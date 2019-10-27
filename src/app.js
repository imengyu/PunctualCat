
//import css

import 'animate.css/animate.css'
import 'element-ui/lib/theme-chalk/index.css';

import "./assets/css/material-icons.css";
import "./assets/css/font-awesome.css";
import "./assets/css/iconfont.css";
import "./assets/sass/main.scss";

//import scripts

import Vue from 'vue'
import ElementUI from 'element-ui';

import jQuery from "jquery";
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(ElementUI);

const initVue = function() {
  main = new Vue({
    el: '#app',
    render: h => h(App)
  })
  showIntro();
};
const showIntro = function() {
  jQuery('#intro img').show().addClass(['animated','bounceInDown']);
  jQuery('#intro h3').show().addClass(['animated','bounceInUp']);
  jQuery('#intro .ver-text').show().addClass(['animated','bounceInUp']);
  jQuery('#intro-ver').text(main.appVesrsion + ' ' + main.appBuildDate);
}

//Loader start

window.addEventListener('load', () => {
  initVue();
});

//Base type extends

import './utils/base-extends'
