<template>
  <div class="main-area table-area overflow-visible">
    <div class="main-container">
      <div v-if="currentShowTable">{{currentShowTable.name}}</div>
      <div v-else class="text-secondary">没有打开的列表</div>
    </div>
    <div class="bottom-area">
      <div v-if="currentShowTable" class="table-cursor" :style="'left:'+getCurrentTableCurLeft()+'px'"></div>
      <ul class="table-tables">
        <li v-for="(table,index) in tables" :key="index" 
          :class="table==currentShowTable?'active':''" 
          @click="showTable(table)"
          @contextmenu="showTableRightMenu(table)"
          @dblclick="editTable(table)"
          :id="'table_item_'+index">
          <span class="status" :data-status="table.status" :title="getTableStatusString(table.status)" @click="showTableRightMenu(table)"></span>
          {{ table.name }}
        </li>
        <li class="add" title="添加播放计划表" @click="addTable"><i class="iconfont icon-zengjia"></i></li>
      </ul>
    </div>
    <el-dialog
      :title="(currentIsNewTable?'添加':'编辑')+'计划表'"
      :visible.sync="currentIsEditTable"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      class="el-dialog-width-fix-60">
      <el-form v-if="currentEditTable" label-position="right" label-width="100px" 
        :model="currentEditTable" :rules="rulesTable" ref="tableForm" 
        size="small">
        <el-form-item label="计划表名称" prop="name">
          <el-input v-model="currentEditTable.name"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="currentEditTable.note"></el-input>
        </el-form-item>
        <el-form-item label="播放条件">
          <condition-input ref="currentConEditor" :condition="currentEditTable.condition" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="currentEditTable.enabled" style="height:32px" active-color="#13ce66" inactive-color="#aaaaaa"></el-switch>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editTableFinish(false)" round>取消</el-button>
        <el-button type="primary" @click="editTableFinish(true)" round>保存</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import { PlayTable } from '../model/PlayTable'
import ConditionInput from '../components/ConditionInput.vue'
import TableServices from '../services/TableServices'
import { Form } from 'element-ui'
import CommonUtils from "../utils/CommonUtils";
import $ from 'jquery';

const electron = require('electron');
const remote = electron.remote;
const Menu = electron.remote.Menu;
const MenuItem = electron.remote.MenuItem;

@Component({
  components: {
    'condition-input': ConditionInput
  }
})
export default class TableView extends Vue {

  @Prop({default:null}) tableService : TableServices;
  
  tables : Array<PlayTable> = null;
  currentShowTable : PlayTable = null;
  currentEditTable : PlayTable = null;
  currentEditTableBackUp = null;
  currentIsNewTable = false;
  currentIsEditTable = false;

  menuTable : Electron.Menu = null;

  rulesTable = {
    name: [
      { required: true, message: '请输入计划表名称名称', trigger: 'blur' },
      { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
    ],
    note: [
      { required: false, trigger: 'blur' },
      { max: 100, message: '长度在 0 到 100 个字符之间', trigger: 'blur' }
    ],
  };

  mounted() {
    this.tables = this.tableService.getData();
    this.createMenu();
  }

  createMenu() {
    this.menuTable = new Menu();
    this.menuTable.append(new MenuItem({ label: '编辑时间表', click: () => this.editTable(this.currentEditTable) }));
    this.menuTable.append(new MenuItem({ label: '删除时间表', click: () => this.delTable(this.currentEditTable) }));
    //this.menuTable.append(new MenuItem({ type: 'separator' }));
  }

  getCurrentTableCurLeft() {
    if(this.currentShowTable){
      let id = '#table_item_' + this.tables.indexOf(this.currentShowTable);
      let $obj = $(id);
      if($obj.length > 0)
        return $obj.offset().left + $obj.width() / 2 - 5;
    }
    return 0;
  }
  addTable() {
    this.currentEditTable = new PlayTable();
    this.currentIsNewTable = true;
    this.currentIsEditTable = true;
  }
  delTable(table : PlayTable) {
    this.$confirm('确定永久删除该计划表? 此操作不可恢复！', '提示', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      this.tableService.delTable(table);
      this.$message({ type: 'success', message: '删除成功!' });
    }).catch(() => {});
  } 
  editTable(table : PlayTable) {
    this.currentEditTableBackUp = CommonUtils.clone(this.currentEditTable);
    this.currentIsNewTable = false;
    this.currentIsEditTable = true;
  }
  editTableFinish(save : boolean){
    if(save){
      
      let save = () => {
        (<Form>this.$refs['tableForm']).validate((valid) => {
          if (valid) {
            if(this.currentIsNewTable)
              this.tableService.addTable(this.currentEditTable);
            this.currentIsEditTable = false;
          }
        });
      };

      if((<ConditionInput>this.$refs['currentConEditor']).conditionInputBuffer == ''){
        this.$confirm('您似乎没有为此时间表定义一个播放条件，那么意味着它不会自动进行播放，是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => save()).catch(() => {});
      }else {
        if(this.currentEditTable.name == ''){
          let conString = this.currentEditTable.condition.toConditionString(false);
          this.$confirm('您希望使用“' + conString + '”作为此列表的名字吗?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.currentEditTable.name = conString;
            save()
          }).catch(() => {});
        }else save()
      }     
    } else {
      (<Form>this.$refs['tableForm']).resetFields();
      this.currentIsEditTable = false;
      CommonUtils.cloneValue(this.currentEditTable, this.currentEditTableBackUp);
      this.currentEditTableBackUp = null;
    }
  }
  showTable(table : PlayTable) { this.currentEditTable = this.currentShowTable = table; }
  showTableRightMenu(table : PlayTable) { this.currentEditTable = table; this.menuTable.popup(); }

  getTableStatusString(type : string) {
    switch(type){
      case 'playing': return '此计划表正在自动播放';
      case 'normal': return '此计划表未自动播放';
      case 'disabled': return '此计划表已禁用';
      default: return '';
    }

  }
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.table-area {

  .main-container {
    padding: 30px;
  }

  .bottom-area {

  }
  
}

.table-cursor {
  display: inline-block;
  width: 0px;
  height: 0px;
  position: absolute;
  border-width: 10px;
  border-style: solid;
  transition: left ease-in-out .3s;
  border-color: #fff transparent transparent transparent;
  top: 0;
}
.table-tables {
  list-style: none;
  margin: 0;
  padding: 10px;

  li {
    display: inline-block;
    font-size: 16px;
    line-height: 16px;
    text-align: center;
    padding: 7px 8px;
    border-radius: 16px;
    user-select: none;
    vertical-align: middle;
    cursor: pointer;
    transition: all ease-in-out .15s;

    &:hover:not(.add) {
      background-color: white;
      box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.08);
    }
    &.active {
      color: #0078c9;
    }
    &.add {

      width: 30px;
      height: 30px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      align-content: center;
      padding: 0;

      &:hover {
        color: #0078c9;
      }

      i {
        font-size: 18px;
        font-weight: bold;
      }
    }

    .status {

      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      cursor: pointer;
      vertical-align: bottom;

      &[data-status='unknow']{
        background-color: #b7b7b7;
      }
      &[data-status='normal']{
        background-color: #2e583b;
      }
      &[data-status='playing']{
        background-color: #1da546;
      }
      &[data-status='disabled']{
        background-color: #e63600;
      }
    }


  }
}

</style>


