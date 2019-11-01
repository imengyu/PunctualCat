
import { PlayTaskCondition } from "./PlayTaskCondition";
import { MusicItem } from "./MusicItem";

/**
 * 任务类型
 */
export type PlayTaskType = '播放音乐'|'执行命令'|'关闭计算机';

/**
 * 任务执行状态
 */
export type PlayTaskStatus = 'notplay'|'playing'|'played'|'error'|'disabled';

/**
 * 自动播放任务
 */
export class PlayTask {

  /**
   * id
   */
  id = '';
  /**
   * 任务名字
   */
  name = '';
  /**
   * 任务备注
   */
  note = '';
  /**
   * 自动播放条件
   */
  playCondition = new PlayTaskCondition('条件组');
  /**
   * 自动停止条件
   */
  stopCondition = new PlayTaskCondition('条件组');
  /**
   * 父计划表
   */
  parent = null;
  /**
   * 自动执行的命令 类型为 执行命令 时有效
   */
  commands : Array<string> = [];
  /**
   * 自动播放的音乐 类型为 播放音乐 时有效
   */
  musics : Array<MusicItem> = [];
  /**
   * 是否启用任务
   */
  enabled = true;
  /**
   * 任务类型
   */
  type : PlayTaskType = '播放音乐';
  /**
   * 音乐音量，-1为使用默认音量
   */
  musicVolume = -1;
  /**
   * 音乐循环次数，0 为不循环
   */
  musicLoopCount = 0;
  /**
   * 任务播放时间限制，播放超过这个时间将会自动停止
   */
  musicTimeLimit = {
    hour: 0,
    minute: 0,
    second: 0
  };
  /**
   * 音乐播放开始的位置，仅用于只有一首音乐的情况
   */
  musicStartPos = {
    hour: 0,
    minute: 0,
    second: 0
  };
  /**
   * 播放状态
   */
  status : PlayTaskStatus = 'notplay';
  /**
   * 已播放的音乐或已执行的命令数
   */
  playedCommands = 0;
  /**
   * 上一次播放的错误
   */
  playeError = null;


  /**
   * 获取现在是否是播放时间
   */
  isPlayingTime() {
    if(this.enabled && this.playCondition) 
      return this.playCondition.isPlayingTime();
    return false;
  }
  /**
   * 获取播放时间是否在当前一个小时内
   */
  isPlayingInThisHours() {
    if(this.enabled && this.playCondition) 
      return this.playCondition.isPlayingInThisHours();
    return false;
  }
  /**
   * 获取播放时间是否在当前一分钟内
   */
  isPlayingInThisMinute() {
    if(this.enabled && this.playCondition) 
      return this.playCondition.isPlayingInThisMinute();
    return false;
  }
  /**
   * 获取现在是否是停止时间
   */
  isStoppingTime() {
    if(this.enabled && this.stopCondition)
      return this.stopCondition.isPlayingTime();
    return false;
  }
  /**
   * 获取停止时间是否在当前一个小时内
   */
  isStoppingInThisHours() {
    if(this.enabled && this.stopCondition)
      return this.stopCondition.isPlayingInThisHours();
    return false;
  }
  /**
   * 获取停止时间是否在当前一分钟内
   */
  isStoppingInThisMinute() {
    if(this.enabled && this.stopCondition) 
      return this.stopCondition.isPlayingInThisMinute();
    return false;
  }

  /**
   * 获取播放状态字符串
   */
  getStatusString() : string {
    switch(this.status){
      case 'playing': return '正在播放 (' + this.playedCommands + '/' + this.commands.length + ')';
      case 'notplay': return '未播放';
      case 'disabled': return '已禁用';
      case 'played': return '已播放';
      case 'error': return '播放错误：' + this.playeError + '，详情请查看日志';
    }
    return ''
  }
  /**
   * 获取此任务要播放命令或音乐数
   */
  getCommandCount() : string {
    if(this.type=='执行命令'){
      if(this.commands && this.commands.length > 0)
        return this.commands.length.toString()
      return '无任务'
    }else if(this.type=='播放音乐') {
      if(this.musics && this.musics.length > 0)
        return this.musics.length.toString()
      return '无任务'
    }else return '';
  }
  /**
   * 获取任务命令的简要文字
   */
  getCommandFastText() : string {
    if(this.type=='执行命令'){
      if(this.commands && this.commands.length > 0)
        return (this.commands.length > 1) ? (this.commands.length + ' 个命令') : this.commands[0];
      return '无任务'
    }else if(this.type=='播放音乐') {
      if(this.musics && this.musics.length > 0)
        return this.musics[0].name + ' ' + (this.musics.length > 2 ? ' 等 ' + this.musics.length + ' 个任务' : '');
      return '无任务'
    }else return '';
  }

  /**
   * 将此实例保存为 JSON 
   */
  saveToJson() : string {
    return JSON.stringify(this);
  }

  /**
   * 从 JSON 加载此实例
   */
  loadFromJson(json : string, obj : object) {

  }

}