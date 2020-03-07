<template>
  <div class="main-area table-area overflow-visible">
    <div v-if="currentEditTask" class="editing-mask" @click="maskClick"></div>
    <page-hoster v-if="currentShowPage" :el="currentShowPage.el" />
    <div v-else class="main-container p-0" v-loading="currentDeleteingTask">
      <div v-if="currentShowTable && (!currentShowTable.tasks || currentShowTable.tasks.length == 0)" class="table-none">
        <img src="../assets/images/empty-s.svg" />
        <span>这个时间表还没有任务哦</span>
        <el-button class="mt-3" type="primary" @click="addTask(currentShowTable)" round>添加任务</el-button>
      </div>
      <div v-else-if="currentShowTable" class="table-tasks">
        <div class="head">
          <div class="cell" style="width: 20%">
            状态/任务名称
            <sort-btn :order="currentShowTable.sort.order" :prop="currentShowTable.sort.prop" 
              thisProp="name" @updateSort="onUpdateTableSort" />
          </div>
          <div class="cell" style="width: 20%">
            播放条件
            <sort-btn :order="currentShowTable.sort.order" :prop="currentShowTable.sort.prop" 
              thisProp="condition" @updateSort="onUpdateTableSort" />
          </div>
          <div class="cell" style="width: 45%">
            音乐或任务
            <sort-btn :order="currentShowTable.sort.order" :prop="currentShowTable.sort.prop" 
              thisProp="music" @updateSort="onUpdateTableSort" />
          </div>
          <div class="cell" style="width: 10%">
            音量/循环
          </div>
        </div>
        <div class="body" id="task-body">
          <div v-if="currentEditTask && currentEditTask.editingTask" class="editing-task-musics" 
            :style="'top:'+currentEditTaskBoxTop+'px'">
            
            <span class="text-secondary mr-2">任务类型</span>
            <el-radio-group v-model="currentEditTask.type" size="mini">
              <el-radio-button label="music">播放音乐</el-radio-button>
              <el-radio-button label="command">执行 CMD 命令</el-radio-button>
              <el-radio-button label="reboot">重启电脑</el-radio-button>
              <el-radio-button label="shutdown">关闭电脑</el-radio-button>
              <el-radio-button label="mutetime">静音时段</el-radio-button>
            </el-radio-group>
            <div v-if="currentEditTask.type=='music'" class="propever-taskarea">
              <div class="task-prop-box mb-2">
                <span class="d-inline-block text-secondary" style="width:220px">任务的最大播放时长，超过后任务将会自动停止（为 0 则不限制）</span>
                <div class="d-inline-block">
                  <el-input-number v-model="currentEditTask.timeLimit.hours" class="mini-fix" size="mini" controls-position="right" :min="0" :max="23"></el-input-number> : 
                  <el-input-number v-model="currentEditTask.timeLimit.minute" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number> : 
                  <el-input-number v-model="currentEditTask.timeLimit.second" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number>
                </div>
              </div>
              <div class="text-secondary">当前任务的音乐，音乐将会按您设置的顺序从上至下播放</div>
              <command-list v-if="currentEditTask.musics && currentEditTask.musics.length > 0" lockAxis="y" axis="y" v-model="currentEditTask.musics">
                <command-item v-for="(music, index) in currentEditTask.musics" :index="index" :key="index">
                  <div class="updown-drag">
                    <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M814.17307 634.253637H163.708909c-32.045196 0-51.26956 20.829002-35.246962 36.846594C152.491463 696.734385 439.276067 996.332311 453.694027 1010.75653c17.622229 19.224364 56.075964 16.017591 72.093556 0C537.003777 999.540336 831.796551 688.726215 849.421284 671.100231c16.021346-17.620978-4.805152-35.248214-35.248214-36.846594zM163.708909 390.726669H814.17307c30.44181 0 51.26956-19.225616 35.248214-36.846594C831.796551 336.254091 537.003777 25.439971 524.189203 12.625397c-14.419212-16.022598-52.872946-17.627236-72.098562 0C439.276067 28.646743 152.491463 328.245921 128.461947 353.880075c-16.022598 16.022598 3.201766 36.846593 35.246962 36.846594z m0 0" fill="#fff"></path></svg>
                  </div>
                  <el-input style="display: inline-block;width: calc(100% - 200px);" size="mini" v-model="currentEditTask.musics[index].music.fullPath" :readonly="true"></el-input>
                  <el-popover
                    placement="top"
                    width="150"
                    trigger="click"
                    transition="pulse"
                    v-model="currentEditTask.chooseMusic2">
                    <p class="mt-0">选择音乐来源：</p>
                    <el-button size="mini" type="text" class="display-block m-0" 
                      @click="currentEditTask.chooseMusic2=false;chooseTaskMusic(currentEditTask,'file',index)">选择文件</el-button>
                    <el-button size="mini" type="text" class="display-block m-0"
                      @click="currentEditTask.chooseMusic2=false;chooseTaskMusic(currentEditTask,'history',index)">从音乐库中选择</el-button>
                    <el-button size="mini" type="text" class="display-block m-0" @click="currentEditTask.chooseMusic2=false;">取消</el-button>
                    <el-button slot="reference" type="primary" class="ml-1" size="mini" icon="el-icon-refresh-right" title="更换音乐" circle></el-button>
                  </el-popover>
                  <el-popover
                    placement="top"
                    width="160"
                    trigger="click"
                    transition="pulse"
                    v-model="currentEditTask.chooseMusic3">
                    <p class="mt-0">确定删除此音乐？</p>
                    <div style="text-align: right; margin: 0">
                      <el-button size="mini" type="text" @click="currentEditTask.chooseMusic3=false">取消</el-button>
                      <el-button type="primary" size="mini" @click="currentEditTask.chooseMusic3=false;currentEditTask.musics.remove(index)" round>确定</el-button>
                    </div>
                    <el-button slot="reference" type="danger" class="ml-1" size="mini" icon="el-icon-close" title="删除此音乐" circle></el-button>
                  </el-popover>
                  <el-popover
                    placement="top"
                    width="220"
                    trigger="click"
                    transition="pulse"
                    v-model="currentEditTask.chooseMusic4">
                    <p class="mt-0">设置音乐的起始播放时间。此时间不能超过音乐的长度，否则音乐不会播放</p>
                    <div class="mb-2">
                      <el-input-number v-model="currentEditTask.musics[index].startPos.hour" class="mini-fix" size="mini" controls-position="right" :min="0" :max="23"></el-input-number> : 
                      <el-input-number v-model="currentEditTask.musics[index].startPos.minute" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number> : 
                      <el-input-number v-model="currentEditTask.musics[index].startPos.second" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number>
                    </div>
                    <div style="text-align: right; margin: 0">
                      <el-button type="primary" size="mini" @click="currentEditTask.chooseMusic4=false" round>确定</el-button>
                    </div>
                    <el-button slot="reference" type="primary" class="ml-1" size="mini" title="设置音乐的起始播放时间" round>{{ currentEditTask.musics[index].startPos.getTimeString() }}</el-button>
                  </el-popover>
                  <el-popover
                    placement="top"
                    width="220"
                    trigger="click"
                    transition="pulse"
                    v-model="currentEditTask.chooseMusic5">
                    <p class="mt-0">设置音乐的最大播放时长，超过这个时间以后此音乐将会自动停止（为 0 则不限制）</p>
                    <div class="mb-2">
                      <el-input-number v-model="currentEditTask.musics[index].maxLength.hour" class="mini-fix" size="mini" controls-position="right" :min="0" :max="23"></el-input-number> : 
                      <el-input-number v-model="currentEditTask.musics[index].maxLength.minute" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number> : 
                      <el-input-number v-model="currentEditTask.musics[index].maxLength.second" class="mini-fix" size="mini" controls-position="right" :min="0" :max="59"></el-input-number>
                    </div>
                    <div style="text-align: right; margin: 0">
                      <el-button type="primary" size="mini" @click="currentEditTask.chooseMusic5=false" round>确定</el-button>
                    </div>
                    <el-button slot="reference" type="primary" class="ml-1" size="mini" title="设置音乐的最大播放时长" round>{{ currentEditTask.musics[index].maxLength.getTimeString() }}</el-button>
                  </el-popover>
                </command-item>
              </command-list>
              <div v-else class="text-secondary text-center mt-3 mb-3">当前任务没有音乐</div>
            </div>
            <div v-else-if="currentEditTask.type=='command'" class="propever-taskarea">
              <div class="task-prop-box text-secondary mb-2 d-block">
                <div>任务将会按您设置的 CMD 命令顺序执行，通常，您可以使用此功能来启动您自己的程序。</div>
                <el-checkbox v-model="currentEditTask.anyCommandErrStop">任意一个命令未成功执行则停止后续命令的执行</el-checkbox>
              </div>
              <command-list v-if="currentEditTask.commands && currentEditTask.commands.length > 0" lockAxis="y" axis="y" v-model="currentEditTask.commands">
                <command-item v-for="(conmmand, index) in currentEditTask.commands" :index="index" :key="index">
                  <div class="updown-drag">
                    <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M814.17307 634.253637H163.708909c-32.045196 0-51.26956 20.829002-35.246962 36.846594C152.491463 696.734385 439.276067 996.332311 453.694027 1010.75653c17.622229 19.224364 56.075964 16.017591 72.093556 0C537.003777 999.540336 831.796551 688.726215 849.421284 671.100231c16.021346-17.620978-4.805152-35.248214-35.248214-36.846594zM163.708909 390.726669H814.17307c30.44181 0 51.26956-19.225616 35.248214-36.846594C831.796551 336.254091 537.003777 25.439971 524.189203 12.625397c-14.419212-16.022598-52.872946-17.627236-72.098562 0C439.276067 28.646743 152.491463 328.245921 128.461947 353.880075c-16.022598 16.022598 3.201766 36.846593 35.246962 36.846594z m0 0" fill="#fff"></path></svg>
                  </div>
                  <el-input style="display: inline-block;width: calc(100% - 75px);" size="mini" v-model="currentEditTask.commands[index]" placeholder="输入您要执行 CMD 命令"></el-input>
                  <el-popover
                    placement="top"
                    width="160"
                    trigger="click"
                    transition="pulse"
                    v-model="currentEditTask.chooseMusic3">
                    <p class="mt-0">确定删除此命令？</p>
                    <div style="text-align: right; margin: 0">
                      <el-button size="mini" type="text" @click="currentEditTask.chooseMusic3=false">取消</el-button>
                      <el-button type="primary" size="mini" @click="currentEditTask.chooseMusic3=false;currentEditTask.commands.remove(index)" round>确定</el-button>
                    </div>
                    <el-button slot="reference" type="danger" class="ml-1" size="mini" icon="el-icon-close" title="删除此音乐" circle></el-button>
                  </el-popover>
                </command-item>
              </command-list>
              <div v-else class="text-secondary text-center mt-3 mb-3">当前任务没有命令</div>
            </div>
            <div v-else-if="currentEditTask.type=='shutdown'" class="propever-taskarea">
              <div class="text-secondary"><span class="text-important">提示：</span>此任务将会关闭计算机</div>
            </div>
            <div v-else-if="currentEditTask.type=='reboot'" class="propever-taskarea">
              <div class="text-secondary"><span class="text-important">提示：</span>此任务将会重启计算机</div>
            </div>
            <div v-else-if="currentEditTask.type=='mutetime'" class="propever-taskarea">
              <div class="text-secondary">
                <span class="text-important">提示：</span>
                此任务用于控制系统是否处于静音模式，必须将条件设置为时间段才能执行，例如：“19:00 至 24:00”、“12:00 至 13:00” 等等。
              </div>
            </div>

            <div class="propever-buttons">
              <div v-if="currentEditTask.type=='music'">                 
                <el-popover
                  placement="top"
                  width="150"
                  trigger="click"
                  transition="pulse"
                  v-model="currentEditTask.chooseMusic1">
                  <p class="mt-0">选择音乐来源：</p>
                  <el-button size="mini" type="text" class="display-block m-0" 
                    @click="currentEditTask.chooseMusic1=false;chooseTaskMusic(currentEditTask,'file',-1)">选择文件</el-button>
                  <el-button size="mini" type="text" class="display-block m-0"
                    @click="currentEditTask.chooseMusic1=false;chooseTaskMusic(currentEditTask,'history',-1)">从音乐库中选择</el-button>
                  <el-button size="mini" type="text" class="display-block m-0" @click="currentEditTask.chooseMusic1=false;">取消</el-button>
                  <el-button slot="reference" class="float-right" size="mini" round><i class="iconfont icon-tianjiaxiao mr-2"></i>添加音乐</el-button>
                </el-popover>
              </div>
              <div v-else-if="currentEditTask.type=='command'">
                <el-button size="mini" class="float-right" round @click="currentEditTask.commands.push('')"><i class="iconfont icon-tianjiaxiao mr-2"></i>添加命令</el-button>
              </div>
              <div v-else-if="currentEditTask.type=='shutdown'">
                <el-button size="mini" class="float-right" circle><i class="iconfont icon-cuowuhttp"></i></el-button>
              </div>
              <div v-else-if="currentEditTask.type=='reboot'">
                <el-button size="mini" class="float-right" circle><i class="iconfont icon-cuowuhttp"></i></el-button>
              </div>
              <div v-else-if="currentEditTask.type=='mutetime'">
                <el-button size="mini" class="float-right" circle><i class="iconfont icon-cuowuhttp"></i></el-button>
              </div>
              <div>
                <el-button size="mini" type="text" @click="editTaskCommandOrMusicFinish(currentEditTask, false)">取消</el-button>
                <el-button type="primary" size="mini" @click="editTaskCommandOrMusicFinish(currentEditTask, true)" round>确定</el-button>
              </div>
            </div>
            
          </div>
          <div v-for="(item, index) in currentShowTable.tasks" :key="index" 
            :class="'item '+(item.editing?'editing':'')" 
            :id="'task-item-'+item.uid">

            <div class="item-host">

              <div class="cell" style="width: 20%">
                <div class="status" v-if="!item.editing">
                  <el-tooltip v-if="item.status == 'normal'" placement="right" content="任务就绪，等待播放" :open-delay="400">
                    <i class="iconfont icon-dengdaiqueren"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'played'" placement="right" content="任务已播放" :open-delay="150">
                    <i class="iconfont icon-check text-success"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'disabled'" placement="right" content="任务已禁用" :open-delay="150">
                    <i class="iconfont icon-dengdaizhihang" style="color:#cacaca"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'error'" placement="right" content="播放时出现错误，点击查看错误信息" :open-delay="150">
                    <i class="iconfont icon-hj1 text-danger cursor-pointer" @click="showTaskLatestErrLog(item)"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'playing'" placement="right" content="任务正在播放" :open-delay="150">
                    <i class="iconfont icon-yanchu text-success"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'norule'" placement="right" content="未设置任务播放条件" :open-delay="150">
                    <i class="iconfont icon-hj1 text-warning"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'notplay'" placement="right" content="当前时间表今日不播放" :open-delay="400">
                    <i class="iconfont icon-zhihangzhong"></i>
                  </el-tooltip>
                  <el-tooltip v-else-if="item.status == 'parent-disabled'" placement="right" content="当前时间表已禁用" :open-delay="400">
                    <i class="iconfont icon-dengdaizhihang" style="color:#cacaca"></i>
                  </el-tooltip>
                </div>
                <el-input size="mini" placeholder="请输入任务名称" v-if="item.editing" v-model="item.name"></el-input>
                <span class="no-warp-span-full" v-else :title="item.name">{{item.name}}</span>
              </div>

              <div class="cell" style="width: 20%">
                <condition-input size="mini" v-show="item.editing" :condition="item.condition"></condition-input>
                <span class="no-warp-span-full" v-show="!item.editing" v-html="getTaskConHtml(item)"></span>
              </div>

              <div class="cell" style="width: 45%">
                <div class="no-warp-span" v-html="item.getPlayTaskHtml()"></div>
                <a v-if="item.editing" class="float-right" style="margin-top: 3px;" href="javascript:;" 
                  @click="editCommandOrMusicTask(item)" title="编辑音乐或任务">
                  <i class="iconfont icon-chuangzuo"></i>
                </a>
              </div>

              <div class="cell last" style="width: 10%" v-show="item.type=='music'">
                <el-input-number size="mini" controls-position="right" v-show="item.editing" v-model="item.volume"></el-input-number>
                <span class="badge badge-pill badge-primary" v-show="!item.editing">{{item.volume}}%</span>

                <el-input-number size="mini" controls-position="right" v-show="item.editing" v-model="item.loopCount"></el-input-number>
                <span class="badge badge-pill badge-info ml-1" v-show="!item.editing">{{item.loopCount}}次</span>
              </div>

              <div class="action" :id="'edit-task-area-' + index" v-show="!item.editing && !currentIsEditTask">
                <span class="mr-2 ml-2">
                  <b v-if="item.status == 'normal'">任务就绪，等待播放</b>
                  <b v-else-if="item.status == 'played'" class="text-success">任务已播放</b>
                  <b v-else-if="item.status == 'disabled'" style="color:#cacaca">任务已禁用</b>
                  <b v-else-if="item.status == 'error'" class="text-danger cursor-pointer" @click="showTaskLatestErrLog(item)">任务播放时出现错误，点击查看错误信息</b>
                  <b v-else-if="item.status == 'playing'" class="text-success">任务正在播放</b>
                  <b v-else-if="item.status == 'norule'" class="text-warning">未设置任务播放条件</b>
                  <b v-else-if="item.status == 'notplay'">当前时间表今日不播放</b>
                  <b v-else-if="item.status == 'parent-disabled'" style="color:#cacaca">当前时间表已禁用</b>
                </span>
                <button class="text-primary" title="编辑任务" @click="editTask(item)">
                  <i class="iconfont icon-chuangzuo"></i>
                </button>
                <button v-if="item.status != 'playing' && item.status != 'disabled'" class="text-success" title="立即开始播放任务" @click="playTask(item)">
                  <i class="iconfont icon-bofang1"></i>
                </button>
                <button v-else-if="item.status == 'disabled'" class="text-primary" title="启用任务" @click="enableTask(item, true)">
                  <i class="iconfont icon-weixuanzhong"></i>
                </button>
                <button v-else-if="item.status == 'playing'" class="text-danger" title="停止播放任务" @click="stopTask(item)">
                  <i class="iconfont icon-guanbi-copy"></i>
                </button>
              </div>
              <div class="action" :id="'editing-task-area-' + index" v-show="item.editing">
                <button class="text-primary more">
                  <i class="iconfont icon-cebianlanshouqi"></i>
                </button>
                <button class="text-success save" title="保存任务修改" @click="editTaskFinish(item, true)">
                  <i class="iconfont icon-duigou"></i>
                </button>
                <button class="text-danger" title="取消任务修改" @click="editTaskFinish(item, false)">
                  <i class="iconfont icon-tiaojian-copy"></i>
                </button>
                <button v-if="item.enabled" class="text-danger" title="禁用任务" @click="enableTask(item, false)">
                  <i class="iconfont icon-jinyong"></i>
                </button>
                <button v-else class="text-primary" title="启用任务" @click="enableTask(item, true)">
                  <i class="iconfont icon-weixuanzhong"></i>
                </button>
                <button class="text-danger" title="删除任务" @click="delTask(item)">
                  <i class="iconfont icon-shanchu2"></i>
                </button>
                <button class="text-primary">
                  <i class="iconfont icon-cebianlanzhankai"></i>
                </button>
              </div>

            </div>
            <div v-show="item.editing" class="item-placeholder"></div>

          </div>
          <div class="item add" id="task-item-add" @click="addTask(currentShowTable)">
            <div class="item-host">
              <i class="mr-3 iconfont icon-tianjiaxiao"></i>添加新任务
            </div>
          </div>
        </div>
      </div>
      <div v-else class="table-none">
        <img src="../assets/images/empty.svg" />
        <span v-if="tables && tables.length > 0">没有打开的列表<br />点击下方按钮来查看或编辑一个时间表</span>
        <span v-else>这里还没有时间表哦<br />点击下方 “<i class="iconfont icon-xinjiantuopu"></i>” 按钮新建一个时间表</span>
      </div>
    </div>
    <div class="bottom-area">
      <div class="table-tables">
        <table-list v-if="pages" lockAxis="x" axis="x" v-model="pages" :distance="20" @add="addTable" @input="resortPageEnd" class="pages">
          <table-item v-for="(page, index) in pages" :index="index" :key="index"
            :class="(page==currentShowPage?'active':'')+' page'"
            @click="showPage(page)"
            :id="'page_item_'+index">
            <span>{{ page.title }}</span>
            <a href="javascript:;" @click="closePage(page)" title="关闭">
              <i class="iconfont icon-tiaojian-copy"></i>
            </a>
          </table-item>
        </table-list>
        <table-list id="table-list" v-if="tables" lockAxis="x" axis="x" v-model="tables" :distance="20" @add="addTable" @input="resortTableEnd">
          <table-item v-for="(table, index) in tables" :index="index" :key="index" :table="table"
            :class="(table==currentShowTable?'active':'')"
            @click="showTable(table)"
            @contextmenu="showTableRightMenu(table)"
            @dblclick="editTable(table)"
            :id="'table_item_'+index" >
            <el-tooltip v-if="table.status == 'normal'" placement="top" content="此时间表今日不播放" :open-delay="400">
              <i class="status iconfont icon-dengdaizhihang"></i>
            </el-tooltip>
            <el-tooltip v-else-if="table.status == 'playing'" placement="top" content="此时间表正在自动播放" :open-delay="150">
              <i class="status iconfont icon-dengdaiqueren text-success"></i>
            </el-tooltip>
            <el-tooltip v-else-if="table.status == 'disabled'" placement="top" content="此时间表已禁用" :open-delay="150">
              <i class="status iconfont icon-dengdaizhihang" style="color:#cacaca"></i>
            </el-tooltip>
            {{ table.name }}
          </table-item>
        </table-list>
      </div>
      <div class="bottom-right-area">   
        <el-tooltip v-if="currentShowTable"  placement="top" content="设置时间表属性">
          <a type="text" class="icon" @click="editTable(currentShowTable)" href="javascript:;"><i class="iconfont icon-ccaozuo"></i></a>
        </el-tooltip>
        <el-tooltip v-if="currentShowTable" placement="top" content="向时间表添加一个任务">
          <a type="text" class="icon" @click="addTask(currentShowTable)" href="javascript:;"><i class="iconfont icon-zengjia1"></i></a>
        </el-tooltip>
        <div v-if="currentShowTable" class="card-tab-float info-area">
          <span v-if="currentShowTable.status=='normal'" class="text-secondary mr-2">时间表已启用但今日不播</span>
          <span v-else-if="currentShowTable.status=='playing'" class="text-success mr-2">时间表正在播放</span>
          <span v-else-if="currentShowTable.status=='disabled'" class="text-danger mr-2">时间表已禁用</span>
          <el-tooltip v-if="currentShowTable" placement="top" :content="currentShowTable.enabled?'禁用时间表':'启用时间表'">
            <div :class="'ex-toggle '+(currentShowTable.enabled?'on':'off')" 
              @click="enableTable(currentShowTable, !currentShowTable.enabled)"></div>
          </el-tooltip>
        </div>  
      </div>
      <div class="bottom-right-footer"></div>
    </div>
    <!--编辑时间表对话框-->
    <el-dialog
      :title="(currentIsNewTable?'添加':'编辑')+'时间表'"
      :visible.sync="currentIsEditTable"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      class="el-dialog-width-fix-60">
      <el-form v-if="currentEditTable" label-position="right" label-width="100px" 
        :model="currentEditTable" :rules="rulesTable" ref="tableForm" 
        size="small">
        <el-form-item label="时间表名称" prop="name">
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

import ConditionInput from '../components/ConditionInput.vue'
import AudioWave from '../components/AudioWave.vue'
import AutoTimerStatus from '../components/AutoTimerStatus.vue'
import PageHoster from '../components/PageHoster.vue'
import SortProp from '../components/SortProp.vue'

import $ from 'jquery';
import App from '../App.vue'
import { Form } from 'element-ui'

import CommonUtils from "../utils/CommonUtils";
import AutoPlayService from "../services/AutoPlayService";
import TableServices from '../services/TableServices'

import { ContainerMixin, ElementMixin } from 'vue-slicksort';
import { PlayTask } from "../model/PlayTask";
import { PlayTable } from '../model/PlayTable'
import { MainPage } from '../model/MainPage'
import { AutoPlayStatus } from "../model/PlayInterfaces";
import { MusicTask } from "../model/MusicItem";
import { loadMenuIcon } from "../utils/MenuUtils";

const electron = require('electron');
const remote = electron.remote;
const Menu = electron.remote.Menu;
const MenuItem = electron.remote.MenuItem;

const SortableListTable = {
  mixins: [ContainerMixin],
  template: `
    <ul class="list">
      <slot />
      <el-tooltip placement="top" content="添加播放时间表">
        <li class="add" @click="onAddClick"><i class="iconfont icon-xinjiantuopu"></i></li>
      </el-tooltip>
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
    'auto-status': AutoTimerStatus,
    'page-hoster': PageHoster,
    'sort-btn': SortProp,
  }
})
export default class TableView extends Vue {

  @Prop({default:null}) tableService : TableServices;
  @Prop({default:null}) autoPlayService : AutoPlayService;
  @Prop({default:null}) app : App;
  
  tables : Array<PlayTable> = null;
  pages : Array<MainPage> = [];
  
  currentShowPage : MainPage = null;
  currentShowTable : PlayTable = null;
  currentEditTable : PlayTable = null;
  currentDragTable : PlayTable = null;
  currentEditTableBackUp = null;
  currentIsNewTable = false;
  currentIsEditTable = false;
  currentIsEditTask = false;
  currentEditTask = null;
  currentEditTaskBoxTop = 0;
  currentEditTaskBackUp = null;
  currentDeleteingTask = false;

  menuTable : Electron.Menu = null;

  rulesTable = {
    name: [
      { required: true, message: '请输入时间表名称名称', trigger: 'blur' },
      { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
    ],
    note: [
      { required: false, trigger: 'blur' },
      { max: 100, message: '长度在 0 到 100 个字符之间', trigger: 'blur' }
    ],
  };

  mounted() {
    this.tables = this.tableService.tables;
    this.createMenu();
    PlayTask.setGlobalStateChangedCallback(this.globalTaskStateChanged);
    setTimeout(this.autoSwitchCurrentView, 1300);
  }

  createMenu() {
    this.menuTable = new Menu();
    this.menuTable.append(new MenuItem({ label: '编辑时间表', click: () => this.editTable(this.currentEditTable) }));
    this.menuTable.append(new MenuItem({ label: '禁用时间表', click: () => this.enableTable(this.currentEditTable, false), icon: loadMenuIcon(require('../assets/images/menu/ban.png')) }));
    this.menuTable.append(new MenuItem({ label: '启用时间表', click: () => this.enableTable(this.currentEditTable, true), icon: loadMenuIcon(require('../assets/images/menu/play.png')) }));
    this.menuTable.append(new MenuItem({ label: '删除时间表', click: () => this.delTable(this.currentEditTable), icon: loadMenuIcon(require('../assets/images/menu/delete.png')) }));
    this.menuTable.append(new MenuItem({ type: 'separator' }));
    this.menuTable.append(new MenuItem({ label: '添加时间表', click: () => this.addTable(), icon: loadMenuIcon(require('../assets/images/menu/add.png')) }));
  }

  tableSortChange(obj : { column : Number, prop : string, order }) {
    if(this.currentShowTable && this.currentShowTable instanceof PlayTable) {
      this.currentShowTable.sort.order = obj.order;
      this.currentShowTable.sort.prop = obj.prop;
      this.currentShowTable.doSort();
    }
  }
  tableFilterEnabled(value, row : PlayTask) {
    return value == row.enabled;
  }
  tableFilterStatus(value, row : PlayTask) {
    return value == row.status;
  }
  tableFormatterCondition(row : PlayTask, column, cellValue, index) {
    return row.condition.toConditionHtml();
  }
  tableFormatterMusic(row : PlayTask, column, cellValue, index) {
    return row.getPlayTaskString();
  }

  addTable() {
    this.currentEditTable = new PlayTable();
    this.currentIsNewTable = true;
    this.currentIsEditTable = true;
  }
  delTable(table : PlayTable) {
    this.$confirm('确定永久删除该时间表? 此操作将会删除其下所有任务，并且<b style="color:red">不可恢复</b>！', '提示', {
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
      this.$message({ type: 'success', message: '时间表已删除!' });
    }).catch(() => {});
  } 
  enableTable(table : PlayTable, enable : boolean) {
    if(table.enabled != enable) {
      this.$confirm(enable ? '是否启用该时间表? ' : '确定禁用该时间表? 此时间表将不会被自动播放', '提示', {
        confirmButtonText: enable ? '启用' : '禁用',
        cancelButtonText: '取消',
        roundButton: true,
        type: 'warning'
      }).then(() => {
        table.enabled = enable;
        this.autoPlayService.flushTable(table);
        this.$message({ type: 'success', message: '时间表已' + (enable ? '启用' : '禁用') + '!' });
      }).catch(() => {
        table.enabled = !enable;
      });
    }
  } 
  editTable(table : PlayTable) {
    this.currentEditTable = table;
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
  onUpdateTableSort(prop, order) {
    if(this.currentShowTable) {
      this.currentShowTable.sort.prop = prop;
      this.currentShowTable.sort.order = order;
      this.currentShowTable.doSort();
    }
  }
  resortTableEnd(arr : any[]) {
    for(let i = 0; i < arr.length; i++){
      this.tables[i] = arr[i];
      this.tableService.tables[i] = arr[i];
    }
  }
  resortPageEnd(arr : any[]) {
    for(let i = 0; i < arr.length; i++){
      this.pages[i] = arr[i];
    }
  }

  leaveTableCheck() : Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if(this.currentShowTable && this.currentEditTask != null) {
        this.$confirm('您希望放弃当前任务修改吗？', '提示', {
          confirmButtonText: '放弃',
          cancelButtonText: '返回继续修改',
          roundButton: true,
          type: 'warning'
        }).then(() => {
          resolve(false)
        }).catch((e) => {
          resolve(true)
        });
      } else resolve(false);
    });
  }
  showPage(table : MainPage) { 
    this.leaveTableCheck().then((v) => {
      if(!v) {
        this.currentShowPage = table;
        this.currentShowTable = null;
      }
    })
  }
  showTable(table : PlayTable) { 
    this.leaveTableCheck().then((v) => {
      if(!v) {
        this.currentShowTable = table;
        this.currentEditTable = table;
        this.currentShowPage = null;
      }
    })
  }
  showTableRightMenu(table : PlayTable) { 
    this.currentEditTable = table; 
    this.menuTable.items[1].visible = table.enabled;
    this.menuTable.items[2].visible = !table.enabled;
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
  scrollToTask(task : PlayTask) {
    setTimeout(() => {
      var item = document.getElementById('task-item-'+task.uid);
      if(item) item.scrollIntoView();
    }, 500);
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
    this.scrollToTask(task);
  }
  editTask(task : PlayTask) { 
    task.editing = true; 
    this.currentEditTask = task;
    this.currentIsEditTask = true;
    this.currentEditTaskBackUp = CommonUtils.clone(task);
    this.scrollToTask(task);
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
      task.parent.doSort();
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
      let table = task.parent
      if(this.currentEditTask == task) {
        this.currentEditTask = null;
        this.currentIsEditTask = false;
      }

      table.delTask(task);
      this.autoPlayService.flushTable(table);
      this.$message({ type: 'success', message: '任务已删除!' });

      if(table == this.currentShowTable) {
        this.currentDeleteingTask = true;
        this.currentShowTable = null;
        setTimeout(() => {this.currentShowTable = table; this.currentDeleteingTask = false }, 200)
      }
    }).catch((e) => {
      console.log(e);
    });
  }
  enableTask(task : PlayTask, enable : boolean) {
    task.enabled = enable;
    this.autoPlayService.flushTable(task.parent);
  }
  playTask(task : PlayTask) {
    this.$confirm(this.autoPlayService.isMuteTime ? '现在是静音时段，确定继续播放此任务？' : '确定开始播放此任务？', '提示', {
      confirmButtonText: '播放',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => task.play(false)).catch(() => {});
  }
  stopTask(task : PlayTask) {
    this.$confirm('确定停止播放此任务？', '提示', {
      confirmButtonText: '停止',
      cancelButtonText: '取消',
      roundButton: true,
      type: 'warning'
    }).then(() => {
      task.stop();
    }).catch(() => {});
  }
  flashTak(task : PlayTask, type : 'success'|'warn'|'error', time = 1600, feq = 300) {
    if(task.parent && task.parent == this.currentShowTable) {
      let name = '.task-' + task.parent.tasks.indexOf(task);
      let row = $(name);
      let timer = setInterval(() => row.toggleClass('flash-task-' + type), feq);
      row.addClass('flash-task-' + type);
      setTimeout(() => { 
        row.removeClass('flash-task-' + type);
        clearInterval(timer);
      }, time);
    }
  }
  showTaskLatestErrLog(task : PlayTask) {
    this.app.showLogView(task.currentPlayLogItem)
  }
  editCommandOrMusicTask(task : PlayTask) { 
    task.typeBackup = task.type;
    task.musicsBackup = CommonUtils.clone(task.musics);
    task.commandsBackup = CommonUtils.clone(task.commands);
    task.editingTask = true;

    this.currentEditTaskBoxTop = 
      $('#task-item-' + task.uid).offset().top - $('#task-body').offset().top + 40;
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
      if(index == -1) task.musics.push(new MusicTask(music));
      else task.musics[index].music = music
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

  maskClick() {
    if(this.currentEditTask!=null) this.scrollToTask(this.currentEditTask);
  }


  //Pages

  findPage(name : string) {
    for (let index = 0; index < this.pages.length; index++) {
      if(this.pages[index].name == name)
        return this.pages[index];
    }
    return null;
  }
  addPage(name : string, title : string, el : any) {
    let page = this.findPage(name);
    if(page == null) {
      page = new MainPage(name, title, el);
      this.pages.push(page);
    }
    else {
      page.title = title;
      page.el = el;
    }
    this.showPage(page);
    return page;
  }
  closePage(page : MainPage) {
    this.pages.remove(page);
    if(this.currentShowPage == page)
      this.currentShowPage = null;
  }


  editOneItemForGuide() {
    this.editTask(this.currentShowTable.tasks[0]);
  }
  editOneItemFinishForGuide() {
    this.currentShowTable.tasks[0].editing = false;
    this.currentEditTask = null;
    this.currentIsEditTask = false;
  }
  goToOneTableForGuide() {
    let table : PlayTable = null;
    let task : PlayTask = null;
    if(this.tableService.tables.length == 0) {
      table = new PlayTable();
      table.name = '示例播放列表';
      table.note = '这是一个示例播放列表，用于为您演示系统的操作方法';
      this.tableService.addTable(table);
    } else {
      table = this.tableService.tables[0];
    }
    if(table.tasks.length == 0) {
      task = new PlayTask();
      task.name = '示例播放任务';
      task.note = '这是一个示例播放任务，用于为您演示系统的操作方法';
      table.addTask(task);
    }
  }
  
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

/* Table */

.table-area {
  .main-container {
    padding: 30px;
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

.table-tasks {

  position: absolute;
  display: block;
  left: 35px;
  right: 35px;
  top: 35px;
  bottom: 35px;
  border: 1px solid #efefef;

  .cell {

    display: inline-flex!important;
    justify-content: flex-start;
    align-items: center;
    height: 30px;
    padding: 2px 8px;
    transition: all ease-in-out .2s;

    &:not(:last-child) {
      border-right: 1px solid #efefef;
    }
    &.last {
      border-right: none;
    }
    
    .controls .el-button {
      padding: 0;
    }
    .el-input-number {
      width: 50px;

      .el-input-number__decrease,
      .el-input-number__increase {
        width: 15px;
        background: transparent;
        border: none;
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
          background-color: transparent;

          span {
            line-height: 31px;
          }
        }
      }
    }
  }

  .head {
    position: relative;
    border-bottom: 1px solid #efefef;
    display: flex;
    border-right: 5px solid #efefef;

    .cell {
      padding: 3px 8px 6px 8px;
      font-size: 13px;
      font-weight: bold;
      color: #888;

      .sort-icon {
        margin-top: 4px;
      }
    }
  }
  .body {
    position: absolute;
    left: 0;
    right: 0;
    top: 40px;
    bottom: 0;
    overflow: hidden;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      width: 5px;
      height: 5px;
      background-color: #efefef;
    }
    &::-webkit-scrollbar-thumb {
      background: #b9b9b9;
      opacity: .7;
      border-radius: 3px;

      &:hover {
        background: #6b6b6b;
      }
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .item {
    
    border-bottom: 1px solid #efefef;

    .item-placeholder {
      display: block;
      height: 35px;
      padding: 2px 8px;
    }
    .item-host {
      display: flex!important;
      justify-content: flex-start;
      align-items: center;
      position: relative;
      border-radius: 30px;
      margin: 0;
      transition: all ease-in-out .2s;
      border: 1px solid transparent;
    }

    .action {
      position: absolute;
      padding: 4px 10px;
      background-color: white;
      box-shadow: 0 3px 11px 0px rgba(0, 0, 0, 0.08);
      border: 1px solid #eee;
      transition: all ease-in-out .2s;
      transform: scale(0);
      right: 0;
      border-radius: 30px;
      z-index: 100;

      .more {
        margin: 0;
        cursor: default;

        &:hover {
          background: none;
        }
      }
      button {
        display: inline-block;
        width: 30px;
        height: 30px;
        padding: 0;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;

        &:hover {
          background:rgba(202, 202, 202, 0.3);
        }
      }
    }

    &.editing,
    &:hover {

      .item-host {
        background-color: #fff;
        border: 1px solid #eee;
        //box-shadow: 0 3px 11px 0px rgba(0, 0, 0, 0.08);
        //transform: scale(1.02);

        .cell {
          border-right: 1px solid transparent;
        }
        .action {
          transform: scale(1);
        }
      }
    }

    &.editing {

      .item-host {
        position: absolute;
        z-index: 2;
        width: calc(100% - 50px);

        .action {
          right: -50px;

          button:not(.more) {
            display: none;
          }
          &:hover {
            .more {
              display: none;
            }
            button:not(.more) {
              display: inline-block;
            }
          }
        }
      }

      
      
    }
    &.add {
      text-align: center;
      padding: 8px;
      cursor: pointer;

      .item-host {
        justify-content: center;
      }
      &:hover .item-host {
        background-color: transparent;
         border-color: transparent;
        color: #0078c9;
      }
    }

  }

  .editing-task-musics {
    position: absolute;
    display: block;
    top: 50px;
    right: 0;
    width: 500px;
    z-index: 3;
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 3px 11px 0px rgba(0, 0, 0, 0.08);

    .task-prop-box {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      background-color: #eee;
      padding: 5px;
      border-radius: 5px;
    }
    .title {
      display: inline-block;
      margin: 0 0 10px 0;
      font-size: 12px;
      font-weight: bold;
      color: #888;
    }

    &::after {
      display: inline-block;
      width: 0;
      height: 0;
      position: absolute;
      top: -18px;
      left: 100px;
      content: '';
      border-width: 10px;
      border-style: solid;
      border-color: transparent transparent #fff transparent;
    }
  }

  .status {
    font-size: 18px;
    display: inline-block;
    margin-right: 8px;
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

  th.is-center .cell,
  td.is-center .cell {
    justify-content: center;
  }

  
}
.table-tables {
  position: absolute;
  left: 0;
  top: 0;
  right: 100px;

  .list {
    display: inline-block;
    list-style: none;
    margin: 0;
    padding: 0 10px;
    vertical-align: top;

    &.pages {
      padding-right: 0;

      .add {
        display: none;
      }
    }
  }
}
.table-items, .table-tables li {

  $item-round-width-border: 6px;

  position: relative;
  display: inline-block;
  font-size: 16px;
  line-height: 16px;
  text-align: center;
  padding: 10px 8px;
  margin: 0 4px;
  border-bottom-left-radius: $item-round-width-border;
  border-bottom-right-radius: $item-round-width-border;
  user-select: none;
  vertical-align: middle;
  cursor: pointer;
  transition: color,background-color,box-shadow ease-in-out .15s;
  white-space: nowrap;

  &.active,
  &:focus,
  &:hover {
    background-color: white;
    box-shadow: 0 6px 11px 0px rgba(0, 0, 0, 0.08);

    &::after,
    &::before {
      display: inline-block;
    }
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
    box-shadow: none;

    &:hover {
      color: #0078c9;
      background-color: transparent;
      box-shadow: none;
    }

    i {
      font-size: 16px;
      font-weight: bold;
    }
  }
  &.dragging {
    position: absolute;
  }
  &.page {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    span {
      display: inline-block;
    }
    a {
      display: inline-block;
      color: #000;
      font-size: 12px;
      width: 12px;
      height: 14px;
      margin-left: 0.5rem;

      &:hover {
        color: #0078c9;
      }
    }
  }
  &.center {
    text-align: center;
    padding: 8px;
  }

  $item-round-width: 2px;

  &::after {
    display: none;
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    border-style: solid;
    border-width: $item-round-width;
    border-color: transparent transparent white transparent;
    left: -$item-round-width;
    top: -$item-round-width;
    transform: rotate(45deg);
  }
  &::before {
    display: none;
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    border-style: solid;
    border-width: $item-round-width;
    border-color: transparent transparent white transparent;
    right: -$item-round-width;
    top: -$item-round-width;
    transform: rotate(-45deg);
  }

  .status {

    display: inline-block;
    cursor: pointer;
    margin-right: 3px;
    font-size: 20px;
    line-height: 16px;
    vertical-align: middle;

    &[data-status='unknow']{
      background-color: #420000;
    }
    &[data-status='normal']{
      background-color: rgba(0, 184, 6, 0.2);
    }
    &[data-status='playing']{
      background-color: #00b706;
    }
    &[data-status='disabled']{
      background-color: rgba(202, 202, 202, 0.588);
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
    max-width: 160px;
  }
  > span {
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

/*  */

.editing-mask {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,.1);
}

/* bottom area */

.bottom-right-area {
  position: absolute;
  width: 290px;
  top: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 10px 10px 10px;

  > a {
    color: #000;
    font-size: 16px;
    margin-right: 15px;
    padding: 7px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
   
    text-align: center;

    &.icon {
      font-weight: bold;
      padding: 4px 8px 5px 8px;
      margin-right: 5px;
    }

    &:hover {
      color: #0078c9;
    }

    i {
      font-size: 16px;
    }
  }

  .info-area {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    height: 30px;
    padding: 2px 9px;
    font-size: 12px;

    .el-button--mini, .el-button--mini.is-round {
      padding: 5px 8px;
    }
  }
}
.bottom-right-footer {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 120px;
  height: 30px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* propever */

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

/* command list */

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

  .el-button--mini.is-round {
    padding: 7px;
  }
  .el-input-group__append {
    background-color: transparent;
    border: none;
    padding-right: 15px;

    .el-button.el-button--danger {
      color: #FFF;
      background-color: #F56C6C;
      border-color: #F56C6C;

      &:hover {
        background: #f78989;
        border-color: #f78989;
      }
    }
    .el-button.el-button--mini.is-circle {
      margin-left: -16px;
    }
  }
}

/* Others */

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


