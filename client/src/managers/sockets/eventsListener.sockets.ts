import { clientSocket } from "./socket.manager";
import EventManager from "../events.manager";
import {each} from 'lodash-es'

// Create an event manager specialized for sockets events
export const socketEventsManagerOLD = new EventManager({name: 'Socket Event Manager'})

// each socket events declared in socketEvents, if happends, trigger our eventManager
export const bindEventManagerToSocketEventsOLD = () => {
    // each(socketEvents, eventName => {
    //     clientSocket.on(eventName, (data:any) => {
    //         socketEventsManager.trigger(eventName, data)
    //     })
    // })
}