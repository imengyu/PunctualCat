<template>
  <div class="music-container scroll-fix">
          
    <div v-if="choodeMode=='none'" class="music-title">
      <span class="text-secondary">您可以添加一些常用的音乐在此列表中快速进行播放</span>
      <el-tooltip effect="dark" content="添加音乐" placement="right" :visible-arrow="false">
        <div v-if="items && items.length > 0" class="btn-add round" @click="addMusicsToHistoryList()"></div>
      </el-tooltip>
    </div>
    <div v-else-if="choodeMode=='one'||choodeMode=='multiple'" class="music-title">
      <span class="text-secondary">在这里选择你需要的音乐</span>
      <div v-if="choodeMode=='multiple'" style="text-align: center; margin: 0">
        <el-button size="mini" type="text" @click="chooseMultipleMusicEnd(false)">取消</el-button>
        <el-button type="primary" size="mini" @click="chooseMultipleMusicEnd(true)">确定</el-button>
      </div>
    </div>
    <div v-if="choodeMode=='none'">
      <ul v-if="items && items.length > 0" class="music-list">
        <li v-for="(item, index) in items" :key="index" @dblclick="itemClick(item, 'play');" :class="item.status">
          <span :title="item.fullPath">{{ item.name }} </span>
          <div class="btn-round icon-delete" title="删除" @click="itemClick(item, 'delete')"></div>
          
          <div v-if="!item.loading && (item.status == 'notload' || item.status == 'normal')" class="btn-round icon-loop" title="循环播放" @click="itemClick(item, 'looplay');"></div>
          <div v-else-if="(item.status == 'playing' || item.status == 'paused')" class="btn-round icon-stop" title="停止播放" style="background-size: 19px;" @click="itemClick(item, 'stop');"></div>

          <div v-if="!item.loading && (item.status == 'notload' || item.status == 'normal' || item.status == 'paused')" class="btn-round icon-play" style="background-position-x: 8px;" title="播放" @click="itemClick(item, 'play');"></div>
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
            <span class="time">{{ item.playtimeString }}</span>
            <el-popover
              
              class="volume"
              placement="top"
              width="150"
              trigger="click">
              <el-slider class="el-slider-small" :format-tooltip="(val) => { return parseInt(val*100) + '%' }" v-model="item.volume" :max="1" :step="0.01" @input="(val)=>item.changeVolume(item,val)" ></el-slider>
              <a slot="reference" href="javascript:;" title="设置音乐的音量"><i :class="'fa ' + (item.volume == 0 ? 'fa-volume-off' : (item.volume == 1 ? 'fa-volume-up' : 'fa-volume-down'))" aria-hidden="true"></i></a>
            </el-popover>
          </div>
        </li>
      </ul>
      <div v-else class="music-none-view">
        <label>空空如也~ (‾◡‾)<br>这里一首音乐都没有</label>
        <el-button class="mt-3" type="primary" @click="addMusicsToHistoryList()" round>添加音乐</el-button>
      </div>
    </div>
    <div v-else>
      <ul v-if="items && items.length > 0" class="music-list">
        <li v-for="(item, index) in items" :key="index" @click="itemChoose(item)" :class="item.status">
          <span :title="item.fullPath">{{ item.name }} </span>
          <el-checkbox v-model="item.choosed" class="round single" title="选择" @click="itemChoose(item)"></el-checkbox>
        </li>
      </ul>
      <div v-else class="music-none-view">
        <label>空空如也~ (‾◡‾)<br>这里一首音乐都没有</label>
        <el-button class="mt-3" type="primary" @click="addMusicsToHistoryList()" round>添加音乐</el-button>
      </div>
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

  chooseMode : 'none'|'one'|'multiple' = 'none';
  chooseOneMusicCallback : (musicPath : MusicItem) => void = null;
  chooseMultiplMusicCallback : (musicPath : MusicItem[]) => void = null;

  itemChoose(item : MusicItem) {
    if(this.chooseMode == 'one'){
      this.chooseOneMusicCallback(item);
      this.endChoodeMusic();
    }
    else if(this.chooseMode == 'multiple')
      item.choosed = true;
  }
  unCheckAllMusic() {
    this.items.forEach(element => {
      element.choosed = false;
    });
  }
  chooseMultipleMusicEnd(sure : boolean) {
    let choosedMusicPaths = [], i = 0;
    for(;i < this.items.length; i++) {
      if(this.items[i].choosed)
        choosedMusicPaths.push(this.items[i]);
    }
    this.chooseMultiplMusicCallback(choosedMusicPaths);
    this.unCheckAllMusic();
    this.endChoodeMusic();
  }
  startChooseMultipleMusic(callback : (musicPath : MusicItem[]) => void) {
    this.chooseMultiplMusicCallback = callback;
    this.chooseMode = 'multiple';
    this.unCheckAllMusic();
  }
  startChooseOneMusic(callback : (musicPath : MusicItem) => void) {
    this.chooseOneMusicCallback = callback;
    this.chooseMode = 'one';
    this.unCheckAllMusic();
  }
  endChoodeMusic(){
    this.chooseMode = 'none';
    this.$emit('choosed');
  }
}

</script>
