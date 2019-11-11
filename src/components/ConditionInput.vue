<template>
  <div 
    class="con-input"
    >
    <el-input 
      v-if="isInputMode"
      size="small"
      v-model="conditionInputBuffer"
      @focus="isInputMode=true"
    >
      <el-popover
        v-if="conditionInputBuffer==''"
        placement="top-start" width="300" trigger="hover" slot="prepend">
        <span>您没有定义播放条件，该列表/任务 <b>不会自动播放</b> </span>
        <el-button slot="reference"><i :class="'iconfont icon-tanhao'"></i></el-button>
      </el-popover>
      <el-popover
        v-else
        placement="top-start"
        width="300"
        trigger="hover"
        slot="prepend">
        <span v-if="conditionValid">当前条件格式有效</span>
        <span v-else>
          当前条件格式存在错误，请检查：<br />
          <b>{{ conditionValidErr }}</b>
        </span>
        <el-button slot="reference">
          <i :class="'iconfont ' + (conditionValid ? 'icon-chenggong text-success' : 'icon-shibai text-danger')"></i>
        </el-button>
      </el-popover>
      <el-button slot="append" title="保存条件修改" @click="submitInput"><i class="iconfont icon-icon_right text-success"></i></el-button>
      <el-button slot="append" title="放弃修改" @click="cancelInput"><i class="iconfont icon-icon_wrong text-danger"></i></el-button>
    </el-input>
    <div v-else class="con-html-host">
      <div class="con-stat">
        <el-popover
          v-if="conditionInputBuffer==''"
          placement="top-start" width="300" trigger="hover" slot="prepend">
          <span>您没有定义播放条件，该列表/任务 <b>不会自动播放</b> </span>
          <i slot="reference" :class="'iconfont icon-tanhao'"></i>
        </el-popover>
        <el-popover
          v-else
          placement="top-start"
          width="300"
          trigger="hover"
          slot="prepend">
          <span v-if="conditionValid">当前条件格式有效</span>
          <span v-else>
            当前条件格式存在错误，请检查：<br />
            <b>{{ conditionValidErr }}</b>
          </span>
          <i slot="reference" :class="'iconfont ' + (conditionValid ? 'icon-chenggong text-success' : 'icon-shibai text-danger')"></i>
        </el-popover>
        
      </div>
      <div class="con-html" v-html="conditionHtmlBuffer"></div>
      <div @click="isInputMode=true" class="con-edit"><i class="iconfont icon-chuangzuo"></i></div>
    </div>    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { PlayCondition } from '../model/PlayCondition';

@Component
export default class ConditionInput extends Vue {

  @Prop({default:null}) condition : PlayCondition;

  conditionInputBuffer = '';
  conditionHtmlBuffer = '';

  isInputMode = false;
  conditionValid = false;
  conditionValidErr = '';

  mounted() {
    this.refeshStatc();
  }
  
  @Watch('condition')
  onConditionChange(newCondition) { this.refeshStatc() }

  refeshStatc() {
    this.refeshConHtml();
    this.conditionValid = this.condition.conConvertStatus == 'success';
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
      this.conditionValid = true;
      this.conditionValidErr = '';
      this.refeshConHtml();
    }else {
      this.conditionValidErr = this.condition.conConvertErr ? (this.condition.conConvertErr.message + ' 在：' + 
        this.condition.conConvertErr.currentConString + ' (位置：' + 
        this.condition.conConvertErr.currentIndex + ')') : '';
      this.conditionValid = false;
    }
  }
  cancelInput() { this.isInputMode = false; this.refeshConHtml(); }
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.con-input {

  .el-input {
    
  }

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
  }
  .con-html {
    display: inline-block;
    overflow: hidden;
    word-break: keep-all;
    overflow-y: scroll;
    width: calc(100% - 83px);
    vertical-align: middle;
    padding: 0 6px;
    margin-left: 41px;

    @include pc-fix-scrollbar-white();
  }

  .con-html-host {
    border: 1px solid #DCDFE6;
    border-radius: 4px;
  }

  .con-edit {
    display: inline-block;
    width: 40px;
    background-color: #F5F7FA;
    vertical-align: middle;
    text-align: center;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    cursor: pointer;
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
  background-color: #6495ed;
}
.con-span-date-range{
  background-color: #19b8c4;
}
.con-span-time{
  background-color: #49ce85;
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
  background-color: #99CC33;
}
.con-not {
  background-color: #e25a00;
}
</style>