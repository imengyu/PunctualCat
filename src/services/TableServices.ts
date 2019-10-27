import TableModel from '../model/TableModel'

/**
 * 时间表控制服务
 */
export default class TableServices {

  private _data: Array<TableModel>;

  constructor(data: Array<TableModel> | Array<Object>) {
    this._data = data;
  }

  /**
   * 添加时间表
   * @param name 时间表名称
   */
  public addTable(name: String): TableModel {
    let newTable: TableModel;
    newTable = new TableModel();

    return newTable;
  }

  /**
   * 释放所有资源
   */
  public destroy() {

  }
}