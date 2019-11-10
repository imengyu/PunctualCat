<template>
  <div class="main-area table-area overflow-visible">
    <div class="main-container">
      <div v-if="currentShowTable">
        <el-table
          class="table-tasks"
          :data="currentShowTable.tasks"
          border>
          <el-table-column
            prop="name"
            label="任务名称"
            sortable
            align="right"
            width="150">
            <template slot-scope="scope">
              <el-input size="mini" class="text-right" placeholder="请输入任务名称" v-show="scope.row.editing" v-model="scope.row.name"></el-input>
              <span class="text-right" v-show="!scope.row.editing">{{scope.row.name}}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="38">
            <template slot-scope="scope">
              <i v-if="scope.row.status == 'normal'" class="iconfont icon-dengdaiqueren" title="任务就绪，等待播放"></i>
              <i v-else-if="scope.row.status == 'played'" class="iconfont icon-wancheng text-success" title="任务已经播放"></i>
              <i v-else-if="scope.row.status == 'disabled'" class="iconfont icon-dengdaizhihang" title="任务已禁用，不会自动播放"></i>
              <i v-else-if="scope.row.status == 'error'" class="iconfont icon-hj1 text-danger" title="任务播放出现错误"></i>
              <i v-else-if="scope.row.status == 'playing'" class="iconfont icon-zhihangzhong text-success" title="任务正在播放"></i>
              <i v-else-if="scope.row.status == 'norule'" class="iconfont icon-hj1 text-warning" title="由于您没有设置任务的播放条件，因此不会自动播放"></i>
            </template>
          </el-table-column>
          <el-table-column
            prop="condition"
            sortable
            label="播放条件"
            width="125">
            <template slot-scope="scope">
              <el-input size="mini" placeholder="请输入任务名称" v-show="scope.row.editing" v-model="scope.row.name"></el-input>
              <span v-show="!scope.row.editing">{{scope.row.name}}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="音乐或任务">
          </el-table-column>
          <el-table-column
            prop="volume"
            label="音量"
            align="center"
            width="55">
            <template slot-scope="scope">
              <el-input-number size="mini" controls-position="right" v-show="scope.row.editing" v-model="scope.row.volume"></el-input-number>
              <span v-show="!scope.row.editing">{{scope.row.volume}}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="loopCount"
            label="循环"
            align="center"
            width="55">
            <template slot-scope="scope">
              <el-input-number size="mini" controls-position="right" v-show="scope.row.editing" v-model="scope.row.loopCount"></el-input-number>
              <span v-show="!scope.row.editing">{{scope.row.loopCount}}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="启用"
            align="center"
            width="40">
            <template slot-scope="scope">
              <el-checkbox v-show="scope.row.editing" v-model="scope.row.enabled"></el-checkbox>
              <span v-if="!scope.row.editing && scope.row.enabled" class="text-success">是</span>
              <span v-if="!scope.row.editing && !scope.row.enabled" class="text-secondary">否</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="center"
            width="100">
            <template slot-scope="scope">
              <el-button v-show="!scope.row.editing" type="text" class="text-primary" title="编辑任务" @click="editTask(scope.row)">
                <i class="iconfont icon-chuangzuo"></i>
              </el-button>
              <el-button v-show="scope.row.editing" type="text" class="text-success" title="保存任务修改" @click="editTaskFinish(scope.row, true)">
                <i class="iconfont icon-duigou"></i>
              </el-button>
              <el-button v-show="scope.row.editing" type="text" class="text-danger" title="取消任务修改" @click="editTaskFinish(scope.row, false)">
                <i class="iconfont icon-tiaojian-copy"></i>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="table-none">
        <svg t="1573387637231" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2498" width="128" height="128"><path d="M373.163 605.354c-11.864-2.373-29.063-2.373-33.216 10.093-2.371 7.716 10.082 8.313 21.353 11.277 8.899 2.374 13.645 7.123 13.051 8.307-2.374 2.971-16.016-2.373-27.879 1.783-11.864 4.155-9.489 14.838-2.371 17.805 7.116 2.378 18.386-0.593 44.485 3.562 13.047 2.376 21.352-2.374 23.134-10.09 2.368-18.4-21.949-39.172-38.557-42.737z m99.052 65.887c-23.724 0-42.704 18.401-42.704 42.141v0.593c0 4.75 3.559 8.31 8.304 8.31 4.743 0 8.302-3.56 8.302-8.31v-0.593c0-13.65 11.27-25.522 25.504-25.522 14.239 0 25.509 11.871 25.509 25.522v0.593c0 4.75 3.558 8.31 8.302 8.31 4.745 0 8.304-3.56 8.304-8.31v-0.593c1.186-22.556-18.388-42.141-41.521-42.141z m97.868-65.887c-17.199 3.565-41.52 24.338-38.554 43.333 1.782 7.715 8.898 12.461 23.132 10.089 26.099-4.156 37.369-1.189 44.487-3.562 7.117-2.373 8.898-13.651-2.372-17.805-11.864-4.156-24.914 1.187-27.879-1.783-1.777-2.373 3.56-7.122 13.051-8.902 11.27-2.376 23.724-3.562 21.352-11.277-3.561-12.466-20.759-13.06-33.217-10.093z m126.34-310.428c-2.965-2.373-7.119-4.155-12.458-4.155H259.281c-4.746 0-8.898 1.782-12.456 4.749L97.352 432.037c-3.559 3.562-5.93 8.31-5.93 13.654v334.168c0 29.088 23.728 52.827 52.79 52.827v-0.593H798.44c29.064 0 52.79-23.741 52.79-52.824V445.097c0-4.749-2.965-10.092-6.523-13.653L696.423 294.926z m-434.771 18.4h421.125L811.49 432.037H583.724c-4.745 0-8.893 4.156-8.893 9.499 0 54.606-46.861 100.901-102.022 100.901-55.161 0-102.018-46.295-102.018-100.901 0-4.749-4.152-9.499-8.898-9.499H131.755l129.897-118.711z m566.445 466.532c0 16.621-13.047 29.088-29.064 29.088H144.807c-16.61 0-30.251-13.06-30.251-29.088V451.032h237.848l1.185 7.122c4.151 26.711 16.61 51.044 36.183 68.854 22.536 21.367 52.193 33.238 83.037 33.238 30.846 0 59.908-11.871 83.041-33.238 19.571-19.587 32.028-43.33 36.181-68.854l1.187-7.122h234.88v328.826zM338.944 903.263c-19.274-0.513-39.105-7.076-57.201-14.524-12.246-5.049-17.085-4.239-24.554 6.804-13.278 19.634-27.551 39.127-44.29 55.781-26.078 25.941-58.7 39.137-96.571 39.591 32.868 16.83 67.561 26.85 103.918 29.477 7.121 0.509 17.025-6.562 21.909-12.974 8.142-10.69 16.597-11.797 28.442-8.869 13.7 3.382 27.762 6.037 41.799 6.993 7.133 0.477 15.231-2.2 21.759-5.606 43.943-22.997 73.264-59.784 96.44-102.952-31.766 2.459-61.781 7.073-91.651 6.279z m41.587 10.508c7.812-1.453 15.926-1.339 25.385-2.071-26.289 47.299-68.924 98.858-135.962 76.102-14.108-4.79-23.976-1.247-34.005 9.99-5.407 6.041-16.094 10.53-24.227 10.263-15.068-0.473-30.006-4.948-48.217-8.364 4.239-5.175 5.11-7.283 6.615-7.922 40.777-17.213 69.807-47.276 93.678-83.63 2.791-4.242 13.474-7.372 18.368-5.484 31.986 12.347 64.371 17.423 98.365 11.116zM166.33 223.708c0-1.923 0.66-4.01-0.101-5.013-32.761-43.248-41.884-93.277-40.728-145.817 0.306-13.901-2.163-23.797-13.433-33.419C101.194 30.183 93.766 16.845 83.5 3.583c-25.29 74.901-24.709 185.543 82.83 220.125zM91.864 32.643c8.344 11.923 22.004 22.508 22.209 33.335 0.805 42.828 5.161 84.576 22.875 127.28C86.543 180.726 68.25 76.511 91.864 32.643z m824.464 367.931c-13.342 6.227-29.17 7.147-45.402 10.72 4.061 11.405 8.712 24.481 13.33 37.477 33.692-6.881 58.29-33.423 69.92-76.119-13.202 10.045-24.302 21.605-37.848 27.922zM309.369 228.948c-2.877-10.419-9.671-19.695-13.141-30.012-3.37-9.996-4.618-20.708-7.355-33.772-13.569 24.454-6.458 59.546 17.277 86.516 1.55-9.529 4.854-16.815 3.219-22.732z" p-id="2499"></path></svg>
        <span v-if="tables && tables.length > 0">没有打开的列表<br />点击下方按钮来查看或编辑一个时间表</span>
        <span v-else>这里还没有计划表哦<br />点击下方 “<i class="iconfont icon-xinjiantuopu"></i>” 按钮新建一个计划表</span>
      </div>
    </div>
    <div class="bottom-area">
      <div v-if="currentShowTable" class="table-cursor" :style="'left:'+getCurrentTableCurLeft()+'px'"></div>
      <SortableList v-if="tables" lockAxis="x" axis="x" v-model="tables" :pressDelay="100" @add="addTable" @input="resortTableEnd">
        <SortableItem v-for="(table, index) in tables" :index="index" :key="index" :table="table"
          :class="(table==currentShowTable?'active':'')"
          @click="showTable(table)"
          @contextmenu="showTableRightMenu(table)"
          @dblclick="editTable(table)"
          :id="'table_item_'+index" >
          <span class="status" :data-status="table.status" :title="getTableStatusString(table.status)" @click="showTableRightMenu(table)"></span>
          {{ table.name }}
        </SortableItem>
      </SortableList>
      <div class="bottom-right-area">
        <a v-if="currentShowTable" type="text" title="设置计划表属性" @click="editTable(currentShowTable)" href="javascript:;"><i class="iconfont icon-ccaozuo"></i></a>
        <a v-if="currentShowTable" type="text" title="向计划表添加一个任务" @click="addTask(currentShowTable)" href="javascript:;"><i class="iconfont icon-zengjia1"></i></a>
      </div>
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
import { ContainerMixin, ElementMixin } from 'vue-slicksort';
import { PlayTask } from "../model/PlayTask";

const electron = require('electron');
const remote = electron.remote;
const Menu = electron.remote.Menu;
const MenuItem = electron.remote.MenuItem;

const SortableList = {
  mixins: [ContainerMixin],
  template: `
    <ul class="table-tables">
      <slot />
      <li class="add" title="添加播放计划表" @click="onAddClick"><i class="iconfont icon-xinjiantuopu"></i></li>
    </ul>
  `,
  methods: {
    onAddClick() { this.$emit('add'); }
  }
};
const SortableItem = {
  mixins: [ElementMixin],
  template: `
    <li 
      class="table-items"
      @click="onClick"
      @contextmenu="onContextmenu"
      @dblclick="onDblclick"
      >
      <slot />
    </li>
  `,
  methods: {
    onClick() { this.$emit('click') },
    onContextmenu() { this.$emit('contextmenu') },
    onDblclick() { this.$emit('dblclick') }
  }
};

@Component({
  components: {
    'condition-input': ConditionInput,
    'SortableItem': <any>SortableItem,
    'SortableList': <any>SortableList
  }
})
export default class TableView extends Vue {

  @Prop({default:null}) tableService : TableServices;
  
  tables : Array<PlayTable> = null;
  currentShowTable : PlayTable = null;
  currentEditTable : PlayTable = null;
  currentDragTable : PlayTable = null;
  currentEditTableBackUp = null;
  currentIsNewTable = false;
  currentIsEditTable = false;
  currentEditTaskBackUp = null;

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
    this.menuTable.append(new MenuItem({ label: '禁用时间表', click: () => this.enableTable(this.currentEditTable, false) }));
    this.menuTable.append(new MenuItem({ label: '启用时间表', click: () => this.enableTable(this.currentEditTable, true) }));
    this.menuTable.append(new MenuItem({ label: '删除时间表', click: () => this.delTable(this.currentEditTable) }));
    this.menuTable.append(new MenuItem({ type: 'separator' }));
    this.menuTable.append(new MenuItem({ label: '添加时间表', click: () => this.addTable() }));
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
      this.$message({ type: 'success', message: '删除计划表成功!' });
    }).catch(() => {});
  } 
  enableTable(table : PlayTable, enable : boolean) {
    this.$confirm(enable ? '是否启用该计划表? ' : '确定禁用该计划表? 此计划表将不会被自动播放', '提示', {
      confirmButtonText: enable ? '启用' : '禁用',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      table.enabled = enable;
      this.$message({ type: 'success', message: (enable ? '启用' : '禁用') + '计划表成功!' });
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
  resortTableEnd(arr : any[]) {
    for(let i = 0; i < arr.length; i++){
      this.tables[i] = arr[i];
      this.tableService.tables[i] = arr[i];
    }
  }
  showTable(table : PlayTable) { this.currentEditTable = this.currentShowTable = table; }
  showTableRightMenu(table : PlayTable) { 
    this.currentEditTable = table; 
    this.menuTable.items[2].enabled = table.enabled;
    this.menuTable.items[3].enabled = !table.enabled;
    this.menuTable.popup(); 
  }

  addTask(table : PlayTable) {
    let task = new PlayTask();
    task.editing = true;
    task.name = '新任务 ' + (table.tasks.length + 1);
    table.tasks.push(task);
  }
  editTask(task : PlayTask) { 
    task.editing = true; 
    this.currentEditTaskBackUp = CommonUtils.clone(task);
  }
  editTaskFinish(task : PlayTask, save : boolean) {
    if(!save) {
      this.$confirm('确定放弃对此任务的修改？', '提示', {
        confirmButtonText: '放弃',
        cancelButtonText: '取消',
        roundButton: true,
        type: 'warning'
      }).then(() => {
        task.editing = false;
        CommonUtils.cloneValue(task, this.currentEditTaskBackUp);
      }).catch(() => {});
    }else task.editing = false;
  }


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
  position: absolute;
  left: 0;
  top: 0;
  right: 100px;
}
.bottom-right-area {
  position: absolute;
  width: 100px;
  top: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 50px;
  padding-right: 15px;

  a {
    color: #000;
    font-size: 20px;
    margin-right: 15px;

    &:hover {
      color: #0078c9;
    }

    i {
      font-size: 22px;
    }
  }
}
.table-tasks {

  tr,td {
    height: 29px;
  }
  .el-button {
    padding: 0;
  }
  .el-table__empty-block {
    height: auto;
    min-height: 20px;
  }
  .el-input-number {
    width: 50px;

    .el-input-number__decrease,
    .el-input-number__increase {
      width: 16px;
    }
  }
  .el-input-number.is-controls-right .el-input__inner {
    padding: 0;
    padding-right: 20px;
  }
  .el-input-number--mini {
    width: 50px;
    line-height: 26px;
  }
  .el-input__inner {
    border: none;
    padding: 0 3px;
    background-color: transparent;
  }
}
.table-items, .table-tables li {
  display: inline-block;
  font-size: 16px;
  line-height: 16px;
  text-align: center;
  padding: 7px 8px;
  border-radius: 16px;
  user-select: none;
  vertical-align: middle;
  cursor: pointer;
  transition: color,background-color,box-shadow ease-in-out .15s;
  white-space: nowrap;

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
  &.dragging {
    position: absolute;
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
.table-none {
  display: flex;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  svg {

  }
  span {
    margin: 20px 0 35px 0;
    color: #aaa;
  }
}

</style>


