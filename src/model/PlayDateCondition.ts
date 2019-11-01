import { PlayCondition } from './PlayBase'

/**
 * 播放日期条件
 */
export class PlayDateCondition implements PlayCondition {
  
  /**
   * 创建播放日期条件
   * @param start 开始日期
   * @param end 结束日期
   * @param always 是否是永远成立
   */
  public constructor(start : Date, end : Date, always : boolean = false) {
    this.arr[0] = start;
    this.arr[1] = end;
    this.always = always;
  }

  /**
   * 获取或设置日期条件数值
   */
  public arr : Array<Date> = [
    new Date(),
    new Date()
  ];
  /**
   * 获取或设置是否忽略条件永远成立
   */
  public always = false;
  /**
   * 获取或设置是否检查年份
   */
  public testYear = false;

  /**
   * 获取开始日期
   */
  public startDate() : Date { return this.arr[0]; };
  /**
   * 获取结束日期
   */
  public endDate() : Date { return this.arr[1]; };

  /**
   * 检查当前条件是否处于正在播放
   */
  public isPlayingTime() : boolean {
    if(this.always) return true;
    var now = new Date();
    var startDate = this.startDate();
    var endDate = this.endDate();
    if(startDate != null && endDate != null){//时间区间
      if(!this.testYear){
        startDate.setFullYear(2001);
        endDate.setFullYear(2001);
        now.setFullYear(2001);
        //起始时间晚于结束时间
        if(startDate>endDate)
          endDate.setFullYear(2002);
      }
      return now >= startDate && now <= endDate;
    }
    else if(startDate!=null){//时间点
      if(!this.testYear){
        startDate.setFullYear(2001);
        now.setFullYear(2001);
      }
      return startDate == now;
    }
    return false;
  }

  
  public saveToJson() : string {
    return JSON.stringify(this);
  }
  public loadFromJson(json: string, obj : object) {
    let temp = json ? JSON.parse(json) : obj;
    this.arr[0] = temp.arr[0];
    this.arr[1] = temp.arr[1];
    this.always = temp.always;
    this.testYear = temp.testYear;
  }
}