import CommonUtils from "./CommonUtils";

//Date format

/**
 * 日期格式化
 */
Date.prototype.format = function (formatStr) {
  var pad = CommonUtils.pad;
  var str = formatStr;
  str = str.replace(/yyyy|YYYY/, this.getFullYear());
  str = str.replace(/MM/, pad(this.getMonth() + 1, 2));
  str = str.replace(/dd|DD/, pad(this.getDate(), 2));
  str = str.replace(/HH/, pad(this.getHours(), 2));
  str = str.replace(/hh/, pad(this.getHours() > 12 ? this.getHours() - 12 : this.getHours(), 2));
  str = str.replace(/mm/, pad(this.getMinutes(), 2));
  str = str.replace(/ii/, pad(this.getMinutes(), 2));
  str = str.replace(/ss/, pad(this.getSeconds(), 2));
  return str;
}

//字符串

String.prototype.contains = function (str) {
  return this.indexOf(str) >= 0;
}

//数组

Array.prototype.remove = function(item) {
  return this.splice(this.indexOf(item), 1);
}
Array.prototype.contains = function(item) {
  return this.indexOf(item)
}