<template>
  <div class="sort-icon" @click="onClick">
    <i v-if="prop==thisProp && order=='descending'" title="降序排列" class="fa fa-caret-up"></i>
    <i v-else-if="prop==thisProp && order=='ascending'" title="升序排列" class="fa fa-caret-down"></i>
    <i v-else class="nosort fa fa-sort" title="排序"></i>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TextTime extends Vue {

  @Prop({ default: '' }) order : string;
  @Prop({ default: '' }) thisProp : string;
  @Prop({ default: '' }) prop : string;

  onClick() {
    this.$emit('updateSort', this.thisProp, this.order == 'descending' ? 'ascending' : 'descending');
  }
}

</script>

<style lang="scss">
.sort-icon {
  display: inline-block;
  width: 32px;
  height: 32px;
  cursor: pointer;
  text-align: center;
  line-height: 32px;

  i {
    height: 32px;
    line-height: 32px;
  }

  .nosort {
    visibility: hidden;
  }
}
.cell:hover {
  .nosort {
    visibility: visible;
  }
}
</style>
