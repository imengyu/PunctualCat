<template>

  <div :class="'autotimer-status' + (isWarn?' warn':'')" id="auto-status">
    <div class="toggle">
      <el-tooltip
        placement="top"
        :content="autoRunning?'关闭自动播放':'开启自动播放'">
        <el-switch
          class="autotimer-switch"
          :width="50"
          v-model="autoRunning"
          active-color="#13ce66"
          inactive-color="#ff4949">
        </el-switch>
      </el-tooltip>
      <span :class="isWarn?'sp e':'sp'">{{isWarn?'自动播放系统已关闭':'自动播放系统正常运行'}}</span>
    </div>
  </div>

</template>


<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import AutoPlayService, { AutoPlayServiceStatus, AutoPlayServiceTimerStatus } from '../services/AutoPlayService'
import $ from 'jquery'
import AutoTimerStatusCircle from './AutoTimerStatusCircle.vue'
import { PlayTask } from '../model/PlayTask';

@Component({
  components: {
    'auto-status-circle': AutoTimerStatusCircle
  }
})
export default class AutoTimerStatus extends Vue {

  autoPlayService : AutoPlayService = null;

  degree1 : Number = 0;
  degree2 : Number = 0;
  degree3 : Number = 0;

  task1 = 0;
  task2 = 0;
  task3 = 0;

  colorBackground1 : string = '#bbb';
  colorForegound1 : string = '#888';
  colorBackground2 : string = '#bbb';
  colorForegound2 : string = '#888';
  colorBackground3 : string = '#bbb';
  colorForegound3 : string = '#888';

  autoRunning = true;
  statusVisible = false;

  isWarn = false;

  @Watch('autoRunning')
  onRunningChanged(newV) {
    if(newV) {
      this.autoPlayService.start();
    }
    else { 
      this.statusVisible = false;
      this.autoPlayService.stop();
    }
  }

  bindServer(autoPlayService : AutoPlayService) {
    this.autoPlayService = autoPlayService;
    this.autoPlayService.registerServerStatusCallback(this.onAutoPlayServiceStatusChangedCallback);
    this.autoPlayService.registerTimerStatusCallback(this.onAutoPlayServiceTimerStatusChangedCallback);
  }

  mounted() {
    this.degree1 = 0;
    this.degree2 = 0;
    this.degree3 = 0;
  }
  beforeDestroy() {
    if(this.autoPlayService) {
      this.autoPlayService.clearServerStatusCallback();
      this.autoPlayService.clearTimerStatusCallback();
    }
  }

  flashingBackground = [ false, false, false, false ];
  flashingForeground = [ false, false, false, false ];

  flashBackground(index : number) {
    if(!this.flashingBackground[index]){
      this.flashingBackground[index] = true;   
      let currloopCount = 0;
      let interval = null;
      let loop = () => {
        currloopCount++;
        if(currloopCount > 6) {   
          this.flashingBackground[index] = false;
          clearInterval(interval);
          $('#warp' + index).removeClass('flashbg');
        }else {
          $('#warp' + index).toggleClass('flashbg');
        }
      }
      interval = setInterval(loop, 800);
    }
  }
  flashForeground(index : number) {
    if(!this.flashingForeground[index]){
      this.flashingForeground[index] = true;
      let currloopCount = 0;
      let interval = null;
      let loop = () => {
        currloopCount++;
        if(currloopCount > 6) {
          this.flashingForeground[index] = false;
          clearInterval(interval);
          $('#warp' + index).removeClass('flash');
        }else {
          $('#warp' + index).toggleClass('flash');
        }
      }
      interval = setInterval(loop, 800);
    }
  }

  onAutoPlayServiceStatusChangedCallback(status : AutoPlayServiceStatus) {
    if(status.workingTimer == 'second') {
      this.degree1 = Math.floor(status.workingPrecent * 360);
      this.isWarn = false;
      this.task1 = status.workingCheckedTaskCount;
      if(status.workingIsCorrecting) this.colorForegound1 = '#03426a';
      else this.colorForegound1 = '#0a67a3';
    }else if(status.workingTimer == 'minute') {
      this.degree2 = Math.floor(status.workingPrecent * 360);
      this.isWarn = false;
      this.task2 = status.workingCheckedTaskCount;
      if(status.workingIsCorrecting) this.colorForegound2 = '#006363';
      else this.colorForegound2 = '#009999';
    }else if(status.workingTimer == 'hour') {
      this.degree3 = Math.floor(status.workingPrecent * 360);
      this.isWarn = false;
      this.task3 = status.workingCheckedTaskCount;
      if(status.workingIsCorrecting) this.colorForegound3 = '#008209';
      else this.colorForegound3 = '#0c90d';
    }else if(status.workingTimer == 'disabled') {
      this.isWarn = true;
    }
  }
  onAutoPlayServiceTimerStatusChangedCallback(status : AutoPlayServiceTimerStatus) {
    if(status.timer == 'hour') {
      if(status.type=='start') 
        this.flashForeground(3);
      else if(status.type=='stop'){ 
        this.flashBackground(3);
        this.degree3 = 0;
      }
    }else if(status.timer == 'minute') {
      if(status.type=='start') {
        this.flashForeground(2);
      }
      else if(status.type=='stop') { 
        this.flashBackground(2);
        this.degree2 = 0;
      }
    }else if(status.timer == 'second') {
      if(status.type=='start') { 
        this.flashForeground(1);
      }
      else if(status.type=='stop') { 
        this.flashBackground(1);
        this.degree1 = 0;
      }
    }
  }




}
</script>

<style lang="scss">
.autotimer-status {

  position: absolute;
  display: inline-flex;
  height: 30px;
  padding: 2px 9px;
  justify-content: center;
  align-items: center;
  user-select: none;
  right: 160px;
  top: -30px;
  z-index: 2002;

  .toggle {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    color: #888;
  }
  .warn {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #df9400;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 5px;
    cursor: pointer;

    span {
      width: 12px;
      height: 12px;
    }
    &.success {
      background-color: #06af00;
    }
    i {
      font-size: 12px;
      color: #fff;
    }
  }
  .sp {
    font-size: 12px;
    color: #888;
    word-break: keep-all;
    margin-left: 15px;

    &.e { color: #c72e00; }
  }
}
.autotimer-switch {
  .el-switch__core:before {
    content: "OFF";
    
    position: absolute;
    top: -1px;
    left: unset;
    right: 8px;
    
    transition: all .3s;
    width: 20px;
    height: 16px;
    color: #FFF;
    display: inline-block;
  }

  &.is-checked .el-switch__core::before {
    content: "ON";
    top: 0px;
    left: 5px;
    right: unset;
  }
}
</style>
