import { PlayTable } from '../model/PlayTable'
import { PlayTask } from '../model/PlayTask'
import TableServices from './TableServices'
import { EventEmitter } from "events";
import { AutoPlayStatus } from '../model/PlayInterfaces';

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

  public flushTable(table : PlayTable) { this.taskTickLateUpdate(this); }
  public flush() { this.taskTickLateUpdate(this); }

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
        this.taskTickLateUpdate(this);
        //运行秒时钟
        this.timerMinuteWkCurrent = this.timeNow.getMinutes();
        this.timerTickSec(this);
        this.timerSec = setInterval(() => this.timerTickSec(this), 1000);
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

  private timerTickSec(service : AutoPlayService) {
    service.timeNow = new Date();
    var seconds = service.timeNow.getSeconds();
    var minute = service.timeNow.getMinutes();
    if(!service.timerMinuteCorrected){
      if(seconds == 0){
        clearInterval(service.timerSec);
        service.timerSec = null;
        service.timerMinuteCorrected = true;
        //启动分时钟
        service.timerHourWkCurrent = service.timeNow.getHours();
        service.timerTickMinute(service);
        service.timerMinute = setInterval(() => service.timerTickMinute(service), 60000);
        console.log('Correct timer minute at : ' + new Date().format('HH:ii:ss'));
        console.log('Timer minute start at : ' + new Date().format('HH:ii:ss'));
      }
    }
    if(minute == service.timerMinuteWkCurrent){
      this.taskTick(service, 'second');
    }else if(service.timerMinuteCorrected) {
      clearInterval(service.timerSec);
      service.timerSec = null;
      console.log('Timer second stop at : ' + new Date().format('HH:ii:ss'));
    }
  }
  private timerTickMinute(service : AutoPlayService){
    service.timeNow = new Date();

    var hour = service.timeNow.getHours();
    var minute = service.timeNow.getMinutes();
    if(!service.timerHourCorrected){
      if(minute == 0){
        clearInterval(service.timerSec);
        service.timerSec = null;
        service.timerMinuteCorrected = true;

        service.timerTickHour(service);
        service.timerHour = setInterval(() => service.timerTickHour(service), 3600000);
        console.log('Correct timer hour at : ' + new Date().format('HH:ii:ss'));
        console.log('Timer hour start at : ' + new Date().format('HH:ii:ss'));
      }
      //0 点需要重新切换列表状态
      if(hour == 0 && minute == 0)
        service.onDayChange(service);
    }
    if(hour == service.timerHourWkCurrent){
      if(service.taskTick(service, 'minute')){
        //当前分钟存在任务，启动秒时钟

        service.timerMinuteWkCurrent = service.timeNow.getMinutes();
        if(!service.timerSec){
          service.timerTickSec(service);
          service.timerSec = setInterval(() => service.timerTickSec(service), 1000);
        }
        console.log('Timer second start at : ' + new Date().format('HH:ii:ss'));
      }
    }else if(service.timerHourCorrected) {
      clearInterval(service.timerMinute);
      console.log('Timer minute stop at : ' + new Date().format('HH:ii:ss'));
      service.timerMinute = null;
    }
  }
  private timerTickHour(service : AutoPlayService){
    service.timeNow = new Date();

    var hour = this.timeNow.getHours();
    if(service.taskTick(service, 'hour')){
      //当前小时存在任务，启动分钟时钟

      service.timerHourWkCurrent = hour;
      if(!service.timerMinute) {
        service.timerTickMinute(service);
        service.timerMinute = setInterval(() => service.timerTickMinute(service), 60000);
      }
      console.log('Timer minute start at : ' + new Date().format('HH:ii:ss'));
    }
    //0 点需要重新切换列表状态，和执行数据保存任务
    if(hour == 0)
      service.onDayChange(service);
  }

  /*任务自动检测主控*/

  private onDayChange(service : AutoPlayService) {
    service.loopFlushTableStatus(service);
    service.emit('daychange');
  }
  private loopFlushTableStatus(service : AutoPlayService) {
    for (var j = 0, d = service.tables.length; j < d; j++) {
      //正在播放的时间表
      var table = service.tables[j];
      if(!table.enabled) {
        table.status = 'disabled';
        service.loopFlushTaskStatus(table, 'parent-disabled');
      }
      else if(table.condition.isPlayingTime('full')) { 
        table.status = 'playing';
        service.loopFlushTaskStatus(table);
      }
      else {
        table.status = 'normal';
        service.loopFlushTaskStatus(table, 'notplay');
      }
    }
  }
  private loopFlushTaskStatus(table : PlayTable, setStatus ?: AutoPlayStatus) {
    if(setStatus){
      for (var j = 0, d = table.tasks.length; j < d; j++) 
        table.tasks[j].status = setStatus;
    }
    else for (var j = 0, d = table.tasks.length; j < d; j++) {
      var task = table.tasks[j];
      if(!task.enabled) task.status = 'disabled';
      else if(task.condition.isEmpty()) task.status = 'norule';
      else task.status = 'normal';
    }
  }

  private taskTickHour(service : AutoPlayService) : boolean {
    service.thisHourPlayTask = [];    
    let result = false;
    for (var j = 0, d = service.tables.length; j < d; j++) {
      //正在播放的时间表
      var table = service.tables[j];
      if(table.status == 'playing'){
        for (var k = 0, f = table.tasks.length; k < f; k++){
          if(table.tasks[k].isPlayingTime('hour')){
            service.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
          else if(table.tasks[k].isStoppingTime('hour')){
            service.thisHourPlayTask.push(table.tasks[k]);
            result = true;
          }
        }
      }
    }    
    return result
  }
  private taskTickMinute(service : AutoPlayService) : boolean {
    service.thisMinutePlayTask = [];

    var result = false;
    //搜索当前小时播放的任务
    for (var k = 0, f = service.thisHourPlayTask.length; k < f; k++){
      if(service.thisHourPlayTask[k].isPlayingTime('minute')){
        service.thisMinutePlayTask.push(service.thisHourPlayTask[k]);
        result = true;
      }
      else if(service.thisHourPlayTask[k].isStoppingTime('minute')){
        service.thisMinutePlayTask.push(service.thisHourPlayTask[k]);
        result = true;
      }
    }
    return result
  }
  private taskTick(service : AutoPlayService, type : AutoPlayTickType) : boolean {

    var rs = false;
    
    //小时， 全局检索
    if(type == 'hour')
      rs = service.taskTickHour(service);
    else if(type == 'minute')
      rs = service.taskTickMinute(service);
    else if(type == 'second') {
      for (var k = 0, f = service.thisMinutePlayTask.length; k < f; k++){
        if(service.thisMinutePlayTask[k].isPlayingTime('full')){
          service.thisMinutePlayTask[k].play();
          rs = true;
        }
        if(service.thisMinutePlayTask[k].isStoppingTime('full')){
          service.thisMinutePlayTask[k].stop();
          rs = true;
        }
      }
    } 

    //console.log('taskTick : ' + type + '('+ rs +') at : ' + new Date().format('HH:ii:ss'));

    return rs;
  } 
  private taskTickLateUpdate(service : AutoPlayService) {

    //刷新所有列表的状态
    service.loopFlushTableStatus(service);

    var needStartSec = false;
    if(service.taskTick(service, 'hour')){
      //认为修改数据，导致时钟需要重新启动
      if(service.timerMinuteCorrected && !service.timerMinute==null){
        service.timerMinuteCorrected = false;
        needStartSec = true;
      }
    }
    if(service.taskTick(service, 'minute'))
      needStartSec = true;

    if(needStartSec){
      service.timerMinuteWkCurrent = service.timeNow.getMinutes();
      service.timerTickSec(service);
      service.timerSec = setInterval(() => service.timerTickSec(service), 1000);
      console.log('Timer second start at : ' + new Date().format('HH:ii:ss'));
    }
  }
}