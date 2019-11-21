<template>

  <div :class="'autotimer-status' + (isWarn?' warn':'') + (isHover?' hover':'')" 
    @mouseenter="isHover=true" @mouseleave="isHover=false">
    <div v-if="isHover || isWarn" class="toggle">
      <el-tooltip
        placement="top"
        :content="autoRunning?'切换自动播放状态':'开启自动播放系统'">
        <el-switch
          v-model="autoRunning"
          active-color="#13ce66"
          inactive-color="#ff4949">
        </el-switch>
      </el-tooltip>
    </div>
    <div v-if="isWarn" class="warn">
      <el-tooltip
        placement="top"
        content="提示：自动播放系统当前处于关闭状态，现在不会自动播放铃声">
        <i class="iconfont icon-cuowuhttp"></i>
      </el-tooltip>
    </div>
    <div v-else-if="isHover" class="warn success">
      <el-tooltip
        placement="top"
        content="提示：自动播放系统正常运行">
        <i class="iconfont icon-xuanzhong"></i>
      </el-tooltip>
    </div>
    <div id="warp1" v-if="!isWarn && !isHover" class="warp wrap1" :style="'background-color:'+getColor(1, false)+';'" :data-degree="degree1">
      <div class="inner1" :style="'transform: rotate(' + degree11 + 'deg);background-color:' + getColor(1, true) +';'"></div>
      <div class="inner2" :style="'transform: rotate(' + degree12 + 'deg);background-color:' + getColor(1, true) +';'"></div>
      <div class="mask">{{ task1 > 0 ? task1 : '' }}</div>
    </div>
    <div id="warp2" v-if="!isWarn && !isHover" class="warp wrap2" :style="'background-color:'+getColor(2, false)+';'" :data-degree="degree2">
      <div class="inner1" :style="'transform: rotate(' + degree21 + 'deg);background-color:' + getColor(2, true) +';'"></div>
      <div class="inner2" :style="'transform: rotate(' + degree22 + 'deg);background-color:' + getColor(2, true) +';'"></div>
      <div class="mask">{{ task2 > 0 ? task2 : '' }}</div>
    </div>
    <div id="warp3" v-if="!isWarn && !isHover" class="warp wrap3" :style="'background-color:'+getColor(3, false)+';'" :data-degree="degree3">
      <div class="inner1" :style="'transform: rotate(' + degree31 + 'deg);background-color:' + getColor(3, true) +';'"></div>
      <div class="inner2" :style="'transform: rotate(' + degree32 + 'deg);background-color:' + getColor(3, true) +';'"></div>
      <div class="mask">{{ task3 > 0 ? task3 : '' }}</div>
    </div>
  </div>

</template>


<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import AutoPlayService, { AutoPlayServiceStatus, AutoPlayServiceTimerStatus } from '../services/AutoPlayService'
import $ from 'jquery'
import { setInterval, clearInterval } from 'timers';
import { clearLine } from 'readline';

@Component
export default class AutoTimerStatus extends Vue {

  autoPlayService : AutoPlayService = null;

  degree1 : Number = 0;
  degree2 : Number = 0;
  degree3 : Number = 0;

  checked1 : Array<Number>  = [];
  checked2 : Array<Number>  = [];
  checked3 : Array<Number> = [];

  task1 = 0;
  task2 = 0;
  task3 = 0;

  autoRunning = true;

  colorBackground1 : string = '#bbb';
  colorForegound1 : string = '#888';
  colorBackground2 : string = '#bbb';
  colorForegound2 : string = '#888';
  colorBackground3 : string = '#bbb';
  colorForegound3 : string = '#888';

  getColor(index : number, isBackground : boolean) {
    if(index == 1) {
      if(this.degree1 < 180)  return isBackground ? this.colorBackground1 : this.colorForegound1 ;
      else return !isBackground ? this.colorBackground1 : this.colorForegound1 ;
    }else if(index == 2) {
      if(this.degree2 < 180)  return isBackground ? this.colorBackground2 : this.colorForegound2 ;
      else return !isBackground ? this.colorBackground2 : this.colorForegound2 ;
    }else if(index == 3) {
      if(this.degree3 < 180)  return isBackground ? this.colorBackground3 : this.colorForegound3;
      else return !isBackground ? this.colorBackground3 : this.colorForegound3 ;
    }
  }

  degree11 : Number = 0;
  degree12 : Number = 180;
  degree21 : Number = 0;
  degree22 : Number = 180;
  degree31 : Number = 0;
  degree32 : Number = 180;

  isWarn = false;
  isHover = false;

  @Watch('degree1')
  onDegree1Changed(newV) {
    if(newV < 180) {
      this.degree11 = 0;
      this.degree12 = 180 + newV;
    }else {
      this.degree11 = 180;
      this.degree12 = newV;
    }
  }
  @Watch('degree2')
  onDegree2Changed(newV) {
    if(newV < 180) {
      this.degree21 = 0;
      this.degree22 = 180 + newV;
    }else {
      this.degree21 = 180;
      this.degree22 = newV;
    }
  }
  @Watch('degree3')
  onDegree3Changed(newV) {
    if(newV < 180) {
      this.degree31 = 0;
      this.degree32 = 180 + newV;
    }else {
      this.degree31 = 180;
      this.degree32 = newV;
    }
  }

  @Watch('autoRunning')
  onRunningChanged(newV) {
    if(newV) this.autoPlayService.start();
    else this.autoPlayService.stop();
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
      let degreeOld = this['degree'+index];
      let currloopCount = 0;
      let interval = null;
      let loop = () => {
        currloopCount++;
        if(currloopCount > 6) {
          this['degree'+index]=degreeOld;
          this.flashingForeground[index] = false;
          clearInterval(interval);
          $('#warp' + index).removeClass('flash');
        }else {
          $('#warp' + index).toggleClass('flash');
        }
      }
      this['degree'+index]=359;
      interval = setInterval(loop, 800);
    }
  }

  onAutoPlayServiceStatusChangedCallback(status : AutoPlayServiceStatus) {
    if(status.workingTimer == 'second') {
      this.degree1 = Math.floor(status.workingPrecent);
      this.isWarn = false;
      this.task1 = status.workingCheckedTaskCount;
      if(status.workingRunChecked) this.checked1.push(status.workingPrecent);
      if(status.workingIsCorrecting) this.colorForegound1 = '#03426a';
      else this.colorForegound1 = '#0a67a3';
    }else if(status.workingTimer == 'minute') {
      this.degree2 = Math.floor(status.workingPrecent);
      this.isWarn = false;
      this.task2 = status.workingCheckedTaskCount;
      if(status.workingRunChecked) this.checked2.push(status.workingPrecent);
      if(status.workingIsCorrecting) this.colorForegound2 = '#006363';
      else this.colorForegound2 = '#009999';
    }else if(status.workingTimer == 'hour') {
      this.degree3 = Math.floor(status.workingPrecent);
      this.isWarn = false;
      this.task3 = status.workingCheckedTaskCount;
      if(status.workingRunChecked) this.checked3.push(status.workingPrecent);
      if(status.workingIsCorrecting) this.colorForegound3 = '#008209';
      else this.colorForegound3 = '#0c90d';
    }else if(status.workingTimer == 'disabled') {
      this.isWarn = true;
    }
  }
  onAutoPlayServiceTimerStatusChangedCallback(status : AutoPlayServiceTimerStatus) {
    if(status.timer == 'hour') {
      this.checked3 = [];
      if(status.type=='start') this.flashForeground(3);
      else if(status.type=='stop'){ 
        this.flashBackground(3);
        this.degree2 = 0;
      }
    }else if(status.timer == 'minute') {
      this.checked2 = [];
      if(status.type=='start') this.flashForeground(2);
      else if(status.type=='stop') { 
        this.flashBackground(2);
        this.degree2 = 0;
      }
    }else if(status.timer == 'second') {
      this.checked1 = [];
      if(status.type=='start') this.flashForeground(1);
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

  position: relative;
  display: inline-flex;
  width: 68px;
  height: 30px;
  padding: 0 6px;
  justify-content: center;
  align-items: center;
  user-select: none;
  border-radius: 15px;
  background-color: #fff;
  box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.08);

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

    &.success {
      background-color: #06af00;
    }
    i {
      font-size: 12px;
      color: #fff;
    }
  }

  $warp-width : 18px;

  .warp {
    position: relative;
    border-radius: 50%;
    opacity: 1;
    transition: opacity ease-in-out .3s;
    display: inline-block;

    &.flashbg {
      opacity: 0.3;
    }
    &.flash {
      .inner1,
      .inner2 {
        opacity: 0.5;
      }
    }

    .inner1 {
      position: absolute;
      transform: rotate(0deg);
      top: 0;
      left: 0;
      border-radius: 50%;
      transition: opacity ease-in-out .3s;
      opacity: 1;
    }
    .inner2 {
      position: absolute;
      transform: rotate(0deg);
      top: 0;
      left: 0;
      border-radius: 50%;
      transition: opacity ease-in-out .3s;
      opacity: 1;
    }
    .mask {
      position: absolute;
      color: #fff;
      height: $warp-width;
      line-height: $warp-width;
      font-size: 15px;
      font-weight: bold;
      font-family: "FaktPro-Hair";
      left: 0;
      right: 0;
      top: 0;
      text-align: center
    }
  }

  

  @for $i from 1 through 3 {
    .wrap#{$i} {

      $warp-width-val : $warp-width;
      $warp-width-precent : $warp-width-val / 2;

      width: $warp-width-val;
      height: $warp-width-val;

      .inner1 {
        width: $warp-width-val;
        height: $warp-width-val;
        clip: rect(0px,$warp-width-precent,$warp-width-val,0px);
      }
      .inner2 {
        width: $warp-width-val;
        height: $warp-width-val;
        clip: rect(0px,$warp-width-precent,$warp-width-val,0px);
      }
    }
  }
}
</style>
