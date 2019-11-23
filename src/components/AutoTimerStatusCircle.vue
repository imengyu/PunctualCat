<template>
  <div class="d-flex justify-content-center align-items-center">
    <span class="text-secondary mr-3">时钟状态</span> 
    <div class="warp-host">
      <div id="warp1" class="warp wrap1" :style="'background-color:'+getColor(1, false)+';'" :data-degree="degree1">
        <div class="inner1" :style="'transform: rotate(' + degree11 + 'deg);background-color:' + getColor(1, true) +';'"></div>
        <div class="inner2" :style="'transform: rotate(' + degree12 + 'deg);background-color:' + getColor(1, true) +';'"></div>
        <div class="mask">{{ task1 > 0 ? task1 : '秒' }}</div>
      </div>
      <div id="warp2" class="warp wrap2" :style="'background-color:'+getColor(2, false)+';'" :data-degree="degree2">
        <div class="inner1" :style="'transform: rotate(' + degree21 + 'deg);background-color:' + getColor(2, true) +';'"></div>
        <div class="inner2" :style="'transform: rotate(' + degree22 + 'deg);background-color:' + getColor(2, true) +';'"></div>
        <div class="mask">{{ task2 > 0 ? task2 : '分' }}</div>
      </div>
      <div id="warp3" class="warp wrap3" :style="'background-color:'+getColor(3, false)+';'" :data-degree="degree3">
        <div class="inner1" :style="'transform: rotate(' + degree31 + 'deg);background-color:' + getColor(3, true) +';'"></div>
        <div class="inner2" :style="'transform: rotate(' + degree32 + 'deg);background-color:' + getColor(3, true) +';'"></div>
        <div class="mask">{{ task3 > 0 ? task3 : '时' }}</div>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import $ from 'jquery'

@Component
export default class AutoTimerStatus extends Vue {

  @Prop({default:0}) degree1 : Number;
  @Prop({default:0}) degree2 : Number;
  @Prop({default:0}) degree3 : Number;

  @Prop({default:0}) task1 : Number;
  @Prop({default:0}) task2 : Number;
  @Prop({default:0}) task3 : Number;

  @Prop({default:'#bbb'}) colorBackground1 : string;
  @Prop({default:'#888'}) colorForegound1 : string;
  @Prop({default:'#bbb'}) colorBackground2 : string;
  @Prop({default:'#888'}) colorForegound2 : string;
  @Prop({default:'#bbb'}) colorBackground3 : string;
  @Prop({default:'#888'}) colorForegound3 : string;

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

  


}
</script>

<style lang="scss">
$warp-width : 22px;

.warp-host {
  display: inline-block;
  width: ($warp-width + 3) * 3;
  height: $warp-width;
  position: relative;
}
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
    .mask {
      color: #0059ff;
      background-color: rgba(255,255,255,.5);
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
    transition: color,background-color ease-in-out .3s;
    color: #fff;
    height: $warp-width;
    line-height: $warp-width + 2;
    font-size: 14px;
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
</style>
