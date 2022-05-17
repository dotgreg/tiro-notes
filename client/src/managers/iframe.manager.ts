import { each } from "lodash";
import { generateUUID } from "../../../shared/helpers/id.helper";
import { bindToElClass } from "./renderNote.manager";
import { iFile } from "../../../shared/types.shared";
import { createEventBus, iEventBusMessage } from "./eventBus.manager";
import { replaceCustomMdTags } from "./markdown.manager";
import { unescapeHtml } from "./textProcessor.manager";

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
	console.log(h, `INIT IFRAME LISTENING`);
	window.addEventListener('message', m => {
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
		<div id="external-scripts-wrapper"></div>
		<script>
				const IMPORTED_replaceCustomMdTags = ${replaceCustomMdTags.toString()}
				const IMPORTED_unescapeHtml = ${unescapeHtml.toString()}
				const IMPORTED_createEventBus = ${createEventBus.toString()}
				const IMPORTED_generateUUID = ${generateUUID.toString()}
				const IMPORTED_bindToElClass = ${bindToElClass.toString()}
				const main = ${iframeMainCode.toString()};
				main({
					replaceCustomMdTags: IMPORTED_replaceCustomMdTags,
					unescapeHtml: IMPORTED_unescapeHtml,
					createEventBus: IMPORTED_createEventBus,
					generateUUID: IMPORTED_generateUUID,
					bindToElClass: IMPORTED_bindToElClass
				})
		</script>
</html>
`
	return html
}


const iframeMainCode = (p: {
	replaceCustomMdTags,
	unescapeHtml,
	createEventBus,
	generateUUID,
	bindToElClass
}) => {
	const h = '[IFRAME child] 00564'

	console.log(h, 'INIT INNER IFRAME');

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
		// console.log(h, 'init inside iframe!');
		d.frameId = m.frameId
		d.innerTag = m.innerTag
		d.tagContent = m.tagContent
		d.tagName = m.tagName
		d.file = m.file
		console.log(h, '1/2 RECEIVED INIT EVENT', d.frameId);

		// get content and replace script tags
		const el = document.getElementById('content-wrapper')
		if (el) {

			// unescape html and scripts
			const unescHtml = p.unescapeHtml(el.innerHTML) as string
			const newHtml = executeScriptTags(unescHtml)
			console.log(h, '2/2 transformMarkdownScript', { old: el.innerHTML, new: newHtml });
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
			if (el) height = el.clientHeight + 20
			else return
		}

		const data: iIframeData['resize'] = { height }
		sendToParent({ action: 'resize', data })
	}

	///////////////////////////////////////////////////////////////////////// 
	// API 

	// API : CREATING EVENT BUS TO MANAGE API CALLS
	const { subscribeOnce, notify } = p.createEventBus({ headerLog: '[FRAME API] 00567' })

	// LOAD EXTERNAL SCRIPTS
	const loadScripts = (scripts: string[], cb: Function) => {
		console.log(h, 'loadScripts', scripts);
		let scriptsLoaded = 0;

		// each(scripts, scriptToLoad => {
		for (let i = 0; i < scripts.length; i++) {
			const scriptToLoad = scripts[i];
			const s = document.createElement('script');
			s.src = scriptToLoad
			s.onload = () => {
				scriptsLoaded++
				console.log(h, `loadScripts: ${scriptsLoaded}/${scripts.length}`);
				if (scriptsLoaded === scripts.length) {
					console.log(`loadScripts all scripts loaded, cb()!`);
					try {
						if (cb) cb()
					} catch (e) {
						console.log(h, `ERROR LoadScript Callback : ${e}`);
					}
				}
			}
			const el = document.getElementById('external-scripts-wrapper')
			if (el) el.appendChild(s)
		}

		// })

	}
	// LOAD CUSTOM TAG
	const loadCustomTag = (url: string, innerTag: string, opts:any) => {
		const { div, updateContent } = api.utils.createDiv();

		api.utils.loadScripts([url],
			() => {
				console.log(h, `CUSTOM TAG LOADED ${url}`)
				//@ts-ignore
				const htmlStr = window.initCustomTag(`${innerTag}`, opts)
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


		const reqId = `iframe - api - call - ${p.generateUUID()} `

		// listen for answer
		subscribeOnce(reqId, res => {
			if (cb) cb(res)
		})

		// send request
		const apiData: iIframeData['apiCall'] = { reqId, apiName, apiArguments }
		sendToParent({ action: 'apiCall', data: apiData })
	}

	const divApi = () => {
		const id = `ctag-content-wrapper-${p.generateUUID()} `
		const updateContent = (nContent) => {
			// @ts-ignore
			document.getElementById(id).innerHTML = nContent;
		}
		return {
			div: `<div id="${id}"></div>`,
			updateContent
		}
	}

	const api = {
		version: 1,
		call: callApi,
		utils: {
			loadScripts,
			resizeIframe,
			loadCustomTag,
			uuid: p.generateUUID,
			createDiv: divApi,
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

}

// END OF RESTRICTED JS IFRAME ENVIRONMENT
///////////////////////////////////////////////////////////////////////// 
///////////////////////////////////////////////////////////////////////// 











