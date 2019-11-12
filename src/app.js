
//import css

import 'animate.css/animate.css'
import 'element-ui/lib/theme-chalk/index.css';

import "./assets/css/font-awesome.min.css";
import "./assets/css/iconfont.css";
import "./assets/sass/main.scss";

//import scripts

import Vue from 'vue'
import ElementUI from 'element-ui';

import $ from "jquery";
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.prototype.$ = $;

const initVue = function() {
  main = new Vue({
    el: '#app',
    render: h => h(App)
  })
  showIntro();
};
const showIntro = function() {
  $('#intro img').show().addClass(['animated','bounceInDown']);
  $('#intro h3').show().addClass(['animated','bounceInUp']);
  $('#intro .ver-text').show().addClass(['animated','bounceInUp']);
  $('#intro-ver').text(appVesrsion + ' ' + appBuildDate);
}
const showErr = function(source, lineno, colno, error) {
  $('#global-error-info-content').html('<div class="text-blod">' + error + '</div>' + 
    '<div><span class="text-secondary>位置：</span><span class="text-primary>' + source + ':' + lineno + ':' + colno + '</span></div>');
  $('#global-error-info').show();
  $('#intro').hide();
}

//Global error
window.onerror = (event, source, lineno, colno, error) => {
  if(main.inited)
    console.log(event);
  else showErr(source, lineno, colno, error);
};

//Loader start

window.addEventListener('load', () => {
  initVue();
});

//Base type extends

import './utils/BaseExtends'
