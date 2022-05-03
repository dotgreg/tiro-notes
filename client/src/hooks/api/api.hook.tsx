import { each } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { iPopupApi } from '../app/usePromptPopup.hook';
import { iFileApi, useFileApi } from './file.api.hook';
import { iFilesApi, useFilesApi } from './files.api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';
import { iUploadApi, useUploadApi } from './upload.api.hook';

//
// INTERFACES
//
interface iEventBusSubscribers { [reqId: string]: Function }
export interface iApiEventBus {
	subscribe: (reqId: string, cb: Function) => void
	unsubscribe: (reqId: string) => void
	notify: (reqId: string, answer: any) => void
}
export interface iClientApi {
	file: iFileApi
	upload: iUploadApi
	popup: iPopupApi
	move: iMoveApi
	files: iFilesApi
}


//
// OUTSIDE OF REACT
// can also get client api outside of react,
// we should avoid it, but required for some processes
// bootstrapping before that hook... like useBackendState
// feeling kindda bad, feels like a bad design pattern
//
let clientApiInt: iClientApi | null = null
export const getClientApi2 = (): Promise<iClientApi> => {
	return new Promise((res, rej) => {
		if (clientApiInt) return res(clientApiInt)
		else {
			let intId = setInterval(() => {
				if (clientApiInt) {
					clearInterval(intId)
					return res(clientApiInt)
				}
			}, 200)
		}
	})
}

//
// CONTEXT
//
export const ClientApiContext = React.createContext<iClientApi | null>(null);

export const useClientApi = (p: {
	popupApi: iPopupApi
}) => {

	//
	// EVENT/LISTENER BUS MANAGEMENT
	//
	const subscribers = useRef<iEventBusSubscribers>({})
	const subscribe: iApiEventBus['subscribe'] = (reqId, cb) => {


		subscribers.current[reqId] = cb
	}
	const unsubscribe: iApiEventBus['unsubscribe'] = reqId => {
		delete subscribers.current[reqId]
	}
	const notify: iApiEventBus['notify'] = (reqId, dataAnswer) => {
		each(subscribers.current, (sCb, sReqId) => {
			if (sReqId === reqId) {
				try { sCb(dataAnswer); }
				catch (e) { console.log('[CLIENT API] error with function', e); }
				unsubscribe(reqId)
			}
		});
	}

	const eventBus: iApiEventBus = {
		subscribe,
		unsubscribe,
		notify
	}

	useEffect(() => {
		console.log('INIT CLIENT API');
	}, [])


	const fileApi = useFileApi({ eventBus });
	const filesApi = useFilesApi({ eventBus });
	const uploadApi = useUploadApi({ eventBus });
	const moveApi = useMoveApi({ eventBus });

	// 
	// FINAL EXPORT
	// 
	const clientApi: iClientApi = {
		file: fileApi,
		files: filesApi,
		popup: p.popupApi,
		upload: uploadApi,
		move: moveApi
	}
	const clientApiRef = useRef<iClientApi>(clientApi)
	clientApiInt = clientApi

	return { clientApi, clientApiRef }
}



/*
const api = useContext(ClientApiContext)
*/
// useEffect(() => {
// 	api && api.popup.prompt({
// 		text: 'wooop'
// 	})
// }, [])
// 
// SUPPORT FUNCTION
// 
export const genIdReq = (type: string): string => {
	return `client-api-${type}-req-${generateUUID()}`;
}










/*
import React, { useEffect, useRef } from 'react';
import { iApiEventBus } from './api.hook';

//
// INTERFACES
//
export interface iMoveApi {
}

export const useMoveApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// FUNCTIONS
	// 

	//
	// EXPORTS
	//
	const api: iMoveApi = {
	}

	return api
}
*/
