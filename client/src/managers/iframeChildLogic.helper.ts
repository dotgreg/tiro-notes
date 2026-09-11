/**
 * Shared helper for the iframeChildLogic*.test.ts files.
 *
 * Each test file = one fresh jsdom environment = one fresh "srcdoc window",
 * mirroring production (each ctag iframe is its own document). That keeps the
 * child logic's real timers (resize/retry/watchdog) from leaking across tests.
 */
import { createEventBus } from './eventBus.manager'
import { generateUUID, getRessourceIdFromUrl } from '../../../shared/helpers/id.helper'

export type ParentMsg = { subId: string, data: any }

export const buildP = () => ({
	frameId: 'frame-1',
	generateUUID,
	getRessourceIdFromUrl,
	replaceCustomMdTags: require('./markdown.manager').replaceCustomMdTags,
	unescapeHtml: require('./textProcessor.manager').unescapeHtml,
	bindToElClass: () => undefined,
	createEventBus,
	ressCacheIdSync: () => 123,
	backendUrl: 'http://backend.test:8080',
	loginToken: 'tok-abc',
})

export const CTAG_URL = 'https://ex.com/plugins/x/x.ctag.js'
const CTAG_BODY = `[[script]]return api.utils.loadCustomTag("${CTAG_URL}", "innerTag", {}) [[script]]`

/**
 * Build a srcdoc-like DOM, run iframeMainCode, fire the parent's init message.
 * Returns the list of messages the child would have postMessaged to the parent.
 */
export const setup = (fetchImpl: (url: string, opts?: any) => Promise<any>) => {
	const { iframeMainCode } = require('./iframe.manager')

	document.body.innerHTML = `
		<div id="content-wrapper">${CTAG_BODY}</div>
		<div id="external-ressources-wrapper"></div>
	`
	const toParent: ParentMsg[] = []
	;(window as any).postMessage = (msg: any) => { toParent.push(msg) }
	;(global as any).fetch = jest.fn(fetchImpl)

	iframeMainCode(buildP() as any)
	// play the parent: send init (as ContentBlock does after its debounce)
	;(window as any).onmessage({ data: {
		action: 'init',
		data: {
			frameId: 'frame-1', innerTag: 'innerTag', tagContent: '', tagName: 'x', file: null,
			reloadCounter: 0, windowId: 'win-1', ressCacheId: 123,
		}
	} })
	return toParent
}

/** play the parent answering an apiCall request (socket getRessourceApiAnswer relay) */
export const reply = (reqId: string, data: any) => {
	;(window as any).onmessage({ data: { action: 'apiAnswer', data: { reqId, data } } })
}

/** let the (real) promise chain settle */
export const flush = () => new Promise<void>(r => setTimeout(r, 20))

export const scriptsInWrapper = () => Array.from(document.querySelectorAll('#external-ressources-wrapper script')) as any[]
export const downloadCalls = (toParent: ParentMsg[]) =>
	toParent.filter(m => m.data.action === 'apiCall' && m.data.data.apiName === 'ressource.download')
export const errorsSent = (toParent: ParentMsg[]) =>
	toParent.filter(m => m.data.action === 'iframeError')
