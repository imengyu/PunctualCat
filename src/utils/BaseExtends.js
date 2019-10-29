import { isNumber } from "util";

//Date format

/**
 * 日期格式化
 */
Date.prototype.format = function (formatStr) {
  var pad = function(num, n){
    var len = num.toString().length;
    while (len < n) {
      num = "0" + num;
      len++;
    }
    return num;
  }
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

/**
 * 数组删除
 */
Array.prototype.remove = function(item) {
  
  var dx = isNumber(item) ? item : this.indexOf(item);
  var rs = false
  if(dx >= 0){
    for(var i = 0,n = 0;i < this.length; i++) {
      if(this[i] != this[dx]) {
        this[n++] = this[i];
        rs = true;
      }
    }
    this.length -= 1;
  }
  return rs;
}
Array.prototype.contains = function(item) {
  return this.indexOf(item)
}
if(!Array.prototype.findIndex){
	Array.prototype.findIndex = function(predicateFn,thisArg){
		var len = this.length
		for (var i = 0; i < len; i++) {
			var item = this[i];
			if(predicateFn.call(thisArg,item,i,this)){
				return i
			}
		}
		return -1
	}
}