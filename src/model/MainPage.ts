export class MainPage {
  public name : string;
  public title : string;
  public el : any;

  public constructor(name : string, title : string, el : any) {
    this.name = name;
    this.title = title;
    this.el = el;
  }
}