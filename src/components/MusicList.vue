<template>
  <div class="music-container scroll-fix">
          
    <el-tooltip class="item" effect="dark" content="添加音乐" placement="right" :visible-arrow="false">
      <div v-if="items && items.length > 0" class="btn-add round float-right" @click="addMusicsToHistoryList()"></div>
    </el-tooltip>
    <span class="text-secondary">您可以添加一些常用的音乐在此列表中快速进行播放</span>

    <ul v-if="items && items.length > 0" class="music-list">
      <li v-for="(item, index) in items" :key="index" @dblclick="itemClick(item, 'play');">
        <span :title="item">{{ item.name }} </span>
        <div class="btn-round icon-delete" title="删除" @click="itemClick(item, 'delete')"></div>
        <div class="btn-round icon-play" title="播放" @click="itemClick(item, 'play');"></div>
        <div class="btn-round icon-loop" title="循环播放" @click="itemClick(item, 'looplay');"></div>
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
export default class SettingsView extends Vue {

  @Prop({default:null})
  items : Array<MusicItem>;

  itemClick(item : MusicItem, mode : MusicAction) {
    this.$emit('item-click', item, mode);
  }
  addMusicsToHistoryList() {
    this.$emit('add-music');
  }

}

</script>
