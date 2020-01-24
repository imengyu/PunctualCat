<template>
  <div class="guide-view" id="guide-view">
    <div class="overlay">
      <div v-if="pageCurrentEle" class="mask" :style="'left:0;top:0;bottom:0;width:'+pageCurrentEle.x+'px;'"></div>
      <div v-if="pageCurrentEle" class="mask" :style="'left:'+(pageCurrentEle.x+pageCurrentEle.w)+'px;top:0;bottom:0;right:0'"></div>
      <div v-if="pageCurrentEle" class="mask" :style="'left:'+pageCurrentEle.x+';top:0;height:'+pageCurrentEle.y+'px;width:'+(pageCurrentEle.w)+'px;'"></div>
      <div v-if="pageCurrentEle" class="mask" :style="'left:'+pageCurrentEle.x+';top:'+(pageCurrentEle.y+pageCurrentEle.h)+'px;bottom:0;width:'+(pageCurrentEle.w)+'px;'"></div>
      <div v-else class="mask full"></div>
    </div>
    <div v-if="pageCurrent && pageCurrentEle" class="page">
      <div v-if="pageCurrentEle" id="help-box-relative" class="help-box">
        <div>
          <h1>{{pageCurrent.helpTitle}}<div class="close" @click="quit()" title="退出教程"><i class="iconfont icon-close"></i></div></h1>
          <p v-html="pageCurrent.helpText"></p>
        </div>
        <div class="bottom-area">
          <span class="current">{{(pageCurrentIndex+1)}}/<span class="all">{{pages.length}}</span></span>
          <div class="float-right">
            <button v-show="pageCurrentIndex>0" @click="prevPage">上一步</button>
            <button @click="nextPage">{{pageCurrentIndex&lt;pages.length-1?'下一步':'完成'}}</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="pageCurrent && !pageCurrentEle" class="page index">
      <div id="help-box-relative" class="help-box" style="padding:60px;position: relative;">
        <h1>{{pageCurrent.helpTitle}}<div class="close" @click="quit" title="退出教程"><i class="iconfont icon-close"></i></div></h1>
        <p v-html="pageCurrent.helpText"></p>
        <div class="mt-3">
          <span class="current">{{(pageCurrentIndex+1)}}/<span class="all">{{pages.length}}</span></span>
          <div class="float-right">
            <button v-show="pageCurrentIndex>0" @click="prevPage">上一步</button>
            <button @click="nextPage">{{pageCurrentIndex&lt;pages.length-1?'下一步':'完成'}}</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="page index">
      <h1>欢迎使用 PunctualCat</h1>
      <p>本教程将引导您了解 PunctualCat 的基本使用方法</p>
      <div class="mt-3">
        <button class="ml-2 secondary" @click="quit">跳过教程</button>
        <button @click="nextPage()">立即开始</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import $ from "jquery";

@Component
export default class GuideView extends Vue {

  pageCurrentEle : {
    x: number,
    y: number,
    w: number,
    h: number
  } | null = null;
  pageCurrent : GuidePage = null;
  pageCurrentIndex = -1;
  pages : GuidePage[] = [];


  mounted() {
    const guideData = [
      {
        refEle: '',
        helpTitle: '您需要了解的系统基本概念',
        helpText: '我们将任务设置为自动播放列表和自动播放任务，一个自动播放列表包含多个自动播放任务。<br>'+
        '我们给了您最大的自由，您可以自由设置每个任务、列表的播放条件，可以是一个或多个，基本可以满足您的大部分要求。<br>'+
        '<img src="' + require('../assets/images/help/build.png') + '" style="max-width:100%" />',
        callbackFun: () => {},
      },  
      {
        refEle: '#top-menu',
        helpTitle: '这里是顶部菜单栏',
        helpText: '分为主页、广播消息、音乐列表、声音设置、系统设置等功能。',
        callbackFun: () => {},
      }, 
      {
        refEle: '#top-time',
        helpTitle: '这里是时间和日历',
        helpText: '点击这里的时间可以打开日历。',
        callbackFun: () => {},
      },  
      {
        refEle: '#table-list',
        helpTitle: '这里是自动任务列表',
        helpText: '您可以在这里添加、编辑自动任务列表。',
        callbackFun: () => {},
      },
      {
        refEle: '#bottom-right-table-action-area',
        helpTitle: '这里可以编辑自动任务列表或添加任务至当前列表',
        helpText: '',
        callbackFun: () => {},
      },
      {
        refEle: '#auto-status',
        helpTitle: '这里可以控制自动播放系统的启停状态',
        helpText: '自动播放系统可以由您手动控制或自动控制，当自动播放模式关闭时，系统不会自动播放铃声。',
        callbackFun: () => {},
      },
      {
        refEle: '.table-tasks',
        helpTitle: '这里是播放列表的主体',
        helpText: '自动播放列表由多个自动播放任务组成，您可以指定每个任务的自动播放时间、条件，也可以在这里编辑、添加任务。',
        callbackFun: (before) => {
          if(before) {
            this.$emit('goToTableView');
            return true;
          }
        },
      },
      {
        
        refEle: '.task-0',
        helpTitle: '这是一条任务的信息',
        helpText: '您可以参考任务的状态来获知任务是否已播放或未播放。',
        callbackFun: (before) => {
        },
      },
      {
        refEle: '#edit-task-area-0',
        helpTitle: '这里可以编辑、删除任务或播放任务',
        helpText: '点击编辑按钮一次进入编辑模式，您可以自由修改任务播放的音乐或播放时间条件等等。',
        callbackFun: (before, leave) => {
          if(leave) {
            this.$emit('editOneItemForGuide');
            return true;
          }
        },
      },
      {
        refEle: '#editing-task-area-0 .save',
        helpTitle: '在编辑完成以后别忘了点击保存',
        helpText: '',
        callbackFun: (before) => {
          return true;
        },
      },
      {
        refEle: '#icon-item-music-list',
        helpTitle: '这里是音乐列表',
        helpText: '您可以在这里添加音乐、播放音乐。',
        callbackFun: (before) => {
          if(before) {
            this.$emit('editOneItemFinishForGuide');
            return true;
          }
        },
      },
      {
        refEle: '#icon-item-voice-settings',
        helpTitle: '这里是音量设置',
        helpText: '您可以在这里调整音量。',
        callbackFun: (before, leave) => {
          if(before) {
            this.$emit('showVoiceSettingsForGuide');
          }
        },
      },
      {
        refEle: '#icon-item-settings',
        helpTitle: '这里是系统设置',
        helpText: '您可以在这里对本软件进行自定义设置。',
        callbackFun: () => {},
      },
      {
        refEle: '#icon-item-main-menu',
        helpTitle: '这里是主菜单',
        helpText: '您可以在这里找到系统大部分功能菜单，也可以在这里打开本帮助。',
        callbackFun: () => {},
      },
      {
        refEle: '',
        helpTitle: '入门帮助看完了',
        helpText: '想要找到更多帮助，您可以在 “主菜单”>“帮助文档” 中参考帮助文档。另外，您随时可在 “主菜单”>“入门” 打开本入门教程。',
        callbackFun: () => {},
      },
    ];
    for(var i = 0; i < guideData.length; i++){
      this.pages.push(new GuidePage(
        guideData[i].refEle, 
        guideData[i].helpTitle, 
        guideData[i].helpText, 
        guideData[i].callbackFun, 
      ))
    }
  }
  reBoxPosition() {
    if(this.pageCurrentEle) {
      let x2 = this.pageCurrentEle.x + this.pageCurrentEle.w / 2;
      let y2 = this.pageCurrentEle.y + this.pageCurrentEle.h / 2;
      let avW = window.innerWidth - this.pageCurrentEle.w - 100;
      let avH = window.innerHeight - this.pageCurrentEle.h - 100;
      let p : 'left'|'right'|'top'|'bottom';
      if(this.pageCurrentEle.w  > this.pageCurrentEle.h)  //上下
        p = y2 > window.innerHeight / 2 ? 'top' : 'bottom';
      else  //左右
        p = x2 > window.innerWidth / 2 ? 'left' : 'right';

      let $ele = $('#help-box-relative');

      switch(p) {
        case 'left': {
          $ele.css('right', (window.innerWidth - (this.pageCurrentEle.x + this.pageCurrentEle.w) + 60) + 'px');
          $ele.css('top', (this.pageCurrentEle.y - 20) + 'px');
          $ele.css('min-width', (avW  - 20) > 300 ? '300px' : (avW  - 20));
          $ele.css('max-width', (avW  - 20) + 'px');
          $ele.css('max-height', avH + 'px');
          $ele.css('left', 'unset');
          $ele.css('bottom', 'unset');
          break;
        }
        case 'right': 
          $ele.css('right', 'unset');
          $ele.css('bottom', 'unset');
          $ele.css('left', (this.pageCurrentEle.x + 20 + this.pageCurrentEle.w) + 'px');
          $ele.css('top', (this.pageCurrentEle.y - 20) + 'px');
          $ele.css('max-width', (avW  - 20) + 'px');
          $ele.css('min-width', (avW  - 20) > 300 ? '300px' : (avW  - 20));
          $ele.css('max-height', avH + 'px');
          break;
        case 'top':
          $ele.css('left', (window.innerWidth - this.pageCurrentEle.x < 300 ? window.innerWidth - 400 : this.pageCurrentEle.x) + 'px');
          $ele.css('top', (this.pageCurrentEle.y - 60 - $ele.outerHeight()) + 'px');
          $ele.css('min-width', '300px');
          $ele.css('max-height', avH + 'px');
          $ele.css('max-width', 'unset');
          $ele.css('right', 'unset');
          $ele.css('bottom', 'unset');
          break;
        case 'bottom': {
          let $ele = $('#help-box-relative');
          $ele.css('left', (window.innerWidth - this.pageCurrentEle.x < 300 ? window.innerWidth - 400 : this.pageCurrentEle.x) + 'px');
          $ele.css('bottom', (window.innerHeight - (this.pageCurrentEle.y + 20 + this.pageCurrentEle.h) - $ele.outerHeight()) + 'px');
          $ele.css('min-width',  '300px');
          $ele.css('max-height', avH + 'px');
          $ele.css('max-width', 'unset');
          $ele.css('right', 'unset');
          $ele.css('top', 'unset');
          break;
        }
      }
      
     
    }else{
      let $ele = $('#help-box-relative');
      $ele.css('right', 'unset');
      $ele.css('top', 'unset');
      $ele.css('min-width', 'unset');
      $ele.css('max-width', 'unset');
      $ele.css('max-height','unset');
      $ele.css('left', 'unset');
      $ele.css('bottom', 'unset');
    }
  }

  quit() {
    this.$confirm('要退出入门教程吗？以后如果您想打开本教程，可以点击“主菜单”>“入门”。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      roundButton: true,
    }).then(() => this.$emit('close')
    ).catch((e) => console.log(e));
  }
  reset() {
    this.pageCurrentEle = null;
    this.pageCurrent  = null;
    this.pageCurrentIndex = -1;
  }
  loadPage(index : number) {
    if(index < this.pages.length && index >= 0) {
      let delay = false;
      this.pageCurrentIndex = index;
      if(this.pageCurrent!=null){
        delay = this.pageCurrent.callbackFun(false, true);
      }
      this.pageCurrent = this.pages[index];
      delay = this.pageCurrent.callbackFun(true, false) || delay;
      var solve = () => {
        let $ele = $(this.pageCurrent.refEle);
        if(this.pageCurrent.refEle != '' && $ele.length > 0){    
          this.pageCurrentEle = {
            x: $ele.offset().left,
            y: $ele.offset().top,// + 30, //Tite bar
            w: $ele.outerWidth(),
            h: $ele.outerHeight()
          }
          setTimeout(() => {
            this.reBoxPosition();
            this.pageCurrent.callbackFun(false, false);
          }, 100);
        }else {
          this.pageCurrentEle = null;
          this.reBoxPosition();
        }
      }
      if(delay) setTimeout(() => solve(), 200);
      else solve();
    }
  }
  nextPage() {
    if(this.pageCurrentIndex < this.pages.length - 1) this.loadPage(this.pageCurrentIndex + 1);
    else this.$emit('close');
  }
  prevPage() {
    if(this.pageCurrentIndex > 0)
      this.loadPage(this.pageCurrentIndex - 1);
  }
}

class GuidePage {

  public refEle : string;
  public helpTitle : string;
  public helpText : string;
  public callbackFun : Function;

  public constructor(refEle : string, helpTitle:string, helpText : string, callbackFun : Function) {
    this.refEle = refEle;
    this.helpTitle = helpTitle;
    this.helpText = helpText;
    this.callbackFun = callbackFun;
  }
}

</script>

<style lang="scss">
@import "../assets/sass/scroll";

.guide-view {
  position: absolute;
  background-color: transparent;
  z-index: 2000;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: visible;

  .close {
    display: inline;
    font-size: 26px;
    opacity: 0.8;
    transition: all ease-in-out 0.3s;
    float: right;
    z-index: 10;
    cursor: pointer;
    color: #707070;

    &:hover {
      color: #000;
    }
  }
  .overlay {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    position: fixed;
    z-index: 1;

    .mask {
      position: absolute;
      opacity: 0.65;
      background-color: #000;
      transition: all ease-in-out 0.3s;

      &.full {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }
  }
  .help-box {
    position: absolute;
    display: inline-block;
    z-index: 2;
    background-color: #fff;
    border: 1px solid rgba(0,0,0,.5);
    border-radius: 4px;
    padding: 10px;
    transition: all ease-in-out 0.3s;

    .bottom-area {
      margin-top: 13px;
    }
  }
  .page {
    position: relative;
    width: 100%;
    height: 100%;
    color: #fff;
    z-index: 3;
    
    &.index {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      

      div {
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
        overflow-y: scroll;

        @include pc-fix-scrollbar-white();
      }
    }

    .current {
      font-size: 14px;
      font-weight: bold;
      margin-right: 15px;
    }
    .all {
      color: #777;
      font-size: 12px;
    }
    h1 {
      font-size: 20px;
      font-weight: bold;
    }
    p {
      font-size: 12px;
    }
    button {
      display: inline-block;
      border-radius: 35px;
      padding: 5px 10px;
      font-size: 14px;
      background: transparent;
      border: 2px solid #fff;
      color: #fff;
      cursor: pointer;
      transition: all ease-in-out 0.2s;
      outline: none;

      &:focus {
        outline: none;
      }

      &.secondary {
        border: 2px solid transparent;
      }
      &:hover {
        border: 2px solid #0092e7;
        color: #0092e7;
      }
    }

    .help-box  {
      color: #000;

      h1 {
        color: #000;
        margin-top: 0;
      }
      p {
        color: #707070;
        margin-bottom: 0;
      }
      button {
        border: 2px solid #575757;
        color: #575757;
      }      
      .float-right {
        display: inline-block;
      }
    }
  }
}
</style>


