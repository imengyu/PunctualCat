
import { Logger } from 'log4js'
import Datastore from 'nedb'

declare global {
  interface Window {
    appLogger : Logger;
    appAutoLogger : Logger;
    app : any;
    appInited : boolean;
    appDb : Datastore;
    appWin32 : any;
    appDir : string;
    appBuildDate : string;
    appVesrsion : string;
    initLogs : Function;
    initVue : Function;
    showRunTimeError : Function;
    destroyLogs : Function;
  }
}