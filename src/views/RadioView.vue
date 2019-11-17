<template>
  <div class="main-area radio-area overflow-visible">
    <div class="main-container" style="padding: 30px; padding-top: 5px;">
      <el-tabs v-model="activeName">
        <el-tab-pane label="文字转语音朗读" name="readload">
          <span class="text-secondary" style="font-size:12px">
            <i class="fa fa-exclamation-triangle mr-2" style="color: #db9411"></i> 
            本功能需要联网。另外，您最高可以 <span class="text-important">每分钟一条</span> 的速度发送 <span class="text-important">150 字</span> 以内的广播消息。
          </span>
          <el-input
            class="mt-3 mb-3"
            type="textarea"
            :disabled="readAloudCurrentAudio!=null"
            :autosize="{ minRows: 3, maxRows: 10}"
            placeholder="请输入要朗读的内容"
            :maxlength="readAloudMaxCount"
            show-word-limit
            v-model="readAloudContent">
          </el-input>
          <el-row :gutter="20" v-if="readAloudCurrentAudio==null">
            <el-col :span="6">
              <span class="demonstration">语速</span>
              <el-slider v-model="readAloudSpeed" :min="0" :max="15" :step="1" :format-tooltip="formatTooltipSpe"></el-slider>
            </el-col>
            <el-col :span="6">
              <span class="demonstration">音调</span>
              <el-slider v-model="readAloudPit" :min="0" :max="15" :step="1" :format-tooltip="formatTooltipPit"></el-slider>
            </el-col>
            <el-col :span="6">
              <span class="demonstration">发音人</span>
              <el-select v-model="readAloudPer" placeholder="请选择发音人" size="mini" class="round mt-2">
                <el-option
                  v-for="item in readAloudPerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6" class="text-right">
              <span>&nbsp;</span>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="" type="flex" align="bottom">
            <el-col :span="6">
              <span class="demonstration">音量</span>
              <el-slider v-model="readAloudVolLocal" :min="0" :max="100"></el-slider>
            </el-col>
            <el-col :span="6">
              <span v-if="readAloudCurrentAudio!=null">
                已生成语音，如果您要播放其他语音，请先清除当前语音。
              </span>
              <span v-else>&nbsp;</span>
            </el-col>
            <el-col :span="6">
              <span class="demonstration">循环次数</span>
              <el-select v-model="readAloudLoop" placeholder="请选择循环次数" size="mini" class="round mt-2">
                <el-option
                  v-for="item in readAloudLoopOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6" class="text-right">
              
              <div class="mt-2">
                <el-button :disabled="readAloudContent==''" v-if="readAloudCurrentAudio==null" type="primary" size="mini" @click="readAloud" round>开始朗读</el-button>
                <div v-else class="display-inline-block mr-3">
                  <a v-if="readAloudCurrentAudioStatus=='playing'" class="common-a-button big" @click="readAloudSwitch('paused')" title="暂停语音" round><i class="iconfont icon-bofang"></i></a>
                  <a v-else size="mini" @click="readAloudSwitch('playing')" class="common-a-button big" title="播放语音" round><i class="iconfont icon-zanting"></i></a>
                  <a :class="'common-a-button big'+(readAloudCurrentAudioStatus=='normal'?' disabled':'')" @click="readAloudSwitch('stop')" title="停止播放语音" round><i class="iconfont icon-zhongzhi"></i></a>
                </div>
                <el-button :disabled="readAloudContent==''&&readAloudCurrentAudio==null" size="mini" @click="readAloudContent='';readAloudCurrentAudio=null" round>{{readAloudCurrentAudio==null?'清空':'清空语音'}}</el-button>
              
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="在线广播电台 FM" name="fm">
          
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="bottom-area d-flex justify-content-end align-items-center pr-4">

    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import axios from 'axios'
import { Loading } from "element-ui";
import { MusicStatus } from "../model/MusicItem";
import staticSettingsServices from "../services/SettingsServices";

@Component({
  components: {

  }
})
export default class RadioView extends Vue {
  activeName = 'readload';

  readAloudMaxCount = 150;
  readAloudContent = '';
  readAloudPer = 1;// 发音人选择, 基础音库：0为度小美，1为度小宇，3为度逍遥，4为度丫丫，
  readAloudPerOptions = [
    {
      value: 0,
      label: '度小美'
    },
    {
      value: 1,
      label: '度小宇'
    },
    {
      value: 2,
      label: '度逍遥'
    },
    {
      value: 3,
      label: '度丫丫'
    },
  ]
  readAloudLoopOptions = [
    {
      value: 1,
      label: '1 次'
    },
    {
      value: 2,
      label: '2 次'
    },
    {
      value: 3,
      label: '3 次'
    },
    {
      value: 4,
      label: '4 次'
    },
    {
      value: 5,
      label: '5 次'
    },
    {
      value: 6,
      label: '6 次'
    },
  ];
  readAloudLoop = 1;
  readAloudSpeed = 5;// 语速，取值0-15，默认为5中语速
  readAloudPit = 5; // 音调，取值0-15，默认为5中语调
  readAloudVol = 5;// 音量，取值0-9，默认为5中音量
  readAloudToken = null;
  readAloudTokenLastRequestTime : Date = null;
  readAloudCurrentAudio : HTMLAudioElement = null;
  readAloudCurrentAudioStatus : MusicStatus = 'normal';
  readAloudLoopCurrent = 0;
  readAloudVolLocal = 100;

  mounted() {
    this.readAloudVolLocal = staticSettingsServices.getSettingNumber('player.readAloudVolume');
    staticSettingsServices.addListener('beforesave', () => {
      staticSettingsServices.setSettingNumber('player.readAloudVolume', this.readAloudVolLocal);
    })
  }

  @Watch('readAloudVolLocal')
  onreadAloudVolLocalChanged(newV) {
    if(this.readAloudCurrentAudio) this.readAloudCurrentAudio.volume = newV / 100;
  }

  //你好，这是我的铃声播放系统。初次见面，请多多指教
  /*下面播送一则通知：初次见面，请多多指教，通知播送完毕
  下面播送一则通知：请所有广播社成员速前往广播社集合，请所有广播社成员速前往广播社集合，通知播送完毕
   */

  baiduApiclient_id = 'mazxASmgQAsSllytiLyjPa0G';
  baiduApiclient_secret = 'jIii5eFIvIg3qDX7TSoE4ZICZIUjGr3l';

  refeshToken() : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if(this.readAloudToken && this.readAloudTokenLastRequestTime){
        if(new Date().getTime() - this.readAloudTokenLastRequestTime.getTime() < this.readAloudToken.expires_in){
          resolve(this.readAloudToken.access_token);
          return;
        }
      }
      axios.get('https://openapi.baidu.com/oauth/2.0/token?'+
        `grant_type=client_credentials&client_id=${this.baiduApiclient_id}&client_secret=${this.baiduApiclient_secret}`)
        .then((response) => {
          this.readAloudToken = response.data;
          this.readAloudTokenLastRequestTime = new Date();
          resolve(this.readAloudToken.access_token);
        }).catch((reason) => reject(reason));
    })
  }
  readAloud() {
    let loadingInstance = Loading.service({ fullscreen: true, text: '正在合成语音，请稍后...' });
    this.refeshToken().then((token) => {
      let text = encodeURIComponent(encodeURIComponent(this.readAloudContent));
      let url = `https://tsn.baidu.com/text2audio?tex=${text}&per=${this.readAloudPer}&spd=${this.readAloudSpeed}`+
        `$pit=${this.readAloudPit}&vol=${this.readAloudVol}&cuid=radio&tok=${token}&aue=3&lan=zh&ctp=1`;
      let audio = document.createElement('audio');
      document.body.appendChild(audio);
      audio.addEventListener('ended', () => {
        this.readAloudLoopCurrent++;
        if(this.readAloudLoopCurrent >= this.readAloudLoop)
          this.readAloudCurrentAudioStatus = 'normal';
        else {
          this.readAloudCurrentAudio.currentTime = 0;
          this.readAloudCurrentAudio.play();
          this.readAloudCurrentAudioStatus = 'playing';
        }
      })
      audio.src = url;
      loadingInstance.close();
      this.readAloudLoopCurrent = 0;
      this.readAloudCurrentAudio = audio;
      this.readAloudCurrentAudioStatus = 'normal';
      this.readAloudSwitch('playing');
    }).catch((reason) => {
      loadingInstance.close();
      this.readAloudCurrentAudio = null;
      this.$alert('请检查您的网络连接？' + reason, '播放语音失败', { type: 'error' })
    })
  }
  readAloudSwitch(status : MusicStatus) {
    if(status == this.readAloudCurrentAudioStatus) return;
    if(status == 'playing') {
      if(this.readAloudCurrentAudioStatus == 'normal')
        this.readAloudLoopCurrent = 0;
      this.readAloudCurrentAudio.play().then(() => {
        this.$message({ type: 'success', message: '正在播放语音' })
      }).catch((reason) => {
        this.readAloudCurrentAudioStatus == 'playerr';
        this.readAloudCurrentAudio = null;
        this.$alert(reason, '播放语音失败', { type: 'error' })
      })
    }else if(status == 'paused' || status == 'normal') 
      this.readAloudCurrentAudio.pause();
    this.readAloudCurrentAudioStatus = status;
  }

  formatTooltipVol(val : number) {
    switch(val) {
      case 0: 
        return '静音';
      case 1: 
      case 2: 
      case 3: 
      case 4: 
        return '较低音量';
      case 5: 
        return '中等音量';
      case 6: 
      case 7: 
      case 8: 
        return '较高音量';
      case 9: 
        return '最大音量';
    }
    return val;
  }
  formatTooltipSpe(val : number) {
    switch(val) {
      case 0: 
        return '最慢语速';
      case 1: 
      case 2: 
        return '慢语速';
      case 3: 
      case 4: 
        return '较慢语速';
      case 5: 
        return '中等语速';
      case 6: 
      case 7: 
      case 8: 
        return '较快语速';
      case 9: 
      case 10: 
      case 11: 
        return '快语速';
      case 12: 
      case 13: 
        return '非常快语速';
      case 14:
      case 15:
        return '最快语速';
    }
    return val;
  }
  formatTooltipPit(val : number) {
    switch(val) {
      case 0: 
        return '最低音调';
      case 1: 
      case 2: 
        return '低音调';
      case 3: 
      case 4: 
        return '较低音调';
      case 5: 
        return '中等音调';
      case 6: 
      case 7: 
      case 8: 
        return '较高音调';
      case 9: 
      case 10: 
      case 11: 
        return '高音调';
      case 12: 
      case 13: 
        return '非常高音调';
      case 14:
      case 15:
        return '最高音调';
    }
    return val;
  }
}
</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.radio-area {

  font-size: 13px;

  h3 {
    margin: 0;
  }
  .block {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .el-slider {
      display: inline-block;
      width: calc(100% - 130px);
    }
    .demonstration {
      display: inline-block;
      font-size: 15px;
      color: #888;
      width: 100px;
    }
  }
}
</style>


