

class Action {

  public constructor(action : string, callback : (...args) => any) {
    this.action = action;
    this.callback = callback;
  }

  public action : string;
  public callback : (...args) => any;

}

let actionPool : Array<Action> = [];

export default {
  executeGlobalAction,
  registerGlobalAction,
  unRegisterGlobalAction,
  findGlobalAction
}

function executeGlobalAction(action : string, ...args) {
  let oldAction = findGlobalAction(action);
  if(oldAction) return oldAction.callback(args);
  return null
}
function registerGlobalAction(action : string, callback : (...args) => any) {
  let oldAction = findGlobalAction(action);
  if(oldAction) actionPool.remove(oldAction);
  actionPool.push(new Action(action, callback))
}
function unRegisterGlobalAction(action : string) {
  let oldAction = findGlobalAction(action);
  if(oldAction) actionPool.remove(oldAction);
}
function findGlobalAction(action : string) {
  for(var i = 0; i < actionPool.length; i++){
    if(actionPool[i].action == action)
      return actionPool[i];
  }
  return null;
}