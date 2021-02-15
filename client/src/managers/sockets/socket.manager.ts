import * as io from 'socket.io-client'
import { socketEvents } from '../../../../shared/sockets/sockets.events';
import { configClient } from '../../config';

export let clientSocket:SocketIOClient.Socket

export const initSocketConnection = ():Promise<SocketIOClient.Socket> => {
    return new Promise((resolve, reject) => {
        let socketBackend = `${configClient.global.socketUrl}:${configClient.global.socketPort}`
        if (clientSocket) return
        //@ts-ignore
        clientSocket = io(socketBackend);
        configClient.log.socket && console.log(`[SOCKET] connecting to ${socketBackend}...`);
        
        // resolve then connectionSuccess is received from backend
        clientSocket.on(socketEvents.connectionSuccess, (data:any) => {
            configClient.log.socket &&console.log(`[SOCKET] connection successful!, socket.connected :${clientSocket.connected}`, data);
            resolve(clientSocket)
        });
        

        // clientSocket
    })
}