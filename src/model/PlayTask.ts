import { AutoPlayable, AutoSaveable, AutoPlayCheckType } from './PlayInterfaces'
import { PlayCondition } from './PlayCondition'

/**
 * 播放任务
 */
export class PlayTask implements AutoPlayable, AutoSaveable {

  public saveToJSONObject(): object {
    let buf = {
      name: this.name,
      note: this.note,
      condition: this.condition.saveToJSONObject()
    };
    return buf;
  }
  public loadFromJsonObject(json: any) {
    this.name = json.name;
    this.note = json.name;
    this.condition = new PlayCondition(null, json.condition)
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
  public condition: PlayCondition = null;

  public isPlayingTime(type: AutoPlayCheckType) {
    return this.condition ? this.condition.isPlayingTime(type) : false;
  }


}