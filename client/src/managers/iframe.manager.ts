import { each } from "lodash";
import { generateUUID, getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { bindToElClass } from "./renderNote.manager";
import { iFile, iFileNature } from "../../../shared/types.shared";
import { createEventBus, iEventBusMessage } from "./eventBus.manager";
import { replaceCustomMdTags } from "./markdown.manager";
import { unescapeHtml } from "./textProcessor.manager";
import { getUrlParams } from "./url.manager";
import { getLoginToken } from "../hooks/app/loginToken.hook";
import { configClient } from "../config";
import { getSetting } from "../components/settingsView/settingsView.component";
import { getBackendUrl } from "./sockets/socket.manager";

type iIframeActions = 'init' | 'apiCall' | 'apiAnswer' | 'resize' | 'iframeError'

export interface iIframeData {
	init: {
		file: iFile | null
		innerTag: string
		tagName: string
		tagContent: string
		frameId: string
	}
	resize: {
		height: number | string
	}
	iframeError: {
		error: string
	}
	apiCall: {
		reqId: string
		apiName: string,
		apiArguments: any[]
	}
	apiAnswer: {
		reqId: string
		data: any
	}
}


interface iIframeMessage {
	action: iIframeActions
	data: any
}

///////////////////////////////////////////////////////////////////////// 
// PARENT CODE
//

const h = `[IFRAME PARENT] 00563`

//
// Creating an Event Bus
//
const { notify, subscribe, unsubscribe } = createEventBus<iIframeMessage>({
	headerLog: h
})


//
// LISTENING
//
const initIframeListening = () => {
	// console.log(h, `INIT IFRAME LISTENING`);
	window.addEventListener('message', m => {
		if (!m.data.subId) return
		console.log(h, 'parent <== iframe', m.data.data);
		notify(m.data)
	});
}
initIframeListening()


const sendToIframe = (el: HTMLIFrameElement | null, message: iIframeMessage) => {
	if (!el || !el.contentWindow) return;
	console.log(h, `parent ==> iframe`, message);
	el.contentWindow.postMessage(message, "*")
}

//
// EXPORTS
//
export const iframeParentManager = {
	subscribe,
	unsubscribe,
	send: sendToIframe,
}















///////////////////////////////////////////////////////////////////////// 
// CHILD: JAVASCRIPT CODE EXECUTED IN IFRAME
// Doesnt have access to any library of the project
//

//
// IFRAME CODE
//
export const generateIframeHtml = (tagContent: string) => {
	const html = `
<html>
		<div id="content-wrapper">
				${tagContent}
		</div>
		<div id="external-ressources-wrapper"></div>
		<script>
				const IMPORTED_backend_url = "${getBackendUrl()}"
				const IMPORTED_login_token = "${getLoginToken()}"
				const IMPORTED_replaceCustomMdTags = ${replaceCustomMdTags.toString()}
				const IMPORTED_unescapeHtml = ${unescapeHtml.toString()}
				const IMPORTED_createEventBus = ${createEventBus.toString()}
				const IMPORTED_generateUUID = ${generateUUID.toString()}
				const IMPORTED_getRessourceIdFromUrl = ${getRessourceIdFromUrl.toString()}
				const IMPORTED_bindToElClass = ${bindToElClass.toString()}
				const main = ${iframeMainCode.toString()};
				main({
					backendUrl: IMPORTED_backend_url,
					loginToken: IMPORTED_login_token,
					replaceCustomMdTags: IMPORTED_replaceCustomMdTags,
					unescapeHtml: IMPORTED_unescapeHtml,
					createEventBus: IMPORTED_createEventBus,
					generateUUID: IMPORTED_generateUUID,
					getRessourceIdFromUrl: IMPORTED_getRessourceIdFromUrl,
					bindToElClass: IMPORTED_bindToElClass
				})
		</script>
</html>
`
	return html
}


export const iframeMainCode = (p: {
	backendUrl,
	loginToken,
	replaceCustomMdTags,
	unescapeHtml,
	createEventBus,
	generateUUID,
	getRessourceIdFromUrl,
	bindToElClass
}) => {
	const h = '[IFRAME child] 00564'

	console.log(h, 'IFRAME CHILD MAIN CODE STARTED...');

	// 
	// STORAGE
	//
	const d: iIframeData['init'] = {
		file: null,
		frameId: '',
		innerTag: '',
		tagName: '',
		tagContent: '',
	}
	const getInfos = () => d

	//
	// SUPPORT FUNCTIONS
	//
	const sendToParent = (message: iIframeMessage) => {
		if (d.frameId === '') return console.warn(h, 'NO FRAME ID, CANNOT SEND TO PARENT')
		// wrap it around an event for the iframeParentManager Event Bus
		const wrappedMessage = { subId: d.frameId, data: message }
		window.parent.postMessage(wrappedMessage, '*');
	}
	const sendError = (message: string) => {
		const data: iIframeData['iframeError'] = { error: `CUSTOM TAG/SCRIPT ERROR: ${message}` }
		sendToParent({ action: 'iframeError', data })
	}

	const onParentEvent = (events: { [event in iIframeActions]?: Function }) => {
		window.onmessage = (e) => {
			const msg = e.data as iIframeMessage
			if (!msg) return
			for (const event in events) {
				// @ts-ignore
				if (events && events[event] && event === msg.action) events[event](e.data.data)
			}
		}
	}

	const executeScriptTags = (bodyRaw: string): string => {
		let res = p.replaceCustomMdTags(
			bodyRaw,
			'[[script]]',
			(UNSAFE_user_script: string) => {
				// console.log(h, UNSAFE_user_script);
				const scriptTxt = `${UNSAFE_user_script}`
				try {
					// using Function instead of eval to isolate the execution scope
					return new Function(scriptTxt)()
				} catch (e: any) {
					console.warn(h, `[SCRIPT] error: ${e}`, scriptTxt)
					sendError(`${e} in Code "${scriptTxt}"`)
				}
			});
		return res;
	};


	const injectLogicToIframeHtml = () => {
		// title search links
		p.bindToElClass('title-search-link', el => {
			const file = el.dataset.file
			const folder = el.dataset.folder
			const windowId = el.dataset.windowid
			api.call('ui.browser.goTo', [folder, file, { openIn: windowId }])
		})
	}

	const getIframeHeight = () => {

	}


	///////////////////////////////////////////////////////////////////////// 
	// BOOTSTRAP LOGIC
	const iframeInitLogic = (m: iIframeData['init']) => {
		// BOOTING
		// When iframe receive infos from parent
		d.frameId = m.frameId
		d.innerTag = m.innerTag
		d.tagContent = m.tagContent
		d.tagName = m.tagName
		d.file = m.file
		// console.log(h, '1/2 RECEIVED INIT EVENT', d.frameId);

		// get content and replace script tags
		const el = document.getElementById('content-wrapper')
		console.log(h, 'init message from parent received in child iframe', d);
		if (el) {
			console.log(h, '222222', el);

			// unescape html and scripts
			const unescHtml = p.unescapeHtml(el.innerHTML) as string
			const newHtml = executeScriptTags(unescHtml)
			// console.log(h, '2/2 transformMarkdownScript', { old: el.innerHTML, new: newHtml });
			el.innerHTML = newHtml
			//
			// sending height back for resizing sthg
			setTimeout(() => {
				resizeIframe()
			}, 100)

			// inject logic to html
			injectLogicToIframeHtml()

		}
	}

	const resizeIframe = (height?: number) => {
		const el = document.getElementById('content-wrapper')
		if (!height) {
			if (el && el.clientHeight !== 0) height = el.clientHeight + 20
			else return
		}

		const data: iIframeData['resize'] = { height }
		sendToParent({ action: 'resize', data })
	}

	///////////////////////////////////////////////////////////////////////// 
	//
	// API => CUSTOM TAG AVAILABLE API in IFRAME
	//

	//  CREATING EVENT BUS TO MANAGE API CALLS
	const { subscribeOnce, notify } = p.createEventBus({ headerLog: '[FRAME API] 00567' })



	/////////////////////////////
	// LOAD CACHED RESSOURCE & LOAD SCRIPTS : Loading and caching ressources

	///////////
	// SUPPORT FUNCTIONS
	const checkUrlExists = (url, onSuccess, onFail) => {
		try {
			var http = new XMLHttpRequest();
			http.open('HEAD', url, false);
			http.send();
			// return http.status != 404;
			if (http.status !== 404) return onSuccess()
			return onFail()
		} catch (e) {
			onFail(e)
		}
	}

	const loadLocalRessourceInHtml = (url, onLoad) => {
		let tag
		// console.log("111111 loading", url);
		if (url.includes(".js")) {
			// console.log("1111112 loading", url);
			tag = document.createElement('script');
			tag.src = url
		}
		else if (url.includes(".css")) {
			tag = document.createElement('link');
			tag.href = url
			tag.rel = "stylesheet"
			tag.type = "text/css"
		}
		tag.onload = () => {
			// console.log("111113 LOADED!!", url);
			onLoad()
		}
		const el = document.getElementById('external-ressources-wrapper')

		if (!el) return console.error(h, `could not load ${url} because ressource wrapper was not detected`)
		el.appendChild(tag)
	}

	const getCachedRessourceFolder = () => `/.tiro/.tags-ressources/`
	const getCachedRessourceUrl = (url: string): string => {
		const tokenParamStr = `?token=${p.loginToken}`
		const path = `${p.backendUrl}/static${getCachedRessourceFolder()}${p.getRessourceIdFromUrl(url)}${tokenParamStr}`
		return path
	}

	//////////
	// API FUNCTIONS
	const loadCachedRessources = (ressources: string[], cb: Function) => {
		// console.log(h, 'loadCachedRessources', ressources);

		let ressourcesLoaded = 0;
		const onRessLoaded = () => {
			ressourcesLoaded++
			// console.log(h, `ressources: ${ressourcesLoaded}/${ressources.length}`);
			if (ressourcesLoaded === ressources.length) {
				console.log(`ressources all ressources loaded, cb()!`, ressources);
				try {
					if (cb) cb()
				} catch (e) {
					console.log(h, `ERROR LoadScript Callback : ${e}`);
				}
			}
		}

		for (let i = 0; i < ressources.length; i++) {
			const ressToLoad = ressources[i];
			const cachedRessToLoad = getCachedRessourceUrl(ressToLoad)

			//@ts-ignore
			const disableCache = window.disableCache === true ? true : false

			const downloadAndLoadRess = () => {
				callApi("ressource.download", [ressToLoad, getCachedRessourceFolder()], () => {
					// ==== on cb, load that tag
					loadLocalRessourceInHtml(cachedRessToLoad, () => { onRessLoaded() })
				})
			}

			if (disableCache) {
				console.warn(h, "CACHE DISABLED, DOWNLOADING RESSOURCES EVERYTIME!");
				downloadAndLoadRess()
			} else {
				checkUrlExists(cachedRessToLoad,
					() => {
						loadLocalRessourceInHtml(cachedRessToLoad, () => { onRessLoaded() })
					}, () => {
						downloadAndLoadRess()
					})
			}
		}
	}


	// LOAD EXTERNAL SCRIPTS
	const loadScripts = (scripts: string[], cb: Function) => {
		loadCachedRessources(scripts, cb)
	}

	// LOAD CUSTOM TAG
	const loadCustomTag = (url: string, innerTag: string, opts: any) => {
		const { div, updateContent } = api.utils.createDiv();

		// adds to opts the url basePath if need to load more ressources from it (html/js/css/etc.)
		if (!opts) opts = {}
		opts.base_url = url.split("/").slice(0, -1).join("/")

		let hasPadding = true
		if (opts.padding === false) hasPadding = opts.padding

		api.utils.loadScripts([url],
			() => {
				console.log(h, `CUSTOM TAG LOADED ${url}`)
				// ON loadScript Url DONE => script provides the function initCustomTag that we execute
				//@ts-ignore 
				let htmlStr = window.initCustomTag(`${innerTag}`, opts)
				if (hasPadding) htmlStr = `<div class="with-padding" style="padding: 0px 15px;">${htmlStr}</div>`
				// htmlStr = `<div class="with-padding">${htmlStr}</div>`
				updateContent(htmlStr)
			}
		);

		return div
	}

	type iApiCall = (
		apiName: string,
		apiArguments: any[],
		cb?: Function
	) => void

	const callApi: iApiCall = (apiName, apiArguments, cb) => {
		if (
			!apiArguments || !apiName ||
			apiArguments.constructor !== Array || typeof apiName !== 'string'
		) return sendError(`Call Api : ${apiName} => wrong arguments type / number(${JSON.stringify({ apiName, apiArguments, cb })})`)
		const reqId = `iframe-api-call-${p.generateUUID()} `
		// listen for answer
		subscribeOnce(reqId, res => {
			if (cb) cb(res)
		})
		// send request
		const apiData: iIframeData['apiCall'] = { reqId, apiName, apiArguments }
		sendToParent({ action: 'apiCall', data: apiData })
	}

	const createDiv = () => {
		const id = `ctag-content-wrapper-${p.generateUUID()} `
		const updateContent = (nContent) => {
			// @ts-ignore
			const el = document.getElementById(id)
			if (el) el.innerHTML = nContent;
			// if el not existing, wait till here
			else { setTimeout(() => { updateContent(nContent) }, 100) }
		}
		return {
			div: `<div id="${id}">loading...</div>`,
			updateContent
		}
	}

	const api = {
		version: 1.1,
		call: callApi,
		utils: {
			getInfos,
			loadCachedRessources,
			getCachedRessourceUrl,
			loadScripts,
			resizeIframe,
			loadCustomTag,
			uuid: p.generateUUID,
			createDiv,
		}
	}


	// @ts-ignore
	window.api = api


	// 
	// IFRAME EVENTS
	// 
	onParentEvent({
		init: iframeInitLogic,
		apiAnswer: m => {
			const m2: iEventBusMessage = { subId: m.reqId, data: m.data }
			notify(m2)
		},
	})

	return api
}

// END OF RESTRICTED JS IFRAME ENVIRONMENT
///////////////////////////////////////////////////////////////////////// 
///////////////////////////////////////////////////////////////////////// 


// export const exportedType = (api : iframeMainCode)
export type apiType = ReturnType<typeof iframeMainCode>



