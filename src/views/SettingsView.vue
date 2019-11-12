<template>
  <div class="main-area settings-area overflow-visible">
    <div class="main-container shadow-none overflow-visible" style="padding: 30px;padding-right: 0;">
      <div class="left-fix-layer"></div>
      <div class="shadow-fix-layer"></div>
      <el-tabs v-if="appSettingsBackup" tab-position="left" v-model="currentPage">
        <el-tab-pane name="global">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shezhi"></i>全局设置</span>

          <el-form ref="formSettings" :model="appSettingsBackup" label-width="140px">
            <el-form-item label="软件主窗口标题">
              <el-input v-model="appSettingsBackup.window.title" size="small" placeholder="软件主窗口标题，为空使用默认"></el-input>
            </el-form-item>
            <el-form-item label="阻止系统自动休眠">
              <el-switch v-model="appSettingsBackup.system.preventSleep" style="margin: 10px 0;"></el-switch><br>
              <span class="text-secondary el-form-span">您可以开启此选项阻止系统自动休眠，也可以在操作系统的“电源选项”中将休眠时间设置为“从不”，来防止计算机自动休眠。<br><a href="javascript:;">了解更多关于阻止休眠的信息</a></span>
            </el-form-item>
            <el-form-item label="开机自动运行本程序">
              当前开机自动运行状态：<span class="text-important">{{ autoStartStatus }}</span><br>
              <el-button size="mini" type="primary" @click="switchAutoStart(true)" round>设置开机启动</el-button>
              <el-button size="mini" type="info" @click="switchAutoStart(false)" round>取消开机启动</el-button>
              <br>
              <span class="text-secondary el-form-span"><i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i> 某些安全软件可能会禁止开机启动，请您手动允许。</span>
            </el-form-item>
            
            <el-form-item label="本软件长时间无操作时自动隐藏">
              <el-switch v-model="appSettingsBackup.system.autoHide" style="margin: 10px 0;"></el-switch><br>
              <el-input-number v-model="appSettingsBackup.system.autoHideMinute" size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="10"></el-input-number>
              分钟后无操作隐藏
            </el-form-item>
            <el-form-item label="主窗口背景图片">
              <el-input laceholder="输入背景图片文件的路径" v-model="appSettingsBackup.window.background" size="small">
                <template slot="append">
                  <el-button size="mini" icon="el-icon-folder" @click="chooseImage({type:'chooseBackground'})">选择文件</el-button>
                  <el-button size="mini" icon="el-icon-delete" @click="appSettingsBackup.window.background=''" title="清空背景"></el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane name="player">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-yanchu"></i>播放设置</span>
          <el-form ref="formSettings" :model="appSettingsBackup" label-width="140px">
            <el-form-item label="开启音乐播放淡出淡入">
              <el-switch v-model="appSettingsBackup.player.enableFade" style="margin: 10px 0;"></el-switch><br>
            </el-form-item>
            <el-form-item label="同时允许的最大音乐播放数">
              <el-input-number v-model="appSettingsBackup.player.maxPlayingMusic" size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="10"></el-input-number>
              <span class="text-secondary el-form-span">本软件支持同时播放多首音乐，但同时播放过多音乐容易造成混乱，建议设置该参数限制同时播放音乐的数量。</span>
            </el-form-item>
            <el-form-item label="任务播放失败时播放错误提示音">
              <el-switch v-model="appSettingsBackup.auto.playTipIfFail" style="margin: 10px 0;"></el-switch><br>
            </el-form-item>

          </el-form>
        </el-tab-pane>
        <el-tab-pane name="security">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-anquan"></i>安全设置</span>
          <el-form ref="formSettings" :model="appSettingsBackup" label-width="140px">

            <el-form-item label="开启密码保护">
              <el-switch v-model="appSettingsBackup.security.preventAnymouseUse" style="margin: 10px 0;"></el-switch><br>
              <span class="text-secondary el-form-span">您可以开启此选项来使用密码保护系统，这样，只有输入正确的密码才能使用本软件。</span>
            </el-form-item>
            <el-form-item label="长时间无操作时自动锁定软件">
              <el-switch v-model="appSettingsBackup.security.autoLock" style="margin: 10px 0;"></el-switch><br>
              <el-input-number v-model="appSettingsBackup.security.autoLockMaxMinute" size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="10"></el-input-number>
              分钟后无操作自动锁定软件
            </el-form-item>
            <el-form-item label="管理员密码">
              <div v-if="appSettingsBackup.security.managerPassword==''">您未设置管理员密码，<a href="javascript:;">设置管理员密码</a></div>
              <div v-else><a href="javascript:;">修改管理员密码</a></div>
            </el-form-item>
            <el-form-item label="登录界面的说明文字">
              <span class="text-secondary">此说明文字将会被显示在登录界面上，您可以告知别人关于登录的信息。</span>
              <el-input
                type="textarea"
                class="mt-2"
                size="small"
                placeholder="请输入内容"
                v-model="appSettingsBackup.security.lockedNote"
                maxlength="50"
                show-word-limit>
              </el-input>
            </el-form-item>

          </el-form>
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
      <el-button type="primary" size="small" @click="saveSettings" round>保存并应用设置</el-button>
      <el-button size="small" @click="unsaveSettings" round>取消修改设置</el-button>
      <el-button size="small" @click="defaultSettings" round>恢复默认设置</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import electron, { BrowserWindow, screen } from "electron";
import CommonUtils from "../utils/CommonUtils";
import SettingsServices from '../services/SettingsServices'
import Win32Utils from "../utils/Win32Utils";

const ipc = electron.ipcRenderer;
const process = require('process');

@Component({
  components: {

  }
})
export default class SettingsView extends Vue {

  currentPage = 'global';
  process = null;
  appVesrsion = '';
  appBuildDate = '';
  appSettingsBackup = null;
  autoStartStatus = '';

  mounted() {
    this.process = process;
    this.appVesrsion = (<any>window).appVesrsion;
    this.appBuildDate = (<any>window).appBuildDate;
    this.appSettingsBackup = CommonUtils.clone(SettingsServices.getData());
    this.getAutoStartStatus();
  }

  saveSettings() {
    SettingsServices.setData(this.appSettingsBackup);
    this.$message({ type: 'success', message: '设置已保存' });
  }
  unsaveSettings() {
    this.$confirm('您是否真的要抛弃对设置的修改？设置将会恢复至您修改之前的状态', '提示', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      this.appSettingsBackup = CommonUtils.clone(SettingsServices.getData());
      this.$message({ type: 'success', message: '设置已恢复至修改之前的状态' });
    }).catch(() => {});
  }
  defaultSettings() {
    this.$confirm('确定恢复默认设置？', '提示', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      SettingsServices.resetDefault();
      this.$message({ type: 'success', message: '已恢复默认设置' });
    }).catch(() => {});
  }

  switchAutoStart(enable){
    var rs = Win32Utils.setAutoStartEnable(enable);
    this.autoStartStatus = this.getAutoStartStatus();
    this.$message({
      message: (enable ? '设置' : '取消') + '开机启动' + (rs ? '成功' : '失败'),
      type: rs ? 'success' : 'error'
    })
  }
  getAutoStartStatus(){
    try{
      return Win32Utils.getAutoStartEnabled() ? '已设置开机启动' : '未设置开机启动';
    }catch{
      return '未知';
    }
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

  .el-tabs__content {
    padding-right: 45px
  }
  .el-tabs__item {
    padding-left: 7px;
    height: 36px;
    line-height: 36px;
    font-size: 16px;
  }
}
</style>


