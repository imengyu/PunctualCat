import { AutoPlayable, AutoSaveable, AutoPlayCheckType } from './PlayInterfaces'
import DateUtils from '../utils/DateUtils';


/**
 * 条件执行器类型
 */
export type PlayConditionActuatorType = 'unknow'|'time'|'date'|'week'|'week-range'|'date-range'|'week-range'|'group'

export type PlayConditionActuatorLogicType = 'and'|'or'|'unknow'

export let regDate = new RegExp(/(((\d{4}|每|\*)年)*(\d{1,2}|每|\*)月(\d{1,2}|每|\*)日)|((\d{2,4}(-|\/|\\))*(\d{1,2}|\*)(-|\/|\\)(\d{1,2}|\*))/);//✔
export let regTime = new RegExp(/^([0-1]?[0-9]|2[0-3]|\*):([0-5][0-9]):([0-5][0-9])$|^(([0-1]?[0-9]|2[0-3]|\*):([0-5][0-9]))(?!:)$/); //✔
export let regWeek = new RegExp(/(周(一|二|三|四|五|六|日|[0-6]))|(星期(一|二|三|四|五|六|日))/); //✔

/**
 * 条件执行器在解析时发生的错误数据
 */
export class PlayConditionActuatorError extends Error {

  public currentConString : string;
  public currentIndex : number;

  public constructor(message : string, conStrFix : string, thisConStartIndex : number) {
    super(message);
    this.currentConString = conStrFix;
    this.currentIndex = thisConStartIndex;
  }
}

/**
 * 条件执行器
 */
export class PlayConditionActuator implements AutoPlayable {

  private constructor(type : PlayConditionActuatorType) { this.type = type; }

  /**
   * 递归自动转换为执行体
   * @param conStr 已条件格式化字符串
   */
  public static tryConvertConStrToActuator(conStr : string, fullConStr : string, thisConStartIndex : number) : PlayConditionActuator {
    let newActyator : PlayConditionActuator = null;
    let conStrFix = conStr.trim();
    if(conStrFix.startsWith('(') && conStrFix.endsWith(')')){
      //Loop for group (xxx)
      newActyator = new PlayConditionActuator('group');
      let conStrArr = newActyator.splitContStrToArr(conStrFix.substr(1, conStrFix.length - 2));
      for(let i = 0; i < conStrArr.length; i++)
        newActyator.childList.push(PlayConditionActuator.tryConvertConStrToActuator(conStrArr[i], fullConStr, conStr.indexOf(conStrArr[i])));
    }else {  
      //Logic
      let fixLogicAndTrim = (test : string[], callback : () => void) => {
        for(var i = 0;i < test.length; i++)
          if(conStrFix.startsWith(test[i])){
            conStrFix = conStrFix.substring(test[i].length).trimLeft();
            callback();
          }
      };

      fixLogicAndTrim(['与', '且', '和', '并且'], () => newActyator.logicType = 'and');
      fixLogicAndTrim(['或', '或者'], () => newActyator.logicType = 'or');
      fixLogicAndTrim(['非', '不是'], () => newActyator.logicNot = true);

      //Base    
      if(conStrFix.contains('至')){
        let conStrFixSplited = conStrFix.split('至');
        if(conStrFixSplited.length < 2) newActyator.throwErrWithPosition('语法错误：未知的“至”', conStr, thisConStartIndex);
        newActyator.solveValuesRange(conStrFix, conStrFixSplited[0].trim(), conStrFixSplited[1].trim(), fullConStr, conStr.indexOf(conStrFixSplited[0]));
      }else
        newActyator.solveValuesSimple(conStrFix, fullConStr, conStr.indexOf(conStrFix)); 
    }
    return newActyator;
  }

  private solveValuesRange(conStrFix : string, conStrStart : string, conStrEnd : string, fullConStr : string, thisConStartIndex : number) {
    if(regDate.test(conStrStart) && regDate.test(conStrEnd)) {
      this.type = 'date-range';

      let dateConArrStart = null, dateConArrEnd = null;
      conStrStart = conStrStart.replace(/(年|月|日)/g, '-');
      conStrEnd = conStrEnd.replace(/(年|月|日)/g, '-');

      if(conStrStart.contains('/')) dateConArrStart = conStrStart.split('/');
      else if(conStrStart.contains('-')) dateConArrStart = conStrStart.split('-');
      else if(conStrStart.contains('\\')) dateConArrStart = conStrStart.split('\\');

      if(conStrEnd.contains('/')) dateConArrEnd = conStrEnd.split('/');
      else if(conStrEnd.contains('-')) dateConArrEnd = conStrEnd.split('-');
      else if(conStrEnd.contains('\\')) dateConArrEnd = conStrEnd.split('\\');

      if(conStrStart.contains('*') || conStrStart.contains('每')) 
        this.throwErrWithPosition('条件错误：不允许在日期范围中使用泛日期', conStrStart, fullConStr.indexOf(conStrStart));
      else if(conStrEnd.contains('*') || conStrEnd.contains('每')) 
        this.throwErrWithPosition('条件错误：不允许在日期范围中使用泛日期', conStrEnd, fullConStr.indexOf(conStrEnd));

      if(dateConArrStart.length < 2) 
        this.throwErrWithPosition('语法错误', conStrStart, fullConStr.indexOf(conStrStart));
      if(dateConArrEnd.length < 2) 
        this.throwErrWithPosition('语法错误', conStrEnd, fullConStr.indexOf(conStrEnd));

      if(dateConArrStart.lengt == 2){
        this.dateRangeValue.start.year = 0;
        this.dateRangeValue.start.month = parseInt(dateConArrStart[0]);
        this.dateRangeValue.start.day = parseInt(dateConArrStart[1]);
      }else if(dateConArrStart.lengt == 3){
        this.dateRangeValue.start.year = parseInt(dateConArrStart[0]);
        this.dateRangeValue.start.month = parseInt(dateConArrStart[1]);
        this.dateRangeValue.start.day = parseInt(dateConArrStart[2]);
      }
      if(dateConArrEnd.lengt == 2){
        this.dateRangeValue.end.year = 0;
        this.dateRangeValue.end.month = parseInt(dateConArrEnd[0]);
        this.dateRangeValue.end.day = parseInt(dateConArrEnd[1]);
      }else if(dateConArrEnd.lengt == 3){
        this.dateRangeValue.end.year = parseInt(dateConArrEnd[0]);
        this.dateRangeValue.end.month = parseInt(dateConArrEnd[1]);
        this.dateRangeValue.end.day = parseInt(dateConArrEnd[2]);
      }

      if(this.dateRangeValue.start.month > 12 || this.dateRangeValue.start.day > 31)
        this.throwErrWithPosition('错误的日期格式', conStrStart, fullConStr.indexOf(conStrStart));
      if(this.dateRangeValue.end.month > 12 || this.dateRangeValue.end.day > 31)
        this.throwErrWithPosition('错误的日期格式', conStrEnd, fullConStr.indexOf(conStrEnd));

    } else if(regWeek.test(conStrStart) && regWeek.test(conStrEnd)) {
      this.type = 'week-range';
      let g1 = regWeek.exec(conStrStart);
      let g2 = regWeek.exec(conStrStart);
      if(g1) this.weekRangeValue.start = this.parseWeek(g1[2] || g1[4]);
      if(g2) this.weekRangeValue.end = this.parseWeek(g2[2] || g2[4]);
    } else if(regTime.test(conStrStart) && regTime.test(conStrEnd)) {
      this.throwErrWithPosition('语法错误 : 不支持一段时间作为条件',conStrFix, fullConStr.indexOf(conStrFix));
    } else this.throwErrWithPosition('语法错误', conStrFix, fullConStr.indexOf(conStrFix));
  }
  private solveValuesSimple(conStrFix : string, fullConStr : string, thisConStartIndex : number) {
    if(regDate.test(conStrFix)) {
      this.type = 'date';

      let dateConArr = null;
      conStrFix = conStrFix.replace(/(年|月|日)/g, '-');
      if(conStrFix.contains('/')) dateConArr = conStrFix.split('/');
      else if(conStrFix.contains('-')) dateConArr = conStrFix.split('-');
      else if(conStrFix.contains('\\')) dateConArr = conStrFix.split('\\');
      if(dateConArr.length < 2) 
        this.throwErrWithPosition('语法错误', conStrFix, fullConStr.indexOf(conStrFix));

      if(dateConArr.lengt == 2){
        this.dateValue.year = 0;
        this.dateValue.month = dateConArr[0] == '*' || dateConArr[0] == '每' ? 0 : parseInt(dateConArr[0]);
        this.dateValue.day = dateConArr[1] == '*' || dateConArr[1] == '每' ? 0 : parseInt(dateConArr[1]);
      }else if(dateConArr.lengt == 3){
        this.dateValue.year = dateConArr[0] == '*' || dateConArr[0] == '每' ? 0 : parseInt(dateConArr[0]);
        this.dateValue.month = dateConArr[1] == '*' || dateConArr[1] == '每' ? 0 : parseInt(dateConArr[1]);
        this.dateValue.day = dateConArr[2] == '*' || dateConArr[2] == '每' ? 0 : parseInt(dateConArr[2]);
      }

      if(this.dateValue.month > 12 || this.dateValue.day > 31)
        this.throwErrWithPosition('错误的日期格式', conStrFix, fullConStr.indexOf(conStrFix));
      
    } else if(regTime.test(conStrFix)) {
      this.type = 'time';

      let timeConArr = conStrFix.split(':');
      if(timeConArr.length < 2) 
        this.throwErrWithPosition('语法错误', conStrFix, fullConStr.indexOf(conStrFix));

      this.timeValue.hours = timeConArr[0] == '*' ? -1 : parseInt(timeConArr[0]);
      this.timeValue.minute = parseInt(timeConArr[1]);
      this.timeValue.second = timeConArr.length > 2 ? parseInt(timeConArr[2]) : 0;

    } else if(regWeek.test(conStrFix)) {
      this.type = 'week';
      let g = regWeek.exec(conStrFix);
      if(g) this.weekValue = this.parseWeek(g[2] || g[4]);
    } else this.throwErrWithPosition('语法错误', conStrFix, fullConStr.indexOf(conStrFix));
  }
  private throwErrWithPosition(message : string, conStrFix : string, thisConStartIndex : number) {
    throw new PlayConditionActuatorError(message, conStrFix, thisConStartIndex);
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
  private parseWeek(weekStr : string) {

    switch(weekStr){
      case '日': return 0;
      case '一': return 1;
      case '二': return 2;
      case '三': return 3;
      case '四': return 4;
      case '五': return 5;
      case '六': return 6;
      default: return parseInt(weekStr);
    }
    
  }

  public type : PlayConditionActuatorType = 'unknow'
  public logicType : PlayConditionActuatorLogicType = 'unknow';
  public logicNot = false;
  public childList : Array<PlayConditionActuator> = [];

  public timeValue = {
    hours: 0,
    minute: 0,
    second: 0,
  };
  public timeValueRange = {
    start: {
      hours: 0,
      minute: 0,
      second: 0,
    },
    end: {
      hours: 0,
      minute: 0,
      second: 0,
    }
  };
  public dateValue = {
    year: 0,
    month: 0,
    day: 0
  };
  public dateRangeValue = {
    start: {
      year: 0,
      month: 0,
      day: 0
    },
    end: {
      year: 0,
      month: 0,
      day: 0
    },
  };
  public weekValue = 0;
  public weekRangeValue = {
    start: 0,
    end: 0,
  };

  private getLogicEvalStr() {
    return (this.logicNot ? '!' : '') + (this.logicType == 'and' ? '&&' : (this.logicType == 'or' ? '||' : ''));
  }
  public convertToConHtml() : string {

    
    return '';
  }
  public convertToConStr() : string {
    switch(this.type) {
      case 'date': 
        return (this.dateValue.year == 0 ? '*' : this.dateValue.year.toString()) +  '-' +
        (this.dateValue.month == 0 ? '*' : this.dateValue.month.toString()) +  '-' +
        (this.dateValue.day == 0 ? '*' : this.dateValue.day.toString());
      case 'date-range': 
        return (this.dateRangeValue.start.year == 0 ? '*' : this.dateRangeValue.start.year.toString()) + '-' +
        (this.dateRangeValue.start.month == 0 ? '*' : this.dateRangeValue.start.month.toString()) +  '-' +
        (this.dateRangeValue.start.day == 0 ? '*' : this.dateRangeValue.start.day.toString()) + ' 至 ' + 
        (this.dateRangeValue.end.year == 0 ? '*' : this.dateRangeValue.end.year.toString()) +  '-' +
        (this.dateRangeValue.end.month == 0 ? '*' : this.dateRangeValue.end.month.toString()) +  '-' +
        (this.dateRangeValue.end.day == 0 ? '*' : this.dateRangeValue.end.day.toString());
      case 'group': {
        let resultStr = '(', i = 0;
        for(; i < this.childList.length; i++) {
          if(i > 0){
            switch(this.childList[i].logicType){
              case 'or': resultStr += ' 或 '; break;
              case 'and': resultStr += ' 且 '; break;
            }
          }
          resultStr += this.childList[i].convertToConStr();
        }
        resultStr += ')';
        return resultStr;
      }
      case 'time': 
        return (this.timeValue.hours == -1 ? '*' : this.timeValue.hours.toString()) + ':' + 
          this.timeValue.minute.toString() + ':' + this.timeValue.second.toString();
      case 'week': 
        return DateUtils.getWeekStr(this.weekValue);
      case 'week-range': {
        return DateUtils.getWeekStr(this.weekRangeValue.start) + ' 至 ' + DateUtils.getWeekStr(this.weekRangeValue.end);
      }
    }
    return '';
  }
  public isPlayingTime(type: AutoPlayCheckType) : boolean {
    let dateNow = new Date();
    switch(this.type) {
      case 'date': 
        return (this.dateValue.day == 0 || this.dateValue.day == dateNow.getDate()) &&
          (this.dateValue.month == 0 || this.dateValue.month == dateNow.getMonth() + 1) &&
          (this.dateValue.year == 0 || this.dateValue.year == dateNow.getFullYear());
      case 'date-range': {
        let dateStart = new Date(this.dateRangeValue.start.year, this.dateRangeValue.start.month, this.dateRangeValue.start.day);
        let dateEnd = new Date(this.dateRangeValue.end.year, this.dateRangeValue.end.month, this.dateRangeValue.end.day);
        // 4       7      11
        // 11     12      5
        if(dateStart < dateEnd) {
          return dateStart < dateNow && dateNow < dateEnd;
        }else {
          return dateStart < dateNow || dateNow < dateEnd;
        }
      }
      case 'group': {
        //(a && b || c)  (a || b && c)
        let i = 0, evalStr = '';
        for(; i < this.childList.length; i++)
        {
          if(i == 0) evalStr += (this.childList[i].isPlayingTime(type) ? 'true' : 'false');
          else evalStr += this.childList[i].getLogicEvalStr() + (this.childList[i].isPlayingTime(type) ? 'true' : 'false');
        }
        return eval(evalStr);
      }
      case 'time': 
       
      case 'week': 
        return this.weekValue == dateNow.getDay()
      case 'week-range': {
        //2   5   6
        //6   0   3
        if(this.weekRangeValue.start < this.weekRangeValue.end)
          return this.weekRangeValue.start < dateNow.getDay() && dateNow.getDay() < this.weekRangeValue.end;
        else
          return dateNow.getDay() < this.weekRangeValue.end || dateNow.getDay() > this.weekRangeValue.start;
      }
    }
    return false;
  }

}

/**
 * 播放条件
 */
export class PlayCondition implements AutoPlayable, AutoSaveable {

  public saveToJSONObject(): object {
    return { value: this.toConditionString() }
  }
  public loadFromJsonObject(json: any) {
    this.toConditionList(json.value)
  } 

  /**
   * 从 条件格式化字符串 或 JSON 对象 新建条件
   * @param conStr 条件的格式化字符串
   * @param jsonObject JSON 对象
   */
  public constructor(conStr: string, jsonObject?: any) {
    if(conStr && conStr != '') this.toConditionList(conStr);
    else if(jsonObject) this.loadFromJsonObject(jsonObject);
  }

  /**
   * 当前条件执行体数组
   */
  public conList : PlayConditionActuator = null;
  public conConvertStatus : 'unknow'|'success'|'failed' = 'unknow';
  public conConvertErr = null;

  /**
   * 转换 条件的格式化字符串 为执行体数组，此方法会清空原有的数组
   * @param conStr 条件的格式化字符串
   */
  public toConditionList(conStr : string) : PlayConditionActuator {
    try{
      this.conList = PlayConditionActuator.tryConvertConStrToActuator('(' + conStr + ')', '(' + conStr + ')', 0);
      this.conConvertStatus = 'success';
    }catch (err) {
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
   * 将条件转为可读格式化字符串 HTML
   */
  public toConditionHtml() {
    return this.conList ? this.conList.convertToConHtml() : '';
  }
  /**
   * 检测当前条件是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    return this.conList ? this.conList.isPlayingTime(type) : false;
  }
}