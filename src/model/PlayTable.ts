import { AutoPlayable, AutoSaveable, AutoPlayCheckType, AutoPlayStatus } from './PlayInterfaces'
import { PlayTask } from './PlayTask'
import { PlayCondition } from './PlayCondition'



/**
 * 播放计划表
 */
export class PlayTable implements AutoPlayable, AutoSaveable {


  public saveToJSONObject(): object {
    let buf = {
      name: this.name,
      note: this.note,
      color: this.color,
      condition: this.condition.saveToJSONObject(),
      tasks: [],
    }, i = 0;
    for(;i < this.tasks.length; i++)
      buf.tasks.push(this.tasks[i].saveToJSONObject());
    return buf;
  }
  public loadFromJsonObject(obj: any) {
    this.tasks = [];
    this.name = obj.name;
    this.note = obj.note;
    this.color = obj.color;
    for(var i = 0; i < obj.tasks.length; i++){
      let newTask = new PlayTask();
      newTask.loadFromJsonObject(obj.tasks[i]);
      this.tasks.push(newTask);
    }
    this.condition = new PlayCondition(null, obj.condition);
  }

  public constructor(jsonObject?:any) {
    if(jsonObject) this.loadFromJsonObject(jsonObject);
    else {
      this.name = '';
      this.note = '';
      this.condition = new PlayCondition('', null);
    }
  }

  public name : string;
  public note : string;
  public tasks : Array<PlayTask> = [];
  public condition: PlayCondition = null;
  public color = '#000';
  public enabled = true;
  public status : AutoPlayStatus = 'unknow';

  /**
   * 检测当前 播放计划表 是否达到指定的播放时间
   * @param type 检测类型
   */
  public isPlayingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isPlayingTime(type) : false;
  }
  /**
   * 检测当前 播放计划表 是否达到指定的停止时间
   * @param type 检测类型
   */
  public isStoppingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isStoppingTime(type) : false;
  }

  public addTask(task : PlayTask) {
    task.parent = this;
    this.tasks.push(task);
  }
  public delTask(task : PlayTask) {
    task.parent = null;
    this.tasks.remove(task);
  }
}