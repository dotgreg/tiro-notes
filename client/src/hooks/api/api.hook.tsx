import { each } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { iNoteApi, noteApi } from '../../managers/renderNote.manager';
import { iTabsApi, iWindowsApi } from '../app/tabs.hook';
import { iLightboxApi } from '../app/useLightbox.hook';
import { iPopupApi } from '../app/usePromptPopup.hook';
import { iUserSettingsApi } from '../useUserSettings.hook';
import { iBrowserApi, useBrowserApi } from './browser.api.hook';
import { iFileApi, useFileApi } from './file.api.hook';
import { iFilesApi, useFilesApi } from './files.api.hook';
import { iFoldersApi, useFoldersApi } from './folders.api.hook';
import { iNoteHistoryApi } from './history.api.hook';
import { iSearchApi, useSearchApi } from './search.hook.api';
import { iStatusApi } from './status.api.hook';
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
	files: iFilesApi
	folders: iFoldersApi
	tabs: iTabsApi
	userSettings: iUserSettingsApi
	history: iNoteHistoryApi
	note: iNoteApi
	ui: {
		browser: iBrowserApi
		windows: iWindowsApi
		lightbox: iLightboxApi
		search: iSearchApi['ui']
	}
	status: iStatusApi
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
	tabsApi: iTabsApi
	userSettingsApi: iUserSettingsApi
	windowsApi: iWindowsApi
	statusApi: iStatusApi
	lightboxApi: iLightboxApi
	historyApi: iNoteHistoryApi
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


	const searchApi = useSearchApi({
		eventBus,
		statusApi: p.statusApi
	});
	const fileApi = useFileApi({
		eventBus,
		historyApi: p.historyApi
	});
	const filesApi = useFilesApi({
		eventBus,
		searchApi,
		statusApi: p.statusApi
	});
	const uploadApi = useUploadApi({ eventBus });
	const foldersApi = useFoldersApi({ eventBus });


	const browserApi = useBrowserApi({
		searchUiApi: searchApi.ui,
		statusApi: p.statusApi,
		filesApi,
		foldersApi,
		windowApi: p.windowsApi,
		tabsApi: p.tabsApi,
		userSettingsApi: p.userSettingsApi
	})

	// 
	// FINAL EXPORT
	// 
	const clientApi: iClientApi = {
		file: fileApi,
		files: filesApi,
		popup: p.popupApi,
		upload: uploadApi,
		tabs: p.tabsApi,
		folders: foldersApi,
		userSettings: p.userSettingsApi,
		history: p.historyApi,
		status: p.statusApi,
		note: noteApi,
		ui: {
			browser: browserApi,
			windows: p.windowsApi,
			lightbox: p.lightboxApi,
			search: searchApi.ui
		},
	}
	// outside of react too
	clientApiInt = clientApi

	return clientApi
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
