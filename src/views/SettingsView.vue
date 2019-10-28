<template>
  <div class="main-area settings-area overflow-visible">
    <div class="main-container p-3 shadow-none overflow-visible">
      <div class="left-fix-layer"></div>
      <div class="shadow-fix-layer"></div>
      <el-tabs tab-position="left">
        <el-tab-pane>
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shezhi"></i> 全局设置</span>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-yanchu"></i> 播放设置</span>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-anquan"></i> 安全设置</span>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-shuju"></i> 数据管理</span>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label" class="tab-icon-item"><i class="iconfont icon-bangzhu"></i> 关于软件</span>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="bottom-area d-flex justify-content-end align-items-center pr-4">
      <el-button type="primary" size="small" round>保存并应用设置</el-button>
      <el-button size="small" round>恢复默认设置</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";

@Component({
  components: {

  }
})
export default class SettingsView extends Vue {

}

</script>

<style lang="scss">
.settings-area {

  .left-fix-layer {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 155px;
    background-color: #f1f1f1;
  }
  .shadow-fix-layer {
    position: absolute;
    left: 150px;
    top: 0;
    bottom: 0;
    right: 0;
    background-color: #fff;
    box-shadow: -2px 0 10px 0px rgba(0, 0, 0, 0.08);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .tab-icon-item{

    display: inline-flex;
    justify-content: center;
    align-items: center;
    align-content: center;
    font-size: 16px;

    i {
      font-size: 22px;
      margin-right: 10px
    }
  }

  .el-tabs__nav-wrap::after {
    display: none;
  }

  .el-tabs__item {
    padding-left: 7px;
    height: 36px;
    line-height: 36px;
    font-size: 16px;
  }
}
</style>


