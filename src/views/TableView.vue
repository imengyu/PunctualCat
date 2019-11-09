<template>
  <div class="main-area table-area overflow-visible">
    <div class="main-container">
      <div v-if="currentShowTable">{{currentShowTable.name}}</div>
      <div v-else class="text-secondary">没有打开的列表</div>
    </div>
    <div class="bottom-area">
      <ul class="table-tables">
        <li v-for="(table,key) in tables" :key="key" 
          :class="table==currentShowTable?'active':''" 
          @click="showTable(table)"
          @contextmenu="showTableRightMenu(table)">{{ table.name }}</li>
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
import TableServices from '../services/TableServices'
import { Form } from 'element-ui'
import CommonUtils from "../utils/CommonUtils";

const electron = require('electron');
const remote = electron.remote;
const Menu = electron.remote.Menu;
const MenuItem = electron.remote.MenuItem;

@Component({
  components: {

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
      { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
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
    this.menuTable.append(new MenuItem({ type: 'separator' }));
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
      center: true,
      type: 'warning'
    }).then(() => {
      this.tableService.delTable(table);
      this.$message({ type: 'success', message: '删除成功!' });
    }).catch();
  } 
  editTable(table : PlayTable) {
    this.currentEditTableBackUp = CommonUtils.clone(this.currentEditTable);
    this.currentIsNewTable = false;
    this.currentIsEditTable = true;
  }
  editTableFinish(save : boolean){
    if(save){
      (<Form>this.$refs['tableForm']).validate((valid) => {
        if (valid) {
          if(this.currentIsNewTable) 
            this.tableService.addTable(this.currentEditTable);
          this.currentIsEditTable = false;
        } 
      });
    } else {
      (<Form>this.$refs['tableForm']).resetFields();
      this.currentIsEditTable = false;
      CommonUtils.cloneValue(this.currentEditTable, this.currentEditTableBackUp);
      this.currentEditTableBackUp = null;
    }
  }
  showTable(table : PlayTable) { this.currentEditTable = this.currentShowTable = table; }
  showTableRightMenu(table : PlayTable) { this.currentEditTable = table; this.menuTable.popup(); }
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

.table-tables {
  list-style: none;
  margin: 0;
  padding: 10px;

  li {
    display: inline-block;
    font-size: 16px;
    text-align: center;
    padding: 4px 8px;
    border-radius: 16px;

    &:hover:not(.add) {
      background-color: white;
      box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.08);
    }
    &.active {
      color: #0078c9;
      font-weight: bold;
    }
    &.add {

      width: 20px;
      font-size: 18px;
      text-align: center;

      &:hover {
        color: #0078c9;
      }

      i {
        font-weight: bold;
      }
    }
  }
}

</style>


