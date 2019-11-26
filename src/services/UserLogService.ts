import { EventEmitter } from "events";

export class UserLogService extends EventEmitter {

  public static getStaticLogger() : UserLogService { return staticUserLogService; }
  public static writeLog(title : string, text = '', type : UserLogType = 'text', parent? : UserLog) : UserLog {
    return staticUserLogService.writeLog(title, text, type, parent);
  }
  public static clearLog() { staticUserLogService.clearLog(); }

  public constructor() {
    super();
    staticUserLogService = this;
  }

  public currentLogDay : Date = null;
  public logs : Array<UserLog> = [];

  private checkAndWriteDateMark() {
    if(this.currentLogDay == null || new Date().getDay() != this.currentLogDay.getDay()) {
      this.currentLogDay = new Date();

      let dayLog = new UserLog('<span class="time">以上是 ' + this.currentLogDay.format('YYYY 年 MM 月 DD 日') + ' 的日志</span>');
      dayLog.showTime = false;

      this.logs.push(dayLog);
      this.emit('write', dayLog, parent);
    }

  }

  public writeLog(title : string, text = '', type : UserLogType = 'text', parent? : UserLog) : UserLog {
    
    this.checkAndWriteDateMark();
    
    let log = new UserLog(title, text, type);
    if(parent) parent.childs.push(log);
    else this.logs.push(log);

    this.emit('write', log, parent);
    return log;
  }
  public clearLog() {
    window.appLogger.info('clear all user log');
    this.emit('clear');
    this.logs = [];
  }
  public destroy() {
    for(var i = 0;i<this.logs.length;i++)
      this.logs[i].childs = [];
    this.clearLog();
    this.logs = undefined;
  }
}

let globalLogUid = 0;

export let staticUserLogService : UserLogService = null;

export type UserLogType = 'info'|'warn'|'error'|'success'|'text';

export class UserLog {

  public title : string;
  public text : string;
  public type : UserLogType;
  public time : string;
  public childs : Array<UserLog> = [];
  public uid : number;
  public showTime = true;

  public showChilds = false;
  public showText = false;

  public constructor(title : string, text = '', type : UserLogType = 'info') {
    this.uid = globalLogUid; globalLogUid++;
    this.title = title;
    this.text = text;
    this.type = type;
    this.time = new Date().format('HH:ii:ss');
  }


}
