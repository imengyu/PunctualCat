<template>
  <canvas id="waveCanvas"></canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { MusicItem } from '../model/MusicItem';

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

  currentMusic : MusicItem = null;
  running = false;

  mounted() {
    this.canvas = <HTMLCanvasElement>document.getElementById('waveCanvas');
  }

  public stopDrawMusic() { 
    this.running = false; 
    this.currentMusic = null;
    this.clear();
  }
  public startDrawMusic(music : MusicItem) {

    this.currentMusic = music;

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
    this.ctx.clearRect(0, 0, this.oW, this.oH);
  }
  private draw() {
    if(this.running) {
      this.currentMusic.analyser.getByteFrequencyData(this.voiceHeight);

      var step = Math.round(this.voiceHeight.length / this.count);
      var space = 2;
      var width = this.oW / 2 / this.count - space;
      var height = 3;
      
      this.ctx.clearRect(0, 0, this.oW, this.oH);
      
      for (var i = 0; i < this.count; i++) {
        var audioHeight = (this.voiceHeight[step * i] / 30) * 50;
        var audioTop = this.oH - audioHeight;

        this.ctx.fillStyle = this.color;

        for(var j = this.oH; j > height && j > audioTop; j -= height + space)
          this.ctx.fillRect(this.oW / 2 + (i * (width + space)), j, width, height);
        for(var j = this.oH; j > height && j > audioTop; j -= height + space)
          this.ctx.fillRect(this.oW / 2 - (i * (width + space)), j, width, height);
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

