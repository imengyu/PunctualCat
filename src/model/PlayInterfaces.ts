
export type AutoPlayCheckType = 'full'|'minute'|'hour';

/**
 * 可执行自动时间判断项目
 */
export interface AutoPlayable {

  /**
   * 检测是否达到指定的播放时间
   * @param type 检测时间
   */
  isPlayingTime(type : AutoPlayCheckType);

}