import { random, each } from "lodash";
import { lengthObj } from "./helpers/lengthObj.helper";

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

  /**
   * 
   * @param event 
   * @param callback 
   * 
   * @return key of the event callback that can be disabled by .off(key)
   * 
   */
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