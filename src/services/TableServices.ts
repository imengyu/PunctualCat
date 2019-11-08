import PlayTable from '../model/PlayTable'

/**
 * 时间表控制服务
 */
export default class TableServices {

  private _data: Array<PlayTable>;

  constructor(data: Array<PlayTable> | Array<Object>) {
    this._data = data;
  }

  public getData() {
    return this._data
  }

  /**
   * 添加时间表
   * @param name 时间表名称
   */
  public addTable(name: String): PlayTable {
    let newTable: PlayTable;
    newTable = new PlayTable();

    return newTable;
  }

  /**
   * 释放所有资源
   */
  public destroy() {

  }
}