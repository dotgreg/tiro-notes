import { random, each } from "lodash";
import { lengthObj } from "../../../shared/helpers/lengthObj.helper";
import { configClient } from "../config";

interface iEventManagerParams {
  name: string
}

export default class EventManager {
  name: string
  events:{
    [key: string]: {
      [key: number]: Function
    }
  } = {}

  constructor(params:iEventManagerParams) {
    this.name = params.name
  }

  on(event:string, callback:Function):number {
    let key = random(1, 10000000)
    if (!this.events[event]) this.events[event] = {}
    this.events[event][key] = callback
    return key
  }

  off(key:number) {
    each(this.events, (eventFunctions,i) => {
      each(eventFunctions, (f,j:any)=> {
        //@ts-ignore
        if (j == key) { //j,key has string and nubmer type, so ==;
          delete this.events[i][j]
        }
      })
    })
  }

  destroyEvent(event:string) {
    delete this.events[event]
  }

  trigger(event:string, params?:any) {
    if(configClient.log.eventManager) console.log(`%c [${this.name.toUpperCase()}] --> trigger ${event}, nb functions:`,'background: #ccc; color: blue', lengthObj(this.events[event]),`data: `, params)
    if(this.events[event]) {
      each(this.events[event], f => {
        f(params)
      })
    }
  }

  clean() {
    this.events = {}
  }

}