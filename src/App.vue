<template>
  <div class="window-container">
    <!--日历弹出区-->
    <transition enter-active-class="animated fadeInLeft anim-fast delay-300ms" leave-active-class="animated bounceOutLeft anim-fast">
      <div v-show="calendarViaible" class="calendar-host">
        <div class="place-holder-top">
          <text-time @date-click="switchCalendar" />
        </div>
        <div class="place-holder-center">
          <calendar :lunar="true" />
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
        <text-time v-show="!calendarViaible" @date-click="switchCalendar" />
      </transition>
      <div v-show="calendarViaible"></div>
      <div class="top-menu">
        <icon-toolbar :items="topToolbar" :active-item="topTabSelectItem" :arrow-offest="-15" @item-click="onMainTabClick" @select-item-changed="onMainTabChanged" />
      </div>
    </div>
    <!--主区域-->
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='main-list'" class="main-area">
        <div class="main-container">
          主播放列表
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='radio-message'" class="main-area">
        <div class="main-container">
          广播消息
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='voice-settings'" class="main-area">
        <div class="main-container">
          声音设置
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <settings-view v-if="topTabSelectItem" v-show="topTabSelectItem.name=='settings'" />
    </transition>
    <!--音乐列表-->
    <el-drawer
      title="音乐列表"
      :visible.sync="isShowMusicList"
      size="38%"
      direction="rtl">
      <music-list :items="musicHistoryList" @item-click="onMusicItemClick" @add-music="onAddMusicToList" />
    </el-drawer>
    <!--音乐播放器区-->

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
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import { MessageBoxInputData } from 'element-ui/types/message-box'
import "./utils/BaseExtends";
import Win32Helper from "./utils/Win32Utils";
import CommonUtils from "./utils/CommonUtils";
import $ from "jquery";

import TextTime from "./components/TextTime.vue"
import IconToolBar from "./components/IconToolBar.vue"
import Calendar from "./components/Calendar.vue"
import MusicList from "./components/MusicList.vue"

import SettingsView from "./views/SettingsView.vue"
import PlayerView from "./views/PlayerView.vue"

import { MusicItem, MusicAction } from './model/MusicItem'
import IconToolItem from "./model/IconToolItem";
import TableModel from "./model/TableModel";
import TableServices from "./services/TableServices";

import electron, { BrowserWindow, screen } from "electron";
import { Menu, MenuItem } from "electron";

const ipc = electron.ipcRenderer;
const remote = electron.remote;

@Component({
  components: {
    'text-time': TextTime,
    'icon-toolbar': IconToolBar,
    'calendar': Calendar,
    'music-list': MusicList,
    'settings-view': SettingsView,
    'palyer-view' : PlayerView
  }
})
export default class App extends Vue {
  name = "App";

  //Props
  //=====

  //Dialog and menu visible control
  calendarViaible = false;
  isShowMusicList: boolean = false;
  menuVisible: boolean = false;
  quitDialog: boolean = false;
  shutdownNowDialog: boolean = false;
  rebootNowDialog: boolean = false;

  //Toolbar and menu
  topToolbar: Array<IconToolItem> = [
    new IconToolItem('main-list', 'icon-xiaoxizhongxin', '铃声列表', 36),
    new IconToolItem('music-list', 'icon-yanchu', '音乐列表', 36, 'icon', false),
    new IconToolItem('radio-message', 'icon-guangbo', '广播消息', 36),
    new IconToolItem('voice-settings', 'icon-shengyin', '声音设置', 36),
    new IconToolItem('settings', 'icon-shezhi1', '软件设置', 36),
    new IconToolItem('main-menu', 'icon-caidan_o', '主菜单', 40, 'icon', false),
  ];
  topTabSelectItem : IconToolItem = null;
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

  //Data pool

  musicHistoryList : Array<MusicItem> = [];

  //Services

  serviceTables: TableServices = null;

  autoWorkerOn = true;

  mounted() {
    this.init();
  }

  beforeDestroy() {
    this.uninit();
  }

  //Watchs
  //=====
  /*@Watch('currentShowItem')
  onCurrentShowItemChanged(val: TabModel, oldVal: TabModel) { 
  }*/

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
  exitHide(callback) {
    $("html,body").addClass(["animated", "zoomOut"]);
    $("html,body").on("animationend", function() {
      callback();
    });
  }

  //** Init styles
  init() {
    this.initIpcs();

    this.currentWindow = remote.getCurrentWindow();
    this.serviceTables = new TableServices((<any>window).globalData);

    this.initMenus();

    //hide intro
    setTimeout(() => {
      this.hideIntro();
      this.topTabSelectItem = this.topToolbar[0];
    }, 2000);
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
      if(arg.type=='chooseBackground'){
        
      }
    });
    ipc.on('selected-music', (event, arg, path) => {
      if(!path || path.length == 0) 
        return;
      if(arg.type=='chooseCommandMusic'){
        this.addMusicToHistoryList(new MusicItem(path[0]));
      }
      if(arg.type=='openAndPlay'){
        this.addMusicToHistoryList(new MusicItem(path[0]));
      }
      if(arg.type=='addMusicsToHistoryList'){
        var index = 0;
        path.forEach(element => {
          if(element!=''){
            this.addMusicToHistoryList(new MusicItem(path[0]));
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
        
    this.menuSettings.append(new electron.remote.MenuItem({ label: '锁定软件', accelerator: 'CmdOrCtrl+L', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '数据导出与导入', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '手动保存数据', accelerator: 'CmdOrCtrl+S', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '查看日志', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '入门', click: () => {  } }));

    var developerSubMenu = new electron.remote.Menu();
    developerSubMenu.append(new electron.remote.MenuItem({ label: '切换开发者工具', click: () => { ipc.send('main-act-window-control', 'switchDevTools'); } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '打开进程管理器', click: () => { ipc.send('main-act-window-control', 'openProcessManager'); } }));
    developerSubMenu.append(new electron.remote.MenuItem({ type: 'separator' }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制清除数据', click: () => {  } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制结束进程', accelerator: 'CmdOrCtrl+K', click: () => { ipc.send('main-act-quit'); } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制重载页面', accelerator: 'CmdOrCtrl+R', click: () => { location.reload(true) } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制杀死页面', click: () => { location.href = 'chrome://kill/' } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制跳转到 URL', click: () => { 
      this.$prompt('输入要跳转到的 URL ', 'DEBUG', {
        confirmButtonText: '跳转',
        cancelButtonText: '取消',
      }).then((data : MessageBoxInputData) => {
        location.href = data.value;
      }).catch(() => {});
    } }));

    this.menuItemDeveloper = new electron.remote.MenuItem({ label: '开发者选项', submenu: developerSubMenu });
    this.menuItemDeveloper.visible = false;
    this.menuSettings.append(this.menuItemDeveloper);
    
    var powerSubMenu = new electron.remote.Menu();
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭计算机', click: () => { /*this.shutdownByUser();*/ } }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '重启计算机', click: () => { /*this.rebootByUser();*/ } }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭显示器', click: () => this.closeMointor() }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '软件设置', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '系统电源', submenu: powerSubMenu }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '关于软件', click: () => {  } }));    
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
  }
  uninit() {
    this.serviceTables.destroy();
  }

  //** 界面控制
  switchCalendar() {
    this.calendarViaible = !this.calendarViaible;
  }
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
    }
  }


  //** 添加与删除工作函数
  addTable() {}


  
  //音乐列表扩展
  onMusicItemClick(item : MusicItem, mode : MusicAction) {

  }
  onAddMusicToList() { this.chooseMusic({ type: 'addMusicsToHistoryList'}); }

  addMusicToHistoryList(music : MusicItem){
    this.musicHistoryList.forEach(element => {
      if(element == music) return;
    });
    this.musicHistoryList.push(music);
  }
  removeMusicFromHistoryList(music : MusicItem){
    this.musicHistoryList.splice(this.musicHistoryList.indexOf(music), 1);
  }


  //** 应用工作函数

  chooseImage(arg) { ipc.send('main-open-file-dialog-image', arg); }
  chooseMusic(arg) { ipc.send('main-open-file-dialog-music', arg); }
  showHelpWindow(ar) { ipc.send('main-act-show-help-window', ar); }
  emptyAction() {}
  closeMointor() { Win32Helper.closeMointor(); }
  executeShutdownNow() { ipc.send("main-act-shutdown"); }
  executeRebootNow() { ipc.send("main-act-reboot"); }
  exitAppWithAsk() { this.quitDialog = true; }
  exitApp() { ipc.send("main-act-quit")/*this.exitHide(() =>  ipc.send("main-act-quit"));*/ }
}
</script>

