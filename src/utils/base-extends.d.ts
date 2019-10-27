interface Array<T> {
  /**
   * 查找元素在数组中的索引
   * @param predicateFn 
   * @param thisArg 
   */
  findIndex(predicateFn: (item: T, index?: number, arr?: T[]) => boolean, thisArg?: any): number;
  /**
   * 删除数组中的元素
   * @param item 元素 或 元素索引
   */
  remove(item: T | Number): boolean;
}
interface Date {
  /**
   * 格式化日期
   * @param formatStr 格式化字符串 支持 YYYY-MM-DD HH:ii:ss
   */
  format(formatStr: String);
}