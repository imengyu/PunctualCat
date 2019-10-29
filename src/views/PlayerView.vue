<template>
  <div class="player-container">
    <div v-for="(musicItem,index) in playingItems" :key="index" class="controls">    
      <div class="btns">
        <a @click="playMusic(musicItem)" title="播放" href="javascript:;">
          <i class="fa fa-play" aria-hidden="true"></i>
        </a>
        <a @click="pauseMusic(musicItem)" title="暂停" href="javascript:;">
          <i class="fa fa-pause" aria-hidden="true"></i>
        </a>
        <a @click="stopMusic(musicItem)" title="停止播放" href="javascript:;" style="font-size: 16px;">
          <i class="fa fa-times" aria-hidden="true"></i>
        </a>
      </div>
      <div class="track">
        <span>{{ musicItem.playtime }}</span>
        <input type="range" v-model="musicItem.playProgress" 
          :style="'background:linear-gradient(to right, #0073bb, #0073bb ' + 
          (musicItem.playProgress*100) + '%, #cecece ' + (parseInt((musicItem.playProgress*100)) + 1) + 
          '%, #cecece)'" 
          @mousedown="trackMusicDown"
          @mouseup="trackMusicUp"
          min max />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { MusicItem, MusicAction } from "../model/MusicItem";

@Component
export default class PlayerView extends Vue {

  playingItems: Array<MusicItem> = [];

  addAndPlayMusic(item : MusicItem) { 
    if(!this.playingItems.contains(item))
      this.playingItems.push(item);
    item.play() 
  }
  playMusic(item : MusicItem) { item.play() }
  pauseMusic(item : MusicItem)  { item.pause() }
  stopMusic(item : MusicItem)  { item.stop(() => this.playingItems.remove(item)) }
  trackMusicDown(item : MusicItem) { item.tracking = true; }
  trackMusicUp(item : MusicItem) {
    item.tracking = false;
    item.seek(item.playProgress * item.audioDurtion);
  }

}
</script>

<style lang="scss">
.player-container {
  position: absolute;
  bottom: 0;
  top: 100px;
  right: 0;
  z-index: 100;
  background-color: transparent;
  width: 38%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  flex-direction: column;

  audio {
    width: calc(100% - 55px);
    height: 50px;
    display: none;
    transition: all linear 0.3s;
  }

  .controls {
    animation-duration: 0.35s;

    display: inline-flex;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    text-align: center;
    background-color: #fff;
    border-radius: 30px;
    color: #000;
    margin: 0;

    font-weight: bold;
    font-size: 14px;
    transition: all linear 0.3s;

    padding: 0 15px;

    align-items: center;
    justify-content: flex-start;

    .btns {
      display: inline-block;
      padding: 4px 10px;
      padding-left: 0;

      a {
        display: inline-block;
        width: 25px;
        height: 25px;
        line-height: 25px;
        text-align: center;
        margin-right: 3px;
        color: #0073bb;
      }
    }
    .track {
      display: inline-flex;
      align-items: center;

      span {
        padding: 0 6px;
      }

      input[type="range"] {
        -webkit-appearance: none;
        width: calc(100% - 100px);
        background-color: #cecece;
        border-radius: 10px;
        height: 4px;
        padding: 0;
        border: none;
        margin-left: 6px;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          background: #e9e9e9;
          border-radius: 15px;
          border: 5px solid #0073bb;
        }
        &:focus {
          outline: none;
        }
      }
    }
  }
  .text {
    animation-duration: 0.35s;
    display: inline-flex;
    position: absolute;
    cursor: pointer;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    text-align: center;
    background-color: transparent;
    border-radius: 30px;
    color: #000;
    margin: 0;

    font-weight: bold;
    font-size: 14px;
    transition: all linear 0.3s;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 15px;

    justify-content: flex-start;
    align-items: center;

    span {
      line-height: 42px;
      text-align: center;
      width: calc(100% - 30px);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .progress-bg {
      display: inline-block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #fff;
      z-index: -2;
    }
    .progress {
      display: inline-block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      background-color: #dcdcdca6;
      transition: all ease-in-out 0.3s;
      z-index: -1;
    }
  }

  .btn-round {
    outline: none;
    margin-left: 10px;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20class%3D%22icon%22%20viewBox%3D%220%200%201092%201024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2228%22%3E%3Cpath%20d%3D%22M630.673253%20512.00768L1075.339345%2095.022291c22.526836-21.263968%2022.526836-55.532064%200-76.796033l-2.423341-2.286815a60.924852%2060.924852%200%200%200-81.813373%200L546.402407%20433.470937%20101.668051%2015.768785a60.924852%2060.924852%200%200%200-81.847504%200L17.328942%2018.089732a51.231486%2051.231486%200%200%200%200%2076.727769l444.83675%20417.22431L17.397205%20929.095463a52.118907%2052.118907%200%200%200%200%2076.693638l2.423342%202.38921a60.924852%2060.924852%200%200%200%2081.847504%200l444.734356-417.087784%20444.700224%20416.985389a60.924852%2060.924852%200%200%200%2081.813373%200l2.525736-2.286815a52.118907%2052.118907%200%200%200%200-76.693638L630.60499%20511.939416l0.068263%200.068264z%22%20fill%3D%22%23ffffff%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E");
    background-color: #d36216;
    background-size: 14px;

    &:hover {
      background-color: #1f5ba8;
    }
  }
  .btn-add-music {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20class%3D%22icon%22%20viewBox%3D%220%200%201024%201024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2228%22%3E%3Cpath%20d%3D%22M488%20488V192a16%2016%200%200%201%2016-16h16a16%2016%200%200%201%2016%2016v296H832a16%2016%200%200%201%2016%2016v16a16%2016%200%200%201-16%2016H536V832a16%2016%200%200%201-16%2016h-16a16%2016%200%200%201-16-16V536H192a16%2016%200%200%201-16-16v-16a16%2016%200%200%201%2016-16h296z%22%20fill%3D%22%23ffffff%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E");
    background-color: #2c7fec;
    background-size: 26px;
  }
  .btn-music-list {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20class%3D%22icon%22%20viewBox%3D%220%200%201024%201024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2228%22%3E%3Cpath%20d%3D%22M535.8%20786.6c-16.5%200-33-2.9-49-8.6-36.1-13.1-64.9-39.4-81.2-74.1C372%20632%20403%20546.3%20474.7%20512.7c71.7-33.6%20157.5-2.6%20191.1%2069.1%2016.3%2034.8%2018.1%2073.8%205%20109.9-13.1%2036.1-39.4%2064.9-74.1%2081.2-19.4%209.1-40.1%2013.7-60.9%2013.7z%20m-0.1-243.5c-14.4%200-28.8%203.2-42.2%209.5-49.8%2023.3-71.3%2082.8-48%20132.6%2011.3%2024.1%2031.3%2042.4%2056.3%2051.4%2025%209.1%2052.1%207.8%2076.2-3.5s42.4-31.3%2051.4-56.3c9.1-25%207.8-52.1-3.5-76.2s-31.3-42.4-56.3-51.4c-11-4.2-22.5-6.1-33.9-6.1zM819.3%20574.3c-74.5-27-113.2-109.5-86.2-184l41.4%2015c-18.7%2051.7%208.1%20109%2059.8%20127.7l-15%2041.3z%22%20fill%3D%22%23ffffff%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M629.388%20676.656L733.115%20389.96l41.373%2014.969-103.727%20286.697zM195.2%20239h472.4v44H195.2zM195.2%20392.9h472.4v44H195.2zM195.2%20584.6h163.6v44H195.2z%22%20fill%3D%22%23ffffff%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E");
    background-color: #27cc71;
    background-size: 26px;
  }
  .btn-hide-ctl {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20class%3D%22icon%22%20viewBox%3D%220%200%201024%201024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2228%22%20height%3D%2228%22%3E%3Cpath%20d%3D%22M233.056%20941.472c-18.88%2017.856-18.88%2046.72%200.096%2064.48a50.624%2050.624%200%200%200%2068.608%200l489.856-460.288c9.568-8.864%2014.144-20.608%2014.144-32.288%200-0.992-0.512-1.824-0.576-2.752a40.48%2040.48%200%200%200-2.976-14.368c-0.672-1.504-1.984-2.592-2.816-4-2.176-3.84-4.384-7.808-7.808-11.136L301.728%2020.768a51.04%2051.04%200%200%200-68.608%200.064%2043.68%2043.68%200%200%200%200%2064.512l455.456%20428.032L233.024%20941.44z%20m0%200%22%20fill%3D%22%23ffffff%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E");
    background-color: #c0c0c0;
    background-size: 18px;
  }
}
</style>

