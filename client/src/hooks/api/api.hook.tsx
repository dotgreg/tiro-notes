import { cloneDeep, each, isFunction, isNumber } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { iIframeData } from '../../managers/iframe.manager';
import { iTabsApi, iWindowsApi } from '../app/tabs.hook';
import { iLightboxApi } from '../app/useLightbox.hook';
import { iPopupApi } from '../app/usePromptPopup.hook';
import { iUserSettingsApi } from '../useUserSettings.hook';
import { iBrowserApi, useBrowserApi } from './browser.api.hook';
import { iFileApi, useFileApi } from './file.api.hook';
import { iFilesApi, useFilesApi } from './files.api.hook';
import { iFoldersApi, useFoldersApi } from './folders.api.hook';
import { iNoteHistoryApi } from './history.api.hook';
import { iSearchApi, iSearchUiApi, useSearchApi } from './search.hook.api';
import { iStatusApi } from './status.api.hook';
import { iUploadApi, useUploadApi } from './upload.api.hook';
import { getFunctionParamNames } from '../../managers/functions.manager';
import { iNoteApi, useNoteApi } from './note.api.hook';
import { iRessourceApi, useRessourceApi } from './ressource.api.hook';
import { iCacheApi, useCacheApi } from './cache.api.hook';
import { sharedConfig } from '../../../../shared/shared.config';
import { iWatchApi, useWatchApi } from './watch.api.hook';
import { iTtsApi } from '../app/useTtsPopup.hook';
import { iAnalyticsApi, useAnalyticsApi } from './analytics.api.hook';
import { iCommandApi, useCommandApi } from './command.api.hook';
import { encryptApi, iEncryptApi } from '../../managers/encryption.manager';
import { iLastFilesHistoryApi } from '../app/lastFilesHistory.hook';
import { iPluginsApi, usePluginsApi } from './plugin.api.hook';
import { iNotificationApi, useNotificationApi } from './notification.api.hook';
import { iSocketApi, useSocketApi } from './socket.api.hook';


//
// INTERFACES
//
interface iEventBusOptions { persistent?: boolean }
interface iEventBusSubscribers {
	[reqId: string]: {
		cb: Function,
		options: iEventBusOptions
	}[]
}
export interface iApiEventBus {
	subscribe: (reqId: string, cb: Function, options?: iEventBusOptions) => void
	unsubscribe: (reqId: string) => void
	notify: (reqId: string, answer: any) => void
}

/**
 * comment test2
 */
export interface iClientApi {
	file: iFileApi
	upload: iUploadApi
	ressource: iRessourceApi
	/**
	 * comment3
	 */
	watch: iWatchApi
	socket: iSocketApi
	cache: iCacheApi
	popup: iPopupApi
	files: iFilesApi
	folders: iFoldersApi
	tabs: iTabsApi
	userSettings: iUserSettingsApi
	history: iNoteHistoryApi
	note: iNoteApi
	search: iSearchApi
	analytics: iAnalyticsApi
	command: iCommandApi
	encryption: iEncryptApi,
	plugins: iPluginsApi,
	ui: {
		browser: iBrowserApi
		windows: iWindowsApi
		notification: iNotificationApi
		lightbox: iLightboxApi
		textToSpeechPopup: iTtsApi
		search: iSearchUiApi
		note: iNoteApi["ui"]
	}
	status: iStatusApi,
	lastNotesApi?: iLastFilesHistoryApi,

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
export const getApi = (cb: (api: iClientApi) => void) => {
	getClientApi2().then(api => { cb(api) })
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
	ttsApi: iTtsApi
	historyApi: iNoteHistoryApi
}) => {

	//
	// EVENT/LISTENER BUS MANAGEMENT
	//
	const subscribers = useRef<iEventBusSubscribers>({})
	const subscribe: iApiEventBus['subscribe'] = (reqId, cb, options) => {
		if (!options) options = {}
		if (!subscribers.current[reqId]) subscribers.current[reqId] = []
		subscribers.current[reqId].push({ cb, options })
	}
	const unsubscribe: iApiEventBus['unsubscribe'] = reqId => {
		delete subscribers.current[reqId]
	}
	const notify: iApiEventBus['notify'] = (reqId, dataAnswer) => {
		each(subscribers.current, (subObj, sReqId) => {
			if (sReqId === reqId) {
				each(subObj, cbObj => {
					try { cbObj.cb(dataAnswer); }
					catch (e) { console.log('[CLIENT API] error with function', e); }
					if (!cbObj.options.persistent) unsubscribe(reqId)
				})
			}
		});
	}

	const eventBus: iApiEventBus = {
		subscribe,
		unsubscribe,
		notify
	}

	useEffect(() => {
		const log = sharedConfig.client.log.verbose
		log && console.log('[CLIENT API ]INIT ');
	}, [])


	const watchApi = useWatchApi({ eventBus });
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
	const ressourceApi = useRessourceApi({ eventBus });
	const foldersApi = useFoldersApi({ eventBus });
	const commandApi = useCommandApi({ eventBus });
	const pluginsApi = usePluginsApi({eventBus})
	const cacheApi = useCacheApi({});
	const notificationApi = useNotificationApi({});
	const socketApi = useSocketApi({});


	const browserApi = useBrowserApi({
		searchUiApi: searchApi.ui,
		statusApi: p.statusApi,
		filesApi,
		foldersApi,
		windowApi: p.windowsApi,
		tabsApi: p.tabsApi,
		userSettingsApi: p.userSettingsApi
	})

	const noteApi = useNoteApi({})
	const analyticsApi = useAnalyticsApi({})
	


	// 
	// FINAL EXPORT
	// 
	const clientApi: iClientApi = {
		cache: cacheApi,
		file: fileApi,
		encryption: encryptApi,
		files: filesApi,
		socket: socketApi,
		popup: p.popupApi,
		upload: uploadApi,
		ressource: ressourceApi,
		tabs: p.tabsApi,
		folders: foldersApi,
		userSettings: p.userSettingsApi,
		history: p.historyApi,
		status: p.statusApi,
		note: noteApi,
		analytics: analyticsApi,
		search: searchApi,
		command: commandApi,
		plugins: pluginsApi,
		watch: watchApi,
		ui: {
			browser: browserApi,
			notification: notificationApi,
			windows: p.windowsApi,
			lightbox: p.lightboxApi,
			textToSpeechPopup: p.ttsApi,
			search: searchApi.ui,
			note: noteApi.ui
		},
	}
	// outside of react too
	clientApiInt = clientApi

	return clientApi
}

// 
// SUPPORT FUNCTION
// 
export const genIdReq = (type: string): string => {
	return `client-api-${type}-req-${generateUUID()}`;
}


type iCallApiCb = (status: 'ok' | 'nok', data?: any) => void
export const callApiFromString = (p: iIframeData['apiCall'], cb: iCallApiCb) => {
	getClientApi2().then(api => {
		const callNameArr = p.apiName.split('.')
		let callingObj: any | null = api

		// check if api call exists
		each(callNameArr, prop => {
			if (callingObj[prop]) callingObj = callingObj[prop]
			else callingObj = null
		})

		if (callingObj === null) return cb('nok', { error: `"${p.apiName}" does not exists in current api \n\nAvailable Api properties :\n\n${printObjProps('', api)}` })


		// try to call that prop with the param
		// files.getContent('fdlsakfdsja', cb(), options)
		try {
			const pos = getCallbackArgPosition(callingObj)
			if (!isNumber(pos)) {
				// non callback func simply call it, then take result (directly)
				let res = callingObj(...p.apiArguments)
				return cb('ok', res)
			} else {
				// cl func, inject cb inside params
				const nargs = cloneDeep(p.apiArguments)
				const callback = (res) => {
					cb('ok', res)
				}
				nargs.splice(pos, 0, callback)
				callingObj(...nargs)
			}
			// callingObj(...p.apiArguments)
		} catch (e) {
			return cb('nok', { error: `error "${JSON.stringify(e)}" when executing "${p.apiName}" with props ${p.apiArguments}` })
		}
	})
}



const getCallbackArgPosition = (fn: Function): number | null => {
	const args = getFunctionParamNames(fn)
	// problem with that one is function names are compressed by webpack...
	// mangle: {reserved: ["cb"], => has been preserved by webpack minify config
	let index = args.indexOf('cb')
	if (index === -1) return null
	return index
}
const printObjProps = (pre: string, obj: any) => {
	let res = ``
	for (var key in obj) {
		if (typeof obj[key] === "object" && obj[key].constructor !== Array) {
			if (key.length > 1 && key !== 'get') {
				const npre = pre !== '' ? `${pre}.` : ''
				res += printObjProps(`${npre}${key}`, obj[key]);
			}
		} else {
			res = `${res}${pre}.${key}\n`
		}
	}
	const rawRes = res.split("\n")
	const arrRes: any[] = []

	getClientApi2().then(api => {

		each(rawRes, call => {
			const callArr = call.split(".")
			let obj: any = api
			each(callArr, (prop, i) => {
				if (obj[prop]) obj = obj[prop]
			})
			let type = 'var'
			let description = ''
			if (isFunction(obj)) {
				type = 'Function'
				description = obj.toString()
			}
			arrRes.push({
				name: call,
				type,
				description
			})
		})



	})

	return res
}






