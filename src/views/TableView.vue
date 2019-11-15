<template>
  <div class="main-area table-area overflow-visible">
    <div class="main-container">
      <div v-if="currentShowTable">
        <el-table
          class="table-tasks"
          :data="currentShowTable.tasks"
          :row-class-name="getTaskClassStyle"
          border>
          <div slot="empty" class="task-none">
            <img src="../assets/images/empty-s.svg" />
            <span>这个计划表还没有任务哦</span>
            <el-button class="mt-3" type="primary" @click="addTask(currentShowTable)" round>添加任务</el-button>
          </div>
          <el-table-column
            prop="name"
            label="任务名称"
            sortable
            width="120">
            <template slot-scope="scope">
              <el-input size="mini" placeholder="请输入任务名称" v-show="scope.row.editing" v-model="scope.row.name"></el-input>
              <span class="no-warp-span-full" v-show="!scope.row.editing" :title="scope.row.name">{{scope.row.name}}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="38">
            <template slot-scope="scope">
              <div class="text-center">
                <i v-if="scope.row.editing" class="iconfont icon-hj1" style="color: #0087bb" title="您正在编辑任务，保存任务以后才能自动播放"></i>
                <i v-else-if="scope.row.status == 'normal'" class="iconfont icon-dengdaiqueren" title="任务就绪，等待播放"></i>
                <i v-else-if="scope.row.status == 'played'" class="iconfont icon-wancheng text-success" title="任务已播放"></i>
                <i v-else-if="scope.row.status == 'disabled'" class="iconfont icon-dengdaizhihang" style="color:#cacaca" title="任务已禁用，不会自动播放"></i>
                <i v-else-if="scope.row.status == 'error'" class="iconfont icon-hj1 text-danger" title="任务播放时出现错误"></i>
                <i v-else-if="scope.row.status == 'playing'" class="iconfont icon-yanchu text-success" title="任务正在播放"></i>
                <i v-else-if="scope.row.status == 'norule'" class="iconfont icon-hj1 text-warning" title="由于您没有设置任务的播放条件，因此不会自动播放"></i>
                <i v-else-if="scope.row.status == 'notplay'" class="iconfont icon-zhihangzhong" title="当前计划表今日不播放"></i>
                <i v-else-if="scope.row.status == 'parent-disabled'" class="iconfont icon-dengdaizhihang" style="color:#cacaca" title="当前计划表已禁用"></i>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="condition"
            sortable
            label="播放条件"
            width="95">
            <template slot-scope="scope">
              <condition-input size="mini" v-show="scope.row.editing" :condition="scope.row.condition"></condition-input>
              <span class="no-warp-span-full" v-show="!scope.row.editing" v-html="getTaskConHtml(scope.row)"></span>
            </template>
          </el-table-column>
          <el-table-column
            label="音乐或任务">
            <template slot-scope="scope">
              <el-popover
                v-if="scope.row.editing"
                placement="top"
                trigger="manual"
                width="400"
                popper-class="propever-commands"
                v-model="scope.row.editingTask">
                <el-radio-group v-model="scope.row.type" size="mini">
                  <el-radio-button label="music">播放音乐</el-radio-button>
                  <el-radio-button label="command">执行 CMD 命令</el-radio-button>
                  <el-radio-button label="reboot">重启电脑</el-radio-button>
                  <el-radio-button label="shutdown">关闭电脑</el-radio-button>
                </el-radio-group>
                <div v-if="scope.row.type=='music'" class="propever-taskarea">
                  <div class="text-secondary">任务将会按您设置的音乐顺序播放</div>
                  <command-list v-if="scope.row.musics && scope.row.musics.length > 0" lockAxis="y" axis="y" v-model="scope.row.musics">
                    <command-item v-for="(music, index) in scope.row.musics" :index="index" :key="index">
                      <div class="updown-drag">
                        <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M814.17307 634.253637H163.708909c-32.045196 0-51.26956 20.829002-35.246962 36.846594C152.491463 696.734385 439.276067 996.332311 453.694027 1010.75653c17.622229 19.224364 56.075964 16.017591 72.093556 0C537.003777 999.540336 831.796551 688.726215 849.421284 671.100231c16.021346-17.620978-4.805152-35.248214-35.248214-36.846594zM163.708909 390.726669H814.17307c30.44181 0 51.26956-19.225616 35.248214-36.846594C831.796551 336.254091 537.003777 25.439971 524.189203 12.625397c-14.419212-16.022598-52.872946-17.627236-72.098562 0C439.276067 28.646743 152.491463 328.245921 128.461947 353.880075c-16.022598 16.022598 3.201766 36.846593 35.246962 36.846594z m0 0" fill="#fff"></path></svg>
                      </div>
                      <el-input style="display: inline-block;width: calc(100% - 100px);" size="mini" v-model="scope.row.musics[index].fullPath" :readonly="true"></el-input>
                      <el-popover
                        placement="top"
                        width="150"
                        trigger="click"
                        v-model="scope.row.chooseMusic2">
                        <p class="mt-0">选择音乐来源：</p>
                        <el-button size="mini" type="text" class="display-block m-0" 
                          @click="scope.row.chooseMusic2=false;chooseTaskMusic(scope.row,'file',index)">选择文件</el-button>
                        <el-button size="mini" type="text" class="display-block m-0"
                          @click="scope.row.chooseMusic2=false;chooseTaskMusic(scope.row,'history',index)">从音乐库中选择</el-button>
                        <el-button size="mini" type="text" class="display-block m-0" @click="scope.row.chooseMusic2=false;">取消</el-button>
                        <el-button slot="reference" type="primary" size="mini" icon="el-icon-refresh-right" title="更换音乐" circle></el-button>
                      </el-popover>
                      <el-popover
                        placement="top"
                        width="160"
                        trigger="click"
                        v-model="scope.row.chooseMusic3">
                        <p class="mt-0">确定删除此音乐？</p>
                        <div style="text-align: right; margin: 0">
                          <el-button size="mini" type="text" @click="scope.row.chooseMusic3=false">取消</el-button>
                          <el-button type="primary" size="mini" @click="scope.row.chooseMusic3=false;scope.row.musics.remove(index)">确定</el-button>
                        </div>
                        <el-button slot="reference" type="danger" size="mini" icon="el-icon-close" title="删除此音乐" circle></el-button>
                      </el-popover>
                    </command-item>
                  </command-list>
                  <div v-else class="text-secondary text-center mt-3 mb-3">当前任务没有音乐</div>
                </div>
                <div v-else-if="scope.row.type=='command'" class="propever-taskarea">
                  <div class="text-secondary">任务将会按您设置的 CMD 命令顺序执行，通常，您可以使用此功能来启动您自己的程序。</div>
                  <command-list v-if="scope.row.commands && scope.row.commands.length > 0" lockAxis="y" axis="y" v-model="scope.row.commands">
                    <command-item v-for="(conmmand, index) in scope.row.commands" :index="index" :key="index">
                      <el-input size="mini" v-model="scope.row.commands[index]" placeholder="输入您要执行 CMD 命令">
                        <el-button slot="append" icon="el-icon-close" title="删除此命令" @click="scope.row.commands.remove(index)"></el-button>
                      </el-input>
                    </command-item>
                  </command-list>
                  <div v-else class="text-secondary text-center mt-3 mb-3">当前任务没有命令</div>
                </div>
                <div v-else-if="scope.row.type=='shutdown'" class="propever-taskarea">
                  <div class="text-secondary">此任务将会关闭计算机</div>
                </div>
                <div v-else-if="scope.row.type=='reboot'" class="propever-taskarea">
                  <div class="text-secondary">此任务将会重启计算机</div>
                </div>

                <div class="propever-buttons">
                  <div v-if="scope.row.type=='music'">                 
                    <el-popover
                      placement="top"
                      width="150"
                      trigger="click"
                      v-model="scope.row.chooseMusic1">
                      <p class="mt-0">选择音乐来源：</p>
                      <el-button size="mini" type="text" class="display-block m-0" 
                        @click="scope.row.chooseMusic1=false;chooseTaskMusic(scope.row,'file',-1)">选择文件</el-button>
                      <el-button size="mini" type="text" class="display-block m-0"
                        @click="scope.row.chooseMusic1=false;chooseTaskMusic(scope.row,'history',-1)">从音乐库中选择</el-button>
                      <el-button size="mini" type="text" class="display-block m-0" @click="scope.row.chooseMusic1=false;">取消</el-button>
                      <el-button slot="reference" class="float-right" size="mini" round><i class="iconfont icon-tianjiaxiao mr-2"></i>添加音乐</el-button>
                    </el-popover>
                  </div>
                  <div v-else-if="scope.row.type=='command'">
                    <el-button size="mini" class="float-right" round @click="scope.row.commands.push('')"><i class="iconfont icon-tianjiaxiao mr-2"></i>添加命令</el-button>
                  </div>
                  <div v-else-if="scope.row.type=='shutdown'">
                    <el-button size="mini" class="float-right" circle><i class="iconfont icon-cuowuhttp"></i></el-button>
                  </div>
                  <div v-else-if="scope.row.type=='reboot'">
                    <el-button size="mini" class="float-right" circle><i class="iconfont icon-cuowuhttp"></i></el-button>
                  </div>
                  <div>
                    <el-button size="mini" type="text" @click="editTaskCommandOrMusicFinish(scope.row, false)">取消</el-button>
                    <el-button type="primary" size="mini" @click="editTaskCommandOrMusicFinish(scope.row, true)" round>确定</el-button>
                  </div>
                </div>
                <div slot="reference" class="no-select"
                  @click="editCommandOrMusicTask(scope.row)">
                  <span class="no-warp-span cursor-pointer" v-html="scope.row.getPlayTaskString()"></span>
                  <a class="float-right" style="margin-top: 3px;" href="javascript:;" @click="editCommandOrMusicTask(scope.row)" title="编辑音乐或任务"><i class="iconfont icon-chuangzuo"></i></a>
                </div>
              </el-popover>
              <div class="no-warp-span" v-show="!scope.row.editing" v-html="scope.row.getPlayTaskString()"></div>
            </template>
          </el-table-column>
          <el-table-column
            prop="volume"
            label="音量%"
            align="center"
            :min="0"
            :max="100"
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
            :min="1"
            :max="50"
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
              <span v-if="scope.row.enabled" class="text-success">是</span>
              <span v-if="!scope.row.enabled" class="text-secondary">否</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="center"
            width="100">
            <template slot-scope="scope">
              <div class="controls text-center no-select" v-show="!scope.row.editing && !currentIsEditTask">
                <el-button type="text" class="text-primary" title="编辑任务" @click="editTask(scope.row)">
                  <i class="iconfont icon-chuangzuo"></i>
                </el-button>
                <el-button v-if="scope.row.status != 'playing' && scope.row.status != 'disabled'" type="text" class="text-success" title="立即开始播放任务" @click="playTask(scope.row)">
                  <i class="iconfont icon-bofang1"></i>
                </el-button>
                <el-button v-else-if="scope.row.status == 'disabled'" type="text" class="text-primary" title="启用任务" @click="enableTask(scope.row, true)">
                  <i class="iconfont icon-weixuanzhong"></i>
                </el-button>
                <el-button v-else-if="scope.row.status == 'playing'" type="text" class="text-danger" title="停止播放任务" @click="stopTask(scope.row)">
                  <i class="iconfont icon-guanbi-copy"></i>
                </el-button>
                <el-button type="text" class="text-danger" title="删除任务" @click="delTask(scope.row)">
                  <i class="iconfont icon-shanchu2"></i>
                </el-button>
              </div>
              <div class="controls text-center no-select" v-show="scope.row.editing">
                <el-button type="text" class="text-success" title="保存任务修改" @click="editTaskFinish(scope.row, true)">
                  <i class="iconfont icon-duigou"></i>
                </el-button>
                <el-button type="text" class="text-danger" title="取消任务修改" @click="editTaskFinish(scope.row, false)">
                  <i class="iconfont icon-tiaojian-copy"></i>
                </el-button>
                <el-button v-if="scope.row.enabled" type="text" class="text-danger" title="禁用任务" @click="enableTask(scope.row, false)">
                  <i class="iconfont icon-jinyong"></i>
                </el-button>
                <el-button v-else type="text" class="text-primary" title="启用任务" @click="enableTask(scope.row, true)">
                  <i class="iconfont icon-weixuanzhong"></i>
                </el-button>
              </div>
              
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="table-none">
        <img src="../assets/images/empty.svg" />
        <span v-if="tables && tables.length > 0">没有打开的列表<br />点击下方按钮来查看或编辑一个时间表</span>
        <span v-else>这里还没有计划表哦<br />点击下方 “<i class="iconfont icon-xinjiantuopu"></i>” 按钮新建一个计划表</span>
      </div>
    </div>
    <div class="bottom-area">
      <div v-if="currentShowTable" class="table-cursor" :style="'left:'+getCurrentTableCurLeft()+'px'"></div>
      <table-list v-if="tables" lockAxis="x" axis="x" v-model="tables" :distance="20" @add="addTable" @input="resortTableEnd">
        <table-item v-for="(table, index) in tables" :index="index" :key="index" :table="table"
          :class="(table==currentShowTable?'active':'')"
          @click="showTable(table)"
          @contextmenu="showTableRightMenu(table)"
          @dblclick="editTable(table)"
          :id="'table_item_'+index" >
          <span class="status" :data-status="table.status" :title="getTableStatusString(table.status)" @click="showTableRightMenu(table)"></span>
          {{ table.name }}
        </table-item>
      </table-list>
      <div class="bottom-right-area">
        <a v-if="currentShowTable" type="text" title="设置计划表属性" @click="editTable(currentShowTable)" href="javascript:;"><i class="iconfont icon-ccaozuo"></i></a>
        <a v-if="currentShowTable" type="text" title="向计划表添加一个任务" @click="addTask(currentShowTable)" href="javascript:;"><i class="iconfont icon-zengjia1"></i></a>
      </div>
    </div>

    <!--编辑计划表对话框-->
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
import AudioWave from '../components/AudioWave.vue'
import TableServices from '../services/TableServices'
import App from '../App.vue'
import { Form } from 'element-ui'
import CommonUtils from "../utils/CommonUtils";
import $ from 'jquery';
import { ContainerMixin, ElementMixin } from 'vue-slicksort';
import { PlayTask } from "../model/PlayTask";
import AutoPlayService from "../services/AutoPlayService";
import { AutoPlayStatus } from "../model/PlayInterfaces";

const electron = require('electron');
const remote = electron.remote;
const Menu = electron.remote.Menu;
const MenuItem = electron.remote.MenuItem;

const SortableListTable = {
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
const SortableItemTable = {
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

const SortableListCommand = {
  mixins: [ContainerMixin],
  template: `
    <ul class="command-list">
      <slot />
    </ul>
  `
};
const SortableItemCommand = {
  mixins: [ElementMixin],
  template: `
    <li class="command-items">
      <slot />
    </li>
  `
};

@Component({
  components: {
    'condition-input': ConditionInput,
    'table-item': <any>SortableItemTable,
    'table-list': <any>SortableListTable,
    'command-item': <any>SortableItemCommand,
    'command-list': <any>SortableListCommand,

  }
})
export default class TableView extends Vue {

  @Prop({default:null}) tableService : TableServices;
  @Prop({default:null}) autoPlayService : AutoPlayService;
  @Prop({default:null}) app : App;
  
  tables : Array<PlayTable> = null;
  currentShowTable : PlayTable = null;
  currentEditTable : PlayTable = null;
  currentDragTable : PlayTable = null;
  currentEditTableBackUp = null;
  currentIsNewTable = false;
  currentIsEditTable = false;
  currentIsEditTask = false;
  currentEditTask = null;
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
    PlayTask.setGlobalStateChangedCallback(this.globalTaskStateChanged);
    setTimeout(this.autoSwitchCurrentView, 1300);
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
    this.$confirm('确定永久删除该计划表? 此操作将会删除其下所有任务，并且<b style="color:red">不可恢复</b>！', '提示', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      if(table == this.currentShowTable){
        this.currentShowTable = null;
        this.autoSwitchCurrentView();
      }
      this.tableService.delTable(table);
      this.autoPlayService.flush();
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
      this.autoPlayService.flushTable(table);
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
            this.autoPlayService.flushTable(this.currentEditTable);
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

  globalTaskStateChanged(task : PlayTask, status : AutoPlayStatus) {
    if(status == 'playing')
      this.flashTak(task, 'success');
    else if(status == 'error')
      this.flashTak(task, 'error', 10000, 1000);
    else if(status == 'played')
      this.flashTak(task, 'success', 3000, 1000);
  }

  getTaskClassStyle(object : { row : PlayTask, rowIndex : number }) {
    let cls = 'task-' + object.rowIndex;
    if(object.row.editing) 
      cls += ' editing-task';
    return cls;
  }
  addTask(table : PlayTable) {
    if(this.currentIsEditTask) {
      this.editTaskFinish(this.currentEditTask, true);
      this.currentIsEditTask = false;
    }
    let task = new PlayTask();
    task.editing = true;
    task.isNew = true;
    task.name = '新任务 ' + (table.tasks.length + 1);
    table.addTask(task);
    this.currentEditTask = task;
    this.currentIsEditTask = true;
    this.autoPlayService.flushTable(table);
  }
  editTask(task : PlayTask) { 
    task.editing = true; 
    this.currentEditTask = task;
    this.currentIsEditTask = true;
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
        if(task.isNew){
          task.editing = false;
          task.parent.delTask(task);
          this.currentEditTask = null;
          this.currentIsEditTask = false;
        }else {
          CommonUtils.cloneValue(task, this.currentEditTaskBackUp);
          task.editing = false;
          this.currentEditTask = null;
          this.currentIsEditTask = false;
        }
      }).catch((e) => {
        console.log(e);
      });
    }else {
      task.editing = false;
      task.isNew = false;
      this.currentEditTask = null;
      this.currentIsEditTask = false;
      this.autoPlayService.flushTable(task.parent);
    }
  }
  delTask(task : PlayTask) {
    this.$confirm('确定永久删除该任务? 此操作不可恢复！', '提示', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      task.parent.delTask(task);
      this.autoPlayService.flushTable(task.parent);
      this.$message({ type: 'success', message: '删除任务成功!' });
    }).catch(() => {});
  }
  enableTask(task : PlayTask, enable : boolean) {
    task.enabled = enable;
    this.autoPlayService.flushTable(task.parent);
  }
  playTask(task : PlayTask) {
    this.$confirm('确定开始播放此任务？', '提示', {
      confirmButtonText: '开始',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      task.play();
    }).catch(() => {});
  }
  stopTask(task : PlayTask) {
    this.$confirm('确定停止播放此任务？', '提示', {
      confirmButtonText: '开始',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      task.stop();
    }).catch(() => {});
  }
  flashTak(task : PlayTask, type : 'success'|'warn'|'error', time = 1600, feq = 300) {
    let name = '.task-' + task.parent.tasks.indexOf(task);
    let row = $(name);
    let timer = setInterval(() => row.toggleClass('flash-task-' + type), feq);
    row.addClass('flash-task-' + type);
    setTimeout(() => { 
      row.removeClass('flash-task-' + type);
      clearInterval(timer);
    }, time);
  }
  editCommandOrMusicTask(task : PlayTask) { 
    task.typeBackup = task.type;
    task.musicsBackup = CommonUtils.clone(task.musics);
    task.commandsBackup = CommonUtils.clone(task.commands);
    task.editingTask = true;
  }
  editTaskCommandOrMusicFinish(task : PlayTask, save : boolean) {
    task.editingTask = false;
    if(!save) {
      task.type = task.typeBackup;
      task.musics = task.musicsBackup;
      task.commands = task.commandsBackup;
    }
  }
  chooseTaskMusic(task : PlayTask, type : 'file'|'history', index : number) { 
    this.app.chooseOneMusicAndCallback(type, (music) => {
      if(index == -1) task.musics.push(music);
      else task.musics[index] = music
    });
  }

  autoSwitchCurrentView() {
    if(this.currentShowTable == null) {
      for(var i=0;i<this.tables.length;i++){
        if(this.tables[i].status == 'playing'){
          this.currentShowTable = this.tables[i];
          break;
        }
      }
    }
  }
  getTaskConHtml(task : PlayTask) {
    let b = task.condition.toConditionHtml();
    return '<div style="padding:0 3px;line-height: 29px;">' + (b == '' ? '<span style="font-size:12px;color:#888">未定义条件</span>' : b) + '</div>';
  }
  getTableStatusString(type : string) {
    switch(type){
      case 'playing': return '此计划表正在自动播放';
      case 'normal': return '此计划表今日不播放';
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

  .el-table__empty-block {
    height: 300px;
    line-height: 15px;
  }
  .el-table__empty-text {
    line-height: 15px;
  }
  tr,td {
    height: 29px;
  }
  td.el-table_1_column_3 .cell {
    padding: 0;
  }
  .el-table_1_column_2 .cell > div {
    font-size: 18px;
    line-height: 20px;
    text-align: center;
  }

  td {
    border-top: 2px solid transparent;
    border-bottom: 2px solid #f3f3f3;
    transition: all ease-in-out .4s!important;

    &:first-child {
      border-left: 2px solid transparent;
    }
    &:last-child {
      border-right: 3px solid transparent;
    }
  }

  .editing-task {

    td {
      border-top: 2px solid #0087bb;
      border-bottom: 2px solid #0087bb;
      background-color: #F5F7FA;

      &:first-child {
        border-left: 2px solid #0087bb;
      }
      &:last-child {
        border-right: 3px solid #0087bb;
      }
    }
  }

  .flash-task-warn {

    td {
      border-top: 2px solid #dd6300;
      border-bottom: 2px solid #dd6300;
      background-color: #ffecdd;

      &:first-child {
        border-left: 2px solid #dd6300;
      }
      &:last-child {
        border-right: 3px solid #dd6300;
      }
    }
  }
  .flash-task-success {

    td {
      border-top: 2px solid #28aa00;
      border-bottom: 2px solid #28aa00;
      background-color: #c7ffde;

      &:first-child {
        border-left: 2px solid #28aa00;
      }
      &:last-child {
        border-right: 3px solid #28aa00;
      }
    }
  }
  .flash-task-error {

    td {
      border-top: 2px solid #eb4200;
      border-bottom: 2px solid #eb4200;
      background-color: #ffd3c2;

      &:first-child {
        border-left: 2px solid #eb4200;
      }
      &:last-child {
        border-right: 3px solid #eb4200;
      }
    }
  }

  .cell {

    .controls .el-button {
      padding: 0;
    }
    .el-input-number {
      width: 50px;

      .el-input-number__decrease,
      .el-input-number__increase {
        width: 15px;
      }
    }
    .el-input-number.is-controls-right .el-input__inner {
      padding: 0;
      padding-right: 15px;
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
    
    .con-input {

      height: 29px;
    
      .con-html-host {
        height: 29px;
        line-height: 29px;
        border: none;

        .con-html {
          width: calc(100% - 18px);
          padding: 0 8px 0 6px;
          margin-left: 18px;
        }
        .el-input {
          width: calc(100% - 18px);
          margin-left: 21px;
        }
        .con-stat {
          width: 20px;
          border-radius: 0;
          border: none;

          span {
            line-height: 31px;
          }
        }
      }
    }
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
      background-color: #c3d8ca;
    }
    &[data-status='playing']{
      background-color: #1da546;
    }
    &[data-status='disabled']{
      background-color: rgba(226, 63, 13, 0.588);
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
.task-none {
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

  > span {
    margin: 20px 0 15px 0;
    line-height: 15px;
    color: #aaa;
  }
}
.propever-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.propever-taskarea {
  padding: 10px 2px;
}
.propever-commands {
  padding: 25px;
  border-radius: 0px;
  border: 6px solid #0087bb;
  box-shadow: 0 2px 12px 6px rgba(0,0,0,.2);

  .updown-drag {
    background-color: #0087bb;
  }
  .el-button--mini.is-circle {
    width: 24px;
    height: 24px;
    padding: 4px;
  }
  .el-input__inner {
    border-radius: 0;
  }
  .el-radio-button__inner {

    border-radius: 0!important;

    .el-radio-button__inner:hover {
      color: #0087bb;
    }
  }
  .el-radio-button__orig-radio:checked+.el-radio-button__inner {
    color: #FFF;
    background-color: #0087bb;
    border-color: #0087bb;
    box-shadow: -1px 0 0 0 #0087bb;
  }

  .popper__arrow {

    border-bottom-color:#0087bb;
    border-bottom-width: 12px;

    &::after {
      border-bottom-width: 12px;
    }
  }
}

.command-list {
  list-style: none;
  margin: 10px 0 20px 0;
  padding: 0;  
}
.command-items {
  list-style: none;
  margin: 4px 0;
  z-index: 3000;
  background-color: rgb(0, 135, 187);
  padding: 3px;
  border-radius: 20px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  align-content: center;

  .el-input__inner {
    background-color: rgba(255,255,255,.9);
    border-radius: 15px;
    border: none;

    &:hover {
      background-color: #fff;
      border: none;
    }
  }
}


.no-warp-span-full {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-warp-span {
  width: calc(100% - 20px);
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>


