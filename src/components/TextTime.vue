<template>
  <div class="text-time">
    <h1>{{ timeNow }}</h1>
    <div class="text-date" @click="handleDateClick">
      <span>{{ dateNow }} </span><span class="small">{{ dateNowLunar }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getLunarDay } from '../utils/date-utils'
@Component
export default class TextTime extends Vue {

  name = 'text-time';

  timeNow = '';
  dateNow = '';
  dateNowLunar = '';
  timer = null;

  @Prop({ default: false }) expanded : boolean;

  mounted() {
    window.addEventListener('focus', this.addUpdateTick);
    window.addEventListener('blur', this.removeUpdateTick);
    this.updateTimeText('all');
  }
  beforeDestroy() {
    window.removeEventListener('focus', this.addUpdateTick);
    window.addEventListener('blur', this.removeUpdateTick);
    this.removeUpdateTick();
  }

  addUpdateTick() {
    this.timer = setInterval(this.updateTick, 1000);
  }
  removeUpdateTick() {
    clearInterval(this.timer);
  }
  updateTimeText(type : 'all'|'tick') {
    let now = new Date();
    if(type != 'tick') {
      this.dateNow = now.format('YYYY 年 MM 月 DD 日');
      this.dateNowLunar = getLunarDay(now.getFullYear(), now.getMonth(), now.getDate());
    }
    this.timeNow = now.format('HH:ii:ss');
  }
  updateTick() {
    this.updateTimeText('tick');
  }
  update() {
    this.updateTimeText('all');
  }

  handleDateClick() {
    this.$emit('date-click');
  }
}

</script>

<style lang="scss">
.text-time {
 
  position: relative;
  display: inline-block;
  padding: 15px;
  padding-left: 20px;

  h1 {
    margin: 0;
    padding: 0;
    text-align: left;
    color: rgb(0, 77, 153);
    font-family: "FaktPro-Hair";
    font-size: 50px;
    height: 50px;
  }

  .text-date {
    color: #fff;
    opacity: .8;
    transition: all ease-in-out .3s;
    display: block;
    background-color: rgb(0, 128, 255);
    padding: 2px 16px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 3px;

    &:hover {
      box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.3)
    }

    .small {
      font-size: 12px;
      margin-left: 5px;
    }

  }
}


</style>


<style>

</style>