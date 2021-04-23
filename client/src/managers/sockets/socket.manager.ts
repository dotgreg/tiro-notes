import { random } from 'lodash';
import * as io from 'socket.io-client'
import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { configClient } from '../../config';

export let clientSocket:SocketIOClient.Socket
export let clientSocket2:ClientSocketManager<iApiDictionary>

export const initSocketConnection = ():Promise<SocketIOClient.Socket> => {
    return new Promise((resolve, reject) => {
        let socketBackend = `${configClient.global.protocol}://${configClient.global.socketUrl}:${configClient.global.socketPort}`
        if (clientSocket) return
        //@ts-ignore
        clientSocket = io(socketBackend);
        configClient.log.socket && console.log(`[SOCKET] connecting to ${socketBackend}...`);

        // resolve then connectionSuccess is received from backend
        clientSocket2 = initClientSocketManager<iApiDictionary>(clientSocket)
        clientSocket2.on('connectionSuccess', data => {
            configClient.log.socket &&console.log(`[SOCKET] connection successful!, socket.connected :${clientSocket.connected}`, data);
            resolve(clientSocket)
        })
    })
}




type ApiOnFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
                        (
                            endpoint: `${Endpoint}`, 
                            callback: (apiAnswerData: ApiDict[Endpoint]) => void
                        ) => number;

type ApiEmitFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
                        (
                            endpoint: `${Endpoint}`, 
                            payloadToSend: ApiDict[Endpoint] & { token: string } 
                        ) => void;

type ClientSocketManager<ApiDict> = {
    on:ApiOnFn<ApiDict>
    off: (listenerId:number) => void;
    emit:ApiEmitFn<ApiDict>
}

const createLogMessage = (message:string,obj?:any) => [`%c [CLIENT SOCKET 2] ${message}`,'background: #ccc; color: red',obj ? obj : null]

const createFn = (endpoint, callback) => data => {
    console.log(...createLogMessage(`<== ON ${endpoint} `,{...data}));
    callback(data)
}

export const initClientSocketManager = <ApiDict>(rawClientSocket:SocketIOClient.Socket):ClientSocketManager<ApiDict> => {
    
    const activeListeners:{[listenerId:string]:{endpoint:string, apiFn:Function}} = {}

    return {
        on: (endpoint, callback) => {
            let apiFn = createFn(endpoint, callback)
            
            let listenerId = random(1, 10000000)
            activeListeners[listenerId] = {endpoint, apiFn}
            
            rawClientSocket.on(endpoint, apiFn);
            return listenerId
        },
        off: (listenerId:number) => {
            if (activeListeners[listenerId]) {
                console.log(...createLogMessage(`OFF for ${listenerId} => ${activeListeners[listenerId]}`))
                rawClientSocket.off(activeListeners[listenerId].endpoint, activeListeners[listenerId].apiFn);
                delete activeListeners[listenerId] 
            }
        },
        emit: (endpoint, payloadToSend) => {
            console.log(...createLogMessage(`==> EMIT ${endpoint} `,{...payloadToSend}));
            rawClientSocket.emit(endpoint, payloadToSend);
       },
    }
}

