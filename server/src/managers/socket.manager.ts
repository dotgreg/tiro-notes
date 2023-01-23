import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { ioServer } from '../server';
import { listenSocketEndpoints } from "../routes";
import { initUploadFileRoute } from "./upload.manager";
import { backConfig } from "../config.back";
import { getUserFromToken, iRole } from "./loginToken.manager";
import { log } from "./log.manager";
import { getDefaultDataFolderPath } from "./fs.manager";
import { isRgCliWorking } from "./search/search-ripgrep.manager";
import { getServerIps } from "./ip.manager";
import { sharedConfig } from "../../../shared/shared.config";


interface routeOptions {
	duringSetup?: boolean,
	disableLog?: boolean,
	disableDataLog?: boolean,
	bypassLoginTokenCheck?: boolean,
	checkRole?: iRole
}

const h = `[SOCKET SERV EVENT]`

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
	raw: any
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


const shouldlog = sharedConfig.server.log.socket
export const initServerSocketManager =
	<ApiDict>(rawServerSocket: SocketIO.Socket):
		ServerSocketManager<ApiDict> => {
		return {
			on: async (endpoint, callback, options) => {
				rawServerSocket.on(endpoint, async (rawClientData: any) => {

					options = preprocessEndpointOptions(endpoint, options)

					// VARS
					const tokenUser = getUserFromToken(rawClientData.token)

					// LOG
					if (!options?.disableLog && shouldlog) log(`${h} <== RECEIVE ${endpoint} ${JSON.stringify(options)}`);
					if (!options?.disableDataLog && shouldlog) log(`with data `, rawClientData);


					// IF SETUP MODE
					if (backConfig.askForSetup && !options?.duringSetup) {
						shouldlog && log(`${h} BLOCKED AS DURING SETUP --> ${endpoint} `);
					}

					// IF WRONG/NULL TOKEN 
					else if (
						!backConfig.askForSetup &&
						!backConfig.dev.disableLogin &&
						!options?.bypassLoginTokenCheck &&
						!endpoint.startsWith('disconnect') &&
						!endpoint.startsWith('siofu') &&
						// @TOKEN here take ROLE in
						// OPTION and check if current token has it or not
						// create new condition, if viewer try an EDIT API, returns nothing, so nothing happens
						(!rawClientData.token || !getUserFromToken(rawClientData.token))
					) {
						shouldlog && log(`${h} <== WRONG TOKEN given by client (${endpoint})`, options);
						rawServerSocket.emit('getLoginInfos', {
							code: 'WRONG_TOKEN',
							loginInfos: {
								viewer_enabled: backConfig.jsonConfig.users_viewer_user_enable === "true",
								viewer_password: backConfig.jsonConfig.users_viewer_user_password,
								demo_mode: backConfig.jsonConfig.demo_mode_enable === "true",
							}
						})
					}

					// ROLE CHECK (If fail)
					else if (
						options?.checkRole &&
						(!tokenUser || !tokenUser.roles.includes(options.checkRole))
					) {
						shouldlog && log(`${h} <== WRONG ROLE (${options.checkRole} asked by user ${JSON.stringify(tokenUser)} for "${endpoint}" `);
						rawServerSocket.emit('getLoginInfos', { code: 'WRONG_ROLE' })
					}


					// ELSE PROCESS TO NORMAL CALL
					else {
						// TRY CATCH for upload errors mainly
						try {
							await callback(rawClientData)
						} catch (e) {console.log(`${h} ==> ERROR ${JSON.stringify(e)}`);}
					}
				});
			},
			emit: async (endpoint, payloadToSend) => {
				let options = preprocessEndpointOptions(endpoint)
				if (!options?.disableLog) shouldlog && log(`${h} ==> EMIT ${endpoint}`);
				await rawServerSocket.emit(endpoint, payloadToSend);
			},
			raw: rawServerSocket
		}
	}

// export let serverSocket2:ServerSocketManager<iApiDictionary> 

export const initSocketLogic = () => {

	// ON NEW CLIENT CONNECTION
	ioServer.on('connection', (socket, params) => {
		shouldlog && log(`[CONNECTION] new client connected`);

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


		shouldlog && log('INIT SOCKET ENDPOINTS');

		listenSocketEndpoints(serverSocket2)

	})
}

