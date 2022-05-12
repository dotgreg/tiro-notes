import { each } from "lodash";
import { iFile } from "../../../shared/types.shared";
import { replaceCustomMdTags } from "./markdown.manager";
import { unescapeHtml } from "./textProcessor.manager";

type iIframeActions = 'init' | 'api' | 'resize'

export interface iIframeData {
	init: {
		file: iFile | null
		innerTag: string
		tagName: string
		tagContent: string
		frameId: string
	}
	resize: {
		height: number
	}
}

interface iIframeMessage {
	frameId: string
	action: iIframeActions
	data: any
}

///////////////////////////////////////////////////////////////////////// 
// MANAGER EXECUTED ON PARENT
// 
//

const h = `[IFRAME PARENT] 00563`

//
// LISTENING
//
const initIframeListening = () => {
	console.log(h, `INIT IFRAME LISTENING`);
	window.addEventListener('message', m => {
		notify(m.data as iIframeMessage)
	});
}
initIframeListening()

//
// EVENT BUS
//
const subscribers: { [id: string]: Function } = {}
const notify = (message: iIframeMessage) => {
	each(subscribers, (sCb, sId) => {
		if (sId === message.frameId) {
			try {
				console.log(`${h} parent <== iframe`, message);
				sCb(message);
			}
			catch (e) { console.log(`${h} error with function`, e); }
		}
	});
}
const subscribe = (id: string, cb: (message: iIframeMessage) => void) => {
	subscribers[id] = cb
}
const unsubscribe = (id: string) => {
	if (subscribers[id]) delete subscribers[id]
}

const sendToIframe = (el: HTMLIFrameElement | null, message: iIframeMessage) => {
	if (!el || !el.contentWindow) return;
	console.log(h, `parent ==> iframe`, message);
	el.contentWindow.postMessage(message, "*")
}
















///////////////////////////////////////////////////////////////////////// 
///////////////////////////////////////////////////////////////////////// 
// CHILD: JAVASCRIPT CODE EXECUTED IN IFRAME
// Doesnt have access to any library of the project
//

//
// IFRAME CODE
//
const generateIframeHtml = (tagContent: string) => {
	const html = `
<html>
		<div id="content-wrapper">
				${tagContent}
		</div>
		<div id="external-scripts-wrapper"></div>
		<script>
				const IMPORTED_replaceCustomMdTags = ${replaceCustomMdTags.toString()}
				const IMPORTED_unescapeHtml = ${unescapeHtml.toString()}
				const main = ${iframeMainCode.toString()};
				const {api} = main({
						replaceCustomMdTags: IMPORTED_replaceCustomMdTags,
						unescapeHtml: IMPORTED_unescapeHtml
				})
				window.api = api
		</script>
</html>
`
	return html
}


const iframeMainCode = (p: {
	replaceCustomMdTags,
	unescapeHtml
}) => {
	const h = '[IFRAME child] 00564'


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
	const send = (message: iIframeMessage) => {
		if (d.frameId === '') return console.warn(h, 'NO FRAME ID, CANNOT SEND TO PARENT')
		//@ts-ignore
		// console.log(h, 'sending message to parent', message);
		window.parent.postMessage(message, '*');
	}

	const on = (events: { [event in iIframeActions]: Function }) => {
		window.onmessage = (e) => {
			const msg = e.data as iIframeMessage
			if (!msg || !msg.frameId) return
			for (const event in events) {
				if (event === msg.action) events[event](e.data.data)
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
				}
			});
		return res;
	};

	const getIframeHeight = () => {

	}

	//
	// EXECUTION LOGIC
	//
	on({
		init: (m: iIframeData['init']) => {
			// BOOTING
			// When iframe receive infos from parent
			// console.log(h, 'init inside iframe!');
			d.frameId = m.frameId
			d.innerTag = m.innerTag
			d.tagContent = m.tagContent
			d.tagName = m.tagName
			d.file = m.file

			// get content and replace script tags
			const el = document.getElementById('content-wrapper')
			if (el) {

				// unescape html and scripts
				const unescHtml = p.unescapeHtml(el.innerHTML) as string
				const newHtml = executeScriptTags(unescHtml)
				// console.log(h, 'transformMarkdownScript', { old: el.innerHTML, new: newHtml });
				el.innerHTML = newHtml
				//
				// sending height back for resizing sthg
				setTimeout(() => {
					const data: iIframeData['resize'] = {
						height: el.clientHeight + 20
					}
					send({ frameId: d.frameId, action: 'resize', data })
				}, 100)
			}

		},
		api: m => {

		},
		resize: () => {

		}
	})









	///////////////////////////////////////////////////////////////////////// 
	// CUSTOM TAG API FUNCTIONS

	// LOAD EXTERNAL SCRIPTS
	const loadScripts = (scripts: string[], cb: Function) => {
		console.log(h, 'loadScripts', scripts);
		let scriptsLoaded = 0;
		each(scripts, scriptToLoad => {
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
		})
	}
	const api = {
		version: 1,
		loadScripts
	}

	return { api }
}

// END OF RESTRICTED JS IFRAME ENVIRONMENT
///////////////////////////////////////////////////////////////////////// 
///////////////////////////////////////////////////////////////////////// 







//
// EXPORTS
//
export const iframeManager = {
	subscribe,
	unsubscribe,
	send: sendToIframe,
	generateIframeHtml
}




