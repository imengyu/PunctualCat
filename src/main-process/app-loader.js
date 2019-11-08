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