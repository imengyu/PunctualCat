import { PlayTable } from '../model/PlayTable'
import { AutoSaveable } from '../model/PlayInterfaces'

/**
 * 时间表控制服务
 */
export default class TableServices implements AutoSaveable {

  private tables: Array<PlayTable> = [];

  public getData() {
    return this.tables
  }

  /**
   * 添加时间表
   * @param name 时间表名称
   */
  public addTable(table : PlayTable) {
    this.tables.push(table);
  }
  /**
   * 删除时间表
   * @param table 时间表
   */
  public delTable(table : PlayTable) {
    this.tables.remove(table);
  }

  /**
   * 释放所有资源
   */
  public destroy() {
    this.tables = [];
  }


  public saveToJSONObject(): object {
    let buf = {
      tables: []
    }, i = 0;
    for(; i< this.tables.length; i++) 
      buf.tables.push(this.tables[i].saveToJSONObject());
    return buf;
  }
  public loadFromJsonObject(obj: any) {
    let i = 0, objTable : PlayTable = null;
    for(; i< obj.length; i++) {
      objTable = new PlayTable();
      objTable.loadFromJsonObject(obj.tables[i]);
      this.tables.push(objTable);
    }
  }

}