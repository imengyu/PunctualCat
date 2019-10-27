<template>
  <div class="window-container">
    <div class="top-bar">
      <el-popover
        placement="bottom"
        width="300"
        trigger="manual"
        transition="el-zoom-in-top"
        v-model="calendarViaible">
        <calendar :lunar="true" />
        <text-time slot="reference" @date-click="switchCalendar" />
      </el-popover>
      
      <div class="top-menu">
        <icon-toolbar :items="topToolbar" :arrow-offest="-15" />
      </div>
    </div>
    <div class="main-area"></div>
    <div class="bottom-area"></div>
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

import IconToolItem from "./model/IconToolItem";
import TableModel from "./model/TableModel";
import TableServices from "./services/TableServices";

import electron from "electron";

const ipc = electron.ipcRenderer;

@Component({
  components: {
    'text-time': TextTime,
    'icon-toolbar': IconToolBar,
    'calendar': Calendar
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
    new IconToolItem('icon-xiaoxizhongxin', '铃声列表'),
    new IconToolItem('icon-yanchu', '音乐列表'),
    new IconToolItem('icon-guangbo', '广播消息'),
    new IconToolItem('icon-shengyin', '声音设置', 36),
    new IconToolItem('icon-shezhi1', '软件设置'),
  ];

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

  //** */
  switchCalendar() {
    this.calendarViaible = !this.calendarViaible;
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

