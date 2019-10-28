/**
 * 从完整路径获取文件扩展名
 * @param filename 文件完整路径或文件名字
 * @return 返回文件扩展名
 */
export function getFileSuffix(filename : string) : string {
  var index = filename.lastIndexOf(".");
  return filename.substr(index+1);
}
/**
 * 从完整路径获取文件名
 * @param string 文件完整路径
 * @return 返回文件名
 */
export function getFileName(string : string) : string {
  if(string.indexOf('\\')>-1){
    var i = string.lastIndexOf("\\");
    return string.slice(i+1);
  }else if(string.indexOf('/')>-1){
    var i = string.lastIndexOf("/");
    return string.slice(i+1);
  }
  return string;
}