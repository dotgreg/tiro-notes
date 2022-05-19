import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { ioServer } from '../server';
import { listenSocketEndpoints } from "../routes";
import { initUploadFileRoute } from "./upload.manager";
import { backConfig } from "../config.back";
import { getLoginToken } from "./loginToken.manager";
import { log } from "./log.manager";
import { getDefaultDataFolderPath } from "./fs.manager";
import { isRgCliWorking } from "./search/search-ripgrep.manager";
import {  getServerIps } from "./ip.manager";


interface routeOptions {
	duringSetup?: boolean,
	disableLog?: boolean,
	disableDataLog?: boolean,
	bypassLoginTokenCheck?: boolean,
}

type ApiOnFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
	(
	endpoint: `${Endpoint}`,
	callback: (apiAnswerData: ApiDict[Endpoint] & { token: string }) => void,
	options?: routeOptions
) => void;
type ApiEmitFn<ApiDict> = <Endpoint extends string & keyof ApiDict>
	(
	endpoint: `${Endpoint}`,
	payloadToSend: ApiDict[Endpoint]
) => Promise<void>;

export type ServerSocketManager<ApiDict> = {
	on: ApiOnFn<ApiDict>
	emit: ApiEmitFn<ApiDict>
}

export const sleep = (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}


const preprocessEndpointOptions = (endpoint: string, options?: routeOptions) => {
	if (!options) options = {}
	if (endpoint.startsWith('siofu')) {
		options.disableDataLog = true
		options.disableLog = true
	}
	return options
}

export const initServerSocketManager = <ApiDict>(rawServerSocket: SocketIO.Socket): ServerSocketManager<ApiDict> => {
	return {
		on: async (endpoint, callback, options) => {
			rawServerSocket.on(endpoint, async (rawClientData: any) => {

				options = preprocessEndpointOptions(endpoint, options)

				// LOG
				if (!options?.disableLog) log(`[SOCKET SERV EVENT] <== RECEIVE ${endpoint} ${JSON.stringify(options)}`);
				if (!options?.disableDataLog) log(`with data `, rawClientData);


				// IF SETUP MODE
				if (backConfig.askForSetup && !options?.duringSetup) {
					log(`[SOCKET SERV EVENT] BLOCKED AS DURING SETUP --> ${endpoint} `);
				}

				// IF WRONG/NULL TOKEN 
				else if (
					!backConfig.askForSetup &&
					!backConfig.dev.disableLogin &&
					!options?.bypassLoginTokenCheck &&
					!endpoint.startsWith('siofu') &&
					(!rawClientData.token || getLoginToken() !== rawClientData.token)
				) {
					log(`[SOCKET SERV EVENT] <== WRONG TOKEN given by client (${endpoint})`);
					rawServerSocket.emit('getLoginInfos', { code: 'WRONG_TOKEN' })
				}

				// ELSE PROCESS TO NORMAL CALL
				else {
					await callback(rawClientData)
				}
			});
		},
		emit: async (endpoint, payloadToSend) => {
			let options = preprocessEndpointOptions(endpoint)
			if (!options?.disableLog) log(`[SOCKET SERV EVENT] ==> EMIT ${endpoint}`);
			await rawServerSocket.emit(endpoint, payloadToSend);
		},
	}
}

// export let serverSocket2:ServerSocketManager<iApiDictionary> 

export const initSocketLogic = () => {

	// ON NEW CLIENT CONNECTION
	ioServer.on('connection', (socket, params) => {
		log(`[CONNECTION] new client connected`);

		// check if rg path is working

		isRgCliWorking().then(isRgGood => {
			//if (!isRgGood) throw new Error(backConfig.sharedConfig.strings.rgNotWorking);
			// do not block everything, that the UI still shows with the error in alert box
			if (!isRgGood) log(backConfig.sharedConfig.strings.rgNotWorking);
			ioServer.emit('connectionSuccess', { isRgGood, ipsServer: getServerIps() })
		})

		// creating new socket for each specific client
		const serverSocket2 = initServerSocketManager<iApiDictionary>(socket)

		if (backConfig.askForSetup) {
			setTimeout(() => {
				serverSocket2.emit('getSetupInfos', { code: 'ASK_SETUP', defaultFolder: getDefaultDataFolderPath() })
			}, 3000)
		}

		if (!backConfig.askForSetup) initUploadFileRoute(serverSocket2);

		log('INIT SOCKET ENDPOINTS');

		listenSocketEndpoints(serverSocket2)

	})
}

