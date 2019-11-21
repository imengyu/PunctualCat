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
      <settings-view ref="settingsView" v-if="topTabSelectItem" v-show="topTabSelectItem.name=='settings'" :app="app" />
    </transition>
    <!--底部音乐频谱-->
    <audio-wave ref="audioWave" class="main-audio-wave"></audio-wave>
    <!--音量弹出-->
    <transition enter-active-class="animated bounceInDown anim-fast" leave-active-class="animated fadeOutUp anim-fast">
      <voice-view v-show="voiceProverVisible" :show.sync="voiceProverVisible" @volume-soft-changed="onVolumeSoftChanged" style="top:120px;right:20px" />
    </transition>
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
    <!--退出对话框-->
    <el-dialog
      :visible.sync="quitDialog"
      class="el-dialog-width-fix-50"
      center>
      <div class="iconfont icon-bangzhu text-center mb-3" style="font-size:66px;"></div>
      <div class="text-center">是否真的要退出应用？退出以后将不能自动播放铃声！</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="quitDialog=false" round>不退出</el-button>
        <el-button @click="exitApp" round>退出应用</el-button>
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
        <el-button @click="executeShutdownNow" round>立即关机</el-button>
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
        <el-button @click="executeShutdownNow" round>立即重启机</el-button>
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

import { MusicItem, MusicAction, MusicStatus, getPlayingCount, setPlayingCountChangedCallback, setMusicWaveStartCallback, setMusicWaveStopCallback } from './model/MusicItem'
import IconToolItem from "./model/IconToolItem";
import TableServices from "./services/TableServices";
import SettingsServices from "./services/SettingsServices";
import AutoPlayService from "./services/AutoPlayService";
import { MusicHistoryService, createMusicHistoryService } from "./services/MusicHistoryService";
import { DataStorageServices, createDataStorageServices, destroyDataStorageServices } from "./services/DataStorageServices";
import GlobalWorker from "./services/GlobalWorker";

import electron, { BrowserWindow, Rectangle } from "electron";
import { Menu, MenuItem } from "electron";
import Win32Utils from "./utils/Win32Utils";
import { Logger } from "log4js";


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
    'voice-view': VoiceView,
    'settings-view': SettingsView,
    'table-view': TableView,
    'radio-view': RadioView
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
  menuVisible : boolean = false;
  voiceProverVisible : boolean = false;
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

  logger : Logger = null;

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
      playerTabItem.hotPointCount = val;
    }else{
      playerTabItem.showHotPoint = false;
      playerTabItem.hotPointCount = 0;
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
    window.app = this;
    //初始化所有服务
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
          GlobalWorker.registerGlobalAction('shutdown', () => {
            this.logger.info('Execute shutdown action by auto task');
            this.shutdownByUser();
          });
          GlobalWorker.registerGlobalAction('reboot', () => {
            this.logger.info('Execute reboot action by auto task');
            this.rebootByUser();
          });
          //music history
          this.serviceMusicHistory = createMusicHistoryService(this.musicHistoryList);
          //Devtools
          if(SettingsServices.getSettingBoolean('system.developerMode'))
            this.currentWindow.webContents.openDevTools();

          this.loadAllDatas(() => {

            try {
              //Core services
              this.initCoreServices();

              setPlayingCountChangedCallback((music, count) => this.playingMusicCount = count);
              setMusicWaveStartCallback((music) => {
                if(SettingsServices.getSettingBoolean('player.enableWave') && this.playingMusicCount == 0 && this.currentWindow.isVisible())
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

              //hide intro
              setTimeout(() => {
                this.hideIntro();
                this.topTabSelectItem = this.topToolbar[0];
                this.autoPlayService.start();
                this.inited = true;
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
    
    this.menuSettings.append(new electron.remote.MenuItem({ label: '锁定软件', accelerator: 'CmdOrCtrl+L', click: () => this.lock() }));
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
    this.menuSettings.append(new electron.remote.MenuItem({ label: '查看日志', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '入门', click: () => {  } }));

    var developerSubMenu = new electron.remote.Menu();
    developerSubMenu.append(new electron.remote.MenuItem({ label: '切换开发者工具', click: () => { 
      if(this.currentWindow.webContents.isDevToolsOpened()) this.currentWindow.webContents.closeDevTools();
      else this.currentWindow.webContents.openDevTools();
    }}));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '打开进程管理器', click: () => ipc.send('main-act-window-control', 'openProcessManager') }));
    developerSubMenu.append(new electron.remote.MenuItem({ type: 'separator' }));
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
    } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制结束进程', accelerator: 'CmdOrCtrl+K', click: () => ipc.send('main-act-quit') }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制重载页面', accelerator: 'CmdOrCtrl+R', click: () => location.reload(true) }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制杀死页面', click: () => { location.href = 'chrome://kill/' } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '错误测试', click: () => { throw new Error('测试异常，抛出错误') } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制跳转到 URL', click: () => { 
      this.$prompt('输入要跳转到的 URL ', 'DEBUG - URL', {
        confirmButtonText: '跳转',
        cancelButtonText: '取消',
        roundButton: true,
        inputValue: location.href
      }).then((data : MessageBoxInputData) => {
        location.href = data.value;
      }).catch(() => {});
    } }));

    this.menuItemDeveloper = new electron.remote.MenuItem({ label: '开发者选项', submenu: developerSubMenu });
    if(!this.developerMode) this.menuItemDeveloper.visible = false;
    this.menuSettings.append(this.menuItemDeveloper);
    
    var powerSubMenu = new electron.remote.Menu();
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭计算机', click: () => this.shutdownByUser() }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '重启计算机', click: () => this.rebootByUser() }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭显示器', click: () => this.closeMointor() }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '软件设置', click: () => this.goToSettingsPage('global') }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '系统电源', submenu: powerSubMenu }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '关于软件', click: () => this.goToSettingsPage('about') }));    
    this.menuSettings.append(new electron.remote.MenuItem({ label: '退出程序', click: () => this.exitAppWithAsk() }));

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
    clearInterval(this.lockAutoTimer);
    return new Promise((resolve, reject) => {
      this.saveWindowSettings();
      this.saveDatas().then(() => {
        this.autoPlayService.stop();
        this.serviceTables.destroy();
        window.destroyLogs();
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
    this.developerMode = SettingsServices.getSettingBoolean('system.developerMode');
    if(this.menuItemDeveloper != null)
      this.menuItemDeveloper.visible = this.developerMode;
  }
  loadSystemSettings() {
    let system = SettingsServices.getSettingObject('system');
    if(system) {
      Win32Utils.setPowerStateEnable(system.preventSleep);
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

  onSettingsUpdate() { this.appilySettings(false); }
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
        this.logger.info('System locked by ' + (bySystem ? 'system' : 'user'));
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
    }
    else {
      this.lockedLasswordErr = this.lockedEnterPassword == '' ? '请输入密码！' : '密码不正确，请检查';
      if(this.lockedEnterPassword != '')
        this.logger.info('Try to unlock system failed because password error');
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
      item.play();
    } else if(mode == 'pause') {
      item.pause();
    } else if(mode == 'stop') {
      item.stop();
    } else if(mode == 'looplay') {
      item.loopmode = true;
      item.play();
    } else if(mode == 'delete') {    
      this.serviceMusicHistory.removeMusicFromHistoryList(item);
      item.stop();
      item.destroy();
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
  }
  rebootCancel() {
    this.rebootNowDialog = false;
    clearInterval(this.shutdownTimer);
    this.shutdownTimer = null;
    this.logger.info('Reboot is canceled by user');
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

