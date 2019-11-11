import { DataStorageServices, createDataStorageServices } from './DataStorageServices'
import { EventEmitter } from "events";
import CommonUtils from '../utils/CommonUtils';

class SettingsServices extends EventEmitter {

  private staticDataStorageServices : DataStorageServices = null;
  private staticSettings = null;
  private staticSettingsTemplate = {
    window: {
      oldSize: {
        x: 900,
        y: 600
      },
      isMax: false,
      title: '',
      background: '',
    },
    security: {
      preventAnymouseUse: false,
      managerPassword: '',
      autoLock: false,
      autoLockMaxMinute: 5,
      lockedNote: '系统已经锁定，请联系管理员获取更多信息',
    },
    system: {
      autoUpdate: true,
      autoHide: true,
      autoHideMinute: 10,
      preventSleep: true,
    },
    auto: {
      playTipIfFail: true,
      muteTime: {
        enabled: false,
        condition: null
      },
    },
    player: {
      enableFade: true,
      volume: 0.5,
      maxPlayingMusic: 6,
    }
  };

  public constructor() {
    super();
  }

  public getData() { return this.staticSettings }
  public setData(data : any) { 
    CommonUtils.cloneValue(this.staticSettings, data)
  }
  public resetDefault() { 
    CommonUtils.cloneValue(this.staticSettings, this.staticSettingsTemplate)
  }

  /**
   * 读取设置
   */
  public initSettings() {
    this.staticDataStorageServices = createDataStorageServices();
  }
  /**
   * 读取设置
   */
  public loadSettings() : Promise<any> {
    return this.staticDataStorageServices.loadData('settings').then((value) => {
      if(value) { 
        this.staticSettings = value;
        CommonUtils.cloneValueIfUndefined(this.staticSettings, this.staticSettingsTemplate);
      }
      else this.staticSettings = this.staticSettingsTemplate;
      this.emit('load');
    }).catch(() => {
      this.staticSettings = this.staticSettingsTemplate;
    });
  }
  /**
   * 保存设置至磁盘
   */
  public saveSettings() : Promise<any> {
    return this.staticDataStorageServices.saveData('settings', this.staticSettings);
  }


  searchKeyInSettingObject(startObject: any, key : string) : any {
    let rs = null;
    let pointIndex = key.indexOf('.');
    if(pointIndex > 0){
      let currentKey = key.substr(0, pointIndex);
      let nextKey = key.substr(pointIndex + 1);
      rs = this.searchKeyInSettingObject(startObject[currentKey], nextKey);
    }else rs = startObject[key];
    return rs;
  }
  searchAndSetKeyInSettingObject(startObject: any, key : string, value : any) : any {
    let rs = null;
    let pointIndex = key.indexOf('.');
    if(pointIndex > 0){
      let currentKey = key.substr(0, pointIndex);
      let nextKey = key.substr(pointIndex + 1);
      rs = this.searchAndSetKeyInSettingObject(startObject[currentKey], nextKey, value);
    }else { 
      rs = startObject[key];
      startObject[key] = value;
    }
    return rs;
  }

  /**
   * 获取设置
   * @param key 设置的键值
   */
  public getSetting(key : string) : string {
    return this.searchKeyInSettingObject(this.staticSettings, key);
  }
  /**
   * 写入设置
   * @param key 设置的键值
   * @param value 设置值
   */
  public setSettingObject(key : string, value : object) {
    this.searchAndSetKeyInSettingObject(this.staticSettings, key, value);
  }
  /**
   * 获取设置
   * @param key 设置的键值
   */
  public getSettingObject(key : string) : any {
    return this.searchKeyInSettingObject(this.staticSettings, key);
  }
  /**
   * 写入设置
   * @param key 设置的键值
   * @param value 设置值
   */
  public setSetting(key : string, value : string) {
    this.searchAndSetKeyInSettingObject(this.staticSettings, key, value);
  }
  /**
   * 获取 number 设置
   * @param key 设置的键值
   */
  public getSettingNumber(key : string) : number {
    return this.searchKeyInSettingObject(this.staticSettings, key);
  }
  /**
   * 写入 number 设置
   * @param key 设置的键值
   * @param value 设置值
   */
  public setSettingNumber(key : string, value : number) {
    this.searchAndSetKeyInSettingObject(this.staticSettings, key, value);
  }
  /**
   * 获取 boolean 设置
   * @param key 设置的键值
   */
  public getSettingBoolean(key : string) : boolean {
    return this.searchKeyInSettingObject(this.staticSettings, key);
  }
  /**
   * 写入 boolean 设置
   * @param key 设置的键值
   * @param value 设置值
   */
  public setSettingBoolean(key : string, value : boolean) {
    this.searchAndSetKeyInSettingObject(this.staticSettings, key, value);
  }

}

let staticSettingsServices = new SettingsServices();

export default staticSettingsServices