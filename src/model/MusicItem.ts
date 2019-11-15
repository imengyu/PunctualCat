import { getFileName } from '../utils/FileUtils'
import SettingsServices from "../services/SettingsServices";
import CommonUtils from "../utils/CommonUtils";
import { EventEmitter } from "events";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

let staticPlayingCount = 0;
let staticPlayingCountChangedCallback : (music : MusicItem, count : number) => void = null;
let staticMusicWaveStartCallback : (music : MusicItem) => void = null;
let staticMusicWaveStopCallback : (music : MusicItem) => void = null;
let staticMusicPool = Array<MusicItem>();

export function getPlayingCount() { return staticPlayingCount };

export function setPlayingCountChangedCallback(callback : (music : MusicItem, count : number) => void) { staticPlayingCountChangedCallback = callback };

export function setMusicWaveStartCallback(callback : (music : MusicItem) => void) { staticMusicWaveStartCallback = callback };

export function setMusicWaveStopCallback(callback : (music : MusicItem) => void) { staticMusicWaveStopCallback = callback };

export function stopAllMusics() { 
  staticMusicPool.forEach(music => {
    if(music.status == 'normal' || music.status == 'paused' || music.status == 'playing')
      music.stop();
  });
};

/**
 * 音乐条目以及播放器
 */
export class MusicItem extends EventEmitter {

  public name : string;
  public fullPath : string;
  public status : MusicStatus = 'notload';
  public loading : boolean = false;
  public loaded : boolean = false;
  public loopmode : boolean = false;
  public tracking : boolean = false;
  public volume : number = 1.0;

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

    staticMusicPool.push(this);
  }

  private loadAudio(audio : HTMLAudioElement) {
    let _this = this;
    audio.onplaying = () => this.audio_playing(_this);
    audio.ondurationchange = () => this.audio_durationchange(_this);
    audio.onpause = () => this.audio_pause(_this);
    audio.onplay = () => this.audio_play(_this);
    audio.onended = () => this.audio_ended(_this);
  }
  private unloadAudio(audio : HTMLAudioElement) {
    audio.onplaying = null;
    audio.ondurationchange = null;
    audio.onpause = null;
    audio.onplay = null;
    audio.onended = null;
  }

  public audio : HTMLAudioElement = null;
  public audioSrc : MediaElementAudioSourceNode = null;
  public oCtx : AudioContext = null;
  public analyser : AnalyserNode;
  private audioUpdateInterval = null;
  private audioFadeInterval = null;
  public audioFading : boolean = false;


  private doFadeOut(callback : () => void) {
    if(SettingsServices.getSettingBoolean('player.enableFade') && this.status == 'playing'){

      let endVolume = SettingsServices.getSettingNumber('player.volume') * this.volume;
      let volumeStep = (endVolume - 0.01) / 25.0;

      if(this.audioFading) 
        clearInterval(this.audioFadeInterval);
      this.audioFading = true;
      this.audioFadeInterval = setInterval(() => {
        if(this.audio.volume > 0.01) this.audio.volume-=volumeStep;
        else {
          clearInterval(this.audioFadeInterval);
          callback();
          this.audioFading = false;
          this.audio.volume = endVolume;
        }
      }, 40);

    }else callback();
  }
  private doFadeIn(callback : () => void) {
    if(SettingsServices.getSettingBoolean('player.enableFade') && this.audio.currentTime > 0){
  
      let endVolume = SettingsServices.getSettingNumber('player.volume') * this.volume;
      let volumeStep = (endVolume - 0.01) / 25.0;

      this.audio.volume = 0.01;
      if(this.audioFading) 
        clearInterval(this.audioFadeInterval);
      this.audioFading = true;
      this.audioFadeInterval = setInterval(() => {
        if(this.audio.volume < endVolume) this.audio.volume+=volumeStep;
        else {
          this.audio.volume = endVolume;
          clearInterval(this.audioFadeInterval);
          this.audioFading = false;
          callback();
        }
      }, 40);
    }else callback();
  }

  /**
   * 加载音乐
   */
  public load(callback? : (success: boolean) => void) {
    if(this.audio == null) {
      this.loading = true;
      this.audio = document.createElement('audio');
      this.audio.src = this.fullPath;
      this.audio.volume = SettingsServices.getSettingNumber('player.volume') * this.volume;
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
          this.loading = false;
          if(typeof callback == 'function') callback(false);

        }else {
          this.updateStatus('normal');
          this.playError = null;
          this.loaded = true;
          this.loading = false;
          this.audioDurtion = this.audio.duration;
          this.audioDurtionString = CommonUtils.getTimeStringSec(this.audio.duration);
          if(typeof callback == 'function') callback(true);
        }
      }, 600);
    }catch(e) {
      this.playError = e;
      this.updateStatus('playerr');
      this.loaded = false;
      this.loading = false;
      if(typeof callback == 'function') callback(false);
    }

  }
  /**
   * 播放音乐
   * @param fromStart 是否从头开始播放
   */
  public play(fromStart : boolean = false, callback? : (success: boolean) => void) {

    let callBackWithErr = (e ?: any) => {
      if(e) this.playError = e;
      this.updateStatus('playerr');
      clearInterval(this.audioUpdateInterval);
      if(typeof callback == 'function') callback(false);
    }
    let playInternal = (success : boolean) => {

      if(!success) callBackWithErr();
      else if(this.audio && this.loaded){

        if(fromStart) this.audio.currentTime = 0;//从头开始
  
        this.audio.play().then(() => {
  
          this.doFadeIn(() => {
            this.audioUpdateInterval = setInterval(() => this.audio_updateTime(this), 500);
            if(typeof callback == 'function') callback(true);
          });
          this.updateStatus('playing');
  
        }).catch((e) => callBackWithErr(e));
      }else callBackWithErr();
    };

    if(!this.loaded) this.load(playInternal);
    else playInternal(true);   
  }
  /**
   * 暂停音乐
   */
  public pause(callback? : () => void) {
    if(this.audio && this.loaded && !this.audio.paused) {
      this.doFadeOut(() => {
        this.audio.pause();
        clearInterval(this.audioUpdateInterval);
        if(typeof callback == 'function') callback();
      });
      this.updateStatus('paused');
    }
  }
  /**
   * 停止音乐
   */
  public stop(callback? : () => void) {
    if(this.audio && this.loaded) {
      let stopInternal = () => {
        this.updateStatus('normal');
        this.loopmode = false;
        this.audio.pause();
        this.audio.currentTime = 0;
        if(typeof callback == 'function') callback();
      }
      
      if(this.audio.paused) stopInternal()
      else {
        this.doFadeOut(stopInternal);
        this.updateStatus('normal');
      }
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
        document.body.removeChild(this.audio);

        this.loopmode = false;
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
    if(this.oCtx != null) {
      this.audioSrc.disconnect(this.analyser);
      this.analyser.disconnect(this.oCtx.destination);
      this.oCtx.close();
    }
    staticMusicPool.remove(this);
  }
  /**
   * 跳转到音乐指定位置
   * @param pos 音乐指定位置（秒）
   */
  public seek(pos : number) {
    if(this.audio && this.loaded)
      this.audio.currentTime = pos;
  }

  public setVolume(vol : number) {
    if(this.audio) this.audio.volume = vol * this.volume;
  }

  public changeVolume(item : MusicItem, vol : number) {
    item.volume = vol;
    if(item.audio) 
      item.audio.volume = SettingsServices.getSettingNumber('player.volume') * vol;
  }

  private testAndCloseMoreMusic() {
    if(staticPlayingCount > SettingsServices.getSettingNumber('player.maxPlayingMusic')) {
      for(var i = 0; i < staticMusicPool.length; i++){
        if(staticMusicPool[i].status == 'paused' || staticMusicPool[i].status == 'playing'){
          staticMusicPool[i].stop();
          break;
        }
      }
    }
  }
  //更新状态
  private updateStatus(newStatus : MusicStatus) {
    let oldStatus = this.status;
    this.status = newStatus;
    this.emit('statuschanged', newStatus, oldStatus);

    if((oldStatus == 'normal' || oldStatus == 'notload') && newStatus == 'playing'){
      staticPlayingCount ++;
      this.testAndCloseMoreMusic();
      if(typeof staticMusicWaveStartCallback == 'function') staticMusicWaveStartCallback(this);
      if(typeof staticPlayingCountChangedCallback == 'function') staticPlayingCountChangedCallback(this, staticPlayingCount);
    }
    if((oldStatus == 'playing' || oldStatus == 'paused') && (newStatus == 'normal' || newStatus == 'playerr' || newStatus == 'lost'))
    { 
      staticPlayingCount --;
      if(typeof staticPlayingCountChangedCallback == 'function') staticPlayingCountChangedCallback(this, staticPlayingCount);
      if(typeof staticMusicWaveStopCallback == 'function') staticMusicWaveStopCallback(this);
    }
  }

  private audio_updateTime(_this : MusicItem){
    if(!_this.tracking) {
      _this.playtime = _this.audio.currentTime;
      _this.playtimeString = CommonUtils.getTimeStringSec(_this.audio.currentTime) + '/' + _this.audioDurtionString;
      _this.playProgress = _this.audio.currentTime / _this.audio.duration;
      _this.emit('timechanged', _this.playProgress, _this.playtimeString);
    }
  }
  private audio_playing(_this : MusicItem) {

  }
  private audio_durationchange(_this : MusicItem) {
    if(this.loaded) {
      _this.audioDurtion = _this.audio.duration;
      _this.audioDurtionString = CommonUtils.getTimeStringSec(_this.audio.duration);
    }
  }
  private audio_pause(_this : MusicItem) {
    //_this.updateStatus('paused');
  }
  private audio_play(_this : MusicItem) {
    _this.updateStatus('playing');
  }
  private audio_ended(_this : MusicItem) {
  
    if(_this.loopmode) {
      _this.audio.currentTime = 0;
      _this.audio.play();
    } else {
      _this.updateStatus('normal');
    }
    _this.emit('ended');
  }

  /* 临时属性 */
  public choosed = false;
}

export type MusicStatus = 'notload'|'normal'|'playing'|'paused'|'lost'|'playerr';

export type MusicAction = 'play'|'pause'|'looplay'|'delete'|'none'|'stop';