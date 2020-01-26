import { AutoPlayable, AutoSaveable, AutoPlayCheckType } from './PlayInterfaces'
import DateUtils from '../utils/DateUtils';
import CommonUtils from '../utils/CommonUtils';
import { getTimeNow } from '../services/AutoPlayService'

/**
 * 条件执行器类型
 */
export type PlayConditionActuatorType = 'unknow'|'time'|'date'|'week'|'week-range'|'date-range'|'time-range'|'group'|'any'

export type PlayConditionActuatorLogicType = 'and'|'or'|'unknow'

export type PlayConditionType = 'time-point'|'day-point'|'time-range'|'day-range'|'any'

export type PlayConditionAllowType = {
  intervalType: 'time'|'day'|'any',
  timeType: 'range'|'point'|'any',
  forceDisallowTypes: Array<PlayConditionType>
}

export let regDate = new RegExp(/^(((\d{4}|每|\*)年)*(\d{1,2}|每|\*)月(\d{1,2}|每|\*)日)$|^((\d{2,4}(-|\/|\\))*(\d{1,2}|\*)(-|\/|\\)(\d{1,2}|\*))$/);//✔
export let regTime = new RegExp(/^([0-1]?[0-9]|2[0-3]|\*)(:|：)([0-5][0-9]):([0-5][0-9])$|^(([0-1]?[0-9]|2[0-3]|\*)(:|：)([0-5][0-9]))(?!(:|：))$/); //✔
export let regWeek = new RegExp(/^(周(一|二|三|四|五|六|日|[0-6]))$|^(星期(一|二|三|四|五|六|日))$/); //✔

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

let anyPlayConditionAllowType : PlayConditionAllowType = {
  intervalType: 'any',
  timeType: 'any',
  forceDisallowTypes: []
}

/**
 * 条件执行器
 */
export class PlayConditionActuator implements AutoPlayable {
  
  private constructor(type : PlayConditionActuatorType) { 
    this.type = type; 
    this.uid = CommonUtils.genNonDuplicateID(4);
  }

  /**
   * 递归自动转换为执行体
   * @param conStr 已条件格式化字符串
   */
  public static tryConvertConStrToActuator(conStr : string, allow : PlayConditionAllowType, fullConStr : string, thisConStartIndex : number) : PlayConditionActuator {
    let newActyator : PlayConditionActuator = null;
    let conStrFix = conStr.trim();

    //Convert con
    if((conStrFix == '任意' || conStrFix == '不限' || conStrFix == '*')) {
      newActyator = new PlayConditionActuator('any');
      if(anyPlayConditionAllowType.intervalType != 'day' || anyPlayConditionAllowType.timeType != 'point') 
        newActyator.throwErrWithPosition('错误：不限条件只能使用在时间点判断上', conStr, thisConStartIndex);
    }else if((conStrFix.startsWith('(') && conStrFix.endsWith(')')) || (conStrFix.startsWith('（') && conStrFix.endsWith('）'))){
      //Loop for group (xxx)
      newActyator = new PlayConditionActuator('group');
      let conStrArr = newActyator.splitContStrToArr(conStrFix.substr(1, conStrFix.length - 2));
      for(let i = 0; i < conStrArr.length; i++){
        let childActyator = PlayConditionActuator.tryConvertConStrToActuator(conStrArr[i], anyPlayConditionAllowType, fullConStr, conStr.indexOf(conStrArr[i]))
        childActyator.parent = newActyator;
        newActyator.childList.push(childActyator);
      }
    }else {  

      newActyator = new PlayConditionActuator('unknow');

      //Logic
      let fixLogicAndTrim = (test : string[], callback : () => void) => {
        for(var i = 0;i < test.length; i++)
          if(conStrFix.startsWith(test[i])){
            conStrFix = conStrFix.substring(test[i].length).trimLeft();
            callback();
          }
      };

      fixLogicAndTrim(['与', '且', '和', '并且', 'and', '&&'], () => newActyator.logicType = 'and');
      fixLogicAndTrim(['或', '或者', 'or', '||'], () => newActyator.logicType = 'or');
      fixLogicAndTrim(['非', '不是', '!'], () => newActyator.logicNot = true);

      //Base    
      let conStrFixSplited = null;
      if(conStrFix.contains('至')) conStrFixSplited = conStrFix.split('至');
      else if(conStrFix.contains(' - ')) conStrFixSplited = conStrFix.split(' - ');

      if(conStrFixSplited != null){
        if(conStrFixSplited.length < 2) newActyator.throwErrWithPosition('语法错误：未知的 至 分隔符', conStr, thisConStartIndex);
        newActyator.solveValuesRange(conStrFix, conStrFixSplited[0].trim(), conStrFixSplited[1].trim(), fullConStr, conStr.indexOf(conStrFixSplited[0]));
      }else newActyator.solveValuesSimple(conStrFix, fullConStr, conStr.indexOf(conStrFix)); 
    }

    //Check allow type
    if(allow != anyPlayConditionAllowType) {
      let finalType = newActyator.getConditionSummaryType();
      if(allow.intervalType == 'day'){
        if(finalType == 'time-point' || finalType == 'time-range')
          newActyator.throwErrWithPosition('错误：这里要求使用非精确时间条件', conStr, thisConStartIndex);
      }else if(allow.intervalType == 'time'){
        if(finalType == 'time-point' || finalType == 'time-range')
          newActyator.throwErrWithPosition('错误：这里要求使用精确时间条件', conStr, thisConStartIndex);
      }
      if(allow.timeType == 'point'){
        if(finalType == 'day-range' || finalType == 'time-range')
          newActyator.throwErrWithPosition('错误：这里要求使用时间点作为条件，不能使用区间', conStr, thisConStartIndex);
      }else if(allow.timeType == 'range'){
        if(finalType == 'day-point' || finalType == 'time-point')
          newActyator.throwErrWithPosition('错误：这里要求使用区间作为条件', conStr, thisConStartIndex);
      }
      if(allow.forceDisallowTypes.length > 0) {
        for(var i=0;i<allow.forceDisallowTypes.length;i++) {
          if(finalType == allow.forceDisallowTypes[i]){
            newActyator.throwErrWithPosition('错误：条件不符合要求，此条件不会被用于自动播放的判断', conStr, thisConStartIndex);
            break;
          }
        }
      }
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

      if(conStrStart.indexOf('*') >= 1 || conStrStart.indexOf('每') >= 1) 
        this.throwErrWithPosition('条件错误：不允许在日期范围中使用泛日期', conStrStart, fullConStr.indexOf(conStrStart));
      else if(conStrEnd.indexOf('*') >= 1 || conStrEnd.indexOf('每') >= 1) 
        this.throwErrWithPosition('条件错误：不允许在日期范围中使用泛日期', conStrEnd, fullConStr.indexOf(conStrEnd));

      dateConArrStart = CommonUtils.deleteSpaceInStringArray(dateConArrStart);
      dateConArrEnd = CommonUtils.deleteSpaceInStringArray(dateConArrEnd);
      if(dateConArrStart.length < 2) 
        this.throwErrWithPosition('语法错误', conStrStart, fullConStr.indexOf(conStrStart));
      if(dateConArrEnd.length < 2) 
        this.throwErrWithPosition('语法错误', conStrEnd, fullConStr.indexOf(conStrEnd));

      if(dateConArrStart.length == 2){
        this.dateRangeValue.start.year = 0;
        this.dateRangeValue.start.month = parseInt(dateConArrStart[0]);
        this.dateRangeValue.start.day = parseInt(dateConArrStart[1]);
      }else if(dateConArrStart.length == 3){
        this.dateRangeValue.start.year = dateConArrStart[0] == '每' || dateConArrStart[0] == '*' ? 0 : parseInt(dateConArrStart[0]);
        this.dateRangeValue.start.month = parseInt(dateConArrStart[1]);
        this.dateRangeValue.start.day = parseInt(dateConArrStart[2]);
      }
      if(dateConArrEnd.length == 2){
        this.dateRangeValue.end.year = 0;
        this.dateRangeValue.end.month = parseInt(dateConArrEnd[0]);
        this.dateRangeValue.end.day = parseInt(dateConArrEnd[1]);
      }else if(dateConArrEnd.length == 3){
        this.dateRangeValue.end.year = dateConArrEnd[0] == '每' ||  dateConArrEnd[0] == '*' ? 0 : parseInt(dateConArrEnd[0]);
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
      let g2 = regWeek.exec(conStrEnd);
      if(g1) this.weekRangeValue.start = this.parseWeek(g1[2] || g1[4]);
      if(g2) this.weekRangeValue.end = this.parseWeek(g2[2] || g2[4]);
    } else if(regTime.test(conStrStart) && regTime.test(conStrEnd)) {

      if(conStrStart.contains('*') || conStrStart.contains('每')) 
        this.throwErrWithPosition('条件错误：不允许在时间范围中使用泛时间', conStrStart, fullConStr.indexOf(conStrStart));
      else if(conStrEnd.contains('*') || conStrEnd.contains('每')) 
        this.throwErrWithPosition('条件错误：不允许在时间范围中使用泛时间', conStrEnd, fullConStr.indexOf(conStrEnd));

      let timeConArrStart = null;
      let timeConArrEnd = null;
      if(conStrStart.contains(':')) timeConArrStart = conStrStart.split(':');
      else if(conStrStart.contains('：')) timeConArrStart = conStrStart.split('：');
      if(conStrEnd.contains(':')) timeConArrEnd = conStrEnd.split(':');
      else if(conStrEnd.contains('：')) timeConArrEnd = conStrEnd.split('：');

      timeConArrStart = CommonUtils.deleteSpaceInStringArray(timeConArrStart);
      timeConArrEnd = CommonUtils.deleteSpaceInStringArray(timeConArrEnd);
      if(timeConArrStart.length < 2) 
        this.throwErrWithPosition('语法错误', conStrStart, fullConStr.indexOf(conStrStart));
      if(timeConArrStart.length < 2) 
        this.throwErrWithPosition('语法错误', conStrEnd, fullConStr.indexOf(conStrEnd));

      this.timeValueRange.start.hours = timeConArrStart[0] == '*' ? -1 : parseInt(timeConArrStart[0]);
      this.timeValueRange.start.minute = parseInt(timeConArrStart[1]);
      this.timeValueRange.start.second = timeConArrStart.length > 2 ? parseInt(timeConArrStart[2]) : 0;

      this.timeValueRange.end.hours = timeConArrEnd[0] == '*' ? -1 : parseInt(timeConArrEnd[0]);
      this.timeValueRange.end.minute = parseInt(timeConArrEnd[1]);
      this.timeValueRange.end.second = timeConArrEnd.length > 2 ? parseInt(timeConArrEnd[2]) : 0;
      
      this.type = 'time-range';
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

      dateConArr = CommonUtils.deleteSpaceInStringArray(dateConArr);
      if(dateConArr.length < 2) 
        this.throwErrWithPosition('语法错误', conStrFix, fullConStr.indexOf(conStrFix));

      if(dateConArr.length == 2){
        this.dateValue.year = 0;
        this.dateValue.month = dateConArr[0] == '*' || dateConArr[0] == '每' ? 0 : parseInt(dateConArr[0]);
        this.dateValue.day = dateConArr[1] == '*' || dateConArr[1] == '每' ? 0 : parseInt(dateConArr[1]);
      }else if(dateConArr.length == 3){
        this.dateValue.year = dateConArr[0] == '*' || dateConArr[0] == '每' ? 0 : parseInt(dateConArr[0]);
        this.dateValue.month = dateConArr[1] == '*' || dateConArr[1] == '每' ? 0 : parseInt(dateConArr[1]);
        this.dateValue.day = dateConArr[2] == '*' || dateConArr[2] == '每' ? 0 : parseInt(dateConArr[2]);
      }

      if(this.dateValue.month > 12 || this.dateValue.day > 31)
        this.throwErrWithPosition('错误的日期格式', conStrFix, fullConStr.indexOf(conStrFix));
      
    } else if(regTime.test(conStrFix)) {
      this.type = 'time';

      let timeConArr = null;
      if(conStrFix.contains(':')) timeConArr = conStrFix.split(':');
      else if(conStrFix.contains('：')) timeConArr = conStrFix.split('：');
      timeConArr = CommonUtils.deleteSpaceInStringArray(timeConArr);
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
    let splitAndTrim = function(str : string) : boolean {
      if(conStr.contains(str)) {
        let arrTemp = conStr.split(str);
        for(let i = 0; i < arrTemp.length; i++)
          resultArr.push(str + arrTemp[i].trim());
        return true;
      }
      return false
    };
    splitAndTrim('且');
    splitAndTrim('或');
    if(resultArr.length == 0)
      resultArr.push(conStr.trim());
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

  public uid : string;

  public isTopLevel() { 
    return CommonUtils.isNullObject(this.parent)
  }
  public type : PlayConditionActuatorType = 'unknow'
  public logicType : PlayConditionActuatorLogicType = 'unknow';
  public logicNot = false;
  public childList : Array<PlayConditionActuator> = [];
  public parent : PlayConditionActuator = null;

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

  private htmlBuffer = '';
  private strBuffer = '';

  public getConditionSummaryType() : PlayConditionType {
    switch(this.type) {
      case 'date':  return 'day-point';
      case 'date-range':  return 'day-range'
      case 'group': {
        let resultType : PlayConditionType = 'any', i = 0, baseUint = '', baseType = '';
        for(; i < this.childList.length; i++) {
          let childType = this.childList[i].getConditionSummaryType();
          if(childType == 'time-point')
            return 'time-point';
          if(childType == 'day-point') {
            if(baseUint != 'time') baseUint = 'day';
            if(baseType != 'range') baseType = 'point';
          }
          else if(childType == 'day-range') {
            if(baseUint != 'time') baseUint = 'day';
            baseType = 'range';
          }
          else if(childType == 'time-range') {
            baseUint = 'time';
            baseType = 'range';
          }
        }
        if(baseUint == 'time' && baseType == 'range') resultType = 'time-range';
        else if(baseUint == 'day' && baseType == 'range') resultType = 'day-range';
        else if(baseUint == 'day' && baseType == 'point') resultType = 'day-point';
        return resultType;
      }
      case 'time-range': return 'time-range'
      case 'time': return 'time-point'
      case 'week': return 'day-point'
      case 'week-range': 'day-range'
    }
    return 'any';
  }
  public isEmpty() {
    return this.childList.length == 0
  }
  public convertToConHtml() : string {
    if(this.htmlBuffer == '') {
      switch(this.type) {
        case 'date':
        case 'time':
        case 'week':
          this.htmlBuffer = '<span class="con-span con-span-' + this.type + '">' + this.convertToConStr() + '</span>';
          break;
        case 'date-range':
        case 'week-range': 
        case 'time-range': 
          this.htmlBuffer =  '<span class="con-span con-span-' + this.type + '">' + this.convertToConStr().replace(' 至 ', '<span class="con-span-to">至</span>') + '</span>';
          break;
        case 'group': {
          let resultStr = '', i = 0;
          if(this.childList.length == 0){
            resultStr += '<span class="con-none">未定义条件</span>';
          }else for(; i < this.childList.length; i++) {
            if(i > 0){
              switch(this.childList[i].logicType){
                case 'or': resultStr += '<span class="con-span con-span-logic con-or">或</span>'; break;
                case 'and': resultStr += '<span class="con-span con-span-logic con-and">且</span>'; break;
              }
            }
            if(this.childList[i].logicNot)
              resultStr += '<span class="con-span con-span-logic con-not">非</span>';
            resultStr += this.childList[i].convertToConHtml();
          }
          if(this.isTopLevel()) this.htmlBuffer = resultStr;
          else this.htmlBuffer = '<span class="con-group">' + resultStr + '</span>';
          break;
        }
      }
    }
    return this.htmlBuffer;
  }
  public convertToConStr() : string {
    if(this.strBuffer == '') {
      switch(this.type) {
        case 'date': 
          this.strBuffer = (this.dateValue.year == 0 ? '每' : this.dateValue.year.toString()) +  '年' +
          (this.dateValue.month == 0 ? '每' : this.dateValue.month.toString()) +  '月' +
          (this.dateValue.day == 0 ? '每' : this.dateValue.day.toString()) +  '日';
          break;
        case 'date-range': 
          this.strBuffer = (this.dateRangeValue.start.year == 0 ? '每' : this.dateRangeValue.start.year.toString()) + '年' +
          (this.dateRangeValue.start.month == 0 ? '每' : this.dateRangeValue.start.month.toString()) +  '月' +
          (this.dateRangeValue.start.day == 0 ? '每' : this.dateRangeValue.start.day.toString()) + '日 至 ' + 
          (this.dateRangeValue.end.year == 0 ? '每' : this.dateRangeValue.end.year.toString()) +  '年' +
          (this.dateRangeValue.end.month == 0 ? '每' : this.dateRangeValue.end.month.toString()) +  '月' +
          (this.dateRangeValue.end.day == 0 ? '每' : this.dateRangeValue.end.day.toString()) +  '日';
          break;
        case 'group': {
          let resultStr = '', i = 0;
          for(; i < this.childList.length; i++) {
            if(i > 0){
              switch(this.childList[i].logicType){
                case 'or': resultStr += ' 或 '; break;
                case 'and': resultStr += ' 且 '; break;
              }
            }
            if(this.childList[i].logicNot)
              resultStr += '非 ';
            resultStr += this.childList[i].convertToConStr();
          }
          if(this.isTopLevel()) this.strBuffer = resultStr;
          else this.strBuffer = '(' + resultStr + ')';
          break;
        }
        case 'time-range': 
          this.strBuffer = (this.timeValueRange.start.hours == -1 ? '*' : CommonUtils.pad(this.timeValueRange.start.hours, 2)) + ':' + 
          CommonUtils.pad(this.timeValueRange.start.minute, 2) + ':' + CommonUtils.pad(this.timeValueRange.start.second, 2) + ' 至 ' + 
          (this.timeValueRange.end.hours == -1 ? '*' : CommonUtils.pad(this.timeValueRange.end.hours, 2)) + ':' + 
          CommonUtils.pad(this.timeValueRange.end.minute, 2) + ':' + CommonUtils.pad(this.timeValueRange.end.second, 2);
          break;
        case 'time': 
          this.strBuffer = (this.timeValue.hours == -1 ? '*' : CommonUtils.pad(this.timeValue.hours, 2)) + ':' + 
          CommonUtils.pad(this.timeValue.minute, 2) + ':' + CommonUtils.pad(this.timeValue.second, 2);
          break;
        case 'week': 
          this.strBuffer = DateUtils.getWeekStr(this.weekValue);
          break;
        case 'week-range': {
          this.strBuffer = DateUtils.getWeekStr(this.weekRangeValue.start) + ' 至 ' + DateUtils.getWeekStr(this.weekRangeValue.end);
          break;
        }
      }
    }
    return this.strBuffer;
  }
  public isPlayingTime(type: AutoPlayCheckType) : boolean {
    let dateNow = getTimeNow();
    switch(this.type) {
      case 'any': return true;
      case 'date': {
        return (this.dateValue.day == 0 || this.dateValue.day == dateNow.getDate()) &&
          (this.dateValue.month == 0 || this.dateValue.month == dateNow.getMonth() + 1) &&
          (this.dateValue.year == 0 || this.dateValue.year == dateNow.getFullYear());
      }
      case 'date-range': {
        let dateStart = new Date(this.dateRangeValue.start.year, this.dateRangeValue.start.month + 1, this.dateRangeValue.start.day);
        let dateEnd = new Date(this.dateRangeValue.end.year, this.dateRangeValue.end.month + 1, this.dateRangeValue.end.day);
        // 4       7      11
        // 11     12      5
        if(dateStart < dateEnd) {
          return dateStart <= dateNow && dateNow <= dateEnd;
        }else {
          return dateStart <= dateNow || dateNow <= dateEnd;
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
      case 'time': {
        if(type == 'full')
          return (this.timeValue.hours == -1 || this.timeValue.hours == dateNow.getHours()) &&
            (this.timeValue.minute == -1 || this.timeValue.minute == dateNow.getMinutes()) &&
            (this.timeValue.second == dateNow.getSeconds());
        else if(type == 'hour')
          return (this.timeValue.hours == -1 || this.timeValue.hours == dateNow.getHours());
        else if(type == 'minute')
          return (this.timeValue.hours == -1 || this.timeValue.hours == dateNow.getHours()) &&
            (this.timeValue.minute == -1 || this.timeValue.minute == dateNow.getMinutes());
      }
      case 'time-range': {
        let dateStart = new Date();
        let dateEnd = new Date();

        dateStart.setMilliseconds(dateNow.getMilliseconds());
        dateEnd.setMilliseconds(dateNow.getMilliseconds());

        if(type == 'full'){
          dateStart.setHours(this.timeValueRange.start.hours);
          dateStart.setMinutes(this.timeValueRange.start.minute);
          dateStart.setSeconds(this.timeValueRange.start.second);
          dateEnd.setHours(this.timeValueRange.end.hours);
          dateEnd.setMinutes(this.timeValueRange.end.minute);
          dateEnd.setSeconds(this.timeValueRange.end.second);
        }else if(type == 'hour'){
          dateStart.setHours(this.timeValueRange.start.hours);
          dateEnd.setHours(this.timeValueRange.end.hours);
        }else if(type == 'minute'){
          dateStart.setHours(this.timeValueRange.start.hours);
          dateStart.setMinutes(this.timeValueRange.start.minute);
          dateEnd.setHours(this.timeValueRange.end.hours);
          dateEnd.setMinutes(this.timeValueRange.end.minute);
        }     

        if(dateStart < dateEnd) return dateStart <= dateNow && dateNow <= dateEnd;
        else return dateStart <= dateNow || dateNow <= dateEnd;
      }
      case 'week': {
        return this.weekValue == dateNow.getDay()
      }
      case 'week-range': {
        //2   5   6
        //6   0   3
        if(this.weekRangeValue.start < this.weekRangeValue.end)
          return this.weekRangeValue.start <= dateNow.getDay() && dateNow.getDay() <= this.weekRangeValue.end;
        else
          return dateNow.getDay() <= this.weekRangeValue.end || dateNow.getDay() >= this.weekRangeValue.start;
      }
    }
    return false;
  }
  public isStoppingTime(type: AutoPlayCheckType) {
    let dateNow = getTimeNow();
    switch(this.type) {
      case 'any': return false;
      case 'week-range': return this.weekRangeValue.end == dateNow.getDay()
      case 'date-range': {
        return this.dateRangeValue.end.day == dateNow.getDate() &&
          this.dateRangeValue.end.month == dateNow.getMonth() + 1 &&
          this.dateRangeValue.end.year == dateNow.getFullYear();
      }
      case 'time-range': {
        if(type == 'full')
          return this.timeValueRange.end.hours == dateNow.getHours() &&
            this.timeValueRange.end.minute == dateNow.getMinutes() &&
            this.timeValueRange.end.second == dateNow.getSeconds();
        else if(type == 'hour')
          return this.timeValueRange.end.hours == dateNow.getHours() &&
            this.timeValueRange.end.minute == dateNow.getMinutes();
        else if(type == 'minute')
          return this.timeValueRange.end.hours == dateNow.getHours() &&
            this.timeValueRange.end.minute == dateNow.getMinutes();
      }
      case 'group': {
        //(a && b || c)  (a || b && c)
        let i = 0, evalStr = '';
        for(; i < this.childList.length; i++)
        {
          if(i == 0) evalStr += (this.childList[i].isStoppingTime(type) ? 'true' : 'false');
          else evalStr += this.childList[i].getLogicEvalStr() + (this.childList[i].isStoppingTime(type) ? 'true' : 'false');
        }
        return eval(evalStr);
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
    return { 
      value: this.toConditionString() ,
      allow: this.conAllowType,
    }
  }
  public loadFromJsonObject(json: any) {
    if(json.allow) this.conAllowType = json.allow;
    this.toConditionList(json.value)
  } 

  /**
   * 从 条件格式化字符串 或 JSON 对象 新建条件
   * @param conStr 条件的格式化字符串
   * @param jsonObject JSON 对象
   */
  public constructor(conStr: string, jsonObject?: any, conAllowType?: PlayConditionAllowType) {
    if(conStr && conStr != '') this.toConditionList(conStr);
    else if(jsonObject) this.loadFromJsonObject(jsonObject);
    this.uid = CommonUtils.genNonDuplicateID(10);

    if(conAllowType) this.conAllowType = conAllowType;
  }

  /**
   * 当前条件执行体数组
   */
  public conList : PlayConditionActuator = null;
  public conConvertStatus : 'unknow'|'success'|'failed' = 'unknow';
  public conConvertErr : PlayConditionActuatorError = null;
  private conAllowType : PlayConditionAllowType = anyPlayConditionAllowType;

  public uid : string;

  /* 临时属性 */
  public tempBvar1 = false;
  public tempBvar2 = false;

  public setConditionAllowType(type : PlayConditionAllowType) {
    this.conAllowType = type;
  }
  public getConditionAllowType() : PlayConditionAllowType {
    return this.conAllowType;
  }
  public getConditionType()  : PlayConditionType {
    return CommonUtils.isNullObject(this.conList) ? 'any' : this.conList.getConditionSummaryType();
  }
  /** 
   * 转换 条件的格式化字符串 为执行体数组，此方法会清空原有的数组
   * @param conStr 条件的格式化字符串
   */
  public toConditionList(conStr : string) : boolean {
    if(conStr == '') {
      this.conList = null;
      return true;
    }
    try{
      let fixConStr = '';
      if(conStr.startsWith('(') && conStr.endsWith(')') || conStr.startsWith('（') && conStr.endsWith('）')) fixConStr = conStr;
      else fixConStr = '(' + conStr + ')'
      this.conList = PlayConditionActuator.tryConvertConStrToActuator(fixConStr, this.conAllowType, fixConStr, 0);
      this.conConvertStatus = 'success';
      return true;
    }catch (err) {
      this.conConvertStatus = 'failed';
      this.conConvertErr = err;
      return false;
    }
  }
  /**
   * 将条件转为可读格式化字符串
   */
  public toConditionString(withBrackets = true) {
    let b = CommonUtils.isNullObject(this.conList) ? '' : this.conList.convertToConStr();
    if(!withBrackets) {
      if(b.startsWith('(') && b.endsWith(')'))
        b = b.substr(1, b.length - 2);
    }
    return b;
  }
  /**
   * 将条件转为可读格式化字符串 HTML
   */
  public toConditionHtml() {
    return CommonUtils.isNullObject(this.conList) ? '' : this.conList.convertToConHtml()
  }
  /**
   * 判断条件是否为空
   */
  public isEmpty() {
    return CommonUtils.isNullObject(this.conList) ? true : this.conList.isEmpty();
  }
  /**
   * 检测当前条件是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.conList) ? false : this.conList.isPlayingTime(type);
  }
  public isStoppingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.conList) ? false : this.conList.isStoppingTime(type);
  }
}