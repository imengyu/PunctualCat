<template>
  <div class="icon-tollbar">
    <div :id="'icon-item-'+item.name" v-for="(item,index) in items" :key="index" tabindex="2"
      :class="'icon-item'+(activeItem==item?' active':'')+(' '+arrowDirection)" @click="itemClick(item)" 
      :style="'width:'+itemSize+'px;height: '+itemSize+'px;line-height:'+itemSize+'px'">
      <el-tooltip v-if="item.showHotPoint && item.hotPointCountTooltip!=''" :placement="arrowDirection" :content="item.hotPointCountTooltip">
        <span class="hot-point" v-html="item.hotPointCount"></span>
      </el-tooltip>
      <span class="hot-point" v-else-if="item.showHotPoint" v-html="item.hotPointCount"></span>
      <span :class="'iconfont ' + item.content" :style="'font-size:'+(item.fixSize?item.fixSize:'32')+'px'">
        {{ item.type == 'icon' ? '' : item.content }}
      </span>
      <div class="tooltip">{{ item.tooltip }}</div>
    </div>
    <div v-if="activeItem" :class="'select-arrow '+arrowDirection" 
      :style="'left:'+calcActiveItemLeft()+'px;' + (arrowDirection+':'+arrowOffest+'px')"></div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import IconToolItem from '../model/IconToolItem'

@Component
export default class IconToolBar extends Vue {
  name = "IconToolBar";

  @Prop({default: 50}) itemSize : number;
  @Prop({default: 'bottom'}) arrowDirection : 'top'|'bottom';
  @Prop({default: 0}) arrowOffest : number;
  @Prop({default: true}) showSelect : boolean;
  @Prop({default: null}) items : Array<IconToolItem>;
  @Prop({default: null}) activeItem : IconToolItem = null;

  mounted() {

  }



  calcActiveItemLeft() : number{
    let index = this.items.indexOf(this.activeItem);
    return index * (this.itemSize + 10)  + (this.itemSize / 2 - 15)
  }
  itemClick(item : IconToolItem) {
    this.$emit('item-click', item);
    if(this.activeItem != item && item.selectable){
      this.$emit('select-item-changed', item);
    }
  }
}
</script>

<style lang="scss">
.icon-tollbar {
  display: inline-block;
  position: relative;
  word-break: keep-all;
  white-space: nowrap;

  .icon-item {

    display: inline-block;
    position: relative;
    text-align: center;
    cursor: pointer;
    transition: all ease-in-out .2s;
    outline: none;

    .hot-point {
      position: absolute;
      display: inline-block;
      background-color: rgb(223, 74, 37);
      color: #fff;
      border-radius: 10px;
      font-size: 12px;
      padding: 0 6px;
      height: 20px;
      line-height: 20px;
      top: 0;
      right: 0;

      i {
        color: #fff!important;
        font-size: 12px;
      }
    }
    .iconfont {
      transition: all ease-in-out .2s;
      font-size: 32px;
      color: #000;
    }
    .tooltip {
      white-space: nowrap;
      transition: all ease-in-out .2s;
      color: #333;
      text-shadow: 0px 1px 10px #fff;
      font-size: 12px;
      line-height: 13px;
      text-align: center;
      margin-top: -3px;
      opacity: 0;
    }

    &:not(:first-child){
      margin-left: 10px;
    }
    &.active {

      cursor: default;

      .tooltip,
      .iconfont {
        color: #007dc5;
      }
    }
    &:focus,
    &:hover {

      &.bottom {
        transform: translateY(-6px);
        &.active { transform: translateY(-13px); }
      }
      &.top {
        transform: translateY(6px);
        &.active { transform: translateY(13px); }
      }

      .tooltip {
        opacity: 1;
      }
      .tooltip,
      .iconfont {
        color: #007dc5;
      }
    }

  }

  .select-arrow {
    display: inline-block;
    width: 0px;
    height: 0px;
    position: absolute;
    border-width: 15px;
    border-style: solid;

    transition: left ease-in-out .3s;

    &.top {
      border-color: #fff transparent transparent transparent;
      top: 0;
    }
    &.bottom {
      border-color: transparent transparent #fff transparent;
      bottom: 0;
    }
  }
}
</style>

