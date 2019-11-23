<template>
  <div class="voice-view" tabindex="0" @blur="onBlur">
    <div class="block">
      <span class="demonstration">软件音量</span>
      <el-slider v-model="volumeSoft"></el-slider>
    </div>
    <div class="block">
      <span class="demonstration">系统音量</span>
      <el-slider v-model="volumeSystem" :min="0" :max="100" :disabled="!systemVolMgrCanuse"></el-slider>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import SettingsServices from '../services/SettingsServices'
import $ from 'jquery'
import Win32Utils from "../utils/Win32Utils";

@Component
export default class VoiceView extends Vue {


  @Prop({default:false}) show : boolean;
  systemVolMgrCanuse = false;

  volumeSoft = 50;
  volumeSystem = 50;
  volumeSystemChangeLock = false;

  @Watch('volumeSoft')
  onVolumeSoftChanged(newV) {
    this.$emit('volume-soft-changed', newV);
  }
  @Watch('volumeSystem')
  onVolumeSystemChanged(newV) {
    if(this.volumeSystemChangeLock) {
      this.volumeSystemChangeLock = false;
      return;
    }
    this.$emit('volume-system-changed', newV);
  }
  @Watch('show')
  onShowChanged(newV){
    if(newV){
      $('.voice-view').focus();
    }
  }

  onBlur(){
    this.$emit('update:show', false);
  }
  mounted() {
    SettingsServices.addListener('load', () => {
      this.volumeSoft = Math.floor(SettingsServices.getSettingNumber('player.volume') * 100);
      this.systemVolMgrCanuse = Win32Utils.getSystemVolManagerStatus();
      this.volumeSystemChangeLock = true;
      if(this.systemVolMgrCanuse) this.volumeSystem = Win32Utils.getSystemVolume();
    })
  }

}

</script>

<style lang="scss">
.voice-view {
  position: absolute;
  width: 300px;
  background-color: #fff;
  border-radius: 5px;
  border: 1px solid #efefef;
  box-shadow: 0 2px 28px 0 rgba(0, 0, 0, 0.06);
  overflow: visible;
  z-index: 2001;
  padding: 20px;
  outline: none;

  .block {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .el-slider {
      display: inline-block;
      width: calc(100% - 130px);
    }
    .demonstration {
      display: inline-block;
      font-size: 15px;
      color: #888;
      width: 100px;
    }
  }

  &::after {
    display: inline-block;
    content: '';
    position: absolute;
    border-width: 12px;
    border-style: solid;
    border-color: transparent;
    border-bottom-color: #fff;
    width: 0;
    height: 0;
    top: -24px;
    right: 128px;
  }
}
</style>

