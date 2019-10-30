<template>
  <div class="music-container scroll-fix">
          
    <el-tooltip effect="dark" content="添加音乐" placement="right" :visible-arrow="false">
      <div v-if="items && items.length > 0" class="btn-add round float-right" @click="addMusicsToHistoryList()"></div>
    </el-tooltip>
    <span class="text-secondary">您可以添加一些常用的音乐在此列表中快速进行播放</span>

    <ul v-if="items && items.length > 0" class="music-list">
      <li v-for="(item, index) in items" :key="index" @dblclick="itemClick(item, 'play');" :class="item.status">
        <span :title="item.fullPath">{{ item.name }} </span>
        <div class="btn-round icon-delete" title="删除" @click="itemClick(item, 'delete')"></div>
        
        <div v-if="!item.loading && (item.status == 'notload' || item.status == 'normal')" class="btn-round icon-loop" title="循环播放" @click="itemClick(item, 'looplay');"></div>
        <div v-else-if="(item.status == 'playing' || item.status == 'paused')" class="btn-round icon-stop" title="停止播放" style="background-size: 19px;" @click="itemClick(item, 'stop');"></div>

        <div v-if="!item.loading && (item.status == 'notload' || item.status == 'normal' || item.status == 'paused')" class="btn-round icon-play" title="播放" @click="itemClick(item, 'play');"></div>
        <div v-else-if="(item.status == 'playing')" class="btn-round icon-pause" title="暂停" style="background-size: 13px;" @click="itemClick(item, 'pause');"></div>
        <div v-else-if="item.loading" class="btn-round" title="正在加载，请稍后">
          <i class="fa fa-circle-o-notch fa-spin"></i>
        </div>
        
        <div v-if="item.status == 'playing' || item.status == 'paused'" class="track">
          
          <input type="range" v-model="item.playtime" 
            :style="'background:linear-gradient(to right, #0073bb, #0073bb ' + 
            (item.playProgress*100) + '%, #cecece ' + (parseInt((item.playProgress*100)) + 1) + 
            '%, #cecece)'" 
            @mousedown="trackMusicDown(item)"
            @mouseup="trackMusicUp(item)"
            :min="0" :max="item.audioDurtion" />
          <span>{{ item.playtimeString }}</span>
        </div>
      </li>
    </ul>
    <div v-else class="music-none-view">
      <label>空空如也~ (‾◡‾)<br>这里一首音乐都没有</label>
      <el-button class="mt-3" type="primary" @click="addMusicsToHistoryList()" round>添加音乐</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { MusicItem, MusicAction } from '../model/MusicItem'

@Component
export default class MusicView extends Vue {

  @Prop({default:null})
  items : Array<MusicItem>;

  itemClick(item : MusicItem, mode : MusicAction) {
    this.$emit('item-click', item, mode);
  }
  addMusicsToHistoryList() {
    this.$emit('add-music');
  }
  trackMusicDown(item : MusicItem) { item.tracking = true; }
  trackMusicUp(item : MusicItem) {
    item.tracking = false;
    item.seek(item.playtime);
    if(item.status == 'paused') item.play();
  }
}

</script>
