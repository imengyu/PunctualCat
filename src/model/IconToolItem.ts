export default class IconToolItem {
  public name : string;
  public content : string;
  public tooltip : string;
  public fixSize : number;
  public type : IconToolItemType;

  public constructor(name : string, content : string, tooltip : string, fixSize? : number, type : IconToolItemType = 'icon') {
    this.name = name;
    this.content = content;
    this.tooltip = tooltip;
    this.fixSize = fixSize;
    this.type = type;
  }
  
}
export type IconToolItemType = 'text'|'icon';