<template>
  <div class="main-container p-0">
    <iframe :src="getDocsPath()" id="help-iframe"></iframe>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";

@Component
export default class HelpView extends Vue {
  getDocsPath() {
    return window.appDir + '/docs.html';
  }
}
</script>

<style lang="scss">
#help-iframe {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: calc(100% - 20px);
  border: none;
  overflow: hidden;
}
</style>


