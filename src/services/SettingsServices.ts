import { DataStorageServices, createDataStorageServices } from './DataStorageServices'
import { EventEmitter } from "events";
import CommonUtils from '../utils/CommonUtils';
import { PlayCondition } from '../model/PlayCondition';

class SettingsServices extends EventEmitter {

  private staticDataStorageServices : DataStorageServices = null;
  private staticSettings = null;
  private staticSettingsTemplate = {
    app: {
      firstRun: true,
      argeementAllowed: false
    },
    window: {
      oldSize: {
        x: 900,
        y: 600
      },
      oldIsMax: false,
      title: '',
      background: '',
      backgroundOpacity: 60,
    },
    security: {
      preventAnymouseUse: false,
      managerPassword: '',
      autoLock: false,
      autoLockMaxMinute: 5,
      lockedNote: '系统已经锁定，请联系管理员获取更多信息',
    },
    system: {
      developerMode: false,
      autoOpenDevTools: true,
      autoUpdate: true,
      autoHide: true,
      autoHideMinute: 10,
      preventSleep: true,
    },
    auto: {
      playTipIfFail: true,
      enableMuteTime: false,
      setSystemMuteAtMuteTime: false,
      muteTimes: []
    },
    player: {
      enableFade: true,
      enableWave: false,
      fadeMs: 1000,
      volume: 0.5,
      readAloudVolume: 100,
      maxPlayingMusic: 6,
    }
  };

  public constructor() {
    super();
  }

  public sendUpdated() { this.emit('update'); }
  public getData() { return this.staticSettings }
  public setData(data : any) { 
    CommonUtils.cloneValueForce(this.staticSettings, data);
    this.emit('update');
  }
  public resetDefault() { 
    CommonUtils.cloneValueForce(this.staticSettings, this.staticSettingsTemplate);
    this.emit('update');
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
        //Prealloc
        this.emit('afteroad');
        let arr = this.staticSettings.auto.muteTimes, i = 0; this.staticSettings.auto.muteTimes = [];
        for(;i<arr.length;i++) this.staticSettings.auto.muteTimes.push(new PlayCondition(null, arr[i]));
      }
      else this.staticSettings = CommonUtils.clone(this.staticSettingsTemplate);
      this.emit('load');
    }).catch(() => {
      this.staticSettings = CommonUtils.clone(this.staticSettingsTemplate);
    });
  }
  /**
   * 保存设置至磁盘
   */
  public saveSettings() : Promise<any> {
    //Prealloc
    this.emit('beforesave');
    let dataClone = CommonUtils.clone(this.staticSettings);
    let arr : Array<PlayCondition> = dataClone.auto.muteTimes; dataClone.auto.muteTimes = [];
    for(var i=0;i<arr.length;i++) dataClone.auto.muteTimes.push(arr[i].saveToJSONObject());
    //Save
    return this.staticDataStorageServices.saveData('settings', dataClone);
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