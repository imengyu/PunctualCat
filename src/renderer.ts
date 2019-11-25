
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
  else if(fs.existsSync(window.appDir + '/resources/app/index.html')) window.appDir = path.posix.join(window.appDir, '/resources/app');
  else if(fs.existsSync(window.appDir + '/resources/app.asar')) window.appDir = path.posix.join(window.appDir, '/resources/app.asar');
}

//Global error
window.onerror = (event, source, lineno, colno, error) => {
  if(window.appInited) window.app.showRunTimeError(source, lineno, colno, error);
  else showErr(source, lineno, colno, error);
};

//Loader start

window.initVue = initVue;

//Base type extends

import './utils/BaseExtends'
