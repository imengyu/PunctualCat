<template>
  <div class="main-area settings-area overflow-visible">
    <div class="main-container shadow-none overflow-visible" style="padding: 30px;">
      <div class="left-fix-layer"></div>
      <div class="shadow-fix-layer"></div>
      <el-tabs tab-position="left" v-model="currentPage">
        <el-tab-pane name="global">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shezhi"></i>全局设置</span>
        </el-tab-pane>
        <el-tab-pane name="player">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-yanchu"></i>播放设置</span>
        </el-tab-pane>
        <el-tab-pane name="security">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-anquan"></i>安全设置</span>
        </el-tab-pane>
        <el-tab-pane name="datas">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shuju"></i>数据管理</span>
        </el-tab-pane>
        <el-tab-pane name="about">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-bangzhu"></i>关于软件</span>

          <div class="text-center">
            <img class="animated rubberBand" src="../assets/images/logo128.png" />
            <div class="mt-3" style="max-width: 550px; margin: 0 auto;">
              <h5 class="mb-2">关于 PunctualCat </h5>
              This is a kind of software that can automatically play ringtones and music for the broadcasting studio of primary and secondary schools.
              <div class="mt-3 mb-3">
                <a href="javascript:;" @click="showHelpWindow('')">打开帮助文档</a>
              </div>
            </div>
            <div class="text-secondary">
              Copyright <i class="fa fa-copyright mr-2" aria-hidden="true"></i>2019 BY 梦欤. All rights reserved.
            </div>
          </div>
          <div class="mt-4">
            <div style="display: inline-block; width: 100px; text-align: right;">
              主版本 <br />
              编译日期 <br />
            </div>
            <div style="display: inline-block; width: 200px; text-align: left; padding-left: 5px">
              <span class="text-important" @click="toggleDeveloperMode()">{{ appVesrsion }}</span><br />
              <span class="text-important" >{{ appBuildDate }}</span><br />
            </div>
          </div>
          <el-divider content-position="left">框架信息</el-divider>
          <div v-if="process" class="mt-3">
            <div style="display: inline-block; width: 100px; text-align: right;">
              Node.js <br />
              Electron <br />
              Chromium <br />
              V8 <br />
              软件架构 <br />
              操作系统 <br />
            </div>
            <div style="display: inline-block; width: 200px; text-align: left; padding-left: 5px">
              <span class="text-important">{{ process.versions.node }}</span><br />
              <span class="text-important">{{ process.versions.electron }}</span><br />
              <span class="text-important">{{ process.versions.chrome }}</span><br />
              <span class="text-important">{{ process.versions.v8 }}</span><br />
              <span class="text-important">{{ process.arch }}</span><br />
              <span
                class="text-important">{{ process.platform + ' ' + process.getSystemVersion() }}</span><br />
            </div>
          </div>

        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="bottom-area d-flex justify-content-end align-items-center pr-4">
      <el-button type="primary" size="small" round>保存并应用设置</el-button>
      <el-button size="small" round>恢复默认设置</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import electron, { BrowserWindow, screen } from "electron";

const ipc = electron.ipcRenderer;
const process = require('process');

@Component({
  components: {

  }
})
export default class SettingsView extends Vue {

  currentPage = '';
  process = null;
  appVesrsion = '';
  appBuildDate = '';

  mounted() {
    this.process = process;
    this.appVesrsion = (<any>window).appVesrsion;
    this.appBuildDate = (<any>window).appBuildDate;
  }

  showHelpWindow(arg) { ipc.send('main-act-show-help-window', arg); }
  toggleDeveloperMode() {
    
  }

  public showPage(name : string) { this.currentPage = name }
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.settings-area {

  .left-fix-layer {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 155px;
    background-color: #fefefe;
  }
  .shadow-fix-layer {
    position: absolute;
    left: 150px;
    top: 0;
    bottom: 0;
    right: 0;
    background-color: #fff;
    box-shadow: -2px 0 10px 0px rgba(0, 0, 0, 0.08);
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .el-tabs {
    height: 100%;

    .el-tabs__content {
      padding-left: 20px;
      height: 100%;
      overflow: hidden;
      overflow-y: scroll;

      @include pc-fix-scrollbar-white();
    }

  }

  .tab-icon-item{

    display: inline-flex;
    justify-content: center;
    align-items: center;
    align-content: center;
    font-size: 16px;

    i {
      font-size: 22px;
      margin-right: 10px
    }
  }

  .el-tabs__nav-wrap::after {
    display: none;
  }

  .el-tabs__item {
    padding-left: 7px;
    height: 36px;
    line-height: 36px;
    font-size: 16px;
  }
}
</style>


