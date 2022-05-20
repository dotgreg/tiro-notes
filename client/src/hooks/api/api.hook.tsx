import { cloneDeep, each, isFunction, isNumber } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { iIframeData } from '../../managers/iframe.manager';
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
import { getFunctionParamNames } from '../../managers/functions.manager';
import { z } from "zod";


const User = z.object({
	username: z.string()
});
export type iUser = z.infer<typeof User>

const myFunction = z
	.function()
	.args(z.string(), z.number()) // accepts an arbitrary number of arguments
	.returns(z.boolean());

//@ts-ignore
window.myfun = myFunction
type myFunction = z.infer<typeof myFunction>;
console.log(122222333, User, myFunction, JSON.stringify(myFunction.returnType()), myFunction.returnType()._def.typeName);
// en gros je peux creer des types et objets
// en deduire des types
// et je peux generer une docuentation

const nestedObj = z.object({
	prop1: z.number(),
	prop2: z.string(),
})
const myBiggerObject = z.object({
	user: z.string(),
	age: z.number().optional(),
	fun: myFunction,
	nested: nestedObj
})

//@ts-ignore
window.test2 = myBiggerObject

console.log(122222333, myBiggerObject, JSON.stringify(myBiggerObject));



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


// const User1 = t.type({
// 	userId: t.number,
// 	name: t.string
// })
// const f2 = t.interface({
// 	set: t.FunctionType((hello: t.string, world: t.number) => t.string)
// })

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

		if (!callingObj) return cb('nok', { error: `"${p.apiName}" does not exists in current api \n\nAvailable Api properties :\n\n${printObjProps('', api)}` })


		// try to call that prop with the param
		// files.getContent('fdlsakfdsja', cb(), options)
		try {
			const pos = getCallbackArgPosition(callingObj)
			if (!pos) {
				// non callback func simply call it
				callingObj(...p.apiArguments)
				return cb('nok', { error: `error when executing "${p.apiName}" with props ${p.apiArguments}` })
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
			return cb('nok', { error: `error when executing "${p.apiName}" with props ${p.apiArguments}` })
		}
	})
}



const getCallbackArgPosition = (fn: Function): number | null => {
	const args = getFunctionParamNames(fn)
	const index = args.indexOf('cb')
	if (!index || index === -1) return null
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
	// console.log(123333, arrRes, User1, f2);

	return res
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
