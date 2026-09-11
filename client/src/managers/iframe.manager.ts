import { generateUUID, getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { bindToElClass } from "./renderNote.manager";
import { iFile } from "../../../shared/types.shared";
import { createEventBus, iEventBusMessage } from "./eventBus.manager";
import { replaceCustomMdTags } from "./markdown.manager";
import { unescapeHtml } from "./textProcessor.manager";
import { getLoginToken } from "../hooks/app/loginToken.hook";
import { getBackendUrl } from "./sockets/socket.manager";
import { sharedConfig } from "../../../shared/shared.config";
import { getRessourcesCacheId, ressCacheIdSync } from "./cacheRessources.manager";

type iIframeActions = 'init' | 'apiCall' | 'apiAnswer' | 'resize' | 'iframeError' | 'canScrollIframe' | 'askFullscreen' | 'iframeLog' | 'childReady'

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
		ressCacheId: number
	}
	// handshake: the child announces its srcdoc window is alive (parent uses it to re-send init)
	childReady: {},
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
	iframeLog: {
		msg: string
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
		// BOOT TRACE: a message without subId is dropped here (child posted before it knew its frameId)
		if (!m.data || !m.data.subId) {
			if (m.data) console.warn(h, 'parent <== message DROPPED (no subId)', m.data)
			return
		}
		log && console.log(h, 'parent <== iframe', m.data.data);
		notify(m.data)
	});
}
initIframeListening()


const sendToIframe = (el: HTMLIFrameElement | null, message: iIframeMessage) => {
	// BOOT TRACE: if the srcdoc window is not up yet (or el unmounted) the message is lost — make it visible
	if (!el || !el.contentWindow) {
		console.warn(h, `parent ==> iframe LOST (el=${!!el}, contentWindow=${!!(el && el.contentWindow)}): ${message.action}`)
		return
	}
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
	tagContent: string,
	frameId?: string
) => {
	const html = `
<html>
		<div id="content-wrapper">
				${tagContent}
		</div>
		<div id="external-ressources-wrapper"></div>
		<script>
				const IMPORTED_frameId = "${frameId || ''}"
				const IMPORTED_backend_url = "${getBackendUrl()}"
				const IMPORTED_login_token = "${getLoginToken()}"
				const IMPORTED_replaceCustomMdTags = ${replaceCustomMdTags.toString()}
				const IMPORTED_unescapeHtml = ${unescapeHtml.toString()}
				const IMPORTED_createEventBus = ${createEventBus.toString()}
				const IMPORTED_generateUUID = ${generateUUID.toString()}
				const IMPORTED_getRessourceIdFromUrl = ${getRessourceIdFromUrl.toString()}
				const IMPORTED_bindToElClass = ${bindToElClass.toString()}
				const IMPORTED_ressCacheId = ${ressCacheIdSync.curr}
				const main = ${iframeMainCode.toString()};
				main({
					frameId: IMPORTED_frameId,
					backendUrl: IMPORTED_backend_url,
					loginToken: IMPORTED_login_token,
					replaceCustomMdTags: IMPORTED_replaceCustomMdTags,
					unescapeHtml: IMPORTED_unescapeHtml,
					createEventBus: IMPORTED_createEventBus,
					generateUUID: IMPORTED_generateUUID,
					getRessourceIdFromUrl: IMPORTED_getRessourceIdFromUrl,
					bindToElClass: IMPORTED_bindToElClass,
					ressCacheIdSync: IMPORTED_ressCacheId
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


//////////////////////////////////////////////////////////////////////////////////////////////////
//
// IFRAME MAIN JS CODE
//
//

export const iframeMainCode = (p: {
	frameId?,
	backendUrl,
	loginToken,
	replaceCustomMdTags,
	unescapeHtml,
	createEventBus,
	generateUUID,
	getRessourceIdFromUrl,
	bindToElClass,
	ressCacheId
}) => {
	const h = '[IFRAME child js]'

	const log = false
	log && console.log(h, 'IFRAME CHILD MAIN CODE STARTED...');

	// 
	// STORAGE
	//
	const d: iIframeData['init'] = {
		file: null,
		frameId: p.frameId || '',
		reloadCounter: 0,
		windowId: '',
		innerTag: '',
		tagName: '',
		tagContent: '',
		loginToken: p.loginToken,
		backendUrl: p.backendUrl,
		ressCacheId:0
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
		console.error(h, message)
		const data: iIframeData['iframeError'] = { error: `CUSTOM TAG/SCRIPT ERROR: ${message}` }
		sendToParent({ action: 'iframeError', data })
	}

	// BOOT TRACE: console of the srcdoc (visible in F12) + relayed to the parent console
	const bootLog = (msg: string) => {
		console.log(h, msg)
		sendToParent({ action: 'iframeLog', data: { msg } })
	}

	// WATCHDOG: the parent sends init once; if the srcdoc loaded slowly (or the message was dropped),
	// init never arrives: the frame would stay blank forever and couldn't even report it (no frameId yet).
	// frameId is now baked into the srcdoc, so we can surface the lost init instead of staying silent.
	const initWatchdog = setTimeout(() => {
		bootLog('NO INIT RECEIVED from parent within 10s (init message lost — srcdoc probably loaded too late)')
		sendError(`NO INIT RECEIVED from parent within 10s (init message lost — srcdoc probably loaded too late)`) },
		10000)

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
				bootLog(`RUNNING [[script]] block: ${scriptTxt.slice(0, 120)}`)
				try {
					// using Function instead of eval to isolate the execution scope
					// eslint-disable-next-line no-new-func
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
	// init is NOT re-runnable: it re-unsets the content and re-loads ressources. Duplicate inits
	// (parent retry, or the childReady handshake re-sending it) must be ignored after the first.
	let initReceived = false
	const iframeInitLogic = (m: iIframeData['init']) => {
		if (initReceived) return
		initReceived = true
		// BOOTING
		// When iframe receive infos from parent
		bootLog(`INIT RECEIVED: tagName=${m.tagName}, innerTag len=${(m.innerTag || '').length}, tagContent len=${(m.tagContent || '').length}, loginToken=${m.loginToken ? 'SET' : 'MISSING'}, backendUrl=${m.backendUrl}, ressCacheId=${m.ressCacheId}`)
		d.frameId = m.frameId
		clearTimeout(initWatchdog)
		d.innerTag = m.innerTag
		d.tagContent = m.tagContent
		d.tagName = m.tagName
		d.file = m.file
		d.reloadCounter = m.reloadCounter
		d.windowId = m.windowId
		d.ressCacheId = m.ressCacheId

		// get content and replace script tags
		const el = document.getElementById('content-wrapper')
		if (!el) {
			sendError('content-wrapper NOT FOUND in iframe html — ctag cannot boot (srcdoc html broken?)')
			return
		}
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

	let lastResizeIframeHeight = {value:"100%"}
	const resizeIframe = (heightRaw?: any) => {
		const el = document.getElementById('content-wrapper')
		let height = heightRaw
		if (!height) {
			if (el && el.clientHeight !== 0) height = el.clientHeight + 20
			else {
				bootLog(`RESIZE SKIPPED: content-wrapper clientHeight=0 (empty content?)`)
				return
			}
		}
		lastResizeIframeHeight.value = `${height}`
		bootLog(`RESIZE SENT: ${lastResizeIframeHeight.value}`)
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

		bootLog(`HEAD CHECK: ${url}`)
		fetch(url, {method: 'HEAD'})
		.then((response) => {
			if(response.ok) {
				bootLog(`HEAD OK (cache hit): ${url}`)
				return onSuccess()
			} else {
				bootLog(`HEAD ${response.status} (cache miss/fail): ${url}`)
				return onFail()
			}
		}).catch((error) => {
			bootLog(`HEAD FAILED (network): ${url} => ${error}`)
			return onFail(error)
		});
			  

			// return http.status != 404;
		// 	if (http.status !== 404) return onSuccess()
		// 	return onFail()
		// } catch (e) {
		// 	onFail(e)
		// }
	}

	const loadLocalRessourceInHtml = (ressObj:iRessObj, onLoad, onFail?) => {
		let url = ressObj.url
		let tag
		if (url.includes(".js")) {
			tag = document.createElement('script');
			tag.crossorigin = "anonymous"
			tag.rel = "preload"
			tag.src = url
			if (ressObj.type) tag.type = ressObj.type
		}
		else if (url.includes(".css")) {
			tag = document.createElement('link');
			tag.href = url
			tag.rel = "stylesheet"
			tag.crossorigin = "anonymous"
			tag.type = "text/css"
			if (ressObj.type) tag.type = ressObj.type
		}
		else if (url.includes(".wasm")) {
			// https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm
			// <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm" as="fetch" type="application/wasm"  />
			tag = document.createElement('link');
			tag.rel = "preload"
			tag.href = url
			tag.as = "fetch"
			tag.crossorigin = "anonymous"
			tag.type = "application/wasm"
			if (ressObj.type) tag.type = ressObj.type
		}
		tag.onload = () => {
			bootLog(`SCRIPT LOADED: ${url}`)
			onLoad()
		}
		tag.onerror = () => {
			bootLog(`SCRIPT ONERROR: ${url} (see Network tab for the status)`)
			onFail && onFail()
		}
		const el = document.getElementById('external-ressources-wrapper')

		if (!el) return console.trace(h, `could not load ${url} because ressource wrapper was not detected`)
		bootLog(`APPEND <script src="${url}">`)
		el.appendChild(tag)
	}

	const getCachedRessourceFolder = () => `/.tiro/cache/ctag-ressources/`
	const getCachedRessourceUrl = (url: string, fileName?:string): string => {
		const tokenParamStr = `?token=${p.loginToken}`
		const fileName2 = fileName ? fileName : p.getRessourceIdFromUrl(url)
		const path = `${p.backendUrl}/static${getCachedRessourceFolder()}${fileName2}${tokenParamStr}`
		return path
	}

	//////////
	// API FUNCTIONS
	type iRessObj = { url: string, type?: string, fileName?:string }
	type iRessObjOrString = string | { url: string, type?: string }

	const loadCachedRessources = (ressources: iRessObjOrString[], cb: Function) => {
		if (!cb) cb = () => { }
		let ressourcesLoaded = 0;
		const onRessLoaded = () => {
			ressourcesLoaded++
			if (ressourcesLoaded === ressources.length) {
				log && console.log(h, `ressources all ressources loaded, cb()!`, ressources);
				try {
					if (cb) cb()
				} catch (e) {
					console.error(h, `ERROR LoadScript Callback : ${e}`);
					console.log(e)
					console.log("tried to load scripts:", ressources)
				}
			}
		}

		for (let i = 0; i < ressources.length; i++) {
			let ressToLoad = ressources[i];
			// normalize strings into obj
			let ressToLoadObj:iRessObj
			if (ressToLoad.constructor === String) ressToLoadObj = { url: ressToLoad as string }
			else ressToLoadObj = JSON.parse(JSON.stringify(ressToLoad)) 
			const fileName = ressToLoadObj.fileName
			
			// gen cached obj
			const cachedRessToLoadUrl = getCachedRessourceUrl(ressToLoadObj.url, fileName)
			// clone cachedRessToLoadObj from ressToLoadObj
			const cachedRessToLoadObj = JSON.parse(JSON.stringify(ressToLoadObj)) // {...ressToLoadObj} does not work here!
			cachedRessToLoadObj.url = cachedRessToLoadUrl

			//@ts-ignore
			// if frontendCache disabled, add ?nocache=RANDOMNUMBER to url
			const disableCache = window.disableCache === true ? true : false
			if (disableCache) {
				let randomNb = Math.floor(Math.random() * 1000000)
				const nocache = `&nocache=${randomNb}-${d.ressCacheId}`
				cachedRessToLoadObj.url += nocache
			} else {
				const cacheId = `&cacheId=${d.ressCacheId}`
				cachedRessToLoadObj.url += cacheId
			}

			let ressLoadTries = 0
			// on local ress load error (404 file missing, 403 bad/expired token, browser cache quirk, network):
			// force a fresh download (bypassing caches) + retry, report to the user if it keeps failing
			const onRessLoadFail = () => {
				if (ressLoadTries >= 2) {
					sendError(`RESSOURCE NOT LOADED after ${ressLoadTries + 1} tries: ${ressToLoadObj.url} (check browser console + server log)`)
					return
				}
				ressLoadTries++
				//@ts-ignore
				window.disableCache = true
				cachedRessToLoadObj.url = getCachedRessourceUrl(ressToLoadObj.url, fileName) + `&nocache=${Math.floor(Math.random() * 1000000)}-${d.ressCacheId}`
				downloadAndLoadRess({frontendCache: false})
			}
			const downloadAndLoadRess = (p?:{frontendCache?:boolean}) => {
				if (!p) p = {}
				if (!p.frontendCache) p.frontendCache = false
				
				// console.log("download directly ", ressToLoadObj.url, " and load it without caching on frontend")
				bootLog(`DOWNLOAD REQUEST: ${ressToLoadObj.url} => ${fileName}`)
				callApi("ressource.download", [ressToLoadObj.url, getCachedRessourceFolder(), {fileName}], (apiRes) => {
					// if download failed (ex: github 403 / rate limit), do not try to load a missing file: report it
					bootLog(`DOWNLOAD ANSWER: status=${apiRes && apiRes.status}, message=${apiRes && apiRes.message}`)
					if (apiRes && apiRes.status && apiRes.status !== 'SUCCESS') {
						sendError(`DOWNLOAD FAILED (${apiRes.status}): ${ressToLoadObj.url} => ${apiRes.message}`)
						return
					}
					// ==== on cb, load that tag
					loadLocalRessourceInHtml(cachedRessToLoadObj, () => { onRessLoaded() }, onRessLoadFail)
				})
			}

			if (disableCache) {
				console.log(h, "CACHE DISABLED (both frontend + backend fetch), DOWNLOADING RESSOURCES EVERYTIME and NOT CACHING THEM ON FRONTEND!", ressToLoadObj.url);
				downloadAndLoadRess({frontendCache: false})
			} else {
				checkUrlExists(cachedRessToLoadObj.url,
					() => {
						// cachedObjToLoad
						loadLocalRessourceInHtml(cachedRessToLoadObj, () => { onRessLoaded() }, onRessLoadFail)
					}, () => {
						downloadAndLoadRess({frontendCache: true})
					})
			}
		}
	}


	// LOAD EXTERNAL SCRIPTS
	const loadRessources = (ressources: iRessObjOrString[], cb: Function) => {
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
			// eslint-disable-next-line no-loop-func
			s.onload = () => {
				scriptsLoaded++
				log && console.log(h, `loadScripts: ${scriptsLoaded}/${scripts.length}`);
				if (scriptsLoaded === scripts.length) {
					log && console.log(`loadScripts all scripts loaded, cb()!`);
					try {
						if (cb) cb()
					} catch (e) {
						console.error(h, `ERROR LoadScript Callback : ${e}`, scriptToLoad);
						console.log(e)
					}
				}
			}
			const el = document.getElementById('external-ressources-wrapper')
			if (el) el.appendChild(s)
		}
	}


	// LOAD CUSTOM TAG
	const loadCustomTag = (url: string, innerTag: string, opts: any) => {
		bootLog(`LOAD CUSTOM TAG: ${url}`)
		const { div, updateContent } = api.utils.createDiv();

		// adds to opts the url basePath if need to load more ressources from it (html/js/css/etc.)
		if (!opts) opts = {}
		opts.base_url = url.split("/").slice(0, -1).join("/").replace("//","/")
		opts.plugins_root_url = opts.base_url.split("/").slice(0, -1).join("/").replace("//","/")

		let hasPadding = true
		if (opts.padding === false) hasPadding = opts.padding

		const onLoadScriptSuccess = () => {
			log && console.log(h, `CUSTOM TAG LOADED ${url}`)
			// ON loadScript Url DONE => script provides the function initCustomTag that we execute
			bootLog(`CALL initCustomTag: ${url}`)
			let htmlStr
			try {
				//@ts-ignore 
				htmlStr = window.initCustomTag(`${innerTag}`, opts)
			} catch (e: any) {
				// a loaded script that throws (ex: missing common lib) used to leave the iframe silently empty
				sendError(`CUSTOM TAG ${url} loaded but initCustomTag threw: ${e}`)
				return
			}
			if (hasPadding) htmlStr = `<div class="with-padding" style="padding: 0px 15px; height:100%;">${htmlStr}</div>`
			// htmlStr = `<div class="with-padding">${htmlStr}</div>`
			updateContent(htmlStr)
			bootLog(`CUSTOM TAG RENDERED: ${url} (html len=${htmlStr ? htmlStr.length : 0})`)
		}
		api.utils.loadScripts([url],
			() => {
				//@ts-ignore 
				if (window.initCustomTag) { onLoadScriptSuccess() }
				else {
					console.error(h, `CUSTOM TAG ${url} failed to load, disabling cache and trying 3 times...`)
					let count = 0
					let int = setInterval(() => {
						//@ts-ignore
						window.disableCache = true
						api.utils.loadScripts([url], () => {
							//@ts-ignore
							if (window.initCustomTag) { 
								clearInterval(int)
								onLoadScriptSuccess() 
							}
						})
						count++
						if (count > 3) {
							clearInterval(int)
							console.error(h, `CUSTOM TAG ${url} NOT LOADED AFTER 3 TRIES`)
							sendError(`CUSTOM TAG ${url} NOT LOADED AFTER 3 TRIES (script loads but does not define initCustomTag)`)
						}
					}, 3000)
				}
				
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
		bootLog(`API CALL: ${apiName} ${JSON.stringify(apiArguments).slice(0, 120)}`)
		const reqId = `iframe-api-call-${p.generateUUID()} `
		// watchdog: if the parent never answers (api/socket not ready, message lost, ...) do not stay empty forever
		const watchdog = setTimeout(() => {
			sendError(`API CALL TIMEOUT (no answer in 20s): ${apiName}`)
		}, 20000)
		// listen for answer
		subscribeOnce(reqId, res => {
			clearTimeout(watchdog)
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
			if (el) {
				el.innerHTML = nContent;
				bootLog(`CONTENT UPDATED into #${id}: len=${nContent ? nContent.length : 0}`)
			}
			// if el not existing, wait till here
			else { setTimeout(() => { updateContent(nContent) }, 100) }
		}
		return {
			div: `<div id="${id}"></div>`,
			updateContent
		}
	}

	const loadRessourcesOneByOne = (ressources: iRessObjOrString[], cb: Function) => {
		if (!cb) cb = () => { }
		let i = 0
		const loadNext = () => {
			if (i === ressources.length) return cb()
			const ress = ressources[i]
			// console.log(h, `loadRessourcesOneByOne ${i+1}/${ressources.length} => ${ress}`);
			loadCachedRessources([ress], () => {
				i++
				loadNext()
			})
		}
		loadNext()
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
			loadRessourcesOneByOne,
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

	bootLog(`CHILD BOOT: script up, waiting for init (frameId=${d.frameId || 'MISSING — not baked into srcdoc'})`)
	// HANDSHAKE: announce the child is alive. The parent re-sends init on this message — inits
	// posted while the srcdoc was still navigating are lost, so the first inits can miss us.
	sendToParent({ action: 'childReady', data: {} })

	return api
}

// END OF RESTRICTED JS IFRAME ENVIRONMENT
///////////////////////////////////////////////////////////////////////// 
///////////////////////////////////////////////////////////////////////// 


// export const exportedType = (api : iframeMainCode)
export type apiType = ReturnType<typeof iframeMainCode>



