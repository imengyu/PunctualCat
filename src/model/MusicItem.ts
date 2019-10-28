import { getFileName } from '../utils/FileUtils'

export class MusicItem {

  public name : string;
  public fullPath : string;
  public status : MusicStatus = 'normal';

  public constructor(fullPath : string, name?: string) {
    this.fullPath = fullPath;
    this.name = name || getFileName(fullPath);
  }

}

export type MusicStatus = 'normal'|'playing'|'lost';

export type MusicAction = 'play'|'looplay'|'delete'|'none';