import { PlayTable } from '../model/PlayTable'
import { AutoSaveable } from '../model/PlayInterfaces'
import { PlaySeason } from '../model/PlaySeason';


/**
 * 时间表控制服务
 */
export default class TableServices implements AutoSaveable {

  public tables: Array<PlayTable> = [];
  public seasons: Array<PlaySeason> = [];


  /**
   * 获取数据数组
   */
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
    table.destroy();
  }

  /**
   * 添加时令
   * @param name 时令名称
   */
  public addSeason(season : PlaySeason) {
    this.seasons.push(season);
  }
  /**
   * 删除时令
   * @param table 时令
   */
  public delSeason(season : PlaySeason) {
    this.seasons.remove(season);
  }

  /**
   * 释放所有资源
   */
  public destroy() {
    for(var i=0;i<this.tables.length;i++)
      this.tables[i].destroy();
    this.tables = [];
    this.seasons = [];
  }


  public saveToJSONObject(): object {
    let buf = {
      tables: [],
      seasons: []
    }, i = 0;
    for(; i< this.tables.length; i++) 
      buf.tables.push(this.tables[i].saveToJSONObject());
    for(; i< this.seasons.length; i++) 
      buf.seasons.push(this.seasons[i].saveToJSONObject());
    return buf;
  }
  public loadFromJsonObject(obj: any) {
    if(obj){
      let i = 0, objTable : PlayTable = null, objSeason : PlaySeason = null;
      if(obj.tables && obj.tables.length > 0) for(; i< obj.tables.length; i++) {
        objTable = new PlayTable();
        objTable.loadFromJsonObject(obj.tables[i]);
        this.tables.push(objTable);
      }
      if(obj.seasons && obj.seasons.length > 0) for(i = 0; i< obj.seasons.length; i++) {
        objSeason = new PlaySeason();
        objSeason.loadFromJsonObject(obj.seasons[i]);
        this.seasons.push(objSeason);
      }
    }

  }

}