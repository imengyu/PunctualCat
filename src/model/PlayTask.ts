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
import AutoPlayService from '../services/AutoPlayService';
import CommonUtils from '../utils/CommonUtils';
import { UserLogService, UserLog } from '../services/UserLogService';
import child_process from 'child_process'

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
      anyCommandErrStop: this.anyCommandErrStop,
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
    this.anyCommandErrStop = json.anyCommandErrStop;
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
  public currentPlayLogItem : UserLog = null;

  public typeToString(type : PlayTaskType) {
    switch(type) {
      case 'command': return '执行命令';
      case 'music': return '播放音乐';
      case 'mutetime': return '静音时段';
      case 'reboot': return '重启计算机';
      case 'setsystemvol': return '设置系统音量';
      case 'shutdown': return '关闭计算机';
    }
  }

  public anyCommandErrStop = true;
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
      this.currentPlayLogItem = UserLogService.writeLog(`执行任务 ${this.name} (类型：${this.typeToString(this.type)})`);
      switch(this.type){
        case 'shutdown': GlobalWorker.executeGlobalAction('shutdown'); this.switchStatus('played'); break;
        case 'reboot': GlobalWorker.executeGlobalAction('reboot'); this.switchStatus('played'); break;
        case 'command': this.runCommands(); break;
        case 'music': this.startPlayMusic(byAuto); break;
        case 'mutetime': {
          let type = this.condition.getConditionType();
          if(type == 'time-range' || type == 'day-range') {
            GlobalWorker.executeGlobalAction('mutetime'); 
            this.switchStatus('playing'); 
          }else UserLogService.writeLog(`无法执行静音时段任务 ${this.name}，因为条件不是一个时间段`, '必须将条件设置为时间段才能执行', 'warn',  this.currentPlayLogItem);
          break;
        }
      }
    }
  }
  public stop() {
    this.currentPlayLogItem = UserLogService.writeLog(`停止任务 ${this.name}`);
    if(this.type == 'music') this.stopPlayingMusic(true);
    else if(this.type == 'mutetime') { GlobalWorker.executeGlobalAction('quitmutetime'); this.switchStatus('played') }
  }
  public destroy() {

  }
  public destroyLock() { this.lockedByDestroy = true; }

  private runCommands() {
    this.logger.info('Run commands for task : ' + this.name);
    this.switchStatus('playing');

    UserLogService.writeLog(`开始执行任务命令`, `共有 ${this.commands.length} 条命令`, 'info', this.currentPlayLogItem);
    GlobalWorker.executeGlobalAction('runcommands', this.commands, 
      (command : string, fininshTime : number, error : child_process.ExecException, stdout : string, stderr : string) => {
        if(error) {
          this.logger.error('Run command ' + command + ' in task ' + this.name + ' failed, \nError : ' + error + 
            '\nStdOut: ' + stdout + '\nStdErr: ' + stderr);
          UserLogService.writeLog('执行命令 ' + command + ' 失败', '错误信息：' + error + '<br/>程序回显：' + stdout, 'error', this.currentPlayLogItem);
          return this.anyCommandErrStop ? false : true;
        }else {
          this.logger.info('Run command ' + command + ' in task ' + this.name + ' success (' + fininshTime + 's), \n' + 
            '\nStdOut: ' + stdout + '\nStdErr: ' + stderr);
          UserLogService.writeLog('执行命令 ' + command + ' 成功', '执行时长：' + fininshTime + ' 秒<br/>程序回显：' + stdout, 'info', this.currentPlayLogItem);
          return true;
        }
      },
      (success: boolean) => this.switchStatus(success ? 'played' : 'error')
    )
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
        let index = this.currentPlayMusicIndex;
        if(index < this.musics.length) {

          //设置一些初始参数
          let startSec = this.musics[index].startPos.getSec();
          let maxLength = this.musics[index].maxLength.getSec();
          if(maxLength > 0) {
            if(this.currentPlayMusicTimeLimitTimer) clearTimeout(this.currentPlayMusicTimeLimitTimer);
            this.currentPlayMusicTimeLimitTimer = setTimeout(() => {
              this.currentPlayMusicTimeLimitTimer = null;
              this.playerEnded();
              this.logger.info('Play music task ' + this.name + ' on music ' + 
                this.musics[index].music.name + 
                ' is length limit exceeded, no stop music');
              UserLogService.writeLog(`音乐 ${this.musics[index].music.name} 播放超过了指定的时长 (${maxLength} 秒)，现在停止`, 
                '', 'info', this.currentPlayLogItem)
            }, 1000 * maxLength);
          }
          this.endCallback = () => this.playerEnded();
          
          UserLogService.writeLog(`开始播放音乐 ${this.musics[index].music.name} (${index}/${this.musics.length}) `, '', 'info', this.currentPlayLogItem);

          this.musics[index].music.volume = this.volume / 100.0;
          this.musics[index].music.on('ended', this.endCallback);
          this.musics[index].music.play(true, (success) => {
            if(!success){
              this.stopPlayingMusic(false);
              if(SettingsServices.getSettingBoolean('auto.playTipIfFail') && Win32Utils.getNativeCanUse())
                Win32Utils.messageBeep(Win32Utils.messageBeepTypes.MB_ICONEXCLAMATION);
              UserLogService.writeLog(`播放任务 ${this.name} 失败`, 
                `播放任务失败，因为播放任务的音乐 ${this.musics[index].music.name} 失败，错误信息：${this.musics[index].music.playError}`, 
                'error', this.currentPlayLogItem)
              this.logger.error('Play music ' + this.musics[index].music.name + ' failed in task ' + 
                this.name + ' , ERROR : ' + this.musics[index].music.playError);
            }
          }, startSec);

        }else {
          this.currentPlayMusicCount++;
          if(this.currentPlayMusicCount >= this.loopCount){
            this.stopPlayingMusic(true);//循环次数超过，停止
            this.logger.info('Play music task ' + this.name + ' finished');
            UserLogService.writeLog(`任务 ${this.name} 播放完成`, '', 'info', this.currentPlayLogItem)
          }
          else {
            this.currentPlayMusicIndex = 0;
            this.playerLoop();//重新开始一次循环
            this.logger.info('Play music task ' + this.name + ' to next loop ('+ this.currentPlayMusicIndex+'/' + this.loopCount +')');
            UserLogService.writeLog(`任务 ${this.name} 播放完成一次，开始下一次循环 (${this.currentPlayMusicIndex}/${this.loopCount})`,
              '', 'info', this.currentPlayLogItem)
          }
        }
      };
      if(maxSec > 0) {
        this.currentPlayTaskTimeLimitTimer = setTimeout(() => {
          this.currentPlayTaskTimeLimitTimer = null;
          this.stopPlayingMusic(true);
          this.logger.info('Play music task ' + this.name + ' is length limit exceeded, no stop task');
          UserLogService.writeLog(`任务 ${this.name} 播放超过了指定的时长 (${maxSec} 秒)，现在停止`, '', 'info', this.currentPlayLogItem)
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