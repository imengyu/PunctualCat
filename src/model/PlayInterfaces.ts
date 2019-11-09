
export type AutoPlayCheckType = 'full'|'minute'|'hour';

export type AutoPlayStatus = 'unknow'|'playing'|'disabled'|'normal'|'error'|'played'

/**
 * 可执行自动时间判断项目
 */
export interface AutoPlayable {

  /**
   * 检测是否达到指定的播放时间
   * @param type 检测时间
   */
  isPlayingTime(type : AutoPlayCheckType);
  /**
   * 检测是否达到指定的停止时间
   * @param type 检测时间
   */
  isStoppingTime(type : AutoPlayCheckType);
}

/**
 * 可存为 JSON 的项目
 */
export interface AutoSaveable {
  saveToJSONObject() : object;
  loadFromJsonObject(obj : any);
}