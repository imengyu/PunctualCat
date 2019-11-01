

/**
 * 播放条件
 */
export interface PlayCondition {

  /**
   * 检查当前条件是否处于正在播放
   */
  isPlayingTime() : boolean;

  /**
   * 将此实例保存为 JSON 
   */
  saveToJson() : string;

  /**
   * 从 JSON 加载此实例
   */
  loadFromJson(json : string, obj : object);
}