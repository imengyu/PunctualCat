import { AutoPlayable, AutoSaveable, AutoPlayCheckType, AutoPlayStatus } from './PlayInterfaces'
import { PlayCondition } from './PlayCondition';
import CommonUtils from '../utils/CommonUtils';

/**
 * 播放时令
 */
export class PlaySeason implements AutoPlayable, AutoSaveable { 

  public saveToJSONObject(): object {
    let buf = {
      uid: this.uid,
      name: this.name,
      note: this.note,
      enabled: this.enabled,
      commands: [],
      condition: this.condition.saveToJSONObject()
    };
    return buf;
  }
  public loadFromJsonObject(json: any) {
    this.uid = json.uid;
    this.name = json.name;
    this.note = json.note;
    this.enabled = json.enabled;
    this.condition = new PlayCondition(null, json.condition, {
      intervalType: 'any',
      timeType: 'point',
      forceDisallowTypes: [ 'day-range', 'day-point' ]
    });
    this.status = this.enabled ? 'normal' : 'disabled';
  }

  public constructor(jsonObject?:any) {
    if(jsonObject) this.loadFromJsonObject(jsonObject);
    else {
      this.uid = CommonUtils.genNonDuplicateID(2);
      this.condition = new PlayCondition('', null, {
        intervalType: 'any',
        timeType: 'point',
        forceDisallowTypes: [ 'day-range', 'day-point' ]
      });
    }
  }

  public uid : string;

  public name : string = '';
  public note : string = '';
  public condition: PlayCondition = null;
  public enabled = true;
  public status : AutoPlayStatus = 'unknow';

  public isPlayingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.condition) ? false : this.condition.isPlayingTime(type);
  }
  public isStoppingTime(type: AutoPlayCheckType) {
    return CommonUtils.isNullObject(this.condition) ? false : this.condition.isStoppingTime(type);
  }
}