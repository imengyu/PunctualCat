import { EventEmitter } from "events";
import { MusicItem } from "../model/MusicItem";

/**
 * 音乐历史记录服务
 */
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
  public addMusicToHistoryList(music : MusicItem | string) { 
    let item : MusicItem;
    if(typeof music === 'string') item = new MusicItem(music);
    else if(music instanceof MusicItem) item = music;
     
    if(!this.existsInHistoryList(item.fullPath)) 
      this.musicHistoryList.push(item);  
  }
  public removeMusicFromHistoryList(music : MusicItem){ this.musicHistoryList.splice(this.musicHistoryList.indexOf(music), 1); }

  public saveToMusicPathArray() : string[] {
    let arr : string[] = [];
    for(var i = 0, c = this.musicHistoryList.length; i < c; i++)
      arr.push(this.musicHistoryList[i].fullPath);
    return arr;
  }
  public loadFromPathArray(musics : string[]) {
    if(musics) musics.forEach((element : string) => {
      if(!this.existsInHistoryList(element))
        this.addMusicToHistoryList(element);
    });
  }
}

let staticMusicHistoryService = null;

export function createMusicHistoryService(musicHistoryList : Array<MusicItem>) {
  if(staticMusicHistoryService == null)
    staticMusicHistoryService = new MusicHistoryService(musicHistoryList);
  return staticMusicHistoryService;
}

export function getMusicHistoryService() { return staticMusicHistoryService }