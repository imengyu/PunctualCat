<template>
  <div class="text-time">
    <div class="text-bigger">
      <h1>{{ timeNow }}</h1>
      <div class="dsl">
        <span class="date">{{ dateNow }}</span>
        <span class="week">{{ weekNow }}</span>
      </div>
    </div>
    <div class="text-date" @click="handleDateClick">
      <el-tooltip class="item" effect="dark" content="打开日历面板" placement="bottom" :visible-arrow="false">
        <span>
          <small>阳历</small><b class="ml-1">{{ dateNow }}</b>
          <small class="ml-2">农历</small><b class="ml-1">{{ dateNowLunar }}</b>
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getLunarDay, getWeekStr } from '../utils/DateUtils'
@Component
export default class TextTime extends Vue {

  name = 'text-time';

  timeNow = '';
  dateNow = '';
  weekNow = '';
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
      this.weekNow = getWeekStr(now.getDay());
      this.dateNow = now.format('YYYY/MM/DD');
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

  .text-bigger {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      padding: 0;
      text-align: left;
      color: #004d99;
      font-family: "FaktPro-Hair";
      font-size: 50px;
      height: 50px;
      display: inline-block;
    }
    .dsl {
      display: inline-block;
       color: #004d99;

      .date {
        font-size: 16px;
        line-height: 15px;
        font-weight: bold;
        display: block;
        font-family: "FaktPro-Hair";
      }
      .week {
        font-size: 15px;
        font-weight: bold;
        display: block;
      }
    }
  }
  

  .text-date {
    color: #fff;
    opacity: .8;
    transition: all ease-in-out .3s;
    display: block;
    background-color: rgb(0, 128, 255);
    padding: 2px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 3px;
    width: 285px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;

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