import { AutoPlayable, AutoSaveable, AutoPlayCheckType, AutoPlayStatus } from './PlayInterfaces'
import { PlayCondition } from './PlayCondition'
import { PlayTable } from './PlayTable'
import { MusicItem, MusicTask, MusicPos, MusicStatus } from './MusicItem'
import { EventEmitter } from "events";
import GlobalWorker from '../services/GlobalWorker'
import { getMusicHistoryService, MusicHistoryService  } from '../services/MusicHistoryService'
import SettingsServices from "../services/SettingsServices";
import Win32Utils from '../utils/Win32Utils';
import { Logger } from 'log4js';
import { threadId } from 'worker_threads';
import AutoPlayService from '../services/AutoPlayService';
import CommonUtils from '../utils/CommonUtils';

export type PlayTaskType = 'music'|'command'|'shutdown'|'reboot'|'mutetime'|'setsystemvol'

export type GlobalStateChangedCallback = (task : PlayTask, status : AutoPlayStatus) => void

/**
 * 播放任务
 */
export class PlayTask extends EventEmitter implements AutoPlayable, AutoSaveable {

  private static globalStateChangedCallback : GlobalStateChangedCallback = null;

  public static setGlobalStateChangedCallback(callback : GlobalStateChangedCallback) {
    this.globalStateChangedCallback = callback
  }

  public saveToJSONObject(): object {
    let buf = {
      name: this.name,
      note: this.note,
      timeLimit: this.timeLimit,
      type: this.type,
      enabled: this.enabled,
      commands: [],
      loopCount: this.loopCount,
      volume: this.volume,
      musics: [],
      condition: this.condition.saveToJSONObject()
    };
    for(var i = 0; i < this.commands.length; i++)
      buf.commands.push(this.commands[i]);
    for(var i = 0; i < this.musics.length; i++)
      buf.musics.push({ 
        path: this.musics[i].music.fullPath, 
        startPos: this.musics[i].startPos.getSec(),
        maxLength: this.musics[i].maxLength.getSec(),
      });
    return buf;
  }
  public loadFromJsonObject(json: any) {
    this.name = json.name;
    this.note = json.name;
    this.type = json.type;
    this.enabled = json.enabled;
    this.volume = json.volume;
    this.timeLimit = json.timeLimit;
    this.loopCount = json.loopCount;
    this.condition = new PlayCondition(null, json.condition, {
      intervalType: 'any',
      timeType: 'point',
      forceDisallowTypes: [ 'day-range', 'day-point' ]
    });
    for(var i = 0; i < json.commands.length; i++)
      this.commands.push(json.commands[i]);
    for(var i = 0; i < json.musics.length; i++) {
      let musicItem = null;
      let oldItem = this.musicHistoryService.findInHistoryList(json.musics[i].path);
      if(oldItem) musicItem = oldItem;
      else musicItem = new MusicItem(json.musics[i].path);
      this.musics.push({
        music: musicItem,
        startPos: new MusicPos(0,0, json.musics[i].startPos),
        maxLength: new MusicPos(0,0, json.musics[i].maxLength),
      })
    }
    this.status = this.enabled ? 'normal' : 'disabled';
  }

  public constructor(jsonObject?:any) {
    super();
    this.logger = window.appLogger;
    this.musicHistoryService = getMusicHistoryService();
    if(jsonObject) this.loadFromJsonObject(jsonObject);
    else this.condition = new PlayCondition('', null, {
      intervalType: 'any',
      timeType: 'point',
      forceDisallowTypes: [ 'day-range', 'day-point' ]
    });
  }

  private musicHistoryService : MusicHistoryService =  null;

  public parent : PlayTable = null;

  public name : string = '';
  public note : string = '';
  public condition: PlayCondition = null;
  public enabled = true;
  public status : AutoPlayStatus = 'unknow';
  public type: PlayTaskType = 'music';
  public musics : Array<MusicTask> = [];
  public commands : Array<string> = [];

  /* 临时属性 */

  private logger : Logger = null;

  public isNew = false;
  public chooseMusic1 = false;
  public chooseMusic2 = false;
  public chooseMusic3 = false;
  public chooseMusic4 = false;
  public chooseMusic5 = false;
  public chooseMusic6 = false;
  public lastPlayByAuto = false;
  public editing = false;
  public editingTask = false;
  public typeBackup: PlayTaskType;
  public musicsBackup : Array<MusicTask>;
  public commandsBackup : Array<string>;
  private lockedByDestroy = false;

  public volume = 100;
  public timeLimit = {
    hours: 0,
    minute: 0,
    second: 0
  };
  public loopCount = 1;

  public isPlayingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.condition) ? false : this.condition.isPlayingTime(type);
  }
  public isStoppingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.condition) ? false : this.condition.isStoppingTime(type);
  }

  public play(byAuto : boolean) {
    if(!this.editing){
      this.lastPlayByAuto = byAuto;
      switch(this.type){
        case 'shutdown': GlobalWorker.executeGlobalAction('shutdown'); this.switchStatus('played'); break;
        case 'reboot': GlobalWorker.executeGlobalAction('reboot'); this.switchStatus('played'); break;
        case 'command': this.runCommands(); break;
        case 'music': this.startPlayMusic(byAuto); break;
        case 'mutetime': GlobalWorker.executeGlobalAction('mutetime'); this.switchStatus('playing'); break;
      }
    }
  }
  public stop() {
    if(this.type == 'music') this.stopPlayingMusic(true);
    else if(this.type == 'mutetime') { GlobalWorker.executeGlobalAction('quitmutetime'); this.switchStatus('played') }
  }
  public destroy() {

  }
  public destroyLock() { this.lockedByDestroy = true; }

  private runCommands() {
    this.logger.info('Run commands for task : ' + this.name)
    GlobalWorker.executeGlobalAction('runcommands', this.commands)
    this.switchStatus('played');
  }

  private currentPlayTaskTimeLimitTimer = null;
  private currentPlayMusicTimeLimitTimer = null;
  private currentPlayMusicIndex = 0;
  private currentPlayMusicCount = 0;
  private endCallback = null;
  private playerLoop = null;
  private forcePlayedLock = false;

  private startPlayMusic(byAuto : boolean) {
    if(byAuto && AutoPlayService.staticAutoPlayService.isMuteTime)
      return;
    this.forcePlayedLock = false;
    this.currentPlayMusicIndex = 0;
    this.currentPlayMusicCount = 0;
    this.switchStatus('playing');
    this.logger.info('Play ' + this.musics.length + ' musics for task : ' + this.name)
    if(this.musics.length > 0){
      //最大播放时长
      let maxSec = this.timeLimit.hours * 3600 + this.timeLimit.minute * 60 + this.timeLimit.second;
      this.playerLoop = () => {
        if(this.currentPlayMusicIndex < this.musics.length) {

          //设置一些初始参数
          let startSec = this.musics[this.currentPlayMusicIndex].startPos.getSec();
          let maxLength = this.musics[this.currentPlayMusicIndex].maxLength.getSec();
          if(maxLength > 0) {
            if(this.currentPlayMusicTimeLimitTimer) clearTimeout(this.currentPlayMusicTimeLimitTimer);
            this.currentPlayMusicTimeLimitTimer = setTimeout(() => {
              this.currentPlayMusicTimeLimitTimer = null;
              this.playerEnded();
              this.logger.info('Play music task ' + this.name + ' on music ' + 
                this.musics[this.currentPlayMusicIndex].music.name + 
                ' is length limit exceeded, no stop music');
            }, 1000 * maxLength);
          }
          this.endCallback = () => this.playerEnded();
          
          this.musics[this.currentPlayMusicIndex].music.volume = this.volume / 100.0;
          this.musics[this.currentPlayMusicIndex].music.on('ended', this.endCallback);
          this.musics[this.currentPlayMusicIndex].music.play(true, (success) => {
            if(!success){
              this.stopPlayingMusic(false);
              if(SettingsServices.getSettingBoolean('auto.playTipIfFail') && Win32Utils.getNativeCanUse())
                Win32Utils.messageBeep(Win32Utils.messageBeepTypes.MB_ICONEXCLAMATION);
              this.logger.error('Play music ' + this.musics[this.currentPlayMusicIndex].music.name + ' failed in task ' + 
                this.name + ' , ERROR : ' + this.musics[this.currentPlayMusicIndex].music.playError);
            }
          }, startSec);

        }else {
          this.currentPlayMusicCount++;
          if(this.currentPlayMusicCount >= this.loopCount){
            this.stopPlayingMusic(true);//循环次数超过，停止
            this.logger.info('Play music task ' + this.name + ' finished');
          }
          else {
            this.currentPlayMusicIndex = 0;
            this.playerLoop();//重新开始一次循环
            this.logger.info('Play music task ' + this.name + ' to next loop ('+ this.currentPlayMusicIndex+'/' + this.loopCount +')');
          }
        }
      };
      if(maxSec > 0) {
        this.currentPlayTaskTimeLimitTimer = setTimeout(() => {
          this.currentPlayTaskTimeLimitTimer = null;
          this.stopPlayingMusic(true);
          this.logger.info('Play music task ' + this.name + ' is length limit exceeded, no stop task');
        }, 1000 * maxSec);
      }
      this.playerLoop();
    }else this.stopPlayingMusic(true);
  }
  private playerEnded() {

    //停止最大超时时钟
    if(this.currentPlayMusicTimeLimitTimer) { 
      clearTimeout(this.currentPlayMusicTimeLimitTimer); 
      this.currentPlayMusicTimeLimitTimer = null; 
    }
    if(this.currentPlayTaskTimeLimitTimer) { 
      clearTimeout(this.currentPlayTaskTimeLimitTimer); 
      this.currentPlayTaskTimeLimitTimer = null; 
    }
    if(this.currentPlayMusicIndex < this.musics.length) {
      this.musics[this.currentPlayMusicIndex].music.off('ended', this.endCallback);
      if(this.musics[this.currentPlayMusicIndex].music.status=='playing')
        this.musics[this.currentPlayMusicIndex].music.stop();
      this.musics[this.currentPlayMusicIndex].music.volume = 1.0;
      //停止，index+1
      this.currentPlayMusicIndex++;
      if(!this.forcePlayedLock && this.playerLoop) this.playerLoop();
    }
  }

  private stopPlayingMusic(success : boolean) {
    this.forcePlayedLock = true;
    this.playerEnded();
    this.switchStatus(success ? 'played' : 'error');
  }
  private switchStatus(status : AutoPlayStatus) {
    if(!this.lockedByDestroy) {
      this.status = status;
      this.emit('statuschanged', status);
      this.emitGlobalStatusChanged(status);
    }
  }
  private emitGlobalStatusChanged(status : AutoPlayStatus) {
    if(!this.lockedByDestroy && typeof PlayTask.globalStateChangedCallback == 'function')
      PlayTask.globalStateChangedCallback(this, status)
  }

  public getPlayTaskString() {
    if(this.type == 'music') {
      let rs = '音乐 ';
      if(this.musics.length == 0)
        rs += '无音乐';
      else if(this.musics.length == 1)
        rs += this.musics[0].music.name;
      else if(this.musics.length > 1)
        rs += this.musics[0].music.name + ' 等 '+ (this.musics.length-1) +' 个音乐';
      return rs;
    } else if(this.type == 'command') {
      let rs = '命令 ';
      if(this.commands.length == 0)
        rs += '无';
      else if(this.commands.length == 1)
        rs += this.commands[0];
      else if(this.commands.length > 1)
        rs += this.commands.length + ' 个命令';
      return rs;
    } else if(this.type == 'reboot') 
      return '重启计算机'
    else if(this.type == 'shutdown')
      return '关闭计算机'
    return '未定义任务';
  }
  public getPlayTaskHtml() {
    if(this.type == 'music') {
      let rs = '<span class="badge badge-pill badge-primary mr-2">音乐</span>';
      if(this.musics.length == 0)
        rs += '<i class="text-secondary">无音乐</i>';
      else if(this.musics.length == 1)
        rs += this.musics[0].music.name;
      else if(this.musics.length > 1)
        rs += this.musics[0].music.name + '<span class="text-secondary ml-2" style="font-size:12px">等'+ (this.musics.length-1) +'个音乐</span>';
      return rs;
    } else if(this.type == 'command') {
      let rs = '<span class="badge badge-pill badge-info mr-2">命令</span>';
      if(this.commands.length == 0)
        rs += '<i class="text-secondary">无</i>';
      else if(this.commands.length == 1)
        rs += this.commands[0];
      else if(this.commands.length > 1)
        rs += this.commands.length + ' 个命令';
      return rs;
    } else if(this.type == 'reboot') 
      return '<span class="badge badge-pill badge-warning">重启计算机</span>'
    else if(this.type == 'shutdown')
      return '<span class="badge badge-pill badge-danger">关闭计算机</span>'
    return '<span class="text-secondary">未定义任务</span>';
  }
}