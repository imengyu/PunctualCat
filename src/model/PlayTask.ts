import { AutoPlayable, AutoSaveable, AutoPlayCheckType, AutoPlayStatus } from './PlayInterfaces'
import { PlayCondition } from './PlayCondition'
import { MusicItem } from './MusicItem'
import { EventEmitter } from "events";
import GlobalWorker from '../services/GlobalWorker'
import { getMusicHistoryService, MusicHistoryService  } from '../services/MusicHistoryService'

export type PlayTaskType = 'music'|'command'|'shutdown'|'reboot'

/**
 * 播放任务
 */
export class PlayTask extends EventEmitter implements AutoPlayable, AutoSaveable {


  public saveToJSONObject(): object {
    let buf = {
      name: this.name,
      note: this.note,
      startPos: this.startPos,
      timeLimit: this.timeLimit,
      type: this.type,
      commands: [],
      loopCount: this.loopCount,
      volume: this.volume,
      musics: [],
      condition: this.condition.saveToJSONObject()
    };
    for(var i = 0; i < this.commands.length; i++)
      buf.commands.push(this.commands[i]);
    for(var i = 0; i < this.musics.length; i++)
      buf.musics.push(this.musics[i].fullPath);
    return buf;
  }
  public loadFromJsonObject(json: any) {
    this.name = json.name;
    this.note = json.name;
    this.type = json.type;
    this.volume = json.volume;
    this.timeLimit = json.timeLimit;
    this.startPos = json.startPos;
    this.loopCount = json.loopCount;
    this.condition = new PlayCondition(null, json.condition);
    for(var i = 0; i < json.commands.length; i++)
      this.commands.push(json.commands[i]);
    for(var i = 0; i < json.musics.length; i++) {
      let oldItem = this.musicHistoryService.findInHistoryList(json.musics[i]);
      if(oldItem) this.musics.push(oldItem);
      else this.musics.push(new MusicItem(json.musics[i]));
    }
    this.status = this.enabled ? 'normal' : 'disabled';
  }

  public constructor(jsonObject?:any) {
    super();
    this.musicHistoryService = getMusicHistoryService();
    if(jsonObject) this.loadFromJsonObject(jsonObject);
    else this.condition = new PlayCondition('', null);
  }

  private musicHistoryService : MusicHistoryService =  null;

  public name : string = '';
  public note : string = '';
  public condition: PlayCondition = null;
  public enabled = true;
  public status : AutoPlayStatus = 'unknow';
  public type: PlayTaskType = 'music';
  public musics : Array<MusicItem> = [];
  public commands : Array<string> = [];

  public editing = false;

  public volume = 100;
  public timeLimit = {
    hours: 0,
    minute: 0,
    second: 0
  };
  public startPos = {
    hours: 0,
    minute: 0,
    second: 0
  };
  public loopCount = 1;

  public isPlayingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isPlayingTime(type) : false;
  }
  public isStoppingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isStoppingTime(type) : false;
  }

  public play() {
    switch(this.type){
      case 'shutdown': GlobalWorker.executeGlobalAction('shutdown'); break;
      case 'reboot': GlobalWorker.executeGlobalAction('reboot'); break;
      case 'command': this.runCommands(); break;
      case 'music': this.startPlayMusic(); break;
    }
  }
  public stop() {
    if(this.type == 'music') this.stopPlayingMusic(true);
  }

  private runCommands() {

    this.switchStatus('played');
  }

  private currentPlayMusicIndex = 0;
  private currentPlayMusicCount = 0;

  private startPlayMusic() {
    this.currentPlayMusicIndex = 0;
    this.currentPlayMusicCount = 0;
    this.switchStatus('playing');
    if(this.musics.length > 0){
      let playerLoop = () => {
        if(this.currentPlayMusicIndex < this.musics.length) {

          //设置一些初始参数
          let startSec = this.startPos.hours * 3600 + this.startPos.minute * 60 + this.startPos.second;
          if(startSec > 0) this.musics[this.currentPlayMusicIndex].seek(startSec);
          this.musics[this.currentPlayMusicIndex].volume = this.volume / 100.0;
          this.musics[this.currentPlayMusicIndex].on('ended', () => { this.playerEnded(playerLoop) });
          this.musics[this.currentPlayMusicIndex].play(true, (success) => {
            if(!success)
              this.stopPlayingMusic(false);
          });
        }else {
          this.currentPlayMusicCount++;
          if(this.currentPlayMusicCount > this.loopCount)
            this.stopPlayingMusic(true);//循环次数超过，停止
          else {
            this.currentPlayMusicIndex = 0;
            playerLoop();//重新开始一次循环
          }
        }
      };
      playerLoop();
    }else this.stopPlayingMusic(true);
  }
  private playerEnded(playerLoop ?: () => void) {

    //停止，index+1
    this.musics[this.currentPlayMusicIndex].stop();
    this.musics[this.currentPlayMusicIndex].volume = 1.0;
    this.musics[this.currentPlayMusicIndex].off('ended', this.playerEnded);
    this.currentPlayMusicIndex++;
    
    if(playerLoop) playerLoop();
  };
  private stopPlayingMusic(success : boolean) {
    this.playerEnded();
    this.switchStatus(success ? 'played' : 'error');
  }
  private switchStatus(status : AutoPlayStatus) {
    this.status = status;
    this.emit('statuschanged', status);
  }
}