import electron, { Rectangle, BrowserWindow } from 'electron'

export type WindowSizeType = 'none'|'t'|'b'|'r'|'l'|'tl'|'tr'|'bl'|'br';

export var WindowDraggers = [
  {
    name: 'left',
    type: 'l'
  },
  {
    name: 'right',
    type: 'r'
  },
  {
    name: 'top',
    type: 't'
  },
  {
    name: 'bottom',
    type: 'b'
  },
  {
    name: 'top-left',
    type: 'tl'
  },
  {
    name: 'top-right',
    type: 'tr'
  },
  {
    name: 'bottom-left',
    type: 'bl'
  },
  {
    name: 'bottom-right',
    type: 'br'
  },
];

export function doWindowResize(bounds : Rectangle, window : BrowserWindow, type : WindowSizeType, e : MouseEvent, padding : number) : boolean {
  switch(type) {
    case 't':{
      let oldBottom = bounds.y + bounds.height;
      bounds.y = e.screenY - padding;
      bounds.height = oldBottom - bounds.y;
      window.setBounds(bounds);
      return true;
    }
    case 'l':{
      let oldRight = bounds.x + bounds.width;
      bounds.x = e.screenX - padding;
      bounds.width = oldRight - bounds.x;
      window.setBounds(bounds);
      return true;
    }
    case 'tl':{
      let oldBottom = bounds.y + bounds.height;
      bounds.y = e.screenY - padding;
      bounds.height = oldBottom - bounds.y;

      let oldRight = bounds.x + bounds.width;
      bounds.x = e.screenX - padding;
      bounds.width = oldRight - bounds.x;

      window.setBounds(bounds);
      return true;
    }
    case 'tr':{
      let oldBottom = bounds.y + bounds.height;
      bounds.y = e.screenY - padding;
      bounds.height = oldBottom - bounds.y;

      bounds.width = e.screenX - bounds.x + padding;

      window.setBounds(bounds);
      return true;
    }
    case 'bl':{
      let oldRight = bounds.x + bounds.width;
      bounds.x = e.screenX - padding;
      bounds.width = oldRight - bounds.x;

      bounds.height = e.screenY - bounds.y + padding;

      window.setBounds(bounds);
      return true;
    }

    case 'r':{
      bounds.width = e.screenX - bounds.x + padding;
      window.setBounds(bounds);
      return true;
    }
    case 'b':{
      bounds.height = e.screenY - bounds.y + padding;
      window.setBounds(bounds);
      return true;
    }
    case 'br':{
      bounds.width = e.screenX - bounds.x + padding;
      bounds.height = e.screenY - bounds.y + padding;
      window.setBounds(bounds);
      return true;
    }
  }
  return false;
}