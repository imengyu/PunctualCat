
//import css

import 'animate.css/animate.css'
import 'element-ui/lib/theme-chalk/index.css';

import "./assets/css/font-awesome.min.css";
import "./assets/css/iconfont.css";
import "./assets/sass/main.scss";

//import scripts

import Vue from 'vue'
import ElementUI from 'element-ui';

import path from "path";
import fs from "fs";
import $ from "jquery";
import App from './App.vue'
import electron from "electron";
import process from "process";
import log4js from "log4js";

const Datastore = require("nedb");
const dialog = electron.remote.dialog;

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.prototype.$ = $;

function initVue() {
  new Vue({
    el: '#app',
    render: h => h(App)
  })
  showIntro();
};
function showIntro() {
  $('#window-loading-text').fadeOut(800, function(){
    $('#intro-ver').text(window.appVesrsion + ' ' + window.appBuildDate);
    $('.intro img').show().addClass(['animated','bounceInDown']);
    $('.intro h3').show().addClass(['animated','bounceInUp']);
    $('.intro .ver-text').show().addClass(['animated','bounceInUp']);
    setTimeout(() => $('#window-loading .progress').fadeOut(800), 1000)
  });
}
function showErr(source, lineno, colno, error) {
  $('#global-error-info-content').html('<div class="text-blod">' + error + '</div>' + 
    '<div><span class="text-secondary>位置：</span><span class="text-primary>' + source + ':' + lineno + ':' + colno + '</span></div>');
  $('#global-error-info').show();
  $('#intro').hide();
}


//Global error

window.onerror = (event, source, lineno, colno, error) => {
  if(window.appInited) window.showRunTimeError(source, lineno, colno, error);
  else showErr(source, lineno, colno, error);
};

//Global path

var appPath = process.cwd().replace(/\\/g, '/');
var appDbPath = '';
var appDb = null;
var app = null;
var appVesrsion = 'V 2.0.1';
var appBuildDate = '2020/1/28';
var appLogger = null;
var appAutoLogger = null;
var appWin32 = null;

function initLogs() : Promise<void> {
  return new Promise((resolve, reject) => {
    let logDir = appPath + '/logs';
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
        reject(e)
      }
    }
    let testExists = () => {
      fs.exists(logDir, (exists) => {
        if(!exists) fs.mkdir(logDir, (err) => {
          if(err) reject('创建日志目录失败 (' + logDir + ')')
          else configueLogs();
        }); else configueLogs();
      })
    }
    testExists();
  });
}
function destroyLogs() {
  appLogger.info('Logger shutdown');
  log4js.shutdown();
}
function initDb() : Promise<void> {
  return new Promise((resolve, reject) => {
    let dbDir = appPath + '/data';
    let configueLogs = () => {
      try {
        appDb = new Datastore({ filename: appDbPath });
        resolve();
      }catch(e) {
        reject(e)
      }
    }
    let testExists = () => {
      fs.exists(dbDir, (exists) => {
        if(!exists) fs.mkdir(dbDir, (err) => {
          if(err) reject('创建数据目录失败 (' + dbDir + ')')
          else configueLogs();
        }); else configueLogs();
      })
    }
    testExists();
  });
}
function initBasePath() {

  window.appDir = appPath;

  if(fs.existsSync(appPath + '/dist/index.html')) window.appDir = path.posix.join(appPath, '/dist');
  else if(fs.existsSync(appPath + '/dist/development/index.html')) window.appDir = path.posix.join(appPath, '/dist/development');
  else if(fs.existsSync(appPath + '/resources/app/index.html')) window.appDir = path.posix.join(appPath, '/resources/app');
  else if(fs.existsSync(appPath + '/resources/app.asar')) window.appDir = path.posix.join(appPath, '/resources/app.asar');

  appDbPath = appPath + "/data/data.db";

  console.log(`[Loader] App version is ${appVesrsion} (${appBuildDate})`);
  console.log(`[Loader] App base path is ${appPath}`);
  console.log(`[Loader] App doc path is ${window.appDir}`);
  console.log(`[Loader] App db path is ${appDbPath}`);
}
function initGlobal() {
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
  appLogger.info(`App version is ${appVesrsion} (${appBuildDate})`);
  appLogger.info(`App base path is ${window.appDir}`);
  appLogger.info(`App db path is ${appDbPath}`);
}

function initNativeModule() {
  try{
    let nativeModulePath = '';

    if(process.arch == 'ia32' || process.arch == 'x32') nativeModulePath = window.appDir + '/' + require("./native/app-ia32.node");
    else if(process.arch == 'x64') nativeModulePath = window.appDir + '/' + require("./native/app-x64.node");
    else {
      appLogger.error('Native module is not support whith arch ' + process.arch);
      dialog.showErrorBox('加载本地模块时发生错误', '本地模块不适用于您的系统。当前系统：' + process.arch);
      return;
    }

    console.log(`[Loader] Load native module for arch ${process.arch} : ${nativeModulePath}`);
    appLogger.info(`Load native module for arch ${process.arch} : ${nativeModulePath}`);
    appWin32 = (<any>global).nodeRequire(nativeModulePath);

  }catch(e) {
    appLogger.error('Error while loading Native module : ' + e);
    dialog.showErrorBox('加载本地模块时发生错误', '这可能导致程序出现不可预料的行为。建议您参照 帮助文档 将错误日志发送给我们，以便更好的解决此问题。错误消息：' + e);
  }
}

//Loader start

initBasePath();
initLogs().then(() => {
  initDb().then(() => {
    initNativeModule();
    initGlobal();
    initVue()
  }).catch((err) => {
    console.error(err);
    dialog.showErrorBox('初始化数据失败', err);
  });
}).catch((err) => {
  console.error(err);
  dialog.showErrorBox('初始化日志失败', err);
});

//Base type extends

import './utils/BaseExtends'
