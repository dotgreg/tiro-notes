import { generateUUID, getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { bindToElClass } from "./renderNote.manager";
import { iFile } from "../../../shared/types.shared";
import { createEventBus, iEventBusMessage } from "./eventBus.manager";
import { replaceCustomMdTags } from "./markdown.manager";
import { unescapeHtml } from "./textProcessor.manager";
import { getLoginToken } from "../hooks/app/loginToken.hook";
import { getBackendUrl } from "./sockets/socket.manager";
import { sharedConfig } from "../../../shared/shared.config";

type iIframeActions = 'init' | 'apiCall' | 'apiAnswer' | 'resize' | 'iframeError' | 'canScrollIframe' | 'askFullscreen'

export interface iIframeData {
	init: {
		file: iFile | null
		innerTag: string
		tagName: string
		tagContent: string
		frameId: string
		reloadCounter: number,
		windowId: string
		loginToken: string
		backendUrl: string
	}
	askFullscreen: {},
	resize: {
		height: number | string
	}
	canScrollIframe: {
		status: boolean
	}
	getScrollPos: {
		y: number
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
const log = sharedConfig.client.log.iframe

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
	window.addEventListener('message', m => {
		if (!m.data.subId) return
		log && console.log(h, 'parent <== iframe', m.data.data);
		notify(m.data)
	});
}
initIframeListening()


const sendToIframe = (el: HTMLIFrameElement | null, message: iIframeMessage) => {
	if (!el || !el.contentWindow) return;
	log && console.log(h, `parent ==> iframe`, message);
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
export const generateIframeHtml = (
	tagContent: string
	// params: { windowId: string }
) => {
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
<style>
		body::backdrop {
			background: #F7F7F7;
		}
</style>
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

	const log = false
	log && console.log(h, 'IFRAME CHILD MAIN CODE STARTED...');

	// 
	// STORAGE
	//
	const d: iIframeData['init'] = {
		file: null,
		frameId: '',
		reloadCounter: 0,
		windowId: '',
		innerTag: '',
		tagName: '',
		tagContent: '',
		loginToken: p.loginToken,
		backendUrl: p.backendUrl,
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
		d.reloadCounter = m.reloadCounter
		d.windowId = m.windowId

		// get content and replace script tags
		const el = document.getElementById('content-wrapper')
		if (el) {

			// unescape html and scripts
			const unescHtml = p.unescapeHtml(el.innerHTML) as string
			const newHtml = executeScriptTags(unescHtml)
			el.innerHTML = newHtml

			// sending height back for resizing sthg
			setTimeout(() => {
				resizeIframe()
			}, 100)

			// inject logic to html
			injectLogicToIframeHtml()

		}
	}

	const canScrollIframe = (status: boolean) => {
		const data: iIframeData['canScrollIframe'] = { status }
		sendToParent({ action: 'canScrollIframe', data })
	}

	// const askForScrollPos = () => {
	// 	const data: iIframeData['getScrollPos'] = { status }
	// 	sendToParent({ action: 'canScrollIframe', data })
	// }

	const resizeIframe = (height?: number) => {
		const el = document.getElementById('content-wrapper')
		if (!height) {
			if (el && el.clientHeight !== 0) height = el.clientHeight + 20
			else return
		}

		const data: iIframeData['resize'] = { height }
		sendToParent({ action: 'resize', data })
	}

	const fullscreenIframe = () => {
		const element = document.body as any
		// Supports most browsers and their versions.
		var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
		if (requestMethod) { requestMethod.call(element); }
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
		// try {
		// 	var http = new XMLHttpRequest();
		// 	http.open('HEAD', url, false);
		// 	http.send();

		fetch(url, {method: 'HEAD'})
		.then((response) => {
			if(response.ok) {
				return onSuccess()
			} else {
				return onFail()
			}
		}).catch((error) => {
			return onFail(error)
		});
			  

			// return http.status != 404;
		// 	if (http.status !== 404) return onSuccess()
		// 	return onFail()
		// } catch (e) {
		// 	onFail(e)
		// }
	}

	const loadLocalRessourceInHtml = (url, onLoad) => {
		let tag
		if (url.includes(".js")) {
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
			onLoad()
		}
		const el = document.getElementById('external-ressources-wrapper')

		if (!el) return console.error(h, `could not load ${url} because ressource wrapper was not detected`)
		el.appendChild(tag)
	}

	const getCachedRessourceFolder = () => `/.tiro/cache/ctag-ressources/`
	const getCachedRessourceUrl = (url: string): string => {
		const tokenParamStr = `?token=${p.loginToken}`
		const path = `${p.backendUrl}/static${getCachedRessourceFolder()}${p.getRessourceIdFromUrl(url)}${tokenParamStr}`
		return path
	}

	//////////
	// API FUNCTIONS
	const loadCachedRessources = (ressources: string[], cb: Function) => {

		let ressourcesLoaded = 0;
		const onRessLoaded = () => {
			ressourcesLoaded++
			if (ressourcesLoaded === ressources.length) {
				log && console.log(h, `ressources all ressources loaded, cb()!`, ressources);
				try {
					if (cb) cb()
				} catch (e) {
					console.error(h, `ERROR LoadScript Callback : ${e}`);
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
	const loadRessources = (ressources: string[], cb: Function) => {
		loadCachedRessources(ressources, cb)
	}
	const loadScripts = (scripts: string[], cb: Function) => {
		loadCachedRessources(scripts, cb)
	}
	const loadScriptsNoCache = (scripts: string[], cb: Function) => {
		log && console.log(h, 'loadScripts', scripts);
		let scriptsLoaded = 0;
		// each(scripts, scriptToLoad => {
		for (let i = 0; i < scripts.length; i++) {
			const scriptToLoad = scripts[i];
			const s = document.createElement('script');
			s.src = scriptToLoad
			s.onload = () => {
				scriptsLoaded++
				log && console.log(h, `loadScripts: ${scriptsLoaded}/${scripts.length}`);
				if (scriptsLoaded === scripts.length) {
					log && console.log(`loadScripts all scripts loaded, cb()!`);
					try {
						if (cb) cb()
					} catch (e) {
						console.error(h, `ERROR LoadScript Callback : ${e}`);
					}
				}
			}
			const el = document.getElementById('external-ressources-wrapper')
			if (el) el.appendChild(s)
		}
	}


	// LOAD CUSTOM TAG
	const loadCustomTag = (url: string, innerTag: string, opts: any) => {
		const { div, updateContent } = api.utils.createDiv();

		// adds to opts the url basePath if need to load more ressources from it (html/js/css/etc.)
		if (!opts) opts = {}
		opts.base_url = url.split("/").slice(0, -1).join("/").replace("//","/")
		opts.plugins_root_url = opts.base_url.split("/").slice(0, -1).join("/").replace("//","/")

		let hasPadding = true
		if (opts.padding === false) hasPadding = opts.padding

		api.utils.loadScripts([url],
			() => {
				log && console.log(h, `CUSTOM TAG LOADED ${url}`)
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
			div: `<div id="${id}"></div>`,
			updateContent
		}
	}

	const api = {
		version: 1.2,
		call: callApi,
		utils: {
			getInfos,

			loadCachedRessources,
			getCachedRessourceUrl,
			getRessourceIdFromUrl: p.getRessourceIdFromUrl,

			loadScripts,
			loadRessources,
			loadScriptsNoCache,

			resizeIframe,
			fullscreenIframe,
			canScrollIframe,
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
		askFullscreen: fullscreenIframe,
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



