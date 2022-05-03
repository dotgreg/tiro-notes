import { each } from 'lodash';
import React, { useContext, useEffect, useRef } from 'react';
import { iPopupApi } from '../app/usePromptPopup.hook';
import { iFileApi, useFileApi } from './file.api.hook';

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
	popup: iPopupApi
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

	const eventsBus: iApiEventBus = {
		subscribe,
		unsubscribe,
		notify
	}



	// FILE API IMPORT
	const fileApi = useFileApi({ eventsBus });

	// UPLOAD API
	const fileApi = useFileApi({ eventsBus });

	// 
	// FINAL EXPORT
	// 
	const clientApi: iClientApi = {
		file: fileApi,
		popup: p.popupApi
	}

	return clientApi
}

// export const getClientApi = () => {
// 	return useContext(ClientApiContext)
// }

/*
const api = useContext(ClientApiContext)
*/
	// useEffect(() => {
	// 	api && api.popup.prompt({
	// 		text: 'wooop'
	// 	})
	// }, [])
