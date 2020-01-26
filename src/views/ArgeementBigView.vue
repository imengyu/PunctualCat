<template>
  <div class="main-container p-0">
    <argeement-view id="argeement-view" />
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import ArgeementView from "./ArgeementView.vue";

@Component({
  components: {
    'argeement-view': ArgeementView
  }
})
export default class ArgeementBigView extends Vue {}
</script>

<style scoped>
#argeement-view {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  bottom: 10px;
}
</style>



