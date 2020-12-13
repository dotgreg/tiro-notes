import { socketEvents} from "../../../../shared/sockets/sockets.events";
import { ioServer } from '../../server';
import {sharedConfig} from "../../../../shared/shared.config";
import { socketRoutes } from "../../routes";
import { initUploadFileRoute } from "../upload.manager";


export interface iSockerRoute { event: string, action: iServerSocketAction}
export type iServerSocketAction = (socket?: SocketIO.Socket, data?:any) => void

export const listenForSocketRoutes = () => {
    ioServer.on(socketEvents.connection, (socket, params) => {
        // send connection Success to finish front bootstrap
        sharedConfig.debug.connection && console.log(`[CONNECTION] new client connected`);

        ioServer.emit(socketEvents.connectionSuccess, {woop:'wooooop'})

        initUploadFileRoute(socket);

        // start listening to all events for that client
        socketRoutes.forEach(route => {
            socket.on(route.event, (data) => {
                sharedConfig.debug.socketEvents && console.log(`[SOCKET SERV EVENT] --> ${route.event} with data`, data);
                route.action(socket, data)
            })
        });
    })
}

