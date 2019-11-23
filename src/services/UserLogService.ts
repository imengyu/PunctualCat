export class UserLogService {

  public static staticUserLogService : UserLogService = null;

  public static getStaticLogger() : UserLogService { return this.staticUserLogService; }
  public static writeLog(title : string, text = '', type : UserLogType = 'text') {
    this.staticUserLogService.writeLog(title, text, type);
  }
  public static clearLog() { this.staticUserLogService.clearLog(); }

  public constructor() {
    UserLogService.staticUserLogService = this;
  }

  public logs : Array<UserLog> = [];

  public writeLog(title : string, text = '', type : UserLogType = 'text') {
    this.logs.push(new UserLog(title, text, type));
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

  public constructor(title : string, text = '', type : UserLogType = 'text') {
    this.title = title;
    this.text = text;
    this.type = type;
    this.time = new Date().format('YYYY-MM-DD HH:ii:ss');
  }


}
