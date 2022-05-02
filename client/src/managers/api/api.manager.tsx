import '../../managers/scriptsInMarkdown.manager';
import { each, random } from 'lodash';
import { ClientSocketManager } from '../../managers/sockets/socket.manager';
import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { fileApi, iFileApi, initFileApi } from './file.api.manager';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { initUploadApi, iUploadApi, uploadApi } from './upload.api.manager';

//
// FUNCTION TO USE 
//
export const getClientApi = (): Promise<iClientApi> => {
	return new Promise((res, rej) => {
		if (clientApiInt) return res(clientApiInt)
		else {
			let intId = setInterval(() => {
				if (clientApiInt) {
					return res(clientApiInt)

				}
			}, 200)
		}
	})
}


//
// INIT LOGIC
//
export const initClientApi = (clientSocket2: ClientSocketManager<iApiDictionary>) => {
	console.log(`[CLIENT API] INIT CLIENT DONE`);
	initFileApi()
	initUploadApi()

	// COMPLETE ClientApiInt
	clientApiInt = {
		file: fileApi,
		upload: uploadApi,
	}
}


//
// INTERFACES
//
export interface iClientApi {
	file: iFileApi
	upload: iUploadApi
}


// int
let clientApiInt: iClientApi | null = null

//
// EVENT BUS MANAGEMENT
//

interface iListenersDic { [idReq: string]: Function }
const listeners: iListenersDic = {}
const addListenerCallback = (reqId: string, cb: Function) => {
	listeners[reqId] = cb
}
const onEventTriggerGoodListener = (reqIdAnswer: string, dataAnswer: any) => {
	each(listeners, (listenerCb, listenerReqId) => {
		if (listenerReqId === reqIdAnswer) {
			try {
				listenerCb(dataAnswer);
			} catch (e) {
				console.log('[CLIENT API] error with function', e);
			}
			delete listeners[listenerReqId];
		}
	});
}
export const clientApiEventsBus = {
	triggerOnce: addListenerCallback,
	addPermanentListener: onEventTriggerGoodListener
}

// 
// SUPPORT FUNCTION
// 
export const genIdReq = (type: string): string => {
	return `client-api-${type}-req-${generateUUID()}`;
}
