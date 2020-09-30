import { clientSocket } from "./socket.manager";
import { socketEvents } from "../../../../shared/sockets/sockets.events";
import EventManager from "../events.manager";
import {each} from 'lodash'

// Create an event manager specialized for sockets events
export const socketEventsManager = new EventManager({name: 'Socket Event Manager'})

// each socket events declared in socketEvents, if happends, trigger our eventManager
export const bindEventManagerToSocketEvents = () => {
    each(socketEvents, eventName => {
        clientSocket.on(eventName, (data:any) => {
            socketEventsManager.trigger(eventName, data)
        })
    })
}