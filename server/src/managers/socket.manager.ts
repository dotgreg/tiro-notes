import { iApiDictionary} from "../../../shared/apiDictionary.type";
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
                        ) => Promise<void>;

export type ServerSocketManager<ApiDict> = {
    on:ApiOnFn<ApiDict>
    emit:ApiEmitFn<ApiDict>
}

export const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

export const initServerSocketManager = <ApiDict>(rawServerSocket: SocketIO.Socket):ServerSocketManager<ApiDict> => {
    return {
        on: async (endpoint, callback, options) => {
            rawServerSocket.on(endpoint, async (rawClientData:any) => {
                
                // LOG
                console.log(`[SOCKET SERV EVENT] <== RECEIVE ${endpoint} `);
                !(options?.disableDataLog) && console.log(`with data `, rawClientData);
                
                
                // IF SETUP MODE
                if (backConfig.askForSetup && !options?.duringSetup) {
                    console.error(`[SOCKET SERV EVENT] BLOCKED AS DURING SETUP --> ${endpoint} `);
                } 
                
                // IF WRONG/NULL TOKEN 
                else if (
                    !backConfig.askForSetup && 
                    !backConfig.dev.disableLogin &&
                    !options?.bypassLoginTokenCheck && 
                    !endpoint.startsWith('siofu') &&
                    ( !rawClientData.token || getLoginToken() !== rawClientData.token )
                ) {
                    console.log(`[SOCKET SERV EVENT] <== WRONG TOKEN given by client (${endpoint})`);
                    rawServerSocket.emit('getLoginInfos', {code:'WRONG_TOKEN'})
                } 
                    
                // ELSE PROCESS TO NORMAL CALL
                else {
                    await callback(rawClientData)
                }
            });
        },
        emit: async (endpoint, payloadToSend) => {
            console.log(`[SOCKET SERV EVENT] ==> EMIT ${endpoint}`);
            await rawServerSocket.emit(endpoint, payloadToSend);
       },
    }
}

// export let serverSocket2:ServerSocketManager<iApiDictionary> 

export const initSocketLogic = () => {

    // ON NEW CLIENT CONNECTION
    ioServer.on('connection', (socket, params) => {
        console.log(`[CONNECTION] new client connected`);
        ioServer.emit('connectionSuccess', {woop: 'wooooop'})

        // creating new socket for each specific client
        const serverSocket2 = initServerSocketManager<iApiDictionary>(socket)

        if (backConfig.askForSetup) {
            setTimeout(() => {
                serverSocket2.emit('getSetupInfos', {code: 'ASK_SETUP'})
            },3000)
        }
       
        if (!backConfig.askForSetup) initUploadFileRoute(serverSocket2);

        console.log('INIT SOCKET ENDPOINTS');
        
        listenSocketEndpoints(serverSocket2)
    })
}

