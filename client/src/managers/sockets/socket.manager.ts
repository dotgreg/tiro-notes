import { random } from 'lodash-es';
// import * as io from 'socket.io-client'
// const io = require('./socket.io.slim');
import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { getSetting } from '../../components/settingsView/settingsView.component';
import { configClient } from '../../config';
import { strings } from '../strings.manager';
import * as io from 'socket.io-client'
import { getApi } from '../../hooks/api/api.hook';
import { startRipgrepInstallerProcess } from '../ripgrepInstaller.manager';
// import 'socket.io-client'

export let clientSocket: SocketIOClient.Socket
let cs2: any = { on: () => { }, off: () => { } }
export let clientSocket2: ClientSocketManager<iApiDictionary> = cs2
let initSocketConnexionPromise: Promise<iServerSocketConfig>




export const getBackendUrl = () => {
	let protocol = configClient.global.protocol
	let port = getSetting('backend-port') ? `:${getSetting('backend-port')}` : `${configClient.global.port}`

	let socketBackend = `${protocol}${configClient.global.url}${port}`
	// if port is actually an url 	
	if (getSetting('backend-port').includes(".")) socketBackend = `${protocol}${getSetting('backend-port')}`
	return socketBackend
}


 



export interface iServerSocketConfig {
	socket: SocketIOClient.Socket
	ipsServer: string[],
	socketManager: ClientSocketManager<iApiDictionary>
}
export const initSocketConnexion = (): Promise<iServerSocketConfig> => {
	if (initSocketConnexionPromise) return initSocketConnexionPromise
	initSocketConnexionPromise = new Promise((resolve, reject) => {
		let ioWrapper = io ? io.default : () => { }

		//@ts-ignore
		clientSocket = ioWrapper(getBackendUrl());
		configClient.log.socket && console.log(`[SOCKET] try connecting to ${getBackendUrl()}...`);

		// resolve then connectionSuccess is received from backend
		clientSocket2 = initClientSocketManager<iApiDictionary>(clientSocket)
		clientSocket2.on("onServerError", data => {
			if (data.status === "NO_RIPGREP_COMMAND_AVAILABLE") {
				getApi(api => {
					startRipgrepInstallerProcess(data.platform)
				})
			}
		})
		clientSocket2.on('connectionSuccess', data => {
			configClient.log.socket && console.log(`[SOCKET] connection successful!, socket.connected :${clientSocket.connected}`, data);
			if (!data.isRgGood) {
				
			}
			resolve({
				socket: clientSocket,
				ipsServer: data.ipsServer,
				socketManager: clientSocket2
			})
		})
	})
	return initSocketConnexionPromise
}




// export interface iSocketApi {
// 	emit: (notification: iNotification) => void
// 	on: (cb:(Notification:iNotification) => void) => void
// }




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

//
// LOGIN GATE
// Every emit fired while the login/token exchange is not finished gets a WRONG_TOKEN answer
// from the backend: the request is dropped AND the login popup flashes during page load
// (a server restart regenerates every token, so a cold load used to flood the backend with
// unauthenticated emits). Buffer them, then replay with the fresh token.
// The gate stays inert (open) until useLoginToken arms it, so PublicApp (no login popup) works.
//
const LOGIN_GATE_MAX = 300  // ponytail: cap only, a full page load fires ~30 emits
// a backend that never answers the probe (old server version without checkLoginToken, setup mode)
// would keep every request queued forever: the gate opens by itself, the requests go out
// unauthenticated, the backend answers WRONG_TOKEN and the silent re-login of loginToken.hook takes over
// 3 s: the probe is sent right after the socket handshake, so a late answer means "no answer"
const LOGIN_GATE_SAFETY_MS = 3000
let gateClosed = false
let gateReplay: (endpoint: any, payload: any) => void = () => { }
let gateSafetyTimer: any = null
const gatedEmits: { endpoint: string, payload: any }[] = []
// login endpoints must never be buffered, they are what opens the gate
const gateBypass = (endpoint: string) => endpoint.startsWith('siofu') || endpoint === 'sendLoginInfos' || endpoint === 'checkLoginToken'

export const armLoginGate = (replay?: (endpoint: any, payload: any) => void) => {
	if (replay) gateReplay = replay
	gateClosed = true
	if (gateSafetyTimer) clearTimeout(gateSafetyTimer)
	gateSafetyTimer = setTimeout(openLoginGate, LOGIN_GATE_SAFETY_MS)
}
export const openLoginGate = (replay: (endpoint: any, payload: any) => void = gateReplay) => {
	if (gateSafetyTimer) clearTimeout(gateSafetyTimer)
	gateSafetyTimer = null
	gateClosed = false
	gatedEmits.splice(0).forEach(gated => replay(gated.endpoint, gated.payload))
}
export const loginGatePending = () => gatedEmits.length

const createFn = (endpoint, callback) => data => {
	configClient.log.socket && console.log(...createLogMessage(`<== ON ${endpoint} `, { ...data }));
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
			configClient.log.socket && console.log(...createLogMessage(`==> EMIT ${endpoint} `, { ...payloadToSend }));
			if (gateClosed && !gateBypass(endpoint)) {
				if (gatedEmits.length < LOGIN_GATE_MAX) gatedEmits.push({ endpoint, payload: payloadToSend })
				return
			}
			rawClientSocket.emit(endpoint, payloadToSend);
		},
	}
}

