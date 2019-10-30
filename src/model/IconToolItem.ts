export default class IconToolItem {
  public name : string;
  public content : string;
  public tooltip : string;
  public fixSize : number;
  public type : IconToolItemType;
  public selectable : boolean;

  public showHotPoint : boolean = false;
  public hotPointCount : number = 0;

  public constructor(name : string, content : string, tooltip : string, fixSize? : number, type : IconToolItemType = 'icon', selectable = true) {
    this.name = name;
    this.content = content;
    this.tooltip = tooltip;
    this.fixSize = fixSize;
    this.type = type;
    this.selectable = selectable;
  }
  
}
export type IconToolItemType = 'text'|'icon';