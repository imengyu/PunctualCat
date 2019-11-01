import { PlayCondition } from './PlayBase'
import DateUtils from '../utils/DateUtils'

export type PlayTaskConditionType = '未定义'|'星期'|'星期区间'|'日期区间'|'日期'|'时间'|'条件组'

/**
 * 播放日期条件
 */
export class PlayTaskCondition implements PlayCondition {

  /**
   * 条件类型
   */
  type : PlayTaskConditionType = '未定义';
  /**
   * 播放的时间或日期，在类型为 日期 或 时间 时有效
   */
  datetime : Date = null;
  /**
   * 播放的日期开始，在类型为 日期区间 时有效
   */
  dateStart : Date = null;
  /**
   * 播放的日期结束，在类型为 日期区间 时有效
   */
  dateEnd : Date = null;
  /**
   * 播放的星期，在类型为 星期 时有效
   */
  week = 0;
  /**
   * 播放的星期开始，在类型为 星期区间 时有效
   */
  weekStart = 0;
  /**
   * 播放的星期结束，在类型为 星期区间 时有效
   */
  weekEnd = 0;
  /**
   * 是否使用 “非” 反向条件
   */
  not = false;
  /**
   * 是否使用 “与” 条件，否则默认为 “或” 条件，在类型为 条件组 时有效
   */
  and = false;
  /**
   * 字播放条件，在类型为 条件组 时有效
   */
  childs : Array<PlayTaskCondition> = [];
  /**
   * 是否判断年，在类型为 日期 或 日期区间 时有效
   */
  testYear = false;
  /**
   * 是否启用条件
   */
  enabled = true;
  /**
   * 父条件，在属于 类型为 条件组 的条件时有效
   */
  parent : PlayTaskCondition = null;
  
  /**
   * 创建播放条件
   * @param type 条件类型
   * @param val 初始数值
   */
  public constructor(type? : PlayTaskConditionType, val?: any) {
    if(type)
      this.type = type;
    if(val) {
      if(this.type=='星期'){
        this.week = val;
      }else if(this.type=='星期区间'){
        if(val){
          this.weekStart = val[0];
          this.weekEnd = val[1];
        }
      }else if(this.type=='日期区间'){
        if(val){
          this.dateStart = val[0];
          this.dateEnd = val[1];
        }
      }else if(this.type=='日期' || this.type=='时间'){
        this.datetime = val;
      }
    }
  }

  /**
   * 获取现在是否是播放时间
   */
  public isPlayingTime() : boolean {
    if(!this.enabled)
      return false;
    var now = new Date();
    var ret = false;
    if(this.type == '星期'){
      ret = this.week == now.getDay();
    }else if(this.type == '日期'){
        if(this.testYear) ret = this.datetime.getFullYear() == now.getFullYear() 
            && this.datetime.getMonth() == now.getMonth() 
            && this.datetime.getDate() == now.getDate();
        else ret = this.datetime.getMonth() == now.getMonth() 
            && this.datetime.getDate() == now.getDate();
    }else if(this.type == '时间'){
      return this.datetime.getHours() == now.getHours() 
        && this.datetime.getMinutes() == now.getMinutes() 
        && this.datetime.getSeconds() == now.getSeconds();
    }else if(this.type == '星期区间'){
      var nowDay = now.getDay();
      if(this.weekStart == this.weekEnd)
        ret = true;
      else if(this.weekStart < this.weekEnd)
        ret = this.weekStart <= nowDay && nowDay <= this.weekEnd;
      else 
        ret = nowDay >= this.weekStart || nowDay <= this.weekEnd;
    }else if(this.type == '日期区间'){
      if(this.testYear) ret = this.dateStart <= now && now <= this.dateEnd;
      else {
        var compareMonthAndDay = function(m1,d1,m2,d2){
          if(m1 == m2 && d1 == d2) return 0;
          return (m1 < m2 || (m1 == m2 && d1 < d2)) ? -1 : 1;
        }

        var nowDay = now.getDate();
        var nowMonth = now.getMonth();
        var startDay = this.dateStart.getDate();
        var startMonth = this.dateStart.getMonth();
        var endDay = this.dateEnd.getDate();
        var endMonth = this.dateEnd.getMonth();

        if(compareMonthAndDay(startMonth, startDay, endMonth, endDay) == 0){//相等
          ret = true;
        }else if(compareMonthAndDay(startMonth, startDay, endMonth, endDay) == -1){//小于
          ret = (compareMonthAndDay(startMonth, startDay, nowMonth, nowDay) <= 0 &&
            compareMonthAndDay(nowMonth, nowDay, endMonth, endDay) <= 0)
        }else{//大于
          //9.15 ~   ~ 1.3
          ret = (compareMonthAndDay(startMonth, startDay, nowMonth, nowDay) <= 0||
            compareMonthAndDay(nowMonth, nowDay, endMonth, endDay) <= 0)
        }

      }
    }else if(this.type == '条件组'){
      for(var i = 0, c = this.childs.length; i < c; i++){
        if(this.and){
          if(this.childs[i].isPlayingTime()) ret = true;
          else if(ret) {
            ret = false;
            break; 
          }
        }else if(this.childs[i].isPlayingTime()){
          ret = true;
          break; 
        }
      }
    }

    return this.not ? !ret : ret;
  }  
  /**
   * 获取播放时间是否在当前一个小时内
   */
  public isPlayingInThisHours() : boolean {
    var now = new Date();
    if(this.type == '时间'){
       return this.datetime.getHours() == now.getHours() 
          && now.getMinutes() <= this.datetime.getMinutes();
    }else if(this.type == '条件组'){
      var ret = false;
      for(var i = 0, c = this.childs.length; i < c; i++){
        if(this.and){
          if(this.childs[i].isPlayingInThisHours()) ret = true;
          else if(ret) {
            ret = false;
            break; 
          }
        }else if(this.childs[i].isPlayingInThisHours()){
          ret = true;
          break; 
        }
      }
      return this.not ? !ret : ret;
    }else return this.isPlayingTime();
  }
  /**
   * 获取播放时间是否在当前一分钟内
   */
  public isPlayingInThisMinute() : boolean {
    var now = new Date();
    if(this.type == '时间'){
      return this.datetime.getHours() == now.getHours() 
          && this.datetime.getMinutes() == now.getMinutes()  
          && now.getSeconds() <= this.datetime.getSeconds();
    }else if(this.type == '条件组'){
      var ret = false;
      for(var i = 0, c = this.childs.length; i < c; i++){
        if(this.and){
          if(this.childs[i].isPlayingInThisMinute()) ret = true;
          else if(ret) {
            ret = false;
            break; 
          }
        }else if(this.childs[i].isPlayingInThisMinute()){
          ret = true;
          break; 
        }
      }
      return this.not ? !ret : ret;
    }else return this.isPlayingTime();
  }

  /**
   * 获取可读字符串
   */
  public getFriendlyString() : string {
    if(this.type == '星期'){
      return (this.not ? '非 ' : '') + DateUtils.getWeekStr(this.week);
    }else if(this.type == '日期'){
      return (this.not ? '非 ' : '') + this.testYear ? this.datetime.format('yyyy-MM-dd') : this.datetime.format('MM-dd');     
    }else if(this.type == '时间'){
      return (this.not ? '非 ' : '') + this.datetime.format('HH:mm:ss');
    }else if(this.type == '星期区间'){
      return (this.not ? '不在 ' : '') + DateUtils.getWeekStr(this.weekStart) + ' 至 ' + DateUtils.getWeekStr(this.weekEnd);
    }else if(this.type == '日期区间'){
      return (this.not ? '不在 ' : '') + (this.testYear ? this.dateStart.format('yyyy-MM-dd') : this.dateStart.format('MM-dd'))  + ' 至 ' + 
      (this.testYear ? this.dateEnd.format('yyyy-MM-dd') : this.dateEnd.format('MM-dd'));     
    }else if(this.type == '条件组'){
      return this.childs.length + ' 个 '  +
        (this.and ? '与' : '或') + ' 播放条件';
    }
    return '无效播放条件';
  }

  /**
   * 比较两个播放条件是否相等
   * @param playContidion 需要比较的条件
   */
  public equals(playContidion : PlayTaskCondition){
    if(this.type == '星期')
      return this.week == playContidion.week && this.not == playContidion.not;
    else if(this.type=='日期' || this.type=='时间')
      return this.datetime == playContidion.datetime && this.not == playContidion.not;
    else if(this.type == '星期区间')
      return this.weekStart == playContidion.weekStart && this.weekEnd == playContidion.weekEnd && this.not == playContidion.not;
    else if(this.type == '日期区间')
      return this.dateStart == playContidion.dateStart && this.dateEnd == playContidion.dateEnd && this.not == playContidion.not;
    return false;
  }

  public saveToJson() : string {
    return JSON.stringify(this);
  }
  public loadFromJson(json: string, obj : object) {
    let temp = json ? JSON.parse(json) : obj;
    this.week = temp.week;
    this.testYear = temp.testYear;
    this.enabled = temp.enabled;
    this.parent = temp.parent;
    this.datetime = temp.datetime;
    this.dateStart = temp.dateStart;
    this.dateEnd = temp.dateEnd;
    this.weekStart = temp.weekStart;
    this.weekEnd = temp.weekEnd;
    this.not = temp.not;
    this.and = temp.and;

    //新建子
    this.childs.forEach((k) => {
      let newCon = new PlayTaskCondition();
      newCon.loadFromJson(null, k);
      this.childs.push(newCon);
    })

  }


}