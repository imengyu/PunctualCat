<template>
  <div class="window-container">
    <div v-if="background && background != ''" class="full-background"
      :style="'background-image: url(file:///' + background + ');opacity:' + (backgroundOpacity/100)"
    ></div>
    <!--登录-->
    <div :class="'full-locker' + (locked ? ' show' : '')">
      <div class="login-area">
        <div class="login">
          <h3>登录系统</h3>
          <div class="info-box">
            <h5 class="m-0" id="login-app-title">PunctualCat</h5>
            <h5 class="m-0 mb-1">{{ lockedNote }}</h5>
            <h5 v-if="lockedLasswordErr && lockedLasswordErr != ''" class="m-0 mb-1 text-danger">{{ lockedLasswordErr }}</h5>
          </div>
          <div class="password-box">
            <input id="password-input" placeholder="请输入密码" type="password" v-model="lockedEnterPassword" @focus="inputUnLockClick" @keyup="loginInputKeyDown($event)" />
            <el-button class="mt-4" type="primary" @click="doUnLock" round>登录系统</el-button>
          </div>
        </div>
      </div>
    </div>
    <!--日历弹出区-->
    <transition enter-active-class="animated fadeInLeft anim-fast delay-300ms" leave-active-class="animated bounceOutLeft anim-fast">
      <div v-show="calendarViaible" class="calendar-host">
        <div class="place-holder-top">
          <text-time ref="textTime1" @date-click="switchCalendar" />
        </div>
        <div class="place-holder-center">
          <calendar ref="calendar" :lunar="true" />
        </div>
        <div class="place-holder-bottom">
          <el-button @click="calendarViaible=false" round>收起日历</el-button>
        </div>
      </div>
    </transition>
    <!--日历遮罩-->
    <transition enter-active-class="animated fadeIn anim-fast delay-300ms" leave-active-class="animated fadeOut anim-fast">
      <div v-show="calendarViaible" class="calendar-mask" @click="calendarViaible=false"></div>
    </transition>
    <!--顶栏-->
    <div class="top-bar">
      <transition enter-active-class="animated bounceIn anim-fast delay-400ms" leave-active-class="animated fadeOut anim-fast">
        <text-time ref="textTime2" v-show="!calendarViaible" @date-click="switchCalendar" />
      </transition>
      <div v-show="calendarViaible"></div>
      <div class="top-menu">
        <icon-toolbar :items="topToolbar" :active-item="topTabSelectItem" :arrow-offest="-15" @item-click="onMainTabClick" @select-item-changed="onMainTabChanged" />
      </div>
    </div>
    <!--主区域-->
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <table-view ref="tableView" v-if="topTabSelectItem" v-show="topTabSelectItem.name=='main-list'" :table-service="serviceTables" :auto-play-service="autoPlayService" :app="app" />
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <radio-view v-if="topTabSelectItem" v-show="topTabSelectItem.name=='radio-message'" :app="app" />
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <settings-view ref="settingsView" v-if="topTabSelectItem" v-show="topTabSelectItem.name=='settings'" :app="app" :nativeModuleEnabled="nativeModuleEnabled" />
    </transition>
    <!--底部音乐频谱-->
    <audio-wave ref="audioWave" class="main-audio-wave"></audio-wave>
    <!--音量弹出-->
    <transition enter-active-class="animated bounceInDown anim-fast" leave-active-class="animated fadeOutUp anim-fast">
      <voice-view v-show="voiceProverVisible" :show.sync="voiceProverVisible" :nativeModuleEnabled="nativeModuleEnabled"
        @volume-soft-changed="onVolumeSoftChanged" @volume-system-changed="onVolumeSystemChanged"
        style="top:120px;right:20px" />
    </transition>
    <!--引导页-->
    <transition enter-active-class="animated fadeIn anim-fast delay-300ms" leave-active-class="animated fadeOut anim-fast">
      <div v-show="introductionVisible" class="introduction-host">
        <div class="introduction-inner">
          <div class="page">
            <swiper :options="introductionSwiperOption">
              <swiper-slide>
                <div class="introduction-page">
                  <img src="./assets/images/intro/auto.svg" />
                  <h5>完全自动的执行</h5>
                  <p>任务完全由软件自动播放系统自动执行，无需您进行人工干预</p>
                  <div class="footer-button"></div>
                </div>
              </swiper-slide>
              <swiper-slide>
                <div class="introduction-page">
                  <img src="./assets/images/intro/security.svg" />
                  <h5>安全的数据存放</h5>
                  <p>您的数据被安全保护在系统内部，您还可以设置保护密码来保护系统</p>
                  <div class="footer-button"></div>
                </div>
              </swiper-slide>
              <swiper-slide>
                <div class="introduction-page">
                  <img src="./assets/images/intro/tasks.svg" />
                  <h5>精细的任务设置</h5>
                  <p>任务可自定义多种条件，满足您的多种播放需求</p>
                  <div class="footer-button">
                    <el-button type="primary" size="small" @click="endFirstIntroductionPage" round>立即开始使用</el-button>
                  </div>
                </div>
                
              </swiper-slide>
              <div class="swiper-pagination" slot="pagination"></div>
              <div class="swiper-button-prev" slot="button-prev"></div>
              <div class="swiper-button-next" slot="button-next"></div>
            </swiper>
          </div>
        </div>
      </div>
    </transition>
    <!--入门页-->
    

    <!--音乐列表-->
    <el-drawer
      title="音乐列表"
      :visible.sync="isShowMusicList"
      size="38%"
      direction="rtl"
      @closed="$refs['musicList'].endChoodeMusic()">
      <music-list ref="musicList" 
        @item-click="onMusicItemClick" 
        @choosed="isShowMusicList=false"
        @add-music="onAddMusicToList"
        :app="app" />
    </el-drawer>
    <!--日志列表-->
    <el-drawer
      title="查看日志"
      :visible.sync="isShowLogList"
      size="38%"
      direction="rtl">
      <log-list ref="logView" :app="app" />
    </el-drawer>
    <!--退出对话框-->
    <el-dialog
      :visible.sync="quitDialog"
      class="el-dialog-width-fix-50"
      center>
      <div class="iconfont icon-bangzhu text-center mb-3" style="font-size:66px;"></div>
      <div class="text-center">是否真的要退出应用？退出以后将不能自动播放铃声！</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="quitDialog=false" round>不退出</el-button>
        <el-button type="info" @click="exitApp(false)" round>退出应用</el-button>
      </span>
    </el-dialog>
    <!--关机对话框-->
    <el-dialog
      :visible.sync="shutdownNowDialog"
      class="el-dialog-width-fix-50"
      center>
      <div class="iconfont icon-bangzhu text-center mb-3" style="font-size:66px;"></div>
      <div class="text-center">关机已启动，系统将在 <span class="text-important">{{ shutdownTick }}</span> 秒后关机</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="shutdownCancel" round>取消关机</el-button>
        <el-button type="danger" @click="executeShutdownNow" round>立即关机</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="rebootNowDialog"
      class="el-dialog-width-fix-50"
      center>
      <div class="iconfont icon-bangzhu text-center mb-3" style="font-size:66px;"></div>
      <div class="text-center">重启已启动，系统将在 <span class="text-important">{{ shutdownTick }}</span> 秒后重新启动</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="rebootCancel" round>取消关机</el-button>
        <el-button type="danger" @click="executeShutdownNow" round>立即重启机</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import { MessageBoxInputData } from 'element-ui/types/message-box'
import "./utils/BaseExtends";
import Win32Helper from "./utils/Win32Utils";
import CommonUtils from "./utils/CommonUtils";
import $ from "jquery";
import fs from 'fs';
import child_process from 'child_process';

import TextTime from "./components/TextTime.vue"
import IconToolBar from "./components/IconToolBar.vue"
import Calendar from "./components/Calendar.vue"
import AudioWave from './components/AudioWave.vue'
import AutoTimerStatus from './components/AutoTimerStatus.vue'

import MusicView from "./views/MusicView.vue"
import VoiceView from "./views/VoiceView.vue"
import SettingsView from "./views/SettingsView.vue"
import TableView from "./views/TableView.vue"
import RadioView from "./views/RadioView.vue"
import LogView from "./views/LogView.vue"

import { MusicItem, MusicAction, MusicStatus, getPlayingCount, setPlayingCountChangedCallback, setMusicWaveStartCallback, setMusicWaveStopCallback } from './model/MusicItem'
import IconToolItem from "./model/IconToolItem";
import TableServices from "./services/TableServices";
import SettingsServices from "./services/SettingsServices";
import AutoPlayService from "./services/AutoPlayService";
import { MusicHistoryService, createMusicHistoryService } from "./services/MusicHistoryService";
import { DataStorageServices, createDataStorageServices, destroyDataStorageServices } from "./services/DataStorageServices";
import GlobalWorker from "./services/GlobalWorker";

import electron, { BrowserWindow, Rectangle, shell } from "electron";
import { Menu, MenuItem } from "electron";
import Win32Utils from "./utils/Win32Utils";
import { Logger } from "log4js";
import { UserLogService, UserLog } from "./services/UserLogService";
import { loadMenuIcon } from "./utils/MenuUtils";
import 'swiper/dist/css/swiper.css'
import { swiper, swiperSlide } from 'vue-awesome-swiper'

const ipc = electron.ipcRenderer;
const remote = electron.remote;
const screen = remote.screen;

@Component({
  components: {
    'text-time': TextTime,
    'icon-toolbar': IconToolBar,
    'calendar': Calendar,
    'audio-wave': AudioWave,
    'auto-status': AutoTimerStatus,
    'music-list': MusicView,
    'log-list': LogView,
    'voice-view': VoiceView,
    'settings-view': SettingsView,
    'table-view': TableView,
    'radio-view': RadioView,
    'swiper': swiper,
    'swiper-slide': swiperSlide
  }
})
export default class App extends Vue {
  name = "App";

  //Props
  //=====

  inited = false;
  app : App = this;
  //Dialog and menu visible control
  calendarViaible = false;
  isShowMusicList : boolean = false;
  isShowLogList : boolean = false;
  menuVisible : boolean = false;
  voiceProverVisible : boolean = false;
  introductionVisible : boolean = false;
  quitDialog : boolean = false;
  shutdownNowDialog : boolean = false;
  rebootNowDialog : boolean = false;
  isMax = false;
  shutdownTimer = null;
  shutdownTick = 0;
  locked = false;
  lockedLasswordErr = '';
  lockedEnterPassword = '';
  lockedNote = '';
  background = '';
  backgroundOpacity = 0;
  lockAutoTimer = null;
  autoHideMinute = 0;
  autoLockMinute = 0;
  developerMode = false;
  nodataMode = false;
  introductionSwiperOption = {
    pagination: {
      el: '.swiper-pagination'
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  };

  logger : Logger = null;
  userLogger : UserLogService = null;
  nativeModuleEnabled = false;
  globalRunning = false;

  //Toolbar and menu
  topToolbar: Array<IconToolItem> = [
    new IconToolItem('main-list', 'icon-xiaoxizhongxin', '铃声列表', 36),
    new IconToolItem('radio-message', 'icon-guangbo', '广播消息', 42),
    new IconToolItem('music-list', 'icon-yanchu', '音乐列表', 36, 'icon', false), 
    new IconToolItem('voice-settings', 'icon-shengyin', '声音设置', 36, 'icon', false),
    new IconToolItem('settings', 'icon-shezhi1', '软件设置', 36),
    new IconToolItem('main-menu', 'icon-caidan_o', '主菜单', 40, 'icon', false),
  ];
  topTabSelectItem : IconToolItem = null;
  getTopTabByName(name : string) {
    for(var i=0;i<this.topToolbar.length;i++){
      if(this.topToolbar[i].name == name) return this.topToolbar[i];
    }
    return null;
  }

  tabTransitionClass = [
    "animated fadeInLeft anim-fast", 
    "animated fadeOutRight anim-fast"
  ];
  menuSettings: Menu ;
  menuItemDeveloper: MenuItem;
  menuInput: Menu = null;
  menuCopy: Menu = null;
  currentWindow : BrowserWindow = null;
  currentMousePos = {
    x: 0,
    y: 0
  }
  currentMousePosScreen = {
    x: 0,
    y: 0
  }
  playingMusicCount : number = 0;

  //Data pool

  baseData = null;
  musicHistoryList : Array<MusicItem> = [];

  //Services

  autoPlayService: AutoPlayService = null;
  serviceTables: TableServices = null;
  serviceDataStorage : DataStorageServices = null;
  serviceMusicHistory : MusicHistoryService = null;


  mounted() { this.init() }

  beforeDestroy() {
    this.uninit();
  }

  //Watchs
  //=====
  /*@Watch('currentShowItem')
  onCurrentShowItemChanged(val: TabModel, oldVal: TabModel) { 
  }*/

  @Watch('playingMusicCount')
  onPlayingMusicCountChanged(val : number){
    let playerTabItem = this.getTopTabByName('music-list');
    if(val > 0) {
      playerTabItem.showHotPoint = true;
      playerTabItem.hotPointCount = val.toString();
      playerTabItem.hotPointCountTooltip = '现在有 ' + val + ' 首音乐正在播放';
    }else{
      playerTabItem.showHotPoint = false;
      playerTabItem.hotPointCount = '0';
      playerTabItem.hotPointCountTooltip = '';
    }
  }
  @Watch('isMax')
  onIsMaxChanged(max : boolean) {
    if(max) {
      $('.window-icon-maximize').hide();
      $('.window-icon-unmaximize').show();
    }else {
      $('.window-icon-maximize').show();
      $('.window-icon-unmaximize').hide();
    }

  }

  //Methods
  //=====

  //** Show and hide
  hideIntro() {
    $("#intro").addClass('hidding');
    setTimeout(function() {
      $("#intro").removeClass('hidding');
      $("#intro").addClass('hidden');
    }, 1000);
  }
  showRunTimeError(source : string, lineno : number, colno : number, error : Error) { 
    if(error) {
      this.$alert('<div class="display-block font-monospace mt-3 p-3 bg-light-grey overflow-scroll-x scroll-fix-white">' + error + 
        '</div><div class="display-block font-monospace p-3 bg-light-grey overflow-scroll-x scroll-fix-white">错误位置：<span class="text-important">' + 
          source + ':' + colno + '</span></div>','程序发生了一个不可预料的错误', {
        dangerouslyUseHTMLString: true,
        type: 'error'
      })
      this.logger.error(error.message, error, source, lineno, colno)
      console.error(error, source, lineno, colno);
    }
  }
  showStartUpError(message : string, e) {
    $("#global-error-info").show();
    $("#global-error-info-content").html('<span class="display-block text-important">' + message + '</span><span class="display-block font-monospace">' + e + '</span>');
    $("#intro").hide();
    this.logger.error(message, e);
    console.error(message, e)
  }
  exitHide(callback) {
    $("html,body").addClass(["animated", "zoomOut"]);
    $("html,body").on("animationend", function() {
      callback();
    });
  }
  minWindow() { this.currentWindow.minimize() }
  closeWindow() { this.currentWindow.close() }
  maxRestoreWindow() {
    if(this.isMax) { this.currentWindow.restore(); this.isMax=false; }
    else { this.currentWindow.maximize(); this.isMax=true; }
  }
  initWindowFuns() {
    (<any>window).minWindow = () => this.minWindow();
    (<any>window).closeWindow = () => this.closeWindow();
    (<any>window).maxRestoreWindow = () => this.maxRestoreWindow();
  }

  //** Init styles

  //初始化和卸载
  init() {
    //初始化所有服务
    this.userLogger = new UserLogService()
    this.nativeModuleEnabled = Win32Utils.init();
    this.logger = window.appLogger;
    this.currentWindow = remote.getCurrentWindow();
    this.serviceDataStorage = createDataStorageServices();
    this.initWindowFuns();
    this.initWindowEvents();
    this.initAutoLockTimer();
    this.initWindowBaseEvents();
    this.initAppConfigue().then(() => {
      this.serviceDataStorage.init().then(() => {
      
        SettingsServices.initSettings();
        SettingsServices.loadSettings().then(() => initInternal()).catch((e) => {
          this.showStartUpError('加载设置失败 ', e)
          initInternal();
        })

        let initInternal = () => {

          //Load actions
          this.initGlobalActions();
          
          //music history
          this.serviceMusicHistory = createMusicHistoryService(this.musicHistoryList);
          //Devtools
          if(process.env.NODE_ENV == 'developnment' || SettingsServices.getSettingBoolean('system.developerMode')) {
            window.app = this;
            this.currentWindow.webContents.openDevTools();
          }

          this.loadAllDatas(() => {

            try {

              if(!this.nodataMode) this.userLogger.writeLog('数据加载成功');

              //Core services
              this.initCoreServices();

              setPlayingCountChangedCallback((music, count) => this.playingMusicCount = count);
              setMusicWaveStartCallback((music) => {
                if(SettingsServices.getSettingBoolean('player.enableWave') && this.currentWindow.isVisible())
                  (<AudioWave>this.$refs['audioWave']).startDrawMusic(music);
              });
              setMusicWaveStopCallback((music) => { 
                if(music == (<AudioWave>this.$refs['audioWave']).currentMusic)
                  (<AudioWave>this.$refs['audioWave']).stopDrawMusic();
              });

              //Appily settings
              this.appilySettings(true);

              //Menu
              this.initMenus();
              //IPCS
              this.initIpcs();

              this.userLogger.writeLog('系统初始化完成');

              //hide intro
              setTimeout(() => {
                this.hideIntro();
                this.topTabSelectItem = this.topToolbar[0];
                this.autoPlayService.start();
                this.inited = true;

                //run first tip
                if(SettingsServices.getSettingBoolean('app.firstRun')) {
                  SettingsServices.setSettingBoolean('app.firstRun', false);
                  this.showFirstIntroductionPage();
                }

                window.appInited = true;
              }, 1000);   
            }catch(e){
              this.showStartUpError('初始化失败 ', e)
            }
          })
        }
      }).catch((e) =>  this.showStartUpError('初始化数据失败 ', e))
    }).catch((e) =>  this.showStartUpError('在加载静态配置文件时发生错误，请尝试移除静态配置文件 ', e))
  }
  initIpcs() {
    ipc.send('main-act-main-standby', true);
    ipc.on("main-window-act", (event, arg) => {
      if (arg == "show-exit-dialog") {
        this.exitAppWithAsk();
      }
    });
    ipc.on('selected-image', (event, arg, path) => {
      if(!path || path.length == 0) 
        return;
      if(arg.type=='chooseOneImageAndCallback'){
        this.chooseOneImageCallback(path[0]);
      }
    });
    ipc.on('selected-music', (event, arg, path) => {
      if(!path || path.length == 0) 
        return;
      if(arg.type=='chooseCommandMusic'){
        this.serviceMusicHistory.addMusicToHistoryList(new MusicItem(path[0]));
      }
      else if(arg.type=='openAndPlay'){
        this.serviceMusicHistory.addMusicToHistoryList(new MusicItem(path[0]));
      }
      else if(arg.type=='chooseOneMusicAndCallback'){
        let music = new MusicItem(path[0]);
        this.serviceMusicHistory.addMusicToHistoryList(music);
        this.chooseOneMusicCallback(music);
      }
      else if(arg.type=='addMusicsToHistoryList'){
        var index = 0;
        path.forEach(element => {
          if(element!=''){
            if(!this.serviceMusicHistory.existsInHistoryList(element))
              this.serviceMusicHistory.addMusicToHistoryList(new MusicItem(element));
            index++;
          }
        });    
        this.$message({
          message: '成功添加 ' + index + ' 首音乐！',
          type: 'success'
        });
      }
    });
    
  }
  initMenus() {
    this.menuSettings = new electron.remote.Menu();
    
    this.menuSettings.append(new electron.remote.MenuItem({ label: '锁定软件', accelerator: 'CmdOrCtrl+L', click: () => this.lock(), icon: loadMenuIcon(require('./assets/images/menu/lock.png')) }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }));

    let noDataMode = localStorage.getItem('noDataMode');
    if(noDataMode == 'yes') {
      this.menuSettings.append(new electron.remote.MenuItem({ label: '退出无数据模式', click: () => {
        localStorage.setItem('noDataMode', 'no');
        location.reload(true);
      } }));
    }

    this.menuSettings.append(new electron.remote.MenuItem({ label: '数据导出与导入', click: () => this.goToSettingsPage('datas') }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '手动保存数据', accelerator: 'CmdOrCtrl+S', click: () => {  
      this.saveDatas().then(() => this.$message({ message: '手动保存数据成功', type: 'success' }))
        .catch((e) => {
          this.$alert('保存数据失败，错误信息：' + e, '保存数据失败', { type: 'error', roundButton: true, })
          this.logger.error('保存数据失败', e);
        })
    }}));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '查看日志', accelerator: 'CmdOrCtrl+O', click: () => this.showLogView(), icon: loadMenuIcon(require('./assets/images/menu/log.png')) }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '入门', click: () => this.showFirstGuidePage(), icon: loadMenuIcon(require('./assets/images/menu/tip.png')) }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '帮助', click: () => this.showHelpWindow(null), icon: loadMenuIcon(require('./assets/images/menu/help.png')) }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '软件设置', click: () => this.goToSettingsPage('global'), icon: loadMenuIcon(require('./assets/images/menu/settings.png')) }));

    var developerSubMenu = new electron.remote.Menu();
    var developerSubMenuAutoOpenDevTools = new electron.remote.MenuItem({ 
      label: '启动时开启开发者工具', 
      click: () => {
        let val = !SettingsServices.getSettingBoolean('system.autoOpenDevTools')
        SettingsServices.setSettingBoolean('system.autoOpenDevTools', val);
        developerSubMenuAutoOpenDevTools.checked = val;
      }, checked: SettingsServices.getSettingBoolean('system.autoOpenDevTools'),
      type: 'checkbox'
    });
    developerSubMenu.append(new electron.remote.MenuItem({ label: '切换开发者工具', click: () => { 
      if(this.currentWindow.webContents.isDevToolsOpened()) this.currentWindow.webContents.closeDevTools();
      else this.currentWindow.webContents.openDevTools();
    }, icon: loadMenuIcon(require('./assets/images/menu/dev.png')) }));
    developerSubMenu.append(developerSubMenuAutoOpenDevTools);
    developerSubMenu.append(new electron.remote.MenuItem({ label: '打开进程管理器', click: () => {} }));
    developerSubMenu.append(new electron.remote.MenuItem({ type: 'separator' }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '查看程序运行日志', click: () => shell.openExternal(process.cwd() + '/logs'), icon: loadMenuIcon(require('./assets/images/menu/log2.png')) }));
    developerSubMenu.append(new electron.remote.MenuItem({ type: 'separator' }));

    developerSubMenu.append(new electron.remote.MenuItem({ label: '测试引导页', click: () => this.showFirstIntroductionPage() }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制清除数据', click: () => { 
      this.$confirm('警告！这是调试功能，数据清除后不可恢复，是否继续？', {
        title: '调试功能',
        type: 'warning',
        roundButton: true,
        confirmButtonText: '确定清除',
        confirmButtonClass: 'el-button--danger'
      }).then(() => {
        this.serviceDataStorage.clearData().then(() => this.$message({ message: '清除数据成功！', type: 'success' }))
        .catch((e) => this.$message({ message: '清除数据失败！错误信息：' + e, type: 'success' }))
      }).catch(() => {});
    }, icon: loadMenuIcon(require('./assets/images/menu/cleardata.png')) }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '结束软件进程', accelerator: 'CmdOrCtrl+K', click: () => ipc.send('main-act-quit') }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '重载页面', accelerator: 'CmdOrCtrl+R', click: () => location.reload(true) }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '杀死页面', click: () => { location.href = 'chrome://kill/' } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '错误测试', click: () => { throw new Error('测试异常，抛出错误') } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制跳转到 URL', click: () => { 
      this.$prompt('输入要跳转到的 URL ', 'DEBUG - URL', {
        confirmButtonText: '跳转',
        cancelButtonText: '取消',
        roundButton: true,
        inputValue: location.href,
        inputType: 'textArea',
        inputPlaceholder: '输入 URL',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false
      }).then((data : MessageBoxInputData) => {
        location.href = data.value;
      }).catch(() => {});
    } }));
    developerSubMenu.append(new electron.remote.MenuItem({ type: 'separator' }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '关闭开发者模式', click: () => { 
      SettingsServices.setSettingBoolean('system.developerMode', false);
      if(this.currentWindow.webContents.isDevToolsOpened())
        this.currentWindow.webContents.closeDevTools();
      this.menuItemDeveloper.visible = false;
    }, icon: loadMenuIcon(require('./assets/images/menu/ban.png')) }));

    this.menuItemDeveloper = new electron.remote.MenuItem({ label: '开发者选项', submenu: developerSubMenu, icon: loadMenuIcon(require('./assets/images/menu/bug.png')) });
    if(!this.developerMode) this.menuItemDeveloper.visible = false;
    this.menuSettings.append(this.menuItemDeveloper);
    
    var powerSubMenu = new electron.remote.Menu();
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭计算机', click: () => this.shutdownByUser(), icon: loadMenuIcon(require('./assets/images/menu/shutdown.png')) }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '重启计算机', click: () => this.rebootByUser(), icon: loadMenuIcon(require('./assets/images/menu/reboot.png')) }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭显示器', click: () => this.closeMointor() }));

    this.menuSettings.append(new electron.remote.MenuItem({ label: '系统电源', submenu: powerSubMenu, icon: loadMenuIcon(require('./assets/images/menu/power.png')) }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '关于软件', click: () => this.goToSettingsPage('about') }));    
    this.menuSettings.append(new electron.remote.MenuItem({ label: '退出程序', click: () => this.exitAppWithAsk(), icon: loadMenuIcon(require('./assets/images/menu/quit.png')) }));

    this.menuInput = new electron.remote.Menu();
    this.menuInput.append(new electron.remote.MenuItem({ label:'剪切', role: 'cut' }));
    this.menuInput.append(new electron.remote.MenuItem({ label:'复制', role: 'copy' }));
    this.menuInput.append(new electron.remote.MenuItem({ label:'粘贴', role: 'paste' }));
    this.menuInput.append(new electron.remote.MenuItem({ label:'删除', role: 'delete' }));
    this.menuInput.append(new electron.remote.MenuItem({ label:'全选', role: 'selectAll' }));

    this.menuCopy = new electron.remote.Menu();
    this.menuCopy.append(new electron.remote.MenuItem({ label:'复制', role: 'copy' }));
    this.menuCopy.append(new electron.remote.MenuItem({ label:'全选', role: 'selectAll' }));

    window.addEventListener('mousemove', (e : MouseEvent) => {
      this.currentMousePos = {
        x: e.clientX,
        y: e.clientY
      }
      this.currentMousePosScreen = {
        x: e.screenX,
        y: e.screenY
      }
    });
    window.addEventListener('contextmenu', (e : MouseEvent) => { 
      e.preventDefault();
      if(CommonUtils.isEleEditable(e.target)){
        this.menuInput.popup({ window: this.currentWindow });
      }else if(!CommonUtils.isNullOrEmpty(window.getSelection())){
        this.menuCopy.popup({ window: this.currentWindow });
      }
    }, false);

    this.currentWindow.setMenu(this.menuSettings);
    this.currentWindow.setMenuBarVisibility(false);
  }
  initGlobalActions() {
    GlobalWorker.registerGlobalAction('shutdown', () => {
      UserLogService.writeLog('执行关机命令');
      this.logger.info('Execute shutdown action by auto task');
      this.shutdownByUser();
    });
    GlobalWorker.registerGlobalAction('reboot', () => {
      UserLogService.writeLog('执行重启命令');
      this.logger.info('Execute reboot action by auto task');
      this.rebootByUser();
    });
    GlobalWorker.registerGlobalAction('runcommands', (commands : Array<string>, 
      callback : (command : string, fininshTime : number, err, stdout : string, stderr : string) => boolean, 
      finishCallback : (success: boolean) => void) => {
        let currentCommandIndex = 0;
        let startTime : Date = null;
        let execCommand = () => {
          if(currentCommandIndex < commands.length){
            startTime = new Date();
            child_process.exec(commands[currentCommandIndex], (error, stdout, stderr) => {
              let sec = startTime.getTime() - new Date().getTime();
              if(callback(commands[currentCommandIndex], sec, error, stdout, stderr)) {
                currentCommandIndex++;
                execCommand();
              }else finishCallback(false);
            })
          }else finishCallback(true);
        }
        execCommand()
      }
    );
  }
  initWindowBaseEvents() {
    this.currentWindow.removeAllListeners('page-title-updated');
    this.currentWindow.removeAllListeners('session-end');
    this.currentWindow.on('session-end', () => {
      this.logger.info('Session end event received, now exit app');
      this.exitApp()
    }) //关机事件
    this.currentWindow.on('page-title-updated', (event, title, explicSplit) => {
      $('.window-title').text(title);
    }) //标题更改
  }
  initAppConfigue() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(process.cwd() + '/config/app.js', (err, data) => {
        if(err) resolve();
        else {
          try {
            let dataJson = data.toJSON().data;
            console.log('app.json check : ');
            console.dir(dataJson);
            resolve();
          }catch(e) { reject(e) }
        }
      })
    });
  }
  initCoreServices() {
    this.serviceTables = new TableServices();
    if(this.baseData) this.serviceTables.loadFromJsonObject(this.baseData);
    else {
      this.baseData = [];
      this.logger.warn('Base data lost, use empty data');
    }
    this.autoPlayService = new AutoPlayService(this.serviceTables);
    this.autoPlayService.on('daychange', this.onDayChange);
    this.autoPlayService.on('runningchanged', this.onGlobalRunningChanged);

    SettingsServices.on('update', this.onSettingsUpdate);
  }

  initWindowEvents() {
    this.switchTimeRun(true);
    this.uninitWindowEvents();
    this.currentWindow.webContents.addListener('devtools-reload-page', this.onDevToolsReloadPage);
    this.currentWindow.addListener('hide', this.onWindowDeactive);
    this.currentWindow.addListener('minimize', this.onWindowDeactive);
    this.currentWindow.addListener('restore', this.onWindowActive);
    this.currentWindow.addListener('show', this.onWindowActive);
    this.currentWindow.addListener('focus', this.onWindowFocus);
    this.currentWindow.addListener('blur', this.onWindowBlur);
  }
  uninitWindowEvents() {
    this.currentWindow.webContents.removeListener('devtools-reload-page', this.onDevToolsReloadPage);
    this.currentWindow.removeAllListeners('page-title-updated');
    this.currentWindow.removeAllListeners('session-end');
    this.currentWindow.removeAllListeners('focus');
    this.currentWindow.removeAllListeners('blur');
    this.currentWindow.removeAllListeners('hide');
    this.currentWindow.removeAllListeners('minimize');
    this.currentWindow.removeAllListeners('restore');
    this.currentWindow.removeAllListeners('show');
  }
  uninit() : Promise<any> {
    ipc.send('main-act-main-standby', false);
    clearInterval(this.lockAutoTimer);
    return new Promise((resolve, reject) => {
      this.saveWindowSettings();
      this.saveDatas().then(() => {
        if(this.nativeModuleEnabled) Win32Utils.uninit();
        this.autoPlayService.stop();
        this.serviceTables.destroy();
        window.destroyLogs();
        this.userLogger.destroy();
        destroyDataStorageServices();
        resolve();
      }).catch((e) => reject(e))
    })
  }

  //
  //中央数据控制与设置

  loadAllDatas(callback : () => void) {
    let noDataMode = localStorage.getItem('noDataMode');
    if(noDataMode == 'yes') {
      const h = this.$createElement;

      this.nodataMode = true;
      this.userLogger.writeLog('当前运行在无数据模式', 
        '当前运行在无数据模式，系统目前没有加载数据，要恢复您的数据，您需要在 设置>数据管理 中导出您的数据');
      this.$msgbox({ 
        title: '提示', 
        message: h('div', null, [
          h('p', null, [
            h('span', null, '您现在正在运行无数据模式，当前并没有加载您的数据。如果你在加载数据时软件'+ 
            '不能正常运行而无数据模式可以正常运行，可能是您的数据有问题造成的，请在'),
            h('a', { on: { click: () => this.goToSettingsPage('datas') } }, '“系统设置”>“数据管理”'),
            h('span', null, '中导出数据，并将其发送给我们，我们将会为您修复数据。')
          ]),
          h('p', null, '或者，如果您之前有过数据备份，您可以直接导入以前备份的数据。'),
          h('p', null, '如果您要退出无数据模式，点击下方 “退出无数据模式” 按钮或在主菜单点击 “退出无数据模式” 。'),
          h('p', { style: { class: 'text-warning' } }, '在您恢复数据之前请勿点击 “手动保存数据” ，这会造成您之前的错误数据丢失，无法恢复。')
        ]),
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: '退出无数据模式',
        cancelButtonText: '关闭提示',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            localStorage.setItem('noDataMode', 'false');
            location.reload(true);
          } else done();
        }
      }).then(() => {}).catch(() => {});

      callback();
      return;
    }
    //base
    this.serviceDataStorage.loadData('basedata').then((data) => {
      this.baseData = data;
      //musics
      this.serviceDataStorage.loadData('musics').then((musics) => {
        this.serviceMusicHistory.loadFromPathArray(musics);
        callback();
      }).catch((e) => {
        this.logger.warn('Load musics data failed ! ', e);
        callback();
      })
    }).catch((e) => {
      this.logger.warn('Load base data failed ! ', e);
      callback();
    })
  }
  saveDatas() : Promise<any> {
    return new Promise((resolve, reject) => {
      if(this.$refs['settingsView']) (<SettingsView>this.$refs['settingsView']).autoSaveSettings();
      //musics
      let musics = this.serviceMusicHistory.saveToMusicPathArray();
      this.baseData = this.serviceTables.saveToJSONObject();
      this.serviceDataStorage.saveData('basedata', this.baseData).then(() => {
        this.serviceDataStorage.saveData('musics', musics).then(() => {
          SettingsServices.saveSettings().then(() => resolve()).catch((e) => reject(e));
        }).catch((e) =>  reject(e))
      }).catch((e) =>  reject(e))
    })  
  }
  saveDataBeforeShutdown() {
    this.saveDatas().then(() => {
      this.$notify({ title: '数据保存成功', message: '即将关闭计算机', type: 'success' });
      this.logger.info('Auto save data before shutdown');
    }).catch((e) => {
      this.logger.warn('Auto save data failed : ', e);
    });
  }
  saveDataOnDayChange() {
    //Auto save data
    this.saveDatas().then(() => {
      this.logger.info('Auto save data at success');
    }).catch((e) => {
      this.logger.warn('Auto save data failed : ' + e);
    });
  }
  appilySettings(bySystem : boolean) {
    if(!bySystem) 
      this.logger.info('Appily settings');
    this.loadSecuritySettings(bySystem);
    this.loadSystemSettings();
    this.loadWindowSettings(bySystem);
  }
  loadWindowSettings(bySystem : boolean) {
    let window = SettingsServices.getSettingObject('window');
    if(bySystem) {
      let oldSize = window.oldSize;
      if(window.oldIsMax) { this.currentWindow.maximize(); this.isMax = true; }
      else if(oldSize && oldSize.x != 900 && oldSize.y != 600) {
        let screenSize = screen.getPrimaryDisplay().bounds;
        let newPos = {
          x: (screenSize.width - oldSize.x) / 2,
          y: (screenSize.height - oldSize.y) / 2 - 50,
        }
        if(newPos.x<0)newPos.x=0;
        if(newPos.y<0)newPos.y=0;
        let rect = {
          x: Math.floor(newPos.x),
          y: Math.floor(newPos.y),
          width: Math.floor(oldSize.x),
          height: Math.floor(oldSize.y)
        };
        this.currentWindow.setBounds(rect);
      }
    }
    if(!CommonUtils.isNullOrEmpty(window.title)) this.currentWindow.setTitle(window.title);
    else this.currentWindow.setTitle('PunctualCat')
    this.background = window.background;
    this.backgroundOpacity = window.backgroundOpacity;
    this.developerMode = process.env.NODE_ENV == 'developnment' || SettingsServices.getSettingBoolean('system.developerMode');
    if(this.menuItemDeveloper != null)
      this.menuItemDeveloper.visible = this.developerMode;
  }
  loadSystemSettings() {
    let system = SettingsServices.getSettingObject('system');
    if(system) {
      if(this.nativeModuleEnabled) Win32Utils.setPowerStateEnable(system.preventSleep);
      if(system.autoHide && system.autoHideMinute > 0) this.autoHideMinute = system.autoHideMinute; else this.autoHideMinute = 0;
      if(system.autoUpdate) {
        
      }
    }
  }
  loadSecuritySettings(bySystem : boolean) {
    let security = SettingsServices.getSettingObject('security');
    if(security) {
      this.lockedNote = CommonUtils.isNullOrEmpty(security.lockedNote) ? '系统已锁定，联系管理员获得更多信息' : security.lockedNote;
      if(bySystem && security.preventAnymouseUse && !CommonUtils.isNullOrEmpty(security.managerPassword))
        this.lock(true);
      if(security.preventAnymouseUse && !CommonUtils.isNullOrEmpty(security.managerPassword) && 
        security.autoLock && security.autoLockMaxMinute > 0) this.autoLockMinute = security.autoLockMaxMinute;
      else this.autoLockMinute = 0;
    }
  }
  saveWindowSettings() {
    let bounds = this.currentWindow.getBounds();
    SettingsServices.setSettingObject('window.oldSize', {
      x: bounds.width,
      y: bounds.height
    });
    SettingsServices.setSettingBoolean('window.oldIsMax', this.currentWindow.isMaximized());
  }
  

  //** 中央事件回调

  onSettingsUpdate() { 
    this.appilySettings(false); 
    if(!SettingsServices.getSettingBoolean('player.enableWave'))
      (<AudioWave>this.$refs['audioWave']).stopDrawMusic();
  }
  onDayChange() {
    (<any>this.$refs['calendar']).forceUpdate();
    (<TextTime>this.$refs['textTime1']).update();
    (<TextTime>this.$refs['textTime2']).update();
    this.saveDataOnDayChange();
  }
  onWindowActive() { this.switchTimeRun(true); }
  onWindowDeactive() { this.switchTimeRun(false); }
  onWindowFocus() { this.clearAutoLockCount(); /*$('.window').addClass('active');*/ }
  onWindowBlur() { /*$('.window').removeClass('active');*/ }
  onDevToolsReloadPage() { this.uninitWindowEvents() }
  onGlobalRunningChanged(running : boolean, isMuteTime : boolean) {
    this.globalRunning = running;
    if(isMuteTime) {
      this.topToolbar[0].showHotPoint = true;
      this.topToolbar[0].hotPointCountTooltip = '现在是静音时段，不会自动播放铃声';
      this.topToolbar[0].hotPointCount = '<i class="iconfont icon-shengyinguanbi"></i>';
    }
    else if(!running) {
      this.topToolbar[0].showHotPoint = true;
      this.topToolbar[0].hotPointCountTooltip = '自动播放系统已经关闭，现在不会自动播放铃声';
      this.topToolbar[0].hotPointCount = '<i class="iconfont icon-cuowuhttp"></i>';
    }
    else {
      this.topToolbar[0].showHotPoint = false;
    }
  }

  //** 界面控制

  switchCalendar() {
    this.calendarViaible = !this.calendarViaible;
  }
  switchTimeRun(on : boolean) {
    if(on){
      (<TextTime>this.$refs['textTime1']).addUpdateTick();
      (<TextTime>this.$refs['textTime2']).addUpdateTick();
    }else {
      (<TextTime>this.$refs['textTime1']).removeUpdateTick();
      (<TextTime>this.$refs['textTime2']).removeUpdateTick();
    }
  }
  //主tab
  onMainTabChanged(item : IconToolItem) {
    let oldIndex = this.topToolbar.indexOf(this.topTabSelectItem);
    let newIndex = this.topToolbar.indexOf(item);
    if(oldIndex > newIndex){
      this.tabTransitionClass = [
        "animated fadeInLeft anim-fast", 
        "animated fadeOutRight anim-fast"
      ];
    }else if(oldIndex < newIndex){
       this.tabTransitionClass = [
        "animated fadeInRight anim-fast", 
        "animated fadeOutLeft anim-fast"
      ];
    }
    this.topTabSelectItem = item;
  }
  onMainTabClick(item : IconToolItem) {
    this.isShowMusicList = item.name == 'music-list';
    if(item.name == 'main-menu') { 
      let letPos = $('#icon-item-main-menu').offset();
      this.menuSettings.popup({
        window: this.currentWindow,
        x: Math.floor(letPos.left) - 125,
        y: Math.floor(letPos.top) + 75,
      });
    }else if(item.name=='voice-settings'){
      if(!this.voiceProverVisible)
        this.voiceProverVisible = true;
    }
  }
  goToSettingsPage(page : string) {
    this.topTabSelectItem = this.getTopTabByName('settings'); 
    (<SettingsView>this.$refs['settingsView']).showPage(page)
  }


  //** 锁定控制

  lock(bySystem : boolean = false) {
    let security = SettingsServices.getSettingObject('security');
    if(security && security.preventAnymouseUse) {
      if(CommonUtils.isNullOrEmpty(security.managerPassword)){
        if(!bySystem) this.$msgbox({
          title: '提示', 
          message: '您没有设置管理员密码，无法开启密码保护，设置管理员密码以后才能使用锁定功能。', 
          showCancelButton: true,
          cancelButtonText: '暂不设置',
          confirmButtonText: '立即设置',
          roundButton: true
        }).then(() => this.goToSettingsPage('security')).catch(() => {});
      } else { 
        this.locked = true;
        this.logger.info('System locked by ' + (bySystem ? 'auto' : 'user'));
        UserLogService.writeLog('系统已被 ' + (bySystem ? '自动' : '管理员') + ' 锁定')
      }
    } else {
      if(!bySystem) 
        this.$msgbox({
          title: '提示', 
          message: '您没有开启密码保护，必须开启密码保护以后才能使用锁定功能。', 
          showCancelButton: true,
          cancelButtonText: '暂不设置',
          confirmButtonText: '立即设置',
          roundButton: true
        }).then(() => this.goToSettingsPage('security')).catch(() => {});
    }
  }
  doUnLock() {
    let security = SettingsServices.getSettingObject('security');
    if(this.lockedEnterPassword == security.managerPassword) { 
      this.locked = false;
      this.lockedEnterPassword = '';
      this.lockedLasswordErr = '';
      this.logger.info('System unlocked');
      UserLogService.writeLog('系统锁定已解除');
    }
    else {
      this.lockedLasswordErr = this.lockedEnterPassword == '' ? '请输入密码！' : '密码不正确，请检查';
      if(this.lockedEnterPassword != ''){
        this.logger.info('Try to unlock system failed because password error');
        UserLogService.writeLog('登录失败，错误的密码', '', 'warn');
      }
      $('#password-input').prop('class', 'shake animated error anim-500ms');
      setTimeout(() => {
        $('#password-input').prop('class', 'error');
      }, 400);
    }
  }
  inputUnLockClick() {
    if($('#password-input').hasClass('error'))
      $('#password-input').removeClass('error');
  }
  loginInputKeyDown(ev : KeyboardEvent) {
    if(ev.keyCode == 13) this.doUnLock();
  }

  //自动锁定

  lastUserInputTime : Date = null;

  initAutoLockTimer() {
    this.clearAutoLockCount();
    window.addEventListener('click', () => this.clearAutoLockCount());
    window.addEventListener('keydown', () => this.clearAutoLockCount());
    this.lockAutoTimer = setInterval(this.autoLockTimerTick, 60000);
  }
  autoLockTimerTick() {
    let leaveMinute = (new Date().getTime() - this.lastUserInputTime.getTime()) / 60000;
    if(this.autoHideMinute > 0 && leaveMinute > this.autoHideMinute) {
      if(this.currentWindow.isVisible()) 
        this.currentWindow.hide();
    }
    if(this.autoLockMinute > 0 && leaveMinute > this.autoLockMinute && !this.locked) this.lock(true);
  }
  clearAutoLockCount() { this.lastUserInputTime = new Date(); }
  
  //** 音乐列表控制

  //音乐列表事件
  onMusicItemClick(item : MusicItem, mode : MusicAction) {
    if(mode == 'play') {
      if(this.autoPlayService.isMuteTime && (item.status == 'normal' || item.status == 'notload')){
        this.$confirm('现在是静音时段，您是否确定播放音乐? ', '提示', {
          confirmButtonText: '继续播放',
          cancelButtonText: '取消',
          roundButton: true,
          type: 'warning'
        }).then(() => {
          UserLogService.writeLog('手动播放音乐：' + item.name);
          item.play()
        }).catch(() => {});
      }else { 
        UserLogService.writeLog('手动播放音乐：' + item.name);
        item.play();
      }
    } else if(mode == 'pause') {
      item.pause();
    } else if(mode == 'stop') {
      item.stop();
    } else if(mode == 'looplay') {
      if(this.autoPlayService.isMuteTime){
        this.$confirm('现在是静音时段，您是否确定播放音乐? ', '提示', {
          confirmButtonText: '继续播放',
          cancelButtonText: '取消',
          roundButton: true,
          type: 'warning'
        }).then(() => {
          UserLogService.writeLog('手动播放音乐：' + item.name);
          item.loopmode = true;
          item.play();
        }).catch(() => {});
      }else {
        UserLogService.writeLog('手动播放音乐：' + item.name);
        item.loopmode = true;
        item.play();
      }
    } else if(mode == 'delete') {
      this.$confirm('确定删除此音乐? ', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        roundButton: true,
        type: 'warning'
      }).then(() => {
        this.serviceMusicHistory.removeMusicFromHistoryList(item);
        item.stop();
        item.destroy();
      }).catch(() => {});
    } 
  }
  onAddMusicToList() { this.chooseMusic({ type: 'addMusicsToHistoryList'}); }
  onVolumeSoftChanged(newVolume : number) {
    let volume = newVolume / 100.0;
    SettingsServices.setSettingNumber('player.volume', volume);
    //声音图标
    this.topToolbar[3].content = volume == 0 ? 'icon-shengyinguanbi' : 'icon-shengyin';
    //更新所有已加载的音乐音量
    for(var i = 0; i < this.musicHistoryList.length; i++){
      if(this.musicHistoryList[i].loaded) 
        this.musicHistoryList[i].setVolume(volume);
    }
  }
  onVolumeSystemChanged(newVolume : number) { 
    if(this.nativeModuleEnabled) console.log('setSystemVolume : ' + Win32Utils.setSystemVolume(newVolume)); 
  }

  //** 选择文件扩展

  chooseOneMusicCallback : (music : MusicItem) => void = null;
  chooseOneImageCallback : (imgPath : string) => void = null;

  chooseOneMusicAndCallback(type : 'file'|'history', callback : (music : MusicItem) => void) {
    if(type == 'file'){
      this.chooseOneMusicCallback = callback;
      this.chooseMusic({ type: 'chooseOneMusicAndCallback' });
    }else if(type == 'history') { 
      this.isShowMusicList = true;
      setTimeout(() => (<MusicView>this.$refs['musicList']).startChooseOneMusic(callback), 300);
    }
  }
  chooseOneImageAndCallback(callback : (imgPath : string) => void) {
    this.chooseOneImageCallback = callback;
    this.chooseImage({ type: 'chooseOneImageAndCallback' });
  }

  //** 应用工作函数

  shutdownByUser() {
    this.shutdownNowDialog = true;
    if(this.shutdownTimer == null) {
      this.shutdownTick = 30;
      this.shutdownTimer = setInterval(() => {
        if(this.shutdownTick > 0) this.shutdownTick--;
        else {
          clearInterval(this.shutdownTimer);
          this.shutdownTimer = null;
          this.executeShutdownNow();
        }
      }, 1000);
    }
  }
  rebootByUser() {
    this.rebootNowDialog = true;
    if(this.shutdownTimer == null) {
      this.shutdownTick = 30;
      this.shutdownTimer = setInterval(() => {
        if(this.shutdownTick > 0) this.shutdownTick--;
        else {
          clearInterval(this.shutdownTimer);
          this.shutdownTimer = null;
          this.executeRebootNow();
        }
      }, 1000);
    }
  }
  shutdownCancel() {
    this.shutdownNowDialog = false;
    clearInterval(this.shutdownTimer);
    this.shutdownTimer = null;
    this.logger.info('Shutdown is canceled by user');
    UserLogService.writeLog('关机命令被用户取消');
  }
  rebootCancel() {
    this.rebootNowDialog = false;
    clearInterval(this.shutdownTimer);
    this.shutdownTimer = null;
    this.logger.info('Reboot is canceled by user');
    UserLogService.writeLog('重启命令被用户取消');
  }
  showHelpWindow(arg) { ipc.send('main-act-show-help-window', arg); }
  showLogView(findItem : UserLog = null) { 
    this.isShowLogList = true;
    if(findItem) setTimeout(() => (<LogView>this.$refs['logView']).locateItem(findItem), 600);
  }
  showFirstIntroductionPage() { this.introductionVisible = true; }
  endFirstIntroductionPage() {
    this.introductionVisible = false;
    this.showFirstGuidePage();
  }
  showFirstGuidePage() {

  }
  chooseImage(arg) { ipc.send('main-open-file-dialog-image', arg); }
  chooseMusic(arg) { ipc.send('main-open-file-dialog-music', arg); }
  emptyAction() {}
  closeMointor() { Win32Helper.closeMointor(); }
  executeShutdownNow() { 
    this.logger.info('Shutdown is being executed');
    ipc.send("main-act-shutdown"); 
  }
  executeRebootNow() { 
    this.logger.info('Reboot is being executed');
    ipc.send("main-act-reboot"); 
  }
  exitAppWithAsk() { this.quitDialog = true; }
  exitApp(force = false) { 
    let doExit = () => ipc.send("main-act-quit");
    if(force) doExit();
    else this.uninit().then(() =>  doExit()).catch((e) => {
      this.logger.error('An error occurred while exiting ', e);
      const h = this.$createElement;
      this.$msgbox({
        title: '发生了错误',
        message: h('p', null, [
          h('span', null, '在保存数据时发生了错误 '),
          h('b', { style: 'color: teal' }, e),
          h('p', null, '是否依然要退出？'),
        ]),
        showCancelButton: true,
        confirmButtonText: '重试',
        cancelButtonText: '仍然退出',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true;
            instance.confirmButtonText = '正在保存...';

            this.uninit().then(() => { 
              instance.confirmButtonLoading = false;
              done();
              doExit();
            }).catch((e) => {
              instance.confirmButtonLoading = false;
              done();
              doExit();
            })

          } else {
            done();
            doExit()
          }
        }
      }).then(action => {
      }).catch(() => doExit());
    })
  }
}
</script>

