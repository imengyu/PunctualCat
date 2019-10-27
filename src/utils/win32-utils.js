export default {
  setPowerStateEnable,
  setAutoStartEnable,
  getAutoStartEnabled,
  getIsUserLeave,
  closeMointor,
  openMointor
}

/**
 * 设置是否阻止系统休眠
 * @param {boolean} enable 是否阻止
 * @returns {boolean} 操作是否成功
 */
function setPowerStateEnable(enable){
  window.appWin32.setPowerStateEnable(enable);
}
/**
 * 设置程序是否开机启动
 * @param {boolean} enable 是否开机启动
 * @returns {boolean} 操作是否成功
 */
function setAutoStartEnable(enable){
  window.appWin32.setAutoStartEnable(enable);
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
  window.appWin32.closeMointor();
}
/**
 * 开启显示器
 * @returns {boolean} 操作是否成功
 */
function openMointor(){
  window.appWin32.openMointor();
}