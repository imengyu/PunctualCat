export class UserLogService {

  public static staticUserLogService : UserLogService = null;

  public static getStaticLogger() : UserLogService { return this.staticUserLogService; }
  public static writeLog(title : string, text = '', type : UserLogType = 'text', parent? : UserLog) : UserLog {
    return this.staticUserLogService.writeLog(title, text, type, parent);
  }
  public static clearLog() { this.staticUserLogService.clearLog(); }

  public constructor() {
    UserLogService.staticUserLogService = this;
  }

  public logs : Array<UserLog> = [];

  public writeLog(title : string, text = '', type : UserLogType = 'text', parent? : UserLog) : UserLog {
    let log = new UserLog(title, text, type);
    if(parent) parent.chils.push(log);
    else this.logs.push(log);
    return log;
  }
  public clearLog() {
    this.logs = [];
  }
}

export type UserLogType = 'info'|'warn'|'error'|'text';

export class UserLog {

  public title : string;
  public text : string;
  public type : UserLogType;
  public time : string;
  public chils : Array<UserLog>;

  public constructor(title : string, text = '', type : UserLogType = 'info') {
    this.title = title;
    this.text = text;
    this.type = type;
    this.time = new Date().format('YYYY-MM-DD HH:ii:ss');
  }


}
