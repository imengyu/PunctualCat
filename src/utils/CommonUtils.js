export default {
  isEleEditable,
  isNullOrEmpty,
  isBase64,
  isNumber
}

/**
 * 判断点击区域可编辑
 * @param {*} e 
 */
function isEleEditable(e){
  if(!e){
      return false;
  }
  if(e.tagName == 'INPUT' || e.contentEditable == 'true'){
      return true;
  }else{
      //递归查询父节点
      return isEleEditable(e.parentNode)
  }
}

/**
 * 判断一个字符串是否为空
 * @param {*} str 要判断的字符串
 */
function isNullOrEmpty(str) {
  if (typeof str == 'undefined') return true;
  if (str == null || str == '') return true;
  return false;
}
/**
* 判断字符串是否是 Base64 编码
* @param {String} str 
*/
function isBase64(str) {
  return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(str);
}
/**
 * 检测字符串是否是一串数字
 * @param {String} val 
 */
function isNumber(val) {
  var regPos = /^\d+(\.\d+)?$/; //非负浮点数
  var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
  if (regPos.test(val) || regNeg.test(val)) {
    return true;
  } else {
    return false;
  }
}
