import { EventEmitter } from "events";
import { MusicItem } from "../model/MusicItem";


export class MusicHistoryService extends EventEmitter {

  public constructor(musicHistoryList : Array<MusicItem>) {
    super();
    this.musicHistoryList = musicHistoryList
  }

  public musicHistoryList : Array<MusicItem>;

  public existsInHistoryList(musicPath : string) {
    for(var i = 0; i < this.musicHistoryList.length; i++){
      if(this.musicHistoryList[i].fullPath == musicPath) return true;
    }
    return false;
  }
  public findInHistoryList(musicPath : string) : MusicItem {
    for(var i = 0; i < this.musicHistoryList.length; i++){
      if(this.musicHistoryList[i].fullPath == musicPath) return this.musicHistoryList[i];
    }
    return null;
  }
  public addMusicToHistoryList(music : MusicItem) {  this.musicHistoryList.push(music);  }
  public removeMusicFromHistoryList(music : MusicItem){ this.musicHistoryList.splice(this.musicHistoryList.indexOf(music), 1); }
}

let staticMusicHistoryService = null;

export function createMusicHistoryService(musicHistoryList : Array<MusicItem>) {
  if(staticMusicHistoryService == null)
    staticMusicHistoryService = new MusicHistoryService(musicHistoryList);
  return staticMusicHistoryService;
}

export function getMusicHistoryService() { return staticMusicHistoryService }