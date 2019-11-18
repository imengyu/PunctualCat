import Datastore from 'nedb'

let staticDataStorageServices : DataStorageServices = null;

/**
 * 创建数据存储类
 */
export function createDataStorageServices() : DataStorageServices {
  if(staticDataStorageServices == null)
    staticDataStorageServices = new DataStorageServices(window.appDb);
  return staticDataStorageServices;
}

export function destroyDataStorageServices() {
  staticDataStorageServices.destroy();
  staticDataStorageServices = null;
}

/**
 * 数据存储类
 */
export class DataStorageServices {

  private db : Datastore = null;

  public constructor(db : Datastore){
    this.db = db;
  }

  public init() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.loadDatabase(function (err) {
        if(err) reject(err);
        else resolve();
      });
    });
  }

  public forceNoDataMode() {
    
  }

  /**
   * 保存数据
   * @param key 键值
   * @param object 数据
   */
  public saveData(key : string, object : any) : Promise<any> {
    return new Promise((resolve, reject) => {
      let objectO = { key: key, data: object };
      this.db.find({ key: key }, (err, objectReturn)  => {
        if(objectReturn && objectReturn.length > 0){//有记录，更新
          this.db.update({ key: key }, objectO, {}, (err, doc)  => {
            if(err) reject(err);
            else resolve();
          });
        }else {//无记录，新增
          this.db.insert(objectO, (err, doc)  => {
            if(err) reject(err);
            else resolve();
          });
        }
      });
      
    });
  }
  /**
   * 加载数据
   * @param key 键值
   */
  public loadData(key : string) : Promise<any> {
    return new Promise((resolve, reject) => {
      let objectO = { key: key };
      this.db.find(objectO, (err, objectReturn) => {
        if(err) reject(err);
        else if(objectReturn && objectReturn.length > 0) 
          resolve(objectReturn[0].data);
        else 
          resolve(null);
      });
    });
    
  }
  /**
   * 清除数据
   */
  public clearData() : Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, function (err, numRemoved) {
        if(err) reject(err);
        else resolve(numRemoved);
      });
    });
  }

  public destroy() {
  }
}