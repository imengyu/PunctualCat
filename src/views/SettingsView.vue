<template>
  <div class="main-area settings-area">
    <div class="main-container" style="padding: 30px;padding-right: 0;">
      <!--shadow-none<div class="left-fix-layer"></div>
      <div class="shadow-fix-layer"></div>-->
      <el-tabs v-if="appSettingsBackup" tab-position="left" v-model="currentPage">
        <el-tab-pane name="global">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shezhi"></i>全局设置</span>
          <el-form :model="appSettingsBackup" label-width="140px">
            <el-form-item label="软件主窗口标题">
              <el-input v-model="appSettingsBackup.window.title" size="small" placeholder="软件主窗口标题，为空使用默认"></el-input>
            </el-form-item>
            <el-form-item label="阻止系统自动休眠">
              <el-switch v-model="appSettingsBackup.system.preventSleep" style="margin: 10px 0;"></el-switch><br>
              <span class="text-secondary el-form-span">您可以开启此选项阻止系统自动休眠，也可以在操作系统的“电源选项”中将休眠时间设置为“从不”，来防止计算机自动休眠。<br><a href="javascript:;">了解更多关于阻止休眠的信息</a></span>
            </el-form-item>
            <el-form-item label="开机自动运行本程序">
              当前开机自动运行状态：<span class="text-important">{{ autoStartStatus }}</span><br>
              <el-button size="mini" type="primary" @click="switchAutoStart(true)" :disabled="!nativeModuleEnabled" round>设置开机启动</el-button>
              <el-button size="mini" type="info" @click="switchAutoStart(false)" :disabled="!nativeModuleEnabled" round>取消开机启动</el-button>
              <br>
              <span class="text-secondary el-form-span"><i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i> 某些安全软件可能会禁止开机启动，请您手动允许。</span>
              <span v-if="!nativeModuleEnabled" class="text-secondary el-form-span"><i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i>现在无法使用此功能，因为本地模块没有正确加载</span>
            </el-form-item>        
            <el-form-item label="本软件长时间无操作时自动隐藏">
              <el-switch v-model="appSettingsBackup.system.autoHide" style="margin: 10px 0;"></el-switch><br>
              <el-input-number v-model="appSettingsBackup.system.autoHideMinute" size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="60"></el-input-number>
              分钟后无操作隐藏
            </el-form-item>
            <el-form-item label="主窗口背景图片">
              <el-input laceholder="输入背景图片文件的路径" v-model="appSettingsBackup.window.background" size="small">
                <template slot="append">
                  <el-button size="mini" icon="el-icon-folder" @click="chooseImage({type:'chooseBackground'})">选择文件</el-button>
                  <el-button size="mini" icon="el-icon-delete" @click="appSettingsBackup.window.background='';updateBackground()" title="清空背景"></el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="主窗口背景图片不透明度">
              <div style="padding: 10px 20px">
                <el-slider v-model="appSettingsBackup.window.backgroundOpacity" :format-tooltip="formatBackgroundOpacityTooltip" @change="updateBackground" :min="20" :max="100"></el-slider>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane name="player">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-yanchu"></i>播放设置</span>
          <el-form :model="appSettingsBackup" label-width="140px">
            <el-form-item label="开启音乐播放淡出淡入">
              <el-switch v-model="appSettingsBackup.player.enableFade" style="margin: 10px 0;"></el-switch><br>
              淡出淡入时长(毫秒) ： <el-input-number v-model="appSettingsBackup.player.fadeMs" size="mini" controls-position="right" :min="1000" :max="5000"></el-input-number>
            </el-form-item>
            <el-form-item label="开启音乐播放频谱">
              <el-switch v-model="appSettingsBackup.player.enableWave" style="margin: 10px 0;"></el-switch><br>
              <span class="text-secondary el-form-span"><i class="fa fa fa-info-circle mr-2" style="color: #0b61a4"></i> 
                音乐频谱只是为了好看。在性能弱的电脑上建议关闭，可以节省性能资源。
              </span>
            </el-form-item>
            <el-form-item label="同时允许的最大音乐播放数">
              <el-input-number v-model="appSettingsBackup.player.maxPlayingMusic" size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="10"></el-input-number>
              <span class="text-secondary el-form-span"><i class="fa fa fa-info-circle mr-2" style="color: #0b61a4"></i> 
                本软件支持同时播放多首音乐，但同时播放过多音乐容易造成混乱，建议设置该参数限制同时播放音乐的数量。
              </span>
            </el-form-item>
            <el-form-item label="任务播放失败时播放错误提示音">
              <el-switch v-model="appSettingsBackup.auto.playTipIfFail" style="margin: 10px 0;"></el-switch><br>
            </el-form-item>
            <el-form-item label="开启静音时段">
              <el-switch v-model="appSettingsBackup.auto.enableMuteTime" style="margin: 10px 0;"></el-switch>
              <span class="text-secondary el-form-span"><i class="fa fa fa-info-circle mr-2" style="color: #0b61a4"></i> 
                您可以开启此选项来开启静音时段，当处于您定义的静音时段时，不会自动播放任务和音乐。
              </span>
            </el-form-item>
            <el-form-item label="静音时段">
              <span class="text-secondary el-form-span">您可以设置一些条件表示静音的时段，例如 “22:00 至 5:50”、“周六 至 周日”、“7/1 至 8/31” 等等。</span>
              <div class="mute-con-list" v-if="appSettingsBackup.auto.muteTimes && appSettingsBackup.auto.muteTimes.length > 0">
                <div v-for="(item, index) in appSettingsBackup.auto.muteTimes" :index="index" :key="index">
                  <condition-input :condition="item"></condition-input>
                  <el-popover
                    placement="top"
                    width="160"
                    trigger="click"
                    transition="pulse"
                    v-model="item.tempBvar1">
                    <p class="mt-0">确定删除此条件？</p>
                    <div style="text-align: right; margin: 0">
                      <el-button size="mini" type="text" @click="item.tempBvar1=false">取消</el-button>
                      <el-button type="primary" size="mini" @click="item.tempBvar1=false;appSettingsBackup.auto.muteTimes.remove(index)">确定</el-button>
                    </div>
                    <el-tooltip slot="reference" placement="right" content="删除此条件" transition="pulse">
                      <el-button type="danger" size="mini" circle><i class="iconfont icon-shanchu2"></i></el-button>
                    </el-tooltip>
                  </el-popover>
                </div>
              </div>
              <div style="padding: 10px 0">
                <el-button @click="addMuteTime" size="mini" round><i class="iconfont icon-tianjiaxiao mr-2"></i>添加条件</el-button>
              </div>
             
            </el-form-item>
            <el-form-item label="静音时段时设置电脑静音">
              <el-switch v-model="appSettingsBackup.auto.setSystemMuteAtMuteTime" :disabled="!nativeModuleEnabled" style="margin: 10px 0;"></el-switch>
              <span class="text-secondary el-form-span">开启此选项以后在静音时段还会设置电脑声音为静音，防止其他软件发出声音。</span><br />
              <span v-if="!nativeModuleEnabled" class="text-secondary el-form-span"><i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i>无法使用此功能，因为本地模块没有正确加载</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane name="security">
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-anquan"></i>安全设置</span>
          <el-form :model="appSettingsBackup" label-width="140px">

            <el-form-item label="开启密码保护">
              <el-switch v-model="appSettingsBackup.security.preventAnymouseUse" style="margin: 10px 0;"></el-switch><br>
              <span class="text-secondary el-form-span">您可以开启此选项来使用密码保护系统，这样，只有输入正确的密码才能使用本软件。</span>
            </el-form-item>
            <el-form-item label="长时间无操作时自动锁定软件">
              <el-switch v-model="appSettingsBackup.security.autoLock" :disabled="!appSettingsBackup.security.preventAnymouseUse" style="margin: 10px 0;"></el-switch><br>
              <el-input-number v-model="appSettingsBackup.security.autoLockMaxMinute" 
                :disabled="!appSettingsBackup.security.preventAnymouseUse || !appSettingsBackup.security.autoLock" 
                size="mini" style="width:90px;margin-right:10px" controls-position="right" :min="1" :max="30"></el-input-number>
              分钟后无操作自动锁定软件
            </el-form-item>
            <el-form-item label="管理员密码">
              <div v-if="appSettingsBackup.security.managerPassword==''">您未设置管理员密码，<a href="javascript:;" @click="editManagerPassword(true)">设置管理员密码</a></div>
              <div v-else><a href="javascript:;" @click="editManagerPassword(false)">修改管理员密码</a> | <a href="javascript:;" @click="clearManagerPassword">删除管理员密码</a></div>
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
          <el-form :model="appSettingsBackup" label-width="110px">
            
            <el-form-item label="数据备份与还原">
              <div class="text-secondary el-form-span">您可以使用本功能备份数据，以便在数据被意外修改或丢失时将其还原。</div>
              <div>
                <el-button size="mini" type="primary" @click="exportData" round>导出数据</el-button>
                <el-button size="mini" @click="importData" round>导入数据</el-button>
              </div>
              <span class="text-secondary el-form-span"><i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i> 注意，导入数据时将会强制覆盖当前数据，并且<b>不可恢复</b>，请谨慎操作。</span>
            </el-form-item>

          </el-form>
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
    <!--导出数据对话框-->
    <el-dialog :title="(currentIsImportData ? '导入' : '导出') + '数据'" 
      :visible.sync="showImportOrExportDialog" 
      :close-on-click-modal="false"
      :close-on-press-escape="false" 
      :append-to-body="true"
      width="50%">
      <span class="text-secondary display-block mb-2">选择您需要 {{ (currentIsImportData ? '导入' : '导出') }} 的数据：</span>
      <div v-if="!currentIsImportData">
        <el-checkbox v-model="dataExportConfig.includeData">所有计划表数据</el-checkbox><br />
        <el-checkbox v-model="dataExportConfig.includeSettings">软件设置</el-checkbox><br />
        <el-checkbox v-model="dataExportConfig.includeMusicHistory">最近音乐列表</el-checkbox>
      </div>
      <div v-else-if="dataImport">
        <el-checkbox v-model="dataImportConfig.includeData" :disabled="!dataImport.dataConfig.includeData">所有计划表数据</el-checkbox><br />
        <el-checkbox v-model="dataImportConfig.includeSettings" :disabled="!dataImport.dataConfig.includeSettings">软件设置</el-checkbox><br />
        <el-checkbox v-model="dataImportConfig.includeMusicHistory" :disabled="!dataImport.dataConfig.includeMusicHistory">最近音乐列表</el-checkbox>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button v-if="currentIsImportData" type="primary" 
          :disabled="!dataImportConfig.includeData&&!dataImportConfig.includeSettings&&!dataImportConfig.includeMusicHistory"
          @click="doImportDataSure" round>导入</el-button>
        <el-button v-if="!currentIsImportData" type="primary" 
          :disabled="!dataExportConfig.includeData&&!dataExportConfig.includeSettings&&!dataExportConfig.includeMusicHistory"
          @click="exportDataShowSaveDialog" round><i v-if="dataExporting" class="el-icon-loading"></i>{{ dataExporting ? '正在导出中...' : '导出' }}</el-button>
        <el-button @click="showImportOrExportDialog=false" round>取消</el-button>
      </span>
    </el-dialog>
    <!--设置管理员密码对话框-->
    <el-dialog :title="currentIsAddManagerPassword ? '添加管理员密码' : '设置管理员密码'" 
      :visible.sync="showEditManagerPasswordDialog" 
      :close-on-click-modal="false"
      :close-on-press-escape="false" 
      :append-to-body="true"
      width="50%">
      <el-form ref="formPassword" :rules="currentIsAddManagerPassword ? managerPasswordAddRules : managerPasswordChangeRules" :model="managerPasswordEditor" label-width="80px">
        <el-form-item v-if="!currentIsAddManagerPassword" label="旧密码" prop="old">
          <el-input v-model="managerPasswordEditor.old" placeholder="请输入旧密码" show-password></el-input>
        </el-form-item>
        <el-form-item v-else>
          <span class="text-secondary el-form-span">该密码为以后您登录本软件、修改数据所必须的密码，丢失以后无法找回，请保存好密码</span>
        </el-form-item>
        <el-form-item label="新密码" prop="new">
          <el-input v-model="managerPasswordEditor.new" placeholder="请输入新密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="newCheck">
          <el-input v-model="managerPasswordEditor.newCheck" placeholder="请再输入一次新密码" show-password></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="editManagerFinish(true)" round>保存</el-button>
        <el-button @click="editManagerFinish(false)" round>取消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import { Form } from "element-ui";
import { MessageBoxInputData } from "element-ui/types/message-box";
import { getMusicHistoryService, MusicHistoryService } from '../services/MusicHistoryService'
import { ElMessageComponent } from "element-ui/types/message";
import App from '../App.vue'
import ConditionInput from '../components/ConditionInput.vue'
import electron, { BrowserWindow, screen, shell } from "electron";
import CommonUtils from "../utils/CommonUtils";
import SettingsServices from '../services/SettingsServices'
import Win32Utils from "../utils/Win32Utils";
import fs from 'fs';
import { PlayCondition } from "../model/PlayCondition";
import { Logger } from "log4js";

const ipc = electron.ipcRenderer;
const process = require('process');

@Component({
  components: {
    'condition-input': ConditionInput,
  }
})
export default class SettingsView extends Vue {

  @Prop({default:null}) app : App;
  musicHistoryService : MusicHistoryService = null;
  @Prop({default:false}) nativeModuleEnabled : boolean;

  logger : Logger = null;

  currentPage = 'global';
  process = null;
  appVesrsion = '';
  appBuildDate = '';
  appSettingsBackup = null;
  autoStartStatus = '';

  showEditManagerPasswordDialog = false;
  showImportOrExportDialog = false;

  currentIsImportData = false;
  currentIsAddManagerPassword = false;

  dataExporting = false;
  dataExportConfig = {
    includeSettings: true,
    includeData: true,
    includeMusicHistory: true,
  };
  dataImportConfig = {
    includeSettings: true,
    includeData: true,
    includeMusicHistory: true,
  };
  dataImport = null;

  /* 修改密码 */
  validatePass2 = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请再次输入密码'));
    } else if (value !== this.managerPasswordEditor.new) {
      callback(new Error('两次输入密码不一致!'));
    } else {
      callback();
    }
  };
  managerPasswordAddRules = {
    new: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
    ],
    newCheck: [
      { validator: this.validatePass2, trigger: 'blur' }
    ],
  };
  managerPasswordChangeRules = {
    old: [
      { required: true, message: '请输入旧密码', trigger: 'blur' },
      { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
    ],
    new: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
    ],
    newCheck: [
      { validator: this.validatePass2, trigger: 'blur' }
    ],
  };
  managerPasswordEditor = {
    old: '',
    new: '',
    newCheck: '',
  };


  mounted() {
    this.process = process;
    this.appVesrsion = window.appVesrsion;
    this.appBuildDate = window.appBuildDate;
    this.appSettingsBackup = CommonUtils.clone(SettingsServices.getData());
    this.musicHistoryService = getMusicHistoryService();
    this.autoStartStatus = this.getAutoStartStatus();
    this.logger = window.appLogger;

    ipc.on('selected-json', function (event, arg, path) {
      if(!path || path.length == 0) 
        return;
      if(arg.type=='chooseData'){
        if(arg.isSave) this.doExportData(path);
        else this.doImportData(path[0]);
      }
    });
  }

  //保存、恢复默认按钮

  autoSaveSettings() {
    SettingsServices.setData(this.appSettingsBackup);
  }
  saveSettings() {
    SettingsServices.setData(this.appSettingsBackup);
    this.logger.info('Settings have been updated');
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
      this.logger.info('Settings have been reset to default values');
      this.$message({ type: 'success', message: '已恢复默认设置' });
    }).catch(() => {});
  }

  //管理员密码

  editManagerPassword(isAdd : boolean){
    this.currentIsAddManagerPassword = isAdd;
    this.showEditManagerPasswordDialog = true;
  }
  editManagerFinish(save : boolean){
    if(save){
      (<Form>this.$refs['formPassword']).validate((valid) => {
        if (valid) {
          if(this.currentIsAddManagerPassword){
            this.appSettingsBackup.security.managerPassword = this.managerPasswordEditor.new;
            SettingsServices.setSetting('security.managerPassword', this.managerPasswordEditor.new);
            this.managerPasswordEditor.old = '';
            this.managerPasswordEditor.new = '';
            this.managerPasswordEditor.newCheck = '';
            this.showEditManagerPasswordDialog = false;
            this.$message({ message: '修改管理员密码成功 !', type: 'success' });
            this.logger.info('Manager password has been updated');
            if(!this.appSettingsBackup.security.preventAnymouseUse) {
              this.$confirm('您真已经成功设置管理员密码，现在是否要开启安全保护功能? ', '提示', {
                confirmButtonText: '开启',
                cancelButtonText: '取消',
                roundButton: true,
                type: 'warning'
              }).then(() => {
                this.appSettingsBackup.security.preventAnymouseUse = true;
                SettingsServices.setSettingBoolean('security.preventAnymouseUse', true)}
              ).catch(() => {});
            }
          }else {
            if(this.appSettingsBackup.security.managerPassword == this.managerPasswordEditor.old){
              this.appSettingsBackup.security.managerPassword = this.managerPasswordEditor.new;
              SettingsServices.setSetting('security.managerPassword', this.managerPasswordEditor.new);
              this.managerPasswordEditor.old = '';
              this.managerPasswordEditor.new = '';
              this.managerPasswordEditor.newCheck = '';
              this.$message({ message: '修改管理员密码成功 !', type: 'success' })
              this.showEditManagerPasswordDialog = false;
              this.logger.info('Manager password has been updated');
            }else{
              this.logger.info('Manager password update failed because old password error');
              this.$message({ message: '无法修改管理员密码，旧密码错误', type: 'error' })
            }
          }
        } else {
          this.$message({ message: '请完善信息 !', type: 'warning' })
          return false;
        }
      });
    }else this.showEditManagerPasswordDialog = false;
  }
  clearManagerPassword(){
    this.$confirm('您真的要删除已设置的管理员密码? 删除管理员密码以后将不能使用锁定功能！', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      this.$prompt('请输入原密码', '提示', {
        inputType: 'password',
        roundButton: true,
        inputValidator: function(t){
          if(CommonUtils.isNullOrEmpty(t)) return '请输入密码'
          else if(t.length < 6) return '密码长度必须大于等于 6 位'
          return true
        },
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      }).then((data : MessageBoxInputData) => {
        if(data.value == this.appSettingsBackup.security.managerPassword){

          SettingsServices.setSetting('security.managerPassword', '')
          this.appSettingsBackup.security.managerPassword = '';
          this.logger.info('Manager password has been cleared');
          this.$message({ type: 'success', message: '删除管理员密码成功！ ' });
        }else {
          this.logger.info('Manager password clear failed because old password error');
          this.$alert('管理员密码不正确', '修改密码提示', { type: 'error' })
        }
      }).catch(() => {});
    }).catch(() => {});
  }

  //静音
  addMuteTime() {
    this.appSettingsBackup.auto.muteTimes.push(new PlayCondition('', null, { intervalType: 'any', timeType: 'range', forceDisallowTypes: [] }))
  }

  //开机启动

  switchAutoStart(enable){
    if(Win32Utils.getNativeCanUse()){
      var rs = Win32Utils.setAutoStartEnable(enable);
      this.autoStartStatus = this.getAutoStartStatus();
      this.logger.info((enable ? 'Set' : 'cancel') + ' autostart ' + (rs ? 'success' : 'failed'));
      this.$message({
        message: (enable ? '设置' : '取消') + '开机启动' + (rs ? '成功' : '失败'),
        type: rs ? 'success' : 'error'
      })
    }else {
      this.$message({
        message: '无法设置开机启动，因为本地模块没有加载',
        type: 'error'
      })
    }
  }
  getAutoStartStatus(){
    try{
      if(this.nativeModuleEnabled) return Win32Utils.getAutoStartEnabled() ? '已设置开机启动' : '未设置开机启动';
      else return '未知';
    }catch{
      return '未知';
    }
  }

  //背景

  formatBackgroundOpacityTooltip(val) {
    return '不透明度 ' + val + ' %';
  }
  updateBackground() {
    SettingsServices.setSettingNumber('window.backgroundOpacity', this.appSettingsBackup.window.backgroundOpacity);
    this.app.loadWindowSettings(false);
  }
  chooseImage(arg) {
    this.app.chooseOneImageAndCallback((imagePath) => {
      imagePath = imagePath.replace(/\\/g, '/');
      this.appSettingsBackup.window.background = imagePath;
      SettingsServices.setSetting('window.background', imagePath);
      this.updateBackground();
      this.$message({ message: '更换背景图片成功！', type: 'success' })
    });
  }

  //数据

  exportData() { 
    let noDataMode = localStorage.getItem('noDataMode');
    if(noDataMode == 'yes') {
      
    }
    else this.currentIsImportData = false; this.showImportOrExportDialog = true; 
  } 
  exportDataShowSaveDialog() { ipc.send('main-save-file-dialog-json', { type:'chooseData', name: new Date().format('YYYY-MM-DD HH:ii:ss') + ' 导出的数据.json' }); }
  doExportData(path : string) { 
    this.dataExporting = true;

    let json = {
      dataConfig: {
        includeSettings: this.dataExportConfig.includeSettings,
        includeData: this.dataExportConfig.includeData,
        includeMusicHistory: this.dataExportConfig.includeMusicHistory,
      },
      datas: {
        baseData: null,
        setings: null,
        musicList: null,
      }
    }
    if(this.dataExportConfig.includeSettings) 
      json.datas.setings = SettingsServices.getData();
    if(this.dataExportConfig.includeData) 
      json.datas.baseData = this.app.serviceTables.saveToJSONObject();
    if(this.dataExportConfig.includeMusicHistory) 
      json.datas.musicList = this.musicHistoryService.saveToMusicPathArray();

    fs.writeFile(path, JSON.stringify(json), (err) => {
      this.dataExporting = false;
      this.showImportOrExportDialog = false;
      if(err) {
        this.$alert('写入数据文件时失败：' + err + '  请检查您是否有权限写入指定的路径。', '导出失败', { type: 'error' });
        this.logger.error('Write data file ' + path + ' error while export data : ', err);
      }
      else { 
        this.logger.info('Export data ' + path + ' success');
        this.$msgbox({ 
          title: '导出成功！',
          showCancelButton: true,
          confirmButtonText: '打开数据文件位置',
          cancelButtonText: '确定',
          type: 'success' 
        }).then(() => shell.showItemInFolder(path)).catch(() => {});
      }
    });
  } 
  doImportData(path : string) { 
    fs.exists(path, (b)=>{
      if(!b) this.$alert('数据文件不存在！', '导入失败', { type: 'error' });
      else{
        fs.readFile(path, (err, data) => {
          if(err) {
            this.logger.error('Read data file ' + path + ' error while import data : ', err);
            this.$alert('读取文件失败！<br>错误信息：' + err, '导入失败', {
              type: 'error',
              dangerouslyUseHTMLString: true,
              confirmButtonText: '确定'
            });
          }else {
            this.dataImport = data;
            try{
              this.dataImportConfig.includeSettings = this.dataImport.dataConfig.includeSettings;
              this.dataImportConfig.includeData = this.dataImport.dataConfig.includeData;
              this.dataImportConfig.includeMusicHistory = this.dataImport.dataConfig.includeMusicHistory;
              let len = this.dataImport.datas.length;

            }catch(e){
              this.logger.error('Import data failed : ', err);
              this.$alert('数据文件格式无效，请检查是否导入正确', '导入失败', { type: 'error' });
            }
            this.currentIsImportData = true;
            this.showImportOrExportDialog = true;
          }
        })
      }
    });
  } 
  doImportDataSure() { 
    if(this.dataImportConfig.includeSettings)
      SettingsServices.setData(this.dataImport.datas.setings);
    if(this.dataImportConfig.includeData){
      this.app.serviceTables.destroy();
      this.app.serviceTables.loadFromJsonObject(this.dataImport.datas.baseData);
    }
    if(this.dataImportConfig.includeMusicHistory)
      this.musicHistoryService.loadFromPathArray(this.dataImport.datas.musicList);

    this.app.saveDatas().then(() => {
      this.$message({ message: '导入数据成功！', type: 'success' });
      this.logger.error('Import data sucess, old data has been discarded');
    }).catch((e) => {
      this.logger.error('Import data sucess but save the data import diled : ', e);
      this.$message({ message: '导入数据成功！但是保存新数据时发生错误： ' + e +' ，请稍后尝试手动保存数据', type: 'warning', duration: 12000 })
    })
  } 
  importData() {
    this.$confirm('您确定要导入数据吗? 导入数据功能是为了方便您在系统数据被篡改或数据丢失时使用的，导入后当前原有数据将会被覆盖，并且<b class="text-important">不可恢复</b>，请谨慎操作。', '重要提示', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定丢弃当前数据，并继续导入',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      roundButton: true,
      type: 'warning'
    }).then(() => ipc.send('main-open-file-dialog-json', { type:'chooseData' })).catch(() => {});
  }

  //关于

  showHelpWindow(arg) { ipc.send('main-act-show-help-window', arg); }

  countDeveloperModeClick = 0;
  timerDeveloperMode = null;
  tipDeveloperMode : ElMessageComponent = null;

  showDeveloperModeTip(str : string) {
    if(this.tipDeveloperMode != null) {
      this.tipDeveloperMode.close();
      this.tipDeveloperMode = null;
    }
    this.tipDeveloperMode = this.$message({
      message: str,
      type: 'info',
      onClose: () => this.tipDeveloperMode = null
    });
  }
  toggleDeveloperMode() {
    if(this.appSettingsBackup.system.developerMode) 
      this.showDeveloperModeTip('您已处于开发者模式，无需操作')
    else {
      if(this.countDeveloperModeClick > 0) {
        //Timer
        if(this.timerDeveloperMode == null) {
          this.timerDeveloperMode = setInterval(() => {
            this.countDeveloperModeClick-=2;
            if(this.countDeveloperModeClick <= 0){
              clearInterval(this.timerDeveloperMode);
              this.countDeveloperModeClick = 0;
              this.timerDeveloperMode = null;
            }
          }, 5000);
        }
        //Tip 
        if(this.countDeveloperModeClick > 3) {
          if(this.countDeveloperModeClick < 8)
            this.showDeveloperModeTip('再点击 ' + (8 - this.countDeveloperModeClick) + ' 次即可进入开发者模式');
          else {
            SettingsServices.setSettingBoolean('system.developerMode', true);
            SettingsServices.sendUpdated();
            this.showDeveloperModeTip('您已处于开发者模式');
          }
        }
      }
      this.countDeveloperModeClick++;
    }
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
  .el-form-item__label {
    line-height: 20px;
    padding-top: 10px;
  }
}
</style>


