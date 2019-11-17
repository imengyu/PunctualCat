if (typeof require == "undefined") {
  window.onload = function() {
      document.getElementById("intro").setAttribute("style", "display:none");
      document.getElementById("global-error-info").setAttribute("style", "");
      document.getElementById("global-error-info-text").innerText = "本应用不能在浏览器中运行!"
  };
  throw Error("本应用不能在浏览器中运行! App must run in Electron")
}

var appWin32 = null;
var Datastore = require("nedb");

if(process.arch == 'ia32' || process.arch == 'x32'){
  appWin32 = require("./native/app-ia32.node");
  console.log('Load native module for arch x32');
}
else if(process.arch == 'x64'){
  appWin32 = require("./native/app-x64.node");
  console.log('Load native module for arch x64');
}
else console.log('Native module is not support whith arch ' + process.arch);

var appPath = process.cwd();
var dbPath = appPath + "/data/data.db";
var db = new Datastore({ filename: dbPath });
var main = null;
var data = null;
var appVesrsion = 'V 2.0.1';
var appBuildDate = '2919/11/28';

console.log('Current app cwd is ' + appPath);
console.log('App version is ' + appVesrsion + ' ' + appBuildDate);

function ignoreGlobalErrAndHide() {
  if(confirm('忽略错误继续运行可能会导致意外的程序行为，是否继续？如果您不是开发者调试程序，不建议继续运行'))
    document.getElementById('global-error-info').style.display='none'
}
function reloadWithNoDataMode() {
  if(confirm('无数据模式将暂时不会加载您的数据，但您的数据并没有丢失，稍后重启以后您可以手动导出数据然后排查问题'+
    '（期间不要手动保存数据），更多说明，请参考帮助文档。是否继续无数据模式？')) {
    localStorage.setItem('noDataMode', 'yes');
    location.reload(true);
  }
}