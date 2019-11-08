import { AutoPlayable, AutoPlayCheckType } from './PlayInterfaces'


/**
 * 条件执行器类型
 */
export type PlayConditionActuatorType = 'unknow'|'time'|'date'|'week'|'week-range'|'date-range'|'week-range'|'day-of-month'|'group'

export type PlayConditionActuatorLogicType = 'and'|'or'|'unknow'


/**
 * 条件执行器
 */
export class PlayConditionActuator implements AutoPlayable {

  private constructor(type : PlayConditionActuatorType) { this.type = type; }

  /**
   * 递归自动转换为执行体
   * @param conStr 已条件格式化字符串
   */
  public static tryConvertConStrToActuator(conStr : string) : PlayConditionActuator {
    let newActyator : PlayConditionActuator = null;
    let conStrFix = conStr.trim();
    if(conStrFix.startsWith('(') && conStrFix.endsWith(')')){
      //Loop for group (xxx)
      newActyator = new PlayConditionActuator('group');
      let conStrArr = newActyator.splitContStrToArr(conStrFix.substr(1, conStrFix.length - 2));
      for(let i = 0; i < conStrArr.length; i++)
        newActyator.childList.push(PlayConditionActuator.tryConvertConStrToActuator(conStrArr[i]));
    }else {  
      //Logic
      let fixLogicAndTrim = (test : string[], callback : () => void) => {
        for(var i = 0;i < test.length; i++)
          if(conStrFix.startsWith(test[i])){
            conStrFix = conStrFix.substring(test[i].length).trimLeft();
            callback();
          }
      };

      fixLogicAndTrim(['与', '且', '并且'], () => newActyator.logicType = 'and');
      fixLogicAndTrim(['或', '或者'], () => newActyator.logicType = 'or');
      fixLogicAndTrim(['非', '不是'], () => newActyator.logicNot = true);

      //Base
      let regDate = new RegExp('^(^(\d{4}|\d{2})(\-|\/|\.)\d{1,2}\3\d{1,2}$)|(^\d{4}年\d{1,2}月\d{1,2}日$)|(^\d{4}-\d{1,2}-\d{1,2}-$)$');
      let regTime = new RegExp('([0-1]?[0-9]|2[0-3]):([0-5][0-9])|([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])');
      let regWeek = new RegExp('(周(一|二|三|四|五|六|日))|(星期(一|二|三|四|五|六|日))|(周[0-6])');

      if(regDate.test(conStrFix)) {
        //日期
        newActyator.type = 'date';
        newActyator.dateTimeValue = new Date(conStrFix);
      } else if(regTime.test(conStrFix)) {
        //时间
        newActyator.type = 'time';
        newActyator.dateTimeValue = new Date(conStrFix);
      } else if(regWeek.test(conStrFix)) {
        //时间
        newActyator.type = 'week';
        newActyator.dateTimeValue = new Date(conStrFix);
        regWeek.exec
      }

      

    }
    return newActyator;
  }

  private splitContStrToArr(conStr : string) {
    let resultArr : Array<string> = [];
    let splitAndTrim = function(str : string) {
      if(conStr.contains(str)) {
        let arrTemp = conStr.split(str);
        for(let i = 0; i < arrTemp.length; i++)
          resultArr.push(str + arrTemp[i].trim());
      }
    };
    splitAndTrim('且');
    splitAndTrim('或');
    return resultArr;
  }

  public type : PlayConditionActuatorType = 'unknow'
  public logicType : PlayConditionActuatorLogicType = 'unknow';
  public logicNot = false;
  public childList : Array<PlayConditionActuator> = [];

  public dateTimeValue : Date;
  public dateTimeRangeValue : {
    start: Date,
    end: Date,
  };
  public weekValue : number;
  public weekRangeValue : {
    start: number,
    end: number,
  };

  public convertToConStr() : string {
    return '';
  }
  public isPlayingTime(type: AutoPlayCheckType) {

  }

}

/**
 * 播放条件
 */
export class PlayCondition implements AutoPlayable {

  /**
   * 从 条件格式化字符串 新建条件
   * @param conStr 条件的格式化字符串
   */
  public constructor(conStr : string) {
    this.toConditionList(conStr);
  }

  /**
   * 当前条件执行体数组
   */
  public conList : PlayConditionActuator = null;
  public conConvertStatus : 'unknow'|'success'|'failed' = 'unknow';
  public conConvertErr = '';

  /**
   * 转换 条件的格式化字符串 为执行体数组，此方法会清空原有的数组
   * @param conStr 条件的格式化字符串
   */
  public toConditionList(conStr : string) : PlayConditionActuator {
    try{
      this.conList = PlayConditionActuator.tryConvertConStrToActuator('(' + conStr + ')');
      this.conConvertStatus = 'success';
    }catch(err) {
      this.conConvertStatus = 'failed';
      this.conConvertErr = err;
    }
    return this.conList;
  }
  /**
   * 将条件转为可读格式化字符串
   */
  public toConditionString() {
    return this.conList ? this.conList.convertToConStr() : '';
  }
  /**
   * 检测当前条件是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    return this.conList ? this.conList.isPlayingTime(type) : false;
  }
}