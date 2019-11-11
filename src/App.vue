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
      <table-view ref="tableView" v-if="topTabSelectItem" v-show="topTabSelectItem.name=='main-list'" :table-service="serviceTables" :app="app" />
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <radio-view v-if="topTabSelectItem" v-show="topTabSelectItem.name=='radio-message'" :app="app" />
    </transition>
    <transition :enter-active-class="tabTransitionClass[0]" :leave-active-class="tabTransitionClass[1]">
      <settings-view ref="settingsView" v-if="topTabSelectItem" v-show="topTabSelectItem.name=='settings'" :app="app" />
    </transition>
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
        :items="musicHistoryList"
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

import MusicView from "./views/MusicView.vue"
import VoiceView from "./views/VoiceView.vue"
import SettingsView from "./views/SettingsView.vue"
import TableView from "./views/TableView.vue"
import RadioView from "./views/RadioView.vue"

import { MusicItem, MusicAction, MusicStatus, getPlayingCount, setPlayingCountChangedCallback } from './model/MusicItem'
import IconToolItem from "./model/IconToolItem";
import TableServices from "./services/TableServices";
import SettingsServices from "./services/SettingsServices";
import AutoPlayService from "./services/AutoPlayService";
import { MusicHistoryService, createMusicHistoryService } from "./services/MusicHistoryService";
import { DataStorageServices, createDataStorageServices, destroyDataStorageServices } from "./services/DataStorageServices";
import GlobalWorker from "./services/GlobalWorker";

import electron, { BrowserWindow, screen } from "electron";
import { Menu, MenuItem } from "electron";

const ipc = electron.ipcRenderer;
const remote = electron.remote;

@Component({
  components: {
    'text-time': TextTime,
    'icon-toolbar': IconToolBar,
    'calendar': Calendar,
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

  app : App = this;
  //Dialog and menu visible control
  calendarViaible = false;
  isShowMusicList: boolean = false;
  menuVisible: boolean = false;
  voiceProverVisible: boolean = false;
  quitDialog: boolean = false;
  shutdownNowDialog: boolean = false;
  rebootNowDialog: boolean = false;

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
  showStartUpError(e) {
    $("#global-error-info").show();
    $("#global-error-info-content").text(e);
  }
  exitHide(callback) {
    $("html,body").addClass(["animated", "zoomOut"]);
    $("html,body").on("animationend", function() {
      callback();
    });
  }

  //** Init styles

  //初始化和卸载
  init() {

    //初始化所有服务
    this.currentWindow = remote.getCurrentWindow();
    this.serviceDataStorage = createDataStorageServices();

    this.serviceDataStorage.init().then(() => {
      
      SettingsServices.initSettings();
      SettingsServices.loadSettings().then(() => initInternal()).catch((e) => {
        console.error('loadSettings failed ! ' + e);
        initInternal();
      })

      let initInternal = () => {

        //Load actions
        GlobalWorker.registerGlobalAction('shutdown', this.executeShutdownNow);
        GlobalWorker.registerGlobalAction('reboot', this.executeRebootNow);
        //music history
        this.serviceMusicHistory = createMusicHistoryService(this.musicHistoryList);

        this.loadAllDatas(() => {

          //Core services
          this.initCoreServices();

          setPlayingCountChangedCallback((count) => this.playingMusicCount = count);

          //Menu
          this.initMenus();
          //IPCS
          this.initIpcs();

          //hide intro
          setTimeout(() => {
            this.hideIntro();
            this.topTabSelectItem = this.topToolbar[0];
            this.autoPlayService.start();
          }, 1000);   
        })
      }
    }).catch((e) =>  this.showStartUpError('初始化数据失败 ' + e))
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
    

    this.menuSettings.append(new electron.remote.MenuItem({ label: '锁定软件', accelerator: 'CmdOrCtrl+L', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '数据导出与导入', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '手动保存数据', accelerator: 'CmdOrCtrl+S', click: () => {  
      this.saveDatas().then(() => this.$message({ message: '手动保存数据成功', type: 'success' }))
        .catch((e) => this.$alert('保存数据失败，错误信息：' + e, '保存数据失败', { type: 'error', roundButton: true, }))
    }}));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '查看日志', click: () => {  } }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '入门', click: () => {  } }));

    var developerSubMenu = new electron.remote.Menu();
    developerSubMenu.append(new electron.remote.MenuItem({ label: '切换开发者工具', click: () => { 
      if(this.currentWindow.webContents.isDevToolsOpened()) this.currentWindow.webContents.closeDevTools();
      else this.currentWindow.webContents.openDevTools();
    }}));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '打开进程管理器', click: () => { ipc.send('main-act-window-control', 'openProcessManager'); } }));
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
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制结束进程', accelerator: 'CmdOrCtrl+K', click: () => { ipc.send('main-act-quit'); } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制重载页面', accelerator: 'CmdOrCtrl+R', click: () => { location.reload(true) } }));
    developerSubMenu.append(new electron.remote.MenuItem({ label: '强制杀死页面', click: () => { location.href = 'chrome://kill/' } }));
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
    //this.menuItemDeveloper.visible = false;
    this.menuSettings.append(this.menuItemDeveloper);
    
    var powerSubMenu = new electron.remote.Menu();
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭计算机', click: () => { /*this.shutdownByUser();*/ } }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '重启计算机', click: () => { /*this.rebootByUser();*/ } }));
    powerSubMenu.append(new electron.remote.MenuItem({ label: '关闭显示器', click: () => this.closeMointor() }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '软件设置', click: () => { this.topTabSelectItem = this.getTopTabByName('settings') } }));
    this.menuSettings.append(new electron.remote.MenuItem({ label: '系统电源', submenu: powerSubMenu }));
    this.menuSettings.append(new electron.remote.MenuItem({ type: 'separator' }))
    this.menuSettings.append(new electron.remote.MenuItem({ label: '关于软件', click: () => { this.topTabSelectItem = this.getTopTabByName('settings'); (<SettingsView>this.$refs['settingsView']).showPage('about') } }));    
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
  initCoreServices() {
    this.serviceTables = new TableServices();
    if(this.baseData) this.serviceTables.loadFromJsonObject(this.baseData);
    else {
      this.baseData = [];
      console.log('Base data lost, use empty data');
    }
    this.autoPlayService = new AutoPlayService(this.serviceTables);
    this.autoPlayService.on('daychange', this.onDayChange);
  }
  uninit() : Promise<any> {
    return new Promise((resolve, reject) => {
      this.saveDatas().then(() => {
        this.autoPlayService.stop();
        this.serviceTables.destroy();
        destroyDataStorageServices();
        resolve();
      }).catch((e) => reject(e))
    })
  }

  //数据控制
  loadAllDatas(callback : () => void) {
    //base
    this.serviceDataStorage.loadData('basedata').then((data) => {
      this.baseData = data;

      console.log('Data load check baseData : ');
      console.dir(data);

      //musics
      this.serviceDataStorage.loadData('musics').then((musics) => {

        if(musics) musics.forEach((element : string) => {
          if(!this.serviceMusicHistory.existsInHistoryList(element))
            this.serviceMusicHistory.addMusicToHistoryList(new MusicItem(element));
        });
        callback();
      }).catch((e) => {
        console.error('loadAllDatas for musics failed ! ' + e);
        callback();
      })
    }).catch((e) => {
      console.error('loadAllDatas for base data failed ! ' + e);
      callback();
    })
  }
  saveDatas() : Promise<any> {
    return new Promise((resolve, reject) => {
      //musics
      let musics = [];
      for(var i = 0, c = this.musicHistoryList.length; i < c; i++)
        musics.push(this.musicHistoryList[i].fullPath);
      this.baseData = this.serviceTables.saveToJSONObject();
      this.serviceDataStorage.saveData('basedata', this.baseData).then(() => {
        console.log('Data save check basedata : ');
        console.dir(this.baseData);
        this.serviceDataStorage.saveData('musics', musics).then(() => {
          SettingsServices.saveSettings().then(() => resolve()).catch((e) => reject(e));
        }).catch((e) =>  reject(e))
      }).catch((e) =>  reject(e))
    })
    
  }


  //** 

  onDayChange() {

  }

  //** 界面控制

  switchCalendar() {
    this.calendarViaible = !this.calendarViaible;
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
  //音乐列表扩展
  

  chooseOneMusicCallback : (music : MusicItem) => void = null;

  chooseOneMusicAndCallback(type : 'file'|'history', callback : (music : MusicItem) => void) {
    if(type == 'file'){
      this.chooseOneMusicCallback = callback;
      this.chooseMusic({ type: 'chooseOneMusicAndCallback' });
    }else if(type == 'history') { 
      this.isShowMusicList = true;
      setTimeout(() => (<MusicView>this.$refs['musicList']).startChooseOneMusic(callback), 300);
    }
  }


  //** 应用工作函数

  chooseImage(arg) { ipc.send('main-open-file-dialog-image', arg); }
  chooseMusic(arg) { ipc.send('main-open-file-dialog-music', arg); }
  emptyAction() {}
  closeMointor() { Win32Helper.closeMointor(); }
  executeShutdownNow() { ipc.send("main-act-shutdown"); }
  executeRebootNow() { ipc.send("main-act-reboot"); }
  exitAppWithAsk() { this.quitDialog = true; }
  exitApp() { 
    let doExit = () => {
      ipc.send("main-act-quit")
      /*this.exitHide(() =>  ipc.send("main-act-quit"));*/ 
    }
    this.uninit().then(() =>  doExit()).catch((e) => {
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

