import { random } from 'lodash';
import * as io from 'socket.io-client'
import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { getSetting } from '../../components/settingsView/settingsView.component';
import { configClient } from '../../config';
import { strings } from '../strings.manager';

export let clientSocket: SocketIOClient.Socket
export let clientSocket2: ClientSocketManager<iApiDictionary>

export const getBackendUrl = () => {
	// let protocol = getSetting('backend-protocol') ? `${getSetting('backend-protocol')}://` : configClient.global.protocol
	let protocol = configClient.global.protocol
	let port = getSetting('backend-port') ? `:${getSetting('backend-port')}` : `${configClient.global.port}`  	
	let socketBackend = `${protocol}${configClient.global.url}${port}` 	
	// if port is actually an url 	
	if (getSetting('backend-port').includes(".")) socketBackend = `${protocol}${getSetting('backend-port')}` 	
	console.log("socket backend url : ", socketBackend)

	
	return socketBackend
}






export interface iServerSocketConfig {
	socket: SocketIOClient.Socket
	ipsServer: string[],
	socketManager: ClientSocketManager<iApiDictionary>
}
export const initSocketConnexion = (): Promise<iServerSocketConfig> => {
	return new Promise((resolve, reject) => {
		if (clientSocket) return

		//@ts-ignore
		clientSocket = io(getBackendUrl());
		configClient.log.socket && console.log(`[SOCKET] try connecting to ${getBackendUrl()}...`);

		// resolve then connectionSuccess is received from backend
		clientSocket2 = initClientSocketManager<iApiDictionary>(clientSocket)
		clientSocket2.on('connectionSuccess', data => {
			configClient.log.socket && console.log(`[SOCKET] connection successful!, socket.connected :${clientSocket.connected}`, data);
			if (!data.isRgGood) alert(strings.rgNotWorking);
			resolve({
				socket: clientSocket,
				ipsServer: data.ipsServer,
				socketManager: clientSocket2
			})
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

export type ClientSocketManager<ApiDict> = {
	on: ApiOnFn<ApiDict>
	off: (listenerId: number) => void;
	emit: ApiEmitFn<ApiDict>
}

const createLogMessage = (message: string, obj?: any) => [`%c [CLIENT SOCKET 2] ${message}`, 'background: #ccc; color: red', obj ? obj : null]

const createFn = (endpoint, callback) => data => {
	console.log(...createLogMessage(`<== ON ${endpoint} `, { ...data }));
	callback(data)
}

export const initClientSocketManager = <ApiDict>(rawClientSocket: SocketIOClient.Socket): ClientSocketManager<ApiDict> => {

	const activeListeners: { [listenerId: string]: { endpoint: string, apiFn: Function } } = {}

	return {
		on: (endpoint, callback) => {
			let apiFn = createFn(endpoint, callback)

			let listenerId = random(1, 100000000)
			activeListeners[listenerId] = { endpoint, apiFn }

			rawClientSocket.on(endpoint, apiFn);
			return listenerId
		},
		off: (listenerId: number) => {
			if (activeListeners[listenerId]) {
				// console.log(...createLogMessage(`OFF for ${listenerId} => ${activeListeners[listenerId]}`))
				rawClientSocket.off(activeListeners[listenerId].endpoint, activeListeners[listenerId].apiFn);
				delete activeListeners[listenerId]
			}
		},
		emit: (endpoint, payloadToSend) => {
			console.log(...createLogMessage(`==> EMIT ${endpoint} `, { ...payloadToSend }));
			rawClientSocket.emit(endpoint, payloadToSend);
		},
	}
}

