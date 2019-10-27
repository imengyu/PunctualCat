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
        <icon-toolbar :items="topToolbar" :active-item="topTabSelectItem" :arrow-offest="-15" @select-item-changed="onMainTabChanged" />
      </div>
    </div>
    <!--主区域-->
    <transition enter-active-class="animated fadeIn anim-fast" leave-active-class="animated fadeOut anim-fast">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='main-list'" class="main-area">
        <div class="main-container">
          主播放列表
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition enter-active-class="animated fadeIn anim-fast" leave-active-class="animated fadeOut anim-fast">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='radio-message'" class="main-area">
        <div class="main-container">
          广播消息
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition enter-active-class="animated fadeIn anim-fast" leave-active-class="animated fadeOut anim-fast">
      <div v-if="topTabSelectItem" v-show="topTabSelectItem.name=='voice-settings'" class="main-area">
        <div class="main-container">
          声音设置
        </div>
        <div class="bottom-area"></div>
      </div>
    </transition>
    <transition enter-active-class="animated fadeIn anim-fast" leave-active-class="animated fadeOut anim-fast">
      <settings-view v-if="topTabSelectItem" v-show="topTabSelectItem.name=='settings'" />
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import "./utils/base-extends";
import Win32Helper from "./utils/win32-utils";
import $ from "jquery";

import TextTime from "./components/TextTime.vue"
import IconToolBar from "./components/IconToolBar.vue"
import Calendar from "./components/Calendar.vue"

import SettingsView from "./views/SettingsView.vue"

import IconToolItem from "./model/IconToolItem";
import TableModel from "./model/TableModel";
import TableServices from "./services/TableServices";

import electron from "electron";

const ipc = electron.ipcRenderer;

@Component({
  components: {
    'text-time': TextTime,
    'icon-toolbar': IconToolBar,
    'calendar': Calendar,
    'settings-view': SettingsView
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
    new IconToolItem('main-list', 'icon-xiaoxizhongxin', '铃声列表'),
    new IconToolItem('music-list', 'icon-yanchu', '音乐列表'),
    new IconToolItem('radio-message', 'icon-guangbo', '广播消息'),
    new IconToolItem('voice-settings', 'icon-shengyin', '声音设置', 36),
    new IconToolItem('settings', 'icon-shezhi1', '软件设置'),
  ];
  topTabSelectItem : IconToolItem = null;

  currentWindow : electron.BrowserWindow = null;

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

    this.currentWindow = electron.remote.getCurrentWindow();
    this.serviceTables = new TableServices((<any>window).globalData);

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
  }
  uninit() {
    this.serviceTables.destroy();
  }

  //** 界面控制
  switchCalendar() {
    this.calendarViaible = !this.calendarViaible;
  }
  onMainTabChanged(item : IconToolItem) {
    this.topTabSelectItem = item;
  }


  //** 添加与删除工作函数
  addTable() {}

  //** 应用工作函数

  emptyAction() {}
  closeMointor() {
    Win32Helper.closeMointor();
  }
  executeShutdownNow() {
    //Send shutdown
    ipc.send("main-act-shutdown");
  }
  executeRebootNow() {
    ipc.send("main-act-reboot");
  }
  exitAppWithAsk() {
    this.quitDialog = true;
  }
  exitApp() {
    this.exitHide(() => {
      ipc.send("main-act-quit");
    });
  }
}
</script>

