if (typeof require == "undefined") {
  window.onload = function() {
      document.getElementById("intro").setAttribute("style", "display:none");
      document.getElementById("global-error-info").setAttribute("style", "");
      document.getElementById("global-error-info-text").innerText = "本应用不能在浏览器中运行!"
  };
  throw Error("本应用不能在浏览器中运行! App must run in Electron")
}

const Datastore = require("nedb");
const process = require('process')
const fs = require('fs')
const log4js = require("log4js");
const { dialog } = require('electron')

var appPath = process.cwd();
var dbPath = appPath + "/data/data.db";
var appDb = new Datastore({ filename: dbPath });
var app = null;
var appVesrsion = 'V 2.0.1';
var appBuildDate = '2919/11/28';
var appLogger = null;
var appAutoLogger = null;
var appWin32 = null;

initLogs().then(() => {
  loadNativeModule();
  loadGlobal();
}).catch((err) => {
  dialog.showErrorBox('初始化日志失败', err);
});


function initLogs() {
  return new Promise((resolve, reject) => {
    let logDir = process.cwd() + '/logs';
    let configueLogs = () => {
      try {
        //log4js 配置
        var log4js_config = require("./config/log4js.json");
        log4js.configure(log4js_config);
        appLogger = log4js.getLogger('app');
        appAutoLogger = log4js.getLogger('auto');
        appLogger.info('Logger started');
        resolve();
      }catch(e) {
        reject('初始化日志失败：' + e)
      }
    }
    let testExists = () => {
      if(fs.exists(logDir, (exists) => {
        if(!exists) fs.mkdir(logDir, (err) => {
          if(err) reject('创建日志目录失败')
          else configueLogs();
        }); else configueLogs();
      }));
    }
    testExists();
  });
}
function destroyLogs() {
  appLogger.info('Logger shutdown');
  log4js.shutdown();
}

function loadGlobal() {
  //Global defs
  window.appLogger = appLogger;
  window.appAutoLogger = appAutoLogger;
  window.appBuildDate = appBuildDate;
  window.appVesrsion = appVesrsion;
  window.appInited = false;
  window.appDb = appDb;
  window.app = app;
  window.appWin32 = appWin32;
  //Global defs
  window.initLogs = initLogs;
  window.destroyLogs = destroyLogs;

  appLogger.info('Current app cwd is ' + appPath);
  appLogger.denug('App version is ' + appVesrsion + ' ' + appBuildDate);
}
function loadNativeModule() {
  try{
    if(process.arch == 'ia32' || process.arch == 'x32'){
      appWin32 = require("./native/app-ia32.node");
      appLogger.info('Load native module for arch x32');
    }
    else if(process.arch == 'x64'){
      appWin32 = require("./native/app-x64.node");
      appLogger.info('Load native module for arch x64');
    }
    else {
      appLogger.error('Native module is not support whith arch ' + process.arch);
      dialog.showErrorBox('加载本地模块时发生错误', '本地模块不适用于您的系统。当前系统：' + process.arch);
    }
  }catch(e) {
    appLogger.error('Error while loading Native module : ' + e);
    dialog.showErrorBox('加载本地模块时发生错误', '这可能导致程序出现不可预料的行为。建议您参照 帮助文档 将错误日志发送给我们，以便更好的解决此问题。错误消息：' + e);
  }
}

function ignoreGlobalErrAndHide() {
  if(confirm('忽略错误继续运行可能会导致意外的程序行为，是否继续？如果您不是开发者调试程序，不建议继续运行')){
    appLogger.info('Continue run after global error');
    document.getElementById('global-error-info').style.display='none'
  }
}
function reloadWithNoDataMode() {
  if(confirm('无数据模式将暂时不会加载您的数据，但您的数据并没有丢失，稍后重启以后您可以手动导出数据然后排查问题'+
    '（期间不要手动保存数据），更多说明，请参考帮助文档。是否继续无数据模式？')) {
    appLogger.info('Set to no data mode ');
    localStorage.setItem('noDataMode', 'yes');
    location.reload(true);
  }
}