import { iApiDictionary, socketEvents} from "../../../shared/apiDictionary.type";
import { ioServer } from '../server';
import { listenSocketEndpoints } from "../routes";
import { initUploadFileRoute } from "./upload.manager";
import { backConfig } from "../config.back";
import { getLoginToken } from "./loginToken.manager";


interface routeOptions {
    duringSetup?: boolean,
    disableDataLog?:boolean,
    bypassLoginTokenCheck?:boolean,
} 

type ApiOnFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
                        (
                            endpoint: `${Endpoint}`, 
                            callback: (apiAnswerData: ApiDict[Endpoint]  & { token: string } ) => void,
                            options?:routeOptions
                        ) => void;
type ApiEmitFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
                        (
                            endpoint: `${Endpoint}`, 
                            payloadToSend: ApiDict[Endpoint]
                        ) => void;

type ServerSocketManager<ApiDict> = {
    on:ApiOnFn<ApiDict>
    emit:ApiEmitFn<ApiDict>
}

export const initServerSocketManager = <ApiDict>(rawServerSocket: SocketIO.Socket):ServerSocketManager<ApiDict> => {
    return {
        on: async (endpoint, callback, options) => {
            rawServerSocket.on(endpoint, async (rawClientData:any) => {
                if (backConfig.askForSetup && !options?.duringSetup) {
                    console.error(`[SOCKET SERV EVENT] BLOCKED AS DURING SETUP --> ${endpoint} `);
                } else {
                    console.log(`[SOCKET SERV EVENT] <== RECEIVE ${endpoint} `);
                    !(options?.disableDataLog) && console.log(`with data `, rawClientData);
                    
                    if (!options?.bypassLoginTokenCheck && (
                        !rawClientData.token ||
                        getLoginToken() !== rawClientData.token 
                    )) {
                        // wrong token
                        console.log(`[SOCKET SERV EVENT] <== WRONG TOKEN given by client (${endpoint})`);
                        serverSocket2.emit('getLoginInfos', {code:'WRONG_TOKEN'})
                    } else {
                        await callback(rawClientData)
                    }

                }
            });
        },
        emit: (endpoint, payloadToSend) => {
            // console.log(...createLogMessage(`==> EMIT ${endpoint} `,{...payloadToSend}));
            console.log(`[SOCKET SERV EVENT] ==> EMIT ${endpoint}`);
            rawServerSocket.emit(endpoint, payloadToSend);
       },
    }
}

export let serverSocket2:ServerSocketManager<iApiDictionary> 

export const initSocketLogic = () => {

    // ON NEW CLIENT CONNECTION
    ioServer.on(socketEvents.connection, (socket, params) => {
        console.log(`[CONNECTION] new client connected`);
        ioServer.emit(socketEvents.connectionSuccess, {woop: 'wooooop'})

        serverSocket2 = initServerSocketManager<iApiDictionary>(socket)

        if (backConfig.askForSetup) {
            setTimeout(() => {
                serverSocket2.emit('getSetupInfos', {code: 'ASK_SETUP'})
            },3000)
        }
       
        if (!backConfig.askForSetup) initUploadFileRoute(socket);

        console.log('INIT SOCKET ENDPOINTS');
        
        listenSocketEndpoints()
    })
}

