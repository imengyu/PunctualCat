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
            :autosize="{ minRows: 5, maxRows: 10}"
            placeholder="请输入要朗读的内容"
            :maxlength="readAloudMaxCount"
            show-word-limit
            v-model="readAloudContent">
          </el-input>
          <el-row :gutter="20">
            <el-col :span="6">
              <span class="demonstration">语速</span>
            </el-col>
            <el-col :span="6">
              <span class="demonstration">音调</span>
            </el-col>
            <el-col :span="6">
              <span class="demonstration">音量</span>
            </el-col>
            <el-col :span="6"><span class="demonstration">发音人</span></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-slider v-model="readAloudSpeed" :min="0" :max="15" :step="1" :marks="{1:'慢速',5:'中速',13:'快速'}"></el-slider>
            </el-col>
            <el-col :span="6">
              <el-slider v-model="readAloudSpeed" :min="0" :max="15" :step="1" :marks="{1:'低',5:'中等',10:'高'}"></el-slider>
            </el-col>
            <el-col :span="6">
              <el-slider v-model="readAloudVol" :min="0" :max="9" :step="1" :marks="{1:'低',5:'中等',8:'高'}"></el-slider>
            </el-col>
            <el-col :span="6" class="text-right">
              <el-select v-model="readAloudPer" placeholder="请选择发音人" size="mini">
                <el-option
                  v-for="item in readAloudPerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
              <div class="mt-2">
                <el-button type="primary" size="mini" @click="readAloud">开始朗读</el-button>
                <el-button size="mini" @click="readAloudContent=''">清空</el-button>
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
  readAloudSpeed = 5;// 语速，取值0-15，默认为5中语速
  readAloudPit = 5; // 音调，取值0-15，默认为5中语调
  readAloudVol = 5;// 音量，取值0-9，默认为5中音量
  readAloudToken = null;
  readAloudTokenLastRequestTime : Date = null;

  mounted() {

  }


  //你好，这是我的铃声播放系统。初次见面，请多多指教
  /*
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
      //audio.addEventListener('ended', () => document.body.removeChild(audio))
      audio.src = url;
      audio.play().then(() => {
        loadingInstance.close();
        this.$message({ type: 'success', message: '正在播放语音' })
      }).catch((reason) => {
        loadingInstance.close();
        this.$alert(reason, '播放语音失败', { type: 'error' })
      })
    }).catch((reason) => {
      loadingInstance.close();
      this.$alert(reason, '播放语音失败', { type: 'error' })
    })
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


