export default {
  setPowerStateEnable,
  setAutoStartEnable,
  getAutoStartEnabled,
  getIsUserLeave,
  closeMointor,
  openMointor,
  messageBeep,
  messageBeepTypes: {
    MB_ICONHAND: 0x00000010,
    MB_ICONQUESTION: 0x00000020,
    MB_ICONEXCLAMATION: 0x00000030,
    MB_ICONASTERISK: 0x00000040
  },
  init,
  uninit,
  setSystemVolume,
  getSystemVolume,
  muteSystem,
  unmuteSystem,
  getSystemVolManagerStatus() { return systemVolManagerInitSuccess },
  getNativeCanUse() { return initSuccess }
}

let oldSystemVal = 0;
let systemVolManagerInitSuccess = false;
let initSuccess = false;

/**
 * 设置是否阻止系统休眠
 * @param {boolean} enable 是否阻止
 * @returns {boolean} 操作是否成功
 */
function setPowerStateEnable(enable){
  return window.appWin32.setPowerStateEnable(enable);
}
/**
 * 设置程序是否开机启动
 * @param {boolean} enable 是否开机启动
 * @returns {boolean} 操作是否成功
 */
function setAutoStartEnable(enable){
  return window.appWin32.setAutoStartEnable(enable);
}
/**
 * 获取程序是否已开机启动
 * @returns {boolean} 否已开机启动
 */
function getAutoStartEnabled(){
  return window.appWin32.getAutoStartEnabled();
}
/**
 * 获取用户是否长时间无操作
 * @returns {boolean} 
 */
function getIsUserLeave(){
  return window.appWin32.getIsUserLeave();
}
/**
 * 关闭显示器
 * @returns {boolean} 操作是否成功
 */
function closeMointor(){
  return window.appWin32.closeMointor();
}
/**
 * 开启显示器
 * @returns {boolean} 操作是否成功
 */
function openMointor(){
  return window.appWin32.openMointor();
}
/**
 * 播放系统提示音
 * @param {number} type 提示音类型 (messageBeepTypes)
 * @returns {boolean} 操作是否成功
 */
function messageBeep(type){
  return window.appWin32.messageBeep(type);
}
/**
 * 初始化
 */
function init(){
  if(window.appWin32){
    systemVolManagerInitSuccess = window.appWin32.initSystemVolume();
    initSuccess = true;
    return true;
  }
  return false;
}
/**
 * 卸载
 */
function uninit(){
  window.appWin32.uninitSystemVolume();
  systemVolManagerInitSuccess = false;
  initSuccess = false;
}
/**
 * 设置系统音量
 * @param {number} volume 音量（0~100）
 * @returns {boolean} 操作是否成功
 */
function setSystemVolume(volume){
  return window.appWin32.setSystemVolume(volume);
}
/**
 * 获取系统音量
 * @returns {number} 系统音量（0~100）
 */
function getSystemVolume(){
  return window.appWin32.getSystemVolume();
}
function muteSystem() {
  oldSystemVal = getSystemVolume();
  setSystemVolume(0);
}
function unmuteSystem() {
  setSystemVolume(oldSystemVal);
}