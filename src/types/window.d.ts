
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
    appBuildDate : string;
    appVesrsion : string;
    initLogs : Function;
    initVue : Function;
    destroyLogs : Function;
  }
}