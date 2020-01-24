export default {
  getFestival,
  getLunarDay,
  getDateStr,
  getWeekStr,
}

/**
 * 获取今日的节日
 * @return {string} 今日的节日
 */
export function getFestival(){
  var str = '';
  var calendar = new Date();
  var month = calendar.getMonth();
  var date = calendar.getDate();
  
  if ((month == 0) && (date == 1)) str = "元旦";
  if ((month == 2) && (date == 12)) str = "植树节";
  if ((month == 3) && (date == 5)) str = "清明节";
  if ((month == 4) && (date == 1)) str = "国际劳动节";
  if ((month == 4) && (date == 4)) str = "青年节";
  if ((month == 5) && (date == 1)) str = "国际儿童节";
  if ((month == 7) && (date == 1)) str = "建军节";
  if ((month == 7) && (date == 16)) str = "七夕情人节";
  if ((month == 9) && (date == 1)) str = "国庆节/国际音乐节/国际老人节";
  if ((month == 11) && (date == 24)) str = "平安夜";
  if ((month == 11) && (date == 25)) str = "圣诞节";

  return str;
}

/*农历部分*/

var CalendarData = new Array(100);
var madd = new Array(12);
var tgString = "甲乙丙丁戊己庚辛壬癸";
var dzString = "子丑寅卯辰巳午未申酉戌亥";
var numString = "一二三四五六七八九十";
var monString = "正二三四五六七八九十冬腊";
var weekString = "日一二三四五六";
var sx = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
var cYear, cMonth, cDay, TheDate;
CalendarData = new Array(0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95);
madd[0] = 0;
madd[1] = 31;
madd[2] = 59;
madd[3] = 90;
madd[4] = 120;
madd[5] = 151;
madd[6] = 181;
madd[7] = 212;
madd[8] = 243;
madd[9] = 273;
madd[10] = 304;
madd[11] = 334;

function GetBit(m, n) {
  return (m >> n) & 1;
}
function e2c(y1 ?: number,m1?: number,d1?: number) {
  TheDate = (arguments.length != 3) ? new Date() : new Date(y1, m1, d1);
  var total, m, n, k;
  var isEnd = false;
  var tmp = TheDate.getYear();
  if (tmp < 1900) {
    tmp += 1900;
  }
  total = (tmp - 1921) * 365 + Math.floor((tmp - 1921) / 4) + madd[TheDate.getMonth()] + TheDate.getDate() - 38;

  if (TheDate.getYear() % 4 == 0 && TheDate.getMonth() > 1) {
    total++;
  }
  for (m = 0; ; m++) {
    k = (CalendarData[m] < 0xfff) ? 11 : 12;
    for (n = k; n >= 0; n--) {
      if (total <= 29 + GetBit(CalendarData[m], n)) {
        isEnd = true; break;
      }
      total = total - 29 - GetBit(CalendarData[m], n);
    }
    if (isEnd) break;
  }
  cYear = 1921 + m;
  cMonth = k - n + 1;
  cDay = total;
  if (k == 12) {
    if (cMonth == Math.floor(CalendarData[m] / 0x10000) + 1) {
      cMonth = 1 - cMonth;
    }
    if (cMonth > Math.floor(CalendarData[m] / 0x10000) + 1) {
      cMonth--;
    }
  }
}

function GetcDateString() {
  var tmp = "";
  tmp += tgString.charAt((cYear - 4) % 10);
  tmp += dzString.charAt((cYear - 4) % 12);
  tmp += "(";
  tmp += sx.charAt((cYear - 4) % 12);
  tmp += ")年 ";
  if (cMonth < 1) {
    tmp += "(闰)";
    tmp += monString.charAt(-cMonth - 1);
  } else {
    tmp += monString.charAt(cMonth - 1);
  }
  tmp += "月";
  tmp += (cDay < 11) ? "初" : ((cDay < 20) ? "十" : ((cDay < 30) ? "廿" : "三十"));
  if (cDay % 10 != 0 || cDay == 10) {
    tmp += numString.charAt((cDay - 1) % 10);
  }
  return tmp;
}

/**
 * 获取指定日期的农历日期
 * @param {number} solarYear 阳历年
 * @param {number} solarMonth 阳历月
 * @param {number} solarDay 阳历天
 * @return {string} 返回农历日期字符串
 */
export function getLunarDay(solarYear, solarMonth, solarDay) {
  //solarYear = solarYear<1900?(1900+solarYear):solarYear;  
  if (solarYear < 1921 || solarYear > 2020) {
    return "";
  } else {
    solarMonth = (parseInt(solarMonth) > 0) ? (solarMonth - 1) : 11;
    e2c(solarYear, solarMonth, solarDay);
    return GetcDateString();
  }
}

/**
 * 获取日期字符串
 * @param {number} AddDayCount 必传 今天前后N天的日期
 * @param dateStr： 非必传 获取传入日期前后N天的日期：'2018-01-20'
 * @param type 非必传 'lhRili'类型格式如'2018-7-3'
 * @return {string} 返回日期'2018/01/20'
 */
export function getDateStr(AddDayCount, dateStr, type) {
  // console.log('getDateStr', AddDayCount, dateStr, type)
  var dd
  if (!dateStr) {
  dd = new Date()
  } else {
  // 判断是否为IOS
  const isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  
  let formatDateStr = isIOS ? dateStr.replace(/-/g, '/') : dateStr
  dd = new Date((formatDateStr.length < 12) ? formatDateStr + ' 00:00:00' : formatDateStr)
  }
  dd.setDate(dd.getDate() + AddDayCount) // 获取AddDayCount天后的日期
  
  let y = dd.getFullYear()
  let m
  let d
  if (type === 'lhRili') {
  m = dd.getMonth() + 1
  d = dd.getDate()
  } else {
  let currentMon = (dd.getMonth() + 1)
  let getDate = dd.getDate()
  m = currentMon < 10 ? '0' + currentMon : currentMon // 获取当前月份的日期，不足10补0
  d = getDate < 10 ? '0' + getDate : getDate // 获取当前几号，不足10补0
  }
  
  let time = y + '-' + m + '-' + d
  return time
}

/**
 * 获取星期的字符
 * @param {number} week new Date().getDay() 星期几的数字
 * @return {string} 返回星期几的字符串
 */
export function getWeekStr(week) {
  return '星期' + weekString.substr(week, 1);
}