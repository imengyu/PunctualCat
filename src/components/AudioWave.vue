<template>
  <canvas id="waveCanvas"></canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { MusicItem } from '../model/MusicItem';
import { setTimeout } from 'timers';
import staticSettingsServices from '../services/SettingsServices';

@Component
export default class AudioWave extends Vue {

  canvas : HTMLCanvasElement = null;

  // 音频图的条数
  count = 800 / (10 + 2);
  voiceHeight : Uint8Array = null;
  ctx : CanvasRenderingContext2D;
  color : CanvasGradient;
  oW = 0;
  oH = 0;
  stopDrawStarted : boolean = false;
  stopDrawTimeout = null;

  currentMusic : MusicItem = null;
  running = false;

  mounted() {
    this.canvas = <HTMLCanvasElement>document.getElementById('waveCanvas');
  }

  public stopDrawMusic() { 
    if(!this.stopDrawStarted) {
      this.stopDrawStarted = true;
      let fadeMs = staticSettingsServices.getSettingNumber('player.fadeMs');
      this.stopDrawTimeout = setTimeout(() => {
        this.running = false; 
        this.currentMusic = null;
        this.clear();
        this.stopDrawStarted = false;
      }, fadeMs);
    }
  }
  public startDrawMusic(music : MusicItem) {

    this.currentMusic = music;
 
    if(this.stopDrawStarted) {
      clearInterval(this.stopDrawTimeout);
      this.stopDrawStarted = false;
    }

    if(music.oCtx == null){
      music.oCtx = new AudioContext();
      music.audioSrc = music.oCtx.createMediaElementSource(music.audio);
      music.analyser = music.oCtx.createAnalyser();
      music.audioSrc.connect(music.analyser);
      music.analyser.connect(music.oCtx.destination);
    }

    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.oW = this.canvas.width;
    this.oH = this.canvas.height;
    this.color = this.ctx.createLinearGradient(this.oW / 2, 20, this.oW / 2, this.oH);
    this.color.addColorStop(0, '#cc005f');
    this.color.addColorStop(.5, '#5800cc');
    this.color.addColorStop(1, '#0066ff');

    this.running = true;

    // 缓冲区:进行数据的缓冲处理，转换成二进制数据
    this.voiceHeight = new Uint8Array(music.analyser.frequencyBinCount);
    this.draw();
  }

  private clear() {
    if(this.ctx) this.ctx.clearRect(0, 0, this.oW, this.oH);
  }
  private draw() {
    if(this.running) {
      this.currentMusic.analyser.getByteFrequencyData(this.voiceHeight);

      var step = Math.round(this.voiceHeight.length / this.count);
      var space = 2;
      var width = this.oW / 2 / this.count - space;
      var height = 3;
      
      this.ctx.clearRect(0, 0, this.oW, this.oH);

      //
      //background-color: rgb(40, 150, 252);
      //background-color: rgb(230, 0, 180);
      //                      +190 -150 -137

      for (var i = 0; i < this.count; i++) {
        var audioPec = (this.voiceHeight[step * i] / 100);
        var audioPec2 = audioPec * 0.26;
        var audioHeight = audioPec * 160;
        var audioTop = this.oH - audioHeight;

        //this.ctx.fillStyle = 'rgb('+(200-audioPec*50)+','+(200-audioPec*150)+','+(200-audioPec*252)+')';
        this.ctx.fillStyle = 'rgb('+(audioPec*50)+','+(audioPec*150)+','+(audioPec*252)+')';

        this.ctx.fillRect(this.oW / 2 + (i * (width + space)), this.oH, width, -audioHeight);
        this.ctx.fillRect(this.oW / 2 - (i * (width + space)), this.oH, width, -audioHeight);

        //for(var j = this.oH; j > height && j > audioTop; j -= height + space)
        //  this.ctx.fillRect(this.oW / 2 + (i * (width + space)), j, width, height);
        //for(var j = this.oH; j > height && j > audioTop; j -= height + space)
        //  this.ctx.fillRect(this.oW / 2 - (i * (width + space)), j, width, height);
      }

      window.requestAnimationFrame(this.draw);
    }else this.clear();
  }
}

</script>

<style>
#waveCanvas {
  height: 60px;
}
</style>

