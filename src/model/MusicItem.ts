import { getFileName } from '../utils/FileUtils'
import SettingsServices from "../services/SettingsServices";
import CommonUtils from "../utils/CommonUtils";
import { EventEmitter } from "events";

/**
 * 音乐条目以及播放器
 */
export class MusicItem extends EventEmitter {

  public name : string;
  public fullPath : string;
  public status : MusicStatus = 'notload';
  public loaded : boolean = false;
  public tracking : boolean = false;

  public playtime : number = 0;
  public playtimeString : string = '00:00';
  public playProgress : number = 0.0;
  public playError : string = null;

  public audioDurtion : number = 0;
  public audioDurtionString : string = '';

  /**
   * 创建音乐
   * @param fullPath 音乐完整路径
   * @param name 音乐名字，如果不提供，则从完整路径中取
   */
  public constructor(fullPath : string, name?: string) {
    super();
    this.fullPath = fullPath;
    this.name = name || getFileName(fullPath);
  }

  private loadAudio(audio : HTMLAudioElement) {
    audio.addEventListener('playing', this.audio_playing);
    audio.addEventListener('durationchange', this.audio_durationchange);
    audio.addEventListener('pause', this.audio_pause);
    audio.addEventListener('play', this.audio_play);
    audio.addEventListener('ended', this.audio_ended);
  }
  private unloadAudio(audio : HTMLAudioElement) {
    audio.removeEventListener('playing', this.audio_playing);
    audio.removeEventListener('durationchange', this.audio_durationchange);
    audio.removeEventListener('pause', this.audio_pause);
    audio.removeEventListener('play', this.audio_play);
    audio.removeEventListener('ended', this.audio_ended);
  }

  private audio : HTMLAudioElement = null;
  private audioUpdateInterval : NodeJS.Timeout = null;
  private audioFadeInterval : NodeJS.Timeout = null;
  private audioFading : boolean = false;

  /**
   * 加载音乐
   */
  public load() {
    if(this.audio == null) {
      this.audio = document.createElement('audio');
      this.audio.src = this.fullPath;
      document.body.appendChild(this.audio);
      this.loadAudio(this.audio);
    }
    try {
      this.playError = null;
      this.audio.load();
      setTimeout(() => {
        if(this.audio.error != null){
          var err = '未知错误';
          switch(this.audio.error.code) {
            case 1: err = '操作被终止';break;
            case 2: err = '打开文件时出现了错误';break;
            case 3: err = '无法解码该文件';break;
            case 4: err = '不支持的音频格式';break;
          }
          this.playError = err;
          this.updateStatus(this.audio.error.code == 2 ? 'lost' : 'playerr');
          this.loaded = false;
        }else {
          this.playError = null;
          this.loaded = true;
          this.audioDurtion = this.audio.duration;
          this.audioDurtionString = CommonUtils.getTimeStringSec(this.audio.duration);
        }
      },1000);
    }catch(e) {
      this.playError = e;
      this.updateStatus('playerr');
      this.loaded = false;
    }

  }
  /**
   * 播放音乐
   * @param fromStart 是否从头开始播放
   */
  public play(fromStart : boolean = false, callback? : (success: boolean) => void) {
    if(this.audio && this.loaded && !this.audioFading){

      if(fromStart) this.audio.currentTime = 0;//从头开始

      this.audio.play().then(() => {

        let playFinish = () => {
          this.updateStatus('playing');
          this.audioUpdateInterval = setInterval(this.audio_updateTime, 500);
          if(typeof callback == 'function') callback(true);
        }

        //开启渐变
        if(SettingsServices.getSettingBoolean('player.enableFade')){

          let endVolume = SettingsServices.getSettingNumber('player.volume');
          let volumeStep = (endVolume - 0.01) / 25.0;

          this.audio.volume = 0.01;
          this.audioFading = true;
          this.audioFadeInterval = setInterval(() => {
            if(this.audio.volume > 0.01) this.audio.volume+=volumeStep;
            else {
              clearInterval(this.audioFadeInterval);
              this.audioFading = false;
              playFinish();
            }
          }, 40);
        }else playFinish();

      }).catch((e) => {
        this.playError = e;
        this.updateStatus('playerr');
        clearInterval(this.audioUpdateInterval);
        if(typeof callback == 'function') callback(false);
      });
    }
  }
  /**
   * 暂停音乐
   */
  public pause(callback? : () => void) {
    if(this.audio && this.loaded && !this.audioFading) {

      let pauseInternal = () => {
        this.audio.pause();
        clearInterval(this.audioUpdateInterval);
        if(typeof callback == 'function') callback();
      }

      if(SettingsServices.getSettingBoolean('player.enableFade')){

        let endVolume = SettingsServices.getSettingNumber('player.volume');
        let volumeStep = (endVolume - 0.01) / 25.0;

        this.audioFading = true;
        this.audioFadeInterval = setInterval(() => {
          if(this.audio.volume > 0.01) this.audio.volume-=volumeStep;
          else {
            clearInterval(this.audioFadeInterval);
            this.audioFading = false;
            this.audio.volume = endVolume;
            pauseInternal();
          }
        }, 40);

      }else pauseInternal();

    }
  }
  /**
   * 停止音乐
   */
  public stop(callback? : () => void) {
    if(this.audio && this.loaded && !this.audioFading) {
      this.pause(() => {
        this.audio.currentTime = 0;
        this.updateStatus('normal');
        if(typeof callback == 'function') callback();
      });
    }
  }
  /**
   * 释放播放器
   */
  public destroy(callback? : () => void) {
    this.loaded = false;
    if(this.audio != null && !this.audioFading) {

      let destroyInternal = () => {
        this.unloadAudio(this.audio);
        this.audio.src = '';
        document.removeChild(this.audio);

        this.status = 'notload';
        this.loaded = false;   
        this.playtime  = 0;
        this.playtimeString  = '00:00';
        this.playProgress  = 0.0;
        this.playError  = null; 
        this.audioDurtion  = 0;
        this.audioDurtionString  = '';

        this.audio = null;
        if(typeof callback == 'function') callback();
      }

      if(this.status == 'playing') this.stop(() => destroyInternal() );
      else destroyInternal();
    }
  }
  /**
   * 跳转到音乐指定位置
   * @param pos 音乐指定位置（秒）
   */
  public seek(pos : number) {
    if(this.audio && this.loaded)
      this.audio.currentTime = pos;
  }

  //更新状态
  private updateStatus(newStatus : MusicStatus) {
    this.status = newStatus;
    this.emit('statuschanged', newStatus);
  }

  private audio_updateTime(){
    if(!this.tracking) {
      this.playtime = this.audio.currentTime;
      this.playtimeString = CommonUtils.getTimeStringSec(this.audio.currentTime) + '/' + this.audioDurtionString;
      this.playProgress = this.audio.currentTime / this.audio.duration;
      this.emit('timechanged', this.playProgress, this.playtimeString);
    }
  }
  private audio_playing() {

  }
  private audio_durationchange() {
    if(this.loaded) {
      this.audioDurtion = this.audio.duration;
      this.audioDurtionString = CommonUtils.getTimeStringSec(this.audio.duration);
    }
  }
  private audio_pause() {
    this.updateStatus('paused');
  }
  private audio_play() {
    this.updateStatus('playing');
  }
  private audio_ended() {
    this.updateStatus('normal');
    this.emit('ended');
  }

}

export type MusicStatus = 'notload'|'normal'|'playing'|'paused'|'lost'|'playerr';

export type MusicAction = 'play'|'looplay'|'delete'|'none';