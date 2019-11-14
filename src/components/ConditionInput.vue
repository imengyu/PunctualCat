<template>
  <div 
    class="con-input"
    >
    <div class="con-html-host">
      <div class="con-stat">
        <el-popover
          v-if="conditionInputBuffer==''|| conditionValidStatus=='unknow'"
          placement="top-start" width="300" trigger="hover" slot="prepend">
          <span v-if="conditionInputBuffer==''">您没有定义播放条件，该条件 <b>不会被用于判断</b> </span>
          <i slot="reference" :class="'iconfont icon-tanhao'"></i>
        </el-popover>
        <el-popover
          v-else
          placement="top-start"
          width="300"
          trigger="hover"
          slot="prepend">
          <span v-if="conditionValidStatus=='success'">当前条件格式有效</span>
          <span v-else>
            当前条件格式存在错误，请检查：<br />
            <b>{{ conditionValidErr }}</b>
          </span>
          <i slot="reference" :class="'iconfont ' + (conditionValidStatus=='success' ? 'icon-chenggong text-success' : 'icon-shibai text-danger')"></i>
        </el-popover>   
      </div>
      <el-input 
        v-show="isInputMode"
        ref="conEditor"
        size="small"
        placeholder="请输入条件"
        v-model="conditionInputBuffer"
        @focus="isInputMode=true"
        @blur="submitInput()"
        @keydown.native.enter="submitInput()"
      ></el-input>
      <div v-show="!isInputMode" class="con-html" v-html="conditionHtmlBuffer" @click="isInputMode=true"></div>
    </div>    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { PlayCondition } from '../model/PlayCondition';
import { Input } from 'element-ui';
import { setTimeout } from 'timers';

@Component
export default class ConditionInput extends Vue {

  @Prop({default:null}) condition : PlayCondition;

  conditionInputBuffer = '';
  conditionHtmlBuffer = '';

  isInputMode = false;
  conditionValidStatus = 'unknow';
  conditionValidErr = '';

  mounted() {
    this.refeshStatc();
  }
  
  @Watch('isInputMode')
  onIsInputModeChange(is) { 
    if(is) setTimeout(() => {
      (<Input>this.$refs['conEditor']).focus();
    }, 300);
  }
  @Watch('condition')
  onConditionChange(newCondition) { this.refeshStatc() }

  refeshStatc() {
    this.refeshConHtml();
    this.conditionValidStatus = this.condition.conConvertStatus;
    this.conditionValidErr = this.condition.conConvertErr ? (this.condition.conConvertErr.message + ' 在：' + 
        this.condition.conConvertErr.currentConString + ' (位置：' + 
        this.condition.conConvertErr.currentIndex + ')') : '';
    this.conditionInputBuffer = this.condition.toConditionString();
  }
  refeshConHtml() {
    this.conditionHtmlBuffer = this.condition.toConditionHtml();
    if(this.conditionHtmlBuffer == '')
      this.conditionHtmlBuffer = '未定义条件';
  }
  submitInput() {
    if(this.condition.toConditionList(this.conditionInputBuffer)) {
      this.isInputMode = false;
      this.conditionValidStatus = this.condition.conConvertStatus;
      this.conditionValidErr = '';
      this.refeshConHtml();
    }else {
      this.conditionValidErr = this.condition.conConvertErr ? (this.condition.conConvertErr.message + ' 在：' + 
        this.condition.conConvertErr.currentConString + ' (位置：' + 
        this.condition.conConvertErr.currentIndex + ')') : '';
      this.conditionValidStatus = this.condition.conConvertStatus;
    }
  }
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.con-input {

  position: relative;

  .con-stat {
    display: inline-block;
    width: 40px;
    background-color: #F5F7FA;
    vertical-align: middle;
    text-align: center;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border: 1px solid #DCDFE6;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;

    span, i {
      user-select: none;
      &:focus {
        outline: none;
      }
    }
  }
  .con-html {
    display: inline-block;
    overflow: hidden;
    word-break: keep-all;
    overflow-y: scroll;
    width: calc(100% - 41px);
    vertical-align: middle;
    padding: 0 6px;
    margin-left: 41px;

    @include pc-fix-scrollbar-white();
  }
  .el-input {
    display: inline-block;
    width: calc(100% - 41px);
    margin-left: 41px;

    input {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .con-html-host {
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    height: 32px;
    line-height: 32px;
  }
}
.con-span {
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px;
  color: #fff;
}
.con-span-logic {
  font-size: 12px;
  border-radius: 50%;
  margin: 0 5px;
}

.con-group {
  border-radius: 6px;
  background-color: white;
  border: 1px solid #4284ff;
  padding: 3px 8px 4px 8px;
}

.con-span-to {
  border-radius: 6px;
  padding: 3px;
  margin: 0 6px;
  font-size: 12px;
  background-color: #505050;
  color: #fff;
}

.con-none {
  font-size: 12px;
  color: #888;
}

.con-span-date {
  background-color: #4e83e6;
}
.con-span-date-range{
  background-color: #15aab4;
}
.con-span-time{
  background-color: #0aaa52;
}
.con-span-week {
  background-color: #d81b73;
}
.con-span-week-range {
  background-color: #CC3399;
}

.con-or {
  background-color: #009999;
}
.con-and {
  background-color: #6d9c10;
}
.con-not {
  background-color: #db5800;
}
</style>