<template>
  <div class="main-area">
    <div class="main-container">
      <el-tabs tab-position="left">
        <el-tab-pane label="全局设置"></el-tab-pane>
        <el-tab-pane label="播放设置"></el-tab-pane>
        <el-tab-pane label="安全设置"></el-tab-pane>
        <el-tab-pane label="数据管理"></el-tab-pane>
        <el-tab-pane label="关于软件"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="bottom-area">
      <el-button type="primary">保存并应用设置</el-button>
      <el-button>恢复默认设置</el-button>
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


