export default class IconToolItem {
  public icon : string;
  public tooltip : string;
  public fixSize : number;

  public constructor(icon : string, tooltip : string, fixSize? : number) {
    this.icon = icon;
    this.tooltip = tooltip;
    this.fixSize = fixSize;
  }
}