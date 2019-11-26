import { PlayTable } from '../model/PlayTable'
import { PlayTask } from '../model/PlayTask'
import TableServices from './TableServices'
import { EventEmitter } from "events";
import { AutoPlayStatus } from '../model/PlayInterfaces';
import { Logger } from 'log4js';
import staticSettingsServices from './SettingsServices';
import { PlayCondition } from '../model/PlayCondition';
import GlobalWorker from './GlobalWorker';
import Win32Utils from '../utils/Win32Utils';
import { threadId } from 'worker_threads';
import { UserLogService } from './UserLogService';

export type AutoPlayTickType = 'hour'|'minute'|'second'|'run';

var timeNow : Date = null;

export function getTimeNow() { return timeNow }

export type AutoPlayServiceStatus = {
  workingTimer: 'hour'|'minute'|'second'|'disabled',
  workingPrecent: number,
  workingRunChecked: boolean,
  workingCheckedTaskCount: number,
  workingIsCorrecting: boolean
};

export type AutoPlayServiceTimerStatus = {
  timer: 'hour'|'minute'|'second',
  type: 'start'|'stop'|'corrected'
};

export type AutoPlayServiceStatusChangedCallback = (status : AutoPlayServiceStatus) => void;
export type AutoPlayServiceTimerStatusChangedCallback = (status : AutoPlayServiceTimerStatus) => void;

/**
 * 自动播放控制服务
 */
export default class AutoPlayService extends EventEmitter {

  /**
   * 获取播放服务是否已启动
   */
  public globalRunning = false;
  public static staticAutoPlayService : AutoPlayService = null;
  private tables : Array<PlayTable> = null;
  private tableServices : TableServices;
  private logger : Logger = null;
  private statusChangedCallback : AutoPlayServiceStatusChangedCallback = null;
  private timerStatusChangedCallback : AutoPlayServiceTimerStatusChangedCallback = null;

  public constructor(tableServices : TableServices) {
    super();
    AutoPlayService.staticAutoPlayService = this;
    this.tableServices = tableServices;
    this.tables = tableServices.getData();
    this.logger = window.appAutoLogger;
    staticSettingsServices.addListener('update', () => this.reloadSettings());
    GlobalWorker.registerGlobalAction('mutetime', () => this.mute())
    GlobalWorker.registerGlobalAction('quitmutetime', () => this.unMute())
  }

  /**
   * 启动自动播放服务
   */
  public start() {
    if (!this.globalRunning) {
      this.loadAutoMuteTasks();
      this.startCorrectSequence();
      this.globalRunning = true;
      this.emit('runningchanged', this.globalRunning, this.isMuteTime);
      UserLogService.writeLog('启动自动播放系统');
    }
  }
  /**
   * 停止自动播放服务
   */
  public stop() {

    if (this.globalRunning) {
      this.stopTimer();
      this.globalRunning = false;
      if(this.isMuteTime) this.unMute(false);
      this.emit('runningchanged', this.globalRunning, this.isMuteTime);
      UserLogService.writeLog('停止自动播放系统');
    }

  }
  /**
   * 注册时钟状态回调
   */
  public registerServerStatusCallback(callback : AutoPlayServiceStatusChangedCallback) {
    this.statusChangedCallback = callback;
  }
  /**
   * 注册时钟状态回调 2
   */
  public registerTimerStatusCallback(callback : AutoPlayServiceTimerStatusChangedCallback) {
    this.timerStatusChangedCallback = callback;
  }
  public clearServerStatusCallback() { this.statusChangedCallback = null; }
  public clearTimerStatusCallback() { this.timerStatusChangedCallback = null; }

  public flushTable(table : PlayTable) { this.taskTickLateUpdate(); }
  public flush(force = false) { this.taskTickLateUpdate(force); }

  public isMuteTime = false;

  private unMute(emitEvent = true) {
    if(this.isMuteTime) {
      this.isMuteTime = false;
      if(staticSettingsServices.getSettingBoolean('auto.setSystemMuteAtMuteTime') && Win32Utils.getNativeCanUse())
        Win32Utils.unmuteSystem();
      if(emitEvent) this.emit('runningchanged', this.globalRunning, this.isMuteTime);
      UserLogService.writeLog('退出静音时段');
    }
  }
  private mute() {
    if(!this.isMuteTime) {
      this.isMuteTime = true;
      if(staticSettingsServices.getSettingBoolean('auto.setSystemMuteAtMuteTime') && Win32Utils.getNativeCanUse())
        Win32Utils.muteSystem();
      this.stopAllPlayingTask();
      this.emit('runningchanged', this.globalRunning, this.isMuteTime);
      UserLogService.writeLog('进入静音时段');
    }
  }

  private logInfo(...args) {
    let buf = '', i = 0;
    for(;i<arguments.length;i++)
      buf+= arguments[i];
    this.logger.info(buf);
    console.log('[AutoPlayService] ' + buf);
  }
  private runStatusCallback(status : 'hour'|'minute'|'second'|'disabled', precent: number, correcting: boolean = false, checked: boolean = false, checkCount = 0) {
    if(typeof this.statusChangedCallback == 'function') 
      this.statusChangedCallback({
        workingTimer: status,
        workingPrecent: precent,
        workingRunChecked: checked,
        workingIsCorrecting: correcting,
        workingCheckedTaskCount: checkCount
      });
  }
  private runTimerStatusCallback(timer : 'hour'|'minute'|'second', type: 'start'|'stop'|'corrected') {
    this.logInfo('Timer ' + timer + ' ' + type + ' at : ' + timeNow.format('HH:ii:ss'));
    if(typeof this.timerStatusChangedCallback == 'function') 
      this.timerStatusChangedCallback({ timer: timer, type: type });
  }

  private timerSecCorrected = false;
  private timerMinuteCorrected = false;
  private timerHourCorrected = false;

  private timerMinuteWkCurrent = 0;
  private timerHourWkCurrent = 0;

  private timerCorrectSec = null;
  private timerSec = null;
  private timerMinute = null;
  private timerHour = null;

  private thisHourPlayTask : PlayTask[] = [];
  private thisMinutePlayTask : PlayTask[] = [];
  private thisSecondPlayTask : PlayTask[] = [];
  private thisSecondStopTask : PlayTask[] = [];

  private muteTask : PlayTask[] = [];

  /**
   * 开始时钟校准序列
   */
  private startCorrectSequence() {
    this.logInfo('Starting all timers');
    this.timerCorrectSec = setInterval(() => {
      timeNow = new Date();
      var milliseconds = timeNow.getMilliseconds();
      if(milliseconds >= 950 || milliseconds <= 50){
        clearInterval(this.timerCorrectSec);
        this.timerCorrectSec = null;
        this.timerSecCorrected = true;
        //运行秒时钟
        this.timerMinuteWkCurrent = timeNow.getMinutes();
        this.timerTickSec();
        this.timerSec = setInterval(() => this.timerTickSec(), 1000);   
        //时钟开始时运行一次检查，因为分钟和小时时钟没有启动，没有数据
        this.taskTickLateUpdate();
        this.runTimerStatusCallback('second', 'corrected');
        this.runTimerStatusCallback('second', 'start');
      }
    }, 50);
  }
  /**
   * 停止所有时钟
   */
  private stopTimer() {

    if(this.timerCorrectSec){
      clearInterval(this.timerCorrectSec);
      this.timerCorrectSec = null;
    }
    if(this.timerSec){
      clearInterval(this.timerSec);
      this.timerSec = null;
    }
    if(this.timerMinute){
      clearInterval(this.timerMinute);
      this.timerMinute = null;
    }
    if(this.timerHour){
      clearInterval(this.timerHour);
      this.timerHour = null;
    }

    this.timerSecCorrected = false;
    this.timerMinuteCorrected = false;
    this.timerHourCorrected = false;

    this.runStatusCallback('disabled', 0);
    this.logInfo('All timers stopped');
  }

  private reloadSettings() {
    this.loadAutoMuteTasks();
  }
  private loadAutoMuteTasks() {
    if(staticSettingsServices.getSettingBoolean('auto.enableMuteTime')) {
      let muteTimes : PlayCondition[] = (<Array<PlayCondition>>staticSettingsServices.getSettingObject('auto.muteTimes'));
      if(muteTimes.length > 0){
        this.muteTask = [];
        for(var i = 0; i < muteTimes.length; i++) {
          let task = new PlayTask();
          task.type = 'mutetime';
          task.condition = muteTimes[i];
          task.name = '自动静音';
          this.muteTask.push(task);
        }
        this.taskTickLateUpdate();
      }else { 
        this.muteTask = [];
        this.taskTickLateUpdate();
      }
    }else this.unMute(true);
  }
  private stopAllPlayingTask() {
    for (var j = 0, d = this.tables.length; j < d; j++) {
      var table = this.tables[j];
      for (var k = 0, f = table.tasks.length; k < f; k++) {
        if(table.tasks[k].status == 'playing') table.tasks[k].stop();
      }
    } 
  }

  /*时钟主控*/

  private timerTickSec(updateTime = true) {
    if(updateTime) timeNow = new Date();
    var seconds = timeNow.getSeconds();
    var minute = timeNow.getMinutes();
    if(!this.timerMinuteCorrected){
      this.runStatusCallback('minute', (minute / 60), true);
      if(seconds == 0){
        clearInterval(this.timerSec);
        this.timerSec = null;
        this.timerMinuteCorrected = true;
        //启动分时钟
        this.timerHourWkCurrent = timeNow.getHours();
        if(this.timerMinute == null) { 
          this.timerMinute = setInterval(() => this.timerTickMinute(), 60000);
          this.timerTickMinute(false);
        }
        this.runTimerStatusCallback('minute', 'corrected');
        this.runTimerStatusCallback('minute', 'start');
      }
    }
    if(minute == this.timerMinuteWkCurrent){  
      let checked = this.taskTick('second');
      this.runStatusCallback('second', (seconds / 60), false, checked, this.thisSecondPlayTask.length + this.thisSecondStopTask.length);
      if(checked) this.taskTick('run');
    }else if(this.timerMinuteCorrected) {
      clearInterval(this.timerSec);
      this.timerSec = null;
      this.runTimerStatusCallback('second', 'stop');
    }
  }
  private timerTickMinute(updateTime = true){
    if(updateTime) timeNow = new Date();
    var hour = timeNow.getHours();
    var minute = timeNow.getMinutes();
    var second = timeNow.getSeconds();
    if(second != 0) timeNow.setSeconds(0);
    if(Math.abs(second) > 5) { //认为时钟偏移已经超过指定的范围了，需要重启时钟
      clearInterval(this.timerMinute);
      this.timerMinute = null;
      this.logger.info('Minute timer deviation too large, recorrect minute timer at : ' + timeNow.format('HH:ii:ss'));
      this.timerMinuteCorrected = false;
      if(this.timerSec == null) {
        this.timerSec = setInterval(() => this.timerTickSec(), 1000);
        this.timerTickSec(false);
      }
      this.runTimerStatusCallback('second', 'start');
    }
    //console.log('Timer minute tick at : ' + timeNow.format('HH:ii:ss'));
    if(!this.timerHourCorrected){
      this.runStatusCallback('hour', hour <= 12 ? (hour / 12) : ((hour - 12) / 12), true);
      if(minute == 0){
        clearInterval(this.timerMinute);
        this.timerMinute = null;
        this.timerHourCorrected = true;
        this.runTimerStatusCallback('minute', 'stop');
        if(this.timerHour == null) {
          this.timerHour = setInterval(() => this.timerTickHour(), 1800000);
          this.timerTickHour(false);
        }
        this.runTimerStatusCallback('hour', 'corrected');
        this.runTimerStatusCallback('hour', 'start');
      }
      //0 点需要重新切换列表状态
      if(hour == 0 && minute == 0) this.onDayChange();
    }
    if(hour == this.timerHourWkCurrent){
      if(this.taskTick('minute')){
        //当前分钟存在任务，启动秒时钟
        this.timerMinuteWkCurrent = timeNow.getMinutes();
        if(!this.timerSec) {
          this.timerSec = setInterval(() => this.timerTickSec(), 1000);
          this.timerTickSec(false);
        }
        this.runStatusCallback('minute', (minute / 60), false, true, this.thisMinutePlayTask.length);
        this.runTimerStatusCallback('second', 'start');
      } else this.runStatusCallback('minute', (minute / 60), false, false);
    }else if(this.timerHourCorrected) {
      clearInterval(this.timerMinute);
      this.timerMinute = null;
      this.runTimerStatusCallback('minute', 'stop');
    }
  }
  private timerTickHour(updateTime = true){
    if(updateTime) timeNow = new Date();
    var hour = timeNow.getHours();
    var minute = timeNow.getMinutes();
    var second = timeNow.getSeconds();
    if(second != 0) timeNow.setSeconds(0);
    if(minute != 0) timeNow.setMinutes(0);
    if(this.taskTick('hour')){
      //当前小时存在任务，启动分钟时钟
      this.timerHourWkCurrent = hour;
      if(!this.timerMinute) {
        this.timerMinute = setInterval(() => { 
          this.timerTickMinute()
        }, 60000);
        this.timerTickMinute(false);
      }
      this.runStatusCallback('hour', (hour / 24), false, true, this.thisHourPlayTask.length);
      this.runTimerStatusCallback('minute', 'start');
    } else this.runStatusCallback('hour', hour <= 12 ? (hour / 12) : ((hour - 12) / 12), false, false);
    //0 点需要重新切换列表状态，和执行数据保存任务
    if(hour == 0) this.onDayChange();
  }

  /*任务自动检测主控*/

  private onDayChange() {
    this.logInfo('Day change : ' + new Date().format('MM-DD'));
    this.loopFlushTableStatus(true);
    this.emit('daychange');
  }
  private loopFlushTableStatus(forceUpdateAll = false) {
    for (var j = 0, d = this.tables.length; j < d; j++) {
      //正在播放的时间表
      var table = this.tables[j];
      if(!table.enabled) {
        table.status = 'disabled';
        this.loopFlushTaskStatus(table, 'parent-disabled', forceUpdateAll);
      }
      else if(table.condition.isPlayingTime('full')) { 
        table.status = 'playing';
        this.loopFlushTaskStatus(table, undefined, forceUpdateAll);
      }
      else {
        table.status = 'normal';
        this.loopFlushTaskStatus(table, 'notplay', forceUpdateAll);
      }
    }
  }
  private loopFlushTaskStatus(table : PlayTable, setStatus ?: AutoPlayStatus, forceUpdateAll = false) {
    if(setStatus){
      for (var j = 0, d = table.tasks.length; j < d; j++) 
        table.tasks[j].status = setStatus;
    }
    else for (var j = 0, d = table.tasks.length; j < d; j++) {
      var task = table.tasks[j];
      if(forceUpdateAll || (task.status != 'playing' && task.status != 'error' && task.status != 'played')) {
        if(!task.enabled) task.status = 'disabled';
        else if(task.condition.isEmpty()) task.status = 'norule';
        else task.status = 'normal';
      }
    }
  }

  private taskTickHour() : boolean {
    this.thisHourPlayTask = [];  
    let result = false;
    for (var j = 0, d = this.tables.length; j < d; j++) {
      //正在播放的时间表
      var table = this.tables[j];
      if(table.status == 'playing'){
        for (var k = 0, f = table.tasks.length; k < f; k++){
          if(table.tasks[k].status != 'playing' && table.tasks[k].isPlayingTime('hour')){
            this.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
          else if(table.tasks[k].status == 'playing' && table.tasks[k].isStoppingTime('hour')){
            this.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
        }
      }
    }   
    if(this.muteTask.length > 0) {
      for (var k = 0, f = this.muteTask.length; k < f; k++){
        if(this.muteTask[k].isPlayingTime('hour')){
          this.thisHourPlayTask.push(this.muteTask[k]);
          result = true;
        }
        else if(this.muteTask[k].isStoppingTime('hour')){
          this.thisHourPlayTask.push(this.muteTask[k]);
          result = true;
        }
      }
    }
    return result
  }
  private taskTickMinute() : boolean {
    this.thisMinutePlayTask = [];

    var result = false;
    //搜索当前小时播放的任务
    for (var k = 0, f = this.thisHourPlayTask.length; k < f; k++){
      if(this.thisHourPlayTask[k].status != 'playing' && this.thisHourPlayTask[k].isPlayingTime('minute')){
        this.thisMinutePlayTask.push(this.thisHourPlayTask[k]);
        result = true;
      }
      else if(this.thisHourPlayTask[k].status == 'playing' && this.thisHourPlayTask[k].isStoppingTime('minute')){
        this.thisMinutePlayTask.push(this.thisHourPlayTask[k]);
        result = true;
      }
    }
    return result
  }
  private taskTick(type : AutoPlayTickType) : boolean {
    var rs = false;
    //小时， 全局检索
    if(type == 'hour') rs = this.taskTickHour();
    else if(type == 'minute') rs = this.taskTickMinute();
    else if(type == 'second') {
      this.thisSecondPlayTask = [];
      this.thisSecondStopTask = [];
      for (var k = 0, f = this.thisMinutePlayTask.length; k < f; k++){
        if(this.thisMinutePlayTask[k].status != 'playing' && this.thisMinutePlayTask[k].isPlayingTime('full')){
          this.thisSecondPlayTask.push(this.thisMinutePlayTask[k]);
          rs = true;
        }
        if(this.thisMinutePlayTask[k].status == 'playing' && this.thisMinutePlayTask[k].isStoppingTime('full')){
          this.thisHourPlayTask.push(this.thisMinutePlayTask[k]);
          rs = true;
        }
      }
    } 
    else if(type == 'run') {
      if(this.thisSecondPlayTask.length > 0) for (var k = 0, f = this.thisSecondPlayTask.length; k < f; k++){
        this.thisSecondPlayTask[k].play(true);
        this.logInfo('Auto start task ' + this.thisSecondPlayTask[k].name);
      }
      if(this.thisSecondStopTask.length > 0) for (var k = 0, f = this.thisSecondStopTask.length; k < f; k++){
        this.thisSecondStopTask[k].stop();
        this.logInfo('Auto stop task ' + this.thisSecondStopTask[k].name);
      }
    }
    return rs;
  } 
  private taskTickLateUpdate(forceUpdateAll = false) {

    this.logInfo('Force update at : ' + new Date().format('HH:ii:ss'));
    //刷新所有列表的状态
    this.loopFlushTableStatus(forceUpdateAll);

    var needStartSec = false;
    if(this.taskTick('hour')){
      //认为修改数据，导致时钟需要重新启动
      if(this.timerMinuteCorrected && !this.timerMinute==null){
        this.timerMinuteCorrected = false;
        needStartSec = true;
      }
    }
    if(this.taskTick('minute')) needStartSec = true;

    if(needStartSec){
      this.timerMinuteWkCurrent = timeNow.getMinutes();
      if(!this.timerSec) {
        this.timerSec = setInterval(() => this.timerTickSec(), 1000);
        this.timerTickSec();
      }
      this.runTimerStatusCallback('second', 'start');
    }
  }
}