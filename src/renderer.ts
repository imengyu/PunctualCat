
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
  initBasePath();
  new Vue({
    el: '#app',
    render: h => h(App)
  })
  showIntro();
};
function showIntro() {
  $('.window-loading').fadeOut();
  $('#intro img').show().addClass(['animated','bounceInDown']);
  $('#intro h3').show().addClass(['animated','bounceInUp']);
  $('#intro .ver-text').show().addClass(['animated','bounceInUp']);
  $('#intro-ver').text(window.appVesrsion + ' ' + window.appBuildDate);
}
function showErr(source, lineno, colno, error) {
  $('#global-error-info-content').html('<div class="text-blod">' + error + '</div>' + 
    '<div><span class="text-secondary>位置：</span><span class="text-primary>' + source + ':' + lineno + ':' + colno + '</span></div>');
  $('#global-error-info').show();
  $('#intro').hide();
}
function initBasePath() {
  window.appDir = process.cwd().replace(/\\/g, '/');
  if(fs.existsSync(window.appDir + '/dist/index.html')) window.appDir = path.posix.join(window.appDir, '/dist');
  else if(fs.existsSync(window.appDir + '/dist/development/index.html')) window.appDir = path.posix.join(window.appDir, '/dist/development');
  else if(fs.existsSync(window.appDir + '/resources/app/index.html')) window.appDir = path.posix.join(window.appDir, '/resources/app');
  else if(fs.existsSync(window.appDir + '/resources/app.asar')) window.appDir = path.posix.join(window.appDir, '/resources/app.asar');
}

//Global error
window.onerror = (event, source, lineno, colno, error) => {
  if(window.appInited) window.app.showRunTimeError(source, lineno, colno, error);
  else showErr(source, lineno, colno, error);
};

//Loader start

var appPath = process.cwd();
var dbPath = appPath + "/data/data.db";
var appDb = new Datastore({ filename: dbPath });
var app = null;
var appVesrsion = 'V 2.0.1';
var appBuildDate = '2919/11/28';
var appLogger = null;
var appAutoLogger = null;
var appWin32 = null;

window.addEventListener('load', () => {
  initLogs().then(() => {
    loadGlobal();
    loadNativeModule();
    initVue()
  }).catch((err) => {
    console.error(err);
    dialog.showErrorBox('初始化日志失败', err);
  });
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
      fs.exists(logDir, (exists) => {
        if(!exists) fs.mkdir(logDir, (err) => {
          if(err) reject('创建日志目录失败')
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
  appLogger.debug('Load database from ' + dbPath);
  appLogger.debug('App version is ' + appVesrsion + ' ' + appBuildDate);
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

//Base type extends

import './utils/BaseExtends'
