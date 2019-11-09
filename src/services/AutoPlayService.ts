import { PlayTable } from '../model/PlayTable'
import { PlayTask } from '../model/PlayTask'
import TableServices from './TableServices'
import { EventEmitter } from "events";

export type AutoPlayTickType = 'hour'|'minute'|'second';

/**
 * 自动播放控制服务
 */
export default class AutoPlayService extends EventEmitter {

  /**
   * 获取播放服务是否已启动
   */
  public globalRunning = false;
  private tables : Array<PlayTable> = null;
  private tableServices : TableServices;

  public constructor(tableServices : TableServices) {
    super();
    this.tableServices = tableServices;
    this.tables = tableServices.getData();
  }

  /**
   * 启动自动播放服务
   */
  public start() {
    if (!this.globalRunning) {
      this.startCorrectSequence();
      this.globalRunning = true;
    }
  }
  /**
   * 停止自动播放服务
   */
  public stop() {

    if (this.globalRunning) {
      this.stopTimer();
      this.globalRunning = false;
    }

  }

  private timerSecCorrected = false;
  private timerMinuteCorrected = false;
  private timerHourCorrected = false;

  private timerMinuteWkCurrent = 0;
  private timerHourWkCurrent = 0;

  private timeNow : Date = null;

  private timerCorrectSec = null;
  private timerSec = null;
  private timerMinute = null;
  private timerHour = null;

  private thisHourPlayTask : PlayTask[];
  private thisMinutePlayTask : PlayTask[];

  /**
   * 开始时钟校准序列
   */
  private startCorrectSequence() {
    this.timerCorrectSec = setInterval(() => {
      this.timeNow = new Date();
      var milliseconds = this.timeNow.getMilliseconds();
      if(milliseconds >= 950 || milliseconds <= 50){
        clearInterval(this.timerCorrectSec);
        this.timerCorrectSec = null;
        this.timerSecCorrected = true;
        //时钟开始时运行一次检查，因为分钟和小时时钟没有启动，没有数据
        this.taskTickLateUpdate();
        //运行秒时钟
        this.timerMinuteWkCurrent = this.timeNow.getMinutes();
        this.timerTickSec();
        this.timerSec = setInterval(this.timerTickSec, 1000);
        console.log('Timer second start at : ' + new Date().format('HH:ii:ss'));
        console.log('Correct timer second at : ' + new Date().format('HH:ii:ss'));
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
  }

  /*时钟主控*/

  private timerTickSec() {
    this.timeNow = new Date();
    var seconds = this.timeNow.getSeconds();
    var minute = this.timeNow.getMinutes();
    if(!this.timerMinuteCorrected){
      if(seconds == 0){
        clearInterval(this.timerSec);
        this.timerSec = null;
        this.timerMinuteCorrected = true;
        //启动分时钟
        this.timerHourWkCurrent = this.timeNow.getHours();
        this.timerTickMinute();
        this.timerMinute = setInterval(this.timerTickMinute, 60000);
        console.log('Correct timer minute at : ' + new Date().format('HH:ii:ss'));
        console.log('Timer minute start at : ' + new Date().format('HH:ii:ss'));
      }
    }
    if(minute == this.timerMinuteWkCurrent){
      this.taskTick('second');
    }else if(this.timerMinuteCorrected) {
      clearInterval(this.timerSec);
      this.timerSec = null;
      console.log('Timer second stop at : ' + new Date().format('HH:ii:ss'));
    }
  }
  private timerTickMinute(){
    this.timeNow = new Date();

    var hour = this.timeNow.getHours();
    var minute = this.timeNow.getMinutes();
    if(!this.timerHourCorrected){
      if(minute == 0){
        clearInterval(this.timerSec);
        this.timerSec = null;
        this.timerMinuteCorrected = true;

        this.timerTickHour();
        this.timerHour = setInterval(this.timerTickHour, 3600000);
        console.log('Correct timer hour at : ' + new Date().format('HH:ii:ss'));
        console.log('Timer hour start at : ' + new Date().format('HH:ii:ss'));
      }
      //0 点需要重新切换列表状态
      if(hour == 0 && minute == 0)
        this.onDayChange();
    }
    if(hour == this.timerHourWkCurrent){
      if(this.taskTick('minute')){
        //当前分钟存在任务，启动秒时钟

        this.timerMinuteWkCurrent = this.timeNow.getMinutes();
        if(!this.timerSec){
          this.timerTickSec();
          this.timerSec = setInterval(this.timerTickSec, 1000);
        }
        console.log('Timer second start at : ' + new Date().format('HH:ii:ss'));
      }
    }else if(this.timerHourCorrected) {
      clearInterval(this.timerMinute);
      console.log('Timer minute stop at : ' + new Date().format('HH:ii:ss'));
      this.timerMinute = null;
    }
  }
  private timerTickHour(){
    this.timeNow = new Date();

    var hour = this.timeNow.getHours();
    if(this.taskTick('hour')){
      //当前小时存在任务，启动分钟时钟

      this.timerHourWkCurrent = hour;
      if(!this.timerMinute) {
        this.timerTickMinute();
        this.timerMinute = setInterval(this.timerTickMinute, 60000);
      }
      console.log('Timer minute start at : ' + new Date().format('HH:ii:ss'));
    }
    //0 点需要重新切换列表状态，和执行数据保存任务
    if(hour == 0)
      this.onDayChange();
  }

  /*任务自动检测主控*/

  private onDayChange() {
    this.loopFlushTableStatus();
    this.emit('daychange');
  }
  private loopFlushTableStatus() {
    for (var j = 0, d = this.tables.length; j < d; j++) {
      //正在播放的时间表
      var table = this.tables[j];
      if(!table.enabled) table.status = 'disabled';
      else if(table.condition.isPlayingTime('full')) table.status = 'playing';
      else table.status = 'normal';
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
          if(table.tasks[k].isPlayingTime('hour')){
            this.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
          else if(table.tasks[k].isStoppingTime('hour')){
            this.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
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
      if(this.thisHourPlayTask[k].isPlayingTime('minute')){
        this.thisMinutePlayTask.push(this.thisHourPlayTask[k]);
        result = true;
      }
      else if(this.thisHourPlayTask[k].isStoppingTime('minute')){
        this.thisMinutePlayTask.push(this.thisHourPlayTask[k]);
        result = true;
      }
    }
    return result
  }
  private taskTick(type : AutoPlayTickType) : boolean {

    var rs = false;
    
    //小时， 全局检索
    if(type == 'hour')
      rs = this.taskTickHour();
    else if(type == 'minute')
      rs = this.taskTickMinute();
    else if(type == 'second') {
      for (var k = 0, f = this.thisMinutePlayTask.length; k < f; k++){
        if(this.thisMinutePlayTask[k].isPlayingTime('full')){
          this.thisMinutePlayTask[k].play();
          rs = true;
        }
        if(this.thisMinutePlayTask[k].isStoppingTime('full')){
          this.thisMinutePlayTask[k].stop();
          rs = true;
        }
      }
    } 

    //console.log('taskTick : ' + type + '('+ rs +') at : ' + new Date().format('HH:ii:ss'));

    return rs;
  } 
  private taskTickLateUpdate() {

    //刷新所有列表的状态
    this.loopFlushTableStatus();

    var needStartSec = false;
    if(this.taskTick('hour')){
      //认为修改数据，导致时钟需要重新启动
      if(this.timerMinuteCorrected && !this.timerMinute==null){
        this.timerMinuteCorrected = false;
        needStartSec = true;
      }
    }
    if(this.taskTick('minute'))
      needStartSec = true;

    if(needStartSec){
      this.timerMinuteWkCurrent = this.timeNow.getMinutes();
      this.timerTickSec();
      this.timerSec = setInterval(this.timerTickSec, 1000);
      console.log('Timer second start at : ' + new Date().format('HH:ii:ss'));
    }
  }
}