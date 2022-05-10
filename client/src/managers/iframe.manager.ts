import { each } from "lodash";
import { iFile } from "../../../shared/types.shared";

type iIframeActions = 'init' | 'api'

export interface iIframeData {
	init: {
		file: iFile | null
		innerTag: string
		tagName: string
		tagContent: string
		frameId: string
	}
}

interface iIframeMessage {
	frameId: string
	action: iIframeActions
	data: any
}
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
const subscribe = (id: string, cb: Function) => {
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


//
// IFRAME CODE
//
const generateIframeHtml = (tagContent: string) => {
	const html = `
<html>
		${tagContent}
		<script>
		const main = ${iframeCode.toString()};
		main()
		</script>
</html>
`
	return html
}



///////////////////////////////////////////////////////////////////////// 
// JAVASCRIPT CODE EXECUTED IN IFRAME
// Doesnt have access to any library of the project
//
const iframeCode = () => {
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

	//
	// EXECUTION LOGIC
	//
	on({
		init: (m: iIframeData['init']) => {
			console.log(h, 'init inside iframe!');
			d.frameId = m.frameId
			d.innerTag = m.innerTag
			d.tagContent = m.tagContent
			d.tagName = m.tagName
			d.file = m.file


			// sending back sthg
			setTimeout(() => {
				send({
					frameId: d.frameId,
					action: 'api',
					data: {
						woop: 'woop'
					}
				})
			}, 100)
		},
		api: m => {

		}
	})


}








//
// EXPORTS
//
export const iframeManager = {
	subscribe,
	unsubscribe,
	send: sendToIframe,
	generateIframeHtml
}




