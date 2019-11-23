<template>

  <div :class="'autotimer-status' + (isWarn?' warn':'')">
    <div class="toggle">
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
    <div v-else class="warn success">
      <el-popover
        placement="bottom"
        width="200"
        transition="pulse"
        trigger="manual"
        v-model="statusVisible">
        <div class="text-success mt-1 mb-3">
          <i class="iconfont icon-xuanzhong"></i> 自动播放系统正常运行中 
          <a href="javascript:;" class="float-right" @click="statusVisible=false" title="隐藏"><i class="iconfont icon-tiaojian-copy"></i></a>
        </div>
        <auto-status-circle ref="statusCircle" class="mb-3"
          :degree1="degree1" :degree2="degree2" :degree3="degree3"
          :task1="task1" :task2="task2" task3="task3"
          :colorForegound1="colorForegound1" :colorForegound2="colorForegound2"
          :colorForegound3="colorForegound3" :colorBackground1="colorBackground1"
          :colorBackground2="colorBackground2" :colorBackground3="colorForegound3">
        </auto-status-circle>
        <i slot="reference" class="iconfont icon-duigou" @click="statusVisible=true"></i>
      </el-popover>
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

  position: relative;
  display: inline-flex;
  width: 68px;
  height: 30px;
  padding: 0 6px;
  justify-content: center;
  align-items: center;
  user-select: none;
  border-radius: 15px;

  &:hover {
    background-color: #fff;
    box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.08);
  }

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
}
</style>
