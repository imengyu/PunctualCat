<template>
  <div class="log-container scroll-fix-white" id="log-list">
    <div class="log-title">
      <span class="text-secondary">此处显示的是自程序运行到现在的所有事件日志，您可以根据日志来排查错误</span>
      <el-tooltip v-if="logPools && logPools.length > 0" content="清空日志" placement="right">
        <div class="btn-add round no-background" @click="clearAllLog">
          <i class="iconfont icon-shanchu2"></i>
        </div>
      </el-tooltip>
    </div>
    <ul v-if="logPools" class="log-list">
      <li v-for="(log, index) in logPools" :key="index" :id="'log-item-'+log.uid" :class="log.type">
        <h5>
          <a v-if="log.childs && log.childs.length > 0" :title="(log.showChilds?'收起子日志条目':'展开子日志条目')"
            href="javascript:;" :class="'expand-button'+(log.showChilds?' expand':'')" 
            @click="log.showChilds=!log.showChilds">
            <i class="iconfont icon-cebianlanzhankai"></i>
          </a>
          <i v-if="log.type=='error'" class="iconfont icon-roundclose text-danger"></i>
          <i v-else-if="log.type=='info'" class="iconfont icon-info text-primary"></i>
          <i v-else-if="log.type=='warn'" class="iconfont icon-warn text-warning"></i>
          <i v-else-if="log.type=='success'" class="iconfont icon-roundcheck text-success"></i>
          <span v-if="log.showTime" class="time">{{ log.time }}</span>
          <span v-html="log.title"></span>
          <a v-if="log.text!=''" :title="(log.showText?'收起详细信息':'展开详细信息')"
            href="javascript:;" class="expand-button-v" 
            @click="log.showText=!log.showText">
            <i :class="'iconfont ' + (log.showText?'icon-shanchu1':'icon-tianjia')"></i>
          </a>
        </h5>
        <p v-if="log.text!='' && log.showText" v-html="log.text"></p>
        <ul v-if="log.showChilds && log.childs && log.childs.length > 0">
          <li v-for="(logChild, index2) in log.childs" :key="index2" :id="'log-item-'+logChild.uid" :class="logChild.type">
            <h5>
              <i v-if="logChild.type=='error'" class="iconfont icon-roundclose text-danger"></i>
              <i v-else-if="logChild.type=='info'" class="iconfont icon-info text-primary"></i>
              <i v-else-if="logChild.type=='warn'" class="iconfont icon-warn text-warning"></i>
              <i v-else-if="logChild.type=='success'" class="iconfont icon-roundcheck text-success"></i>
              <span v-if="logChild.showTime" class="time">{{ log.time }}</span>
              <span v-html="logChild.title"></span>
              <a v-if="logChild.text!=''" :title="(logChild.showText?'收起详细信息':'展开详细信息')"
                href="javascript:;" class="expand-button-v" 
                @click="logChild.showText=!logChild.showText">
                <i :class="'iconfont ' + (logChild.showText?'icon-shanchu1':'icon-tianjia')"></i>
              </a>
            </h5>
            <p v-if="logChild.text!='' && logChild.showText" v-html="logChild.text">=</p>
          </li> 
        </ul>
      </li>
      <li v-if="currentLogIndex>0" class="load-more" @change="loadLogItem">点击加载更早的日志</li>
      <li v-else-if="logPools.length > 0" class="no-more">到底啦</li>
      <li v-else class="no-more">没有更多日志了</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { UserLog, UserLogService, staticUserLogService } from "../services/UserLogService";
import App from "../App.vue";
import { setTimeout } from "timers";

@Component
export default class LogView extends Vue {
  
  @Prop({ default:null }) app : App;

  logService : UserLogService = null;
  logPools : Array<UserLog> = null;
  logPageLength = 20;
  currentLogIndex = 0;

  mounted() {
    this.logService = staticUserLogService;
    this.currentLogIndex = this.logService.logs.length > 0 ? this.logService.logs.length - 1 : 0;
    this.loadLogItem();
    this.logService.addListener('write', (log : UserLog, parent : UserLog) => {
      if(!parent) this.logPools.splice(0, 0, log);
    });
    this.logService.addListener('clear', () => {
      this.currentLogIndex = 0;
       this.logPools = []
    });
  }

  loadLogItem() {
    if(this.currentLogIndex > 0){
      this.logPools = [];
      for(var i = this.currentLogIndex, c = 0; 
        i >= 0 && c < this.logPageLength; i--, c++, this.currentLogIndex--) {
          this.logPools.push(this.logService.logs[i]);
      }
    }
  }
  locateItem(logItem : UserLog) {
    if(!logItem.showChilds)logItem.showChilds = true;
    let ele = $('#log-item-' + logItem.uid).addClass('show-here');
    if(ele) { 
      $("#log-list").animate({ scrollTop: ele.eq(0).offset().top }, 500 );
      let timer = setInterval(() => ele.toggleClass('show-here'), 300);
      setTimeout(() => { 
        ele.removeClass('show-here');
        clearInterval(timer);
      }, 2400);
    }
  }

  clearAllLog() {
    this.$confirm('您确定要清除所有日志吗？', '提示', { showClose: false })
      .then(() => this.logService.clearLog()).catch(() => {})
  }

}

</script>

<style lang="scss">
.log-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 20px;

  span {
    width: calc(100% - 50px);
  }
}
.log-container {
  position: absolute;
  top: 60px;
  right: 6px;
  bottom: 10px;
  left: 0;
  overflow-y: scroll;

  .log-list {

    list-style: none;
    padding: 0;
    margin: 0;

    li {
      list-style: none;
      padding: 4px 8px;
      margin: 0;
      min-height: 20px;
      border: 2px solid transparent;
      transition: all ease-in-out .3s;

      h5 {
        position: relative;
        display: flex;
        margin: 0;
        font-size: 14px;
        justify-content: flex-start;
        align-content: center;
        align-items: center;
        font-weight: normal;

        i {
          margin-right: 5px;
          font-size: 18px;
        }
        .time {
          margin-right: 5px;
          font-size: 12px;
          background-color: #e6e6e6;
          color: #444;
          padding: 1px 7px;
          border-radius: 10px;
        }
        span {
          height: 100%;
        }

        .expand-button {

          color: #000;
          width: 20px;
          height: 20px;
          line-height: 20px;
          text-align: center;
          margin-right: 6px;

          i {
            display: inline-block;
            font-size: 16px;
            font-weight: bold;
            transition: all ease-in-out .3s;
            transform: rotate(0deg);
          }

          &.expand {
            i {
              transform: rotate(90deg);
            }
          }
        }
        .expand-button-v {

          color: #0061bb;
          width: 20px;
          height: 20px;
          line-height: 20px;
          text-align: center;
          margin-left: 10px;

          i {
            font-size: 16px;
            font-weight: bold;
          }
        }
      }
      p {
        margin: 0;
        margin-top: 3px;
        padding-top: 3px;
        padding-left: 25px;
        border-top: 1px solid #ececec;
        color: #888;
        font-size: 12px;
      }

      ul {
        list-style: none;
        padding-left: 5px;
        margin-top: 5px;
      }

      &.show-here {
        border: 2px solid #0067c7;
      }

      &.error {
        color: #dc3545
      }
      &.success {
        color: #28a745
      }
      &.warn {
        color: #ffc107
      }
      &.info {
        color: #007bff
      }
    }

    .load-more {
      height: 40px;
      line-height: 40px;
      text-align: center;
      color: #888;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        color: #0067c7;
      }
    }
    .no-more {
      height: 40px;
      color: #888;
      line-height: 40px;
      text-align: center;
      font-size: 12px;
    }
  }
}
</style>

