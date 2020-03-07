import { AutoPlayable, AutoSaveable, AutoPlayCheckType, AutoPlayStatus } from './PlayInterfaces'
import { PlayTask } from './PlayTask'
import { PlayCondition } from './PlayCondition'
import CommonUtils from '../utils/CommonUtils';

/**
 * 播放时间表
 */
export class PlayTable implements AutoPlayable, AutoSaveable {


  public saveToJSONObject(): object {
    let buf = {
      uid: this.uid,
      name: this.name,
      note: this.note,
      color: this.color,
      enabled: this.enabled,
      condition: this.condition.saveToJSONObject(),
      tasks: [],
      sort: this.sort,
      width: this.width,
    }, i = 0;
    for(;i < this.tasks.length; i++)
      buf.tasks.push(this.tasks[i].saveToJSONObject());
    return buf;
  }
  public loadFromJsonObject(obj: any) {
    this.tasks = [];
    this.uid = obj.uid;
    this.name = obj.name;
    this.note = obj.note;
    this.color = obj.color;
    this.enabled = obj.enabled;
    if(obj.sort) this.sort = obj.sort;
    if(obj.width) this.width = obj.width;
    for(var i = 0; i < obj.tasks.length; i++){
      let newTask = new PlayTask();
      newTask.loadFromJsonObject(obj.tasks[i]);
      newTask.parent = this;
      this.tasks.push(newTask);
    }
    this.condition = new PlayCondition(null, obj.condition, { intervalType: 'day', timeType: 'any', forceDisallowTypes: [] });
  }

  public constructor(jsonObject?:any) {
    if(jsonObject) this.loadFromJsonObject(jsonObject);
    else {
      this.name = '';
      this.note = '';
      this.uid = CommonUtils.genNonDuplicateID(4);
      this.condition = new PlayCondition('', null, { intervalType: 'day', timeType: 'any', forceDisallowTypes: [] });
    }
  }
  
  public uid : string;

  public name : string;
  public note : string;
  public tasks : Array<PlayTask> = [];
  public condition: PlayCondition = null;
  public color = '#000';
  public enabled = true;
  public status : AutoPlayStatus = 'unknow';

  /*界面的保存属性*/

  public sort = {
    order: 'descending',
    prop: 'condition',
  }
  public width = {
    name: '120',
    condition: '95',
  }

  /**
   * 进行排序
   */
  public doSort() {
    let order = this.sort.order == 'ascending' ? -1 : 1;
    let prop = this.sort.prop;
    if(prop == 'name' || prop == 'condition' || prop == 'music') {
      this.tasks.sort((a : PlayTask, b : PlayTask) => {
        if(prop == 'name') 
          return order * a.name.localeCompare(b.name);
        else if(prop == 'condition') { 
          if(a.condition && b.condition)
            return order * a.condition.toConditionString().localeCompare(b.condition.toConditionString());
        }
        else if(prop == 'music')
          return order * a.getPlayTaskString().localeCompare(b.getPlayTaskString());
        return 0;
      });
    }
  }
  /**
   * 检测当前 播放时间表 是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isPlayingTime(type) : false;
  }
  /**
   * 检测当前 播放时间表 是否达到指定的停止时间
   * @param type 检测类型
   */
  public isStoppingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isStoppingTime(type) : false;
  }

  public addTask(task : PlayTask) {
    task.parent = this;
    this.tasks.push(task);
    this.doSort();
  }
  public delTask(task : PlayTask) {
    task.parent = null;
    task.destroyLock();
    if(task.status == 'playing') task.stop();
    task.destroy();
    this.tasks.remove(task);
  }
  public destroy() {
    this.tasks.forEach(element => {
      element.destroy();
    });
    this.tasks = [];
  }
}