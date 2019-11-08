import { AutoPlayable, AutoPlayCheckType } from './PlayInterfaces'
import { PlayTask } from './PlayTask'
/**
 * 播放计划表
 */
export class PlayTable implements AutoPlayable {

  name : string;
  note : string;
  tasks : Array<PlayTask> = [];


  /**
   * 检测当前 播放计划表 是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    
  }



}