/**
 * Handshake: (1) the child announces itself (childReady) as soon as its srcdoc window is up —
 * the parent re-sends init on it, healing the race where inits posted before the srcdoc
 * committed are lost; (2) duplicate inits must be ignored (the ctag runs exactly once).
 * (one file per scenario = one fresh srcdoc-like window, as in production)
 */
import { buildP, flush } from '../iframeChildLogic.helper'

jest.mock('../markdown.manager', () => ({
	replaceCustomMdTags: (body: string, tag: string, funcToExec: (s: string) => string) => {
		const tagName = tag.replace('[[', '').replace(']]', '')
		const regex = new RegExp(`(\\[\\[${tagName}\\]\\])((?:[^]*))(\\[\\[${tagName}\\]\\])`, 'gm')
		return body.replace(regex, (_all: string, _m1: string, code: string) => {
			try { return funcToExec(code) } catch (e) { return '' }
		})
	},
}))
jest.mock('../textProcessor.manager', () => ({
	unescapeHtml: (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
}))
jest.mock('../renderNote.manager', () => ({ bindToElClass: () => undefined }))
jest.mock('../cacheRessources.manager', () => ({ getRessourcesCacheId: () => 123, ressCacheIdSync: () => 123 }))
jest.mock('../../hooks/app/loginToken.hook', () => ({ getLoginToken: () => 'tok-abc' }))
jest.mock('../sockets/socket.manager', () => ({ getBackendUrl: () => 'http://backend.test:8080' }))

const INIT = {
	action: 'init',
	data: {
		frameId: 'frame-1', innerTag: 'innerTag', tagContent: '', tagName: 'x', file: null,
		reloadCounter: 0, windowId: 'win-1', loginToken: 'tok-abc', backendUrl: 'http://backend.test:8080', ressCacheId: 123,
	}
}

test('child sends childReady at boot; a duplicate init runs the ctag once', async () => {
	const toParent: any[] = []
	;(window as any).postMessage = (m: any) => toParent.push(m)
	;(global as any).fetch = jest.fn(() => Promise.resolve({ ok: false }))

	document.body.innerHTML = `
		<div id="content-wrapper">[[script]]window.__runs = (window.__runs||0)+1[[script]]</div>
		<div id="external-ressources-wrapper"></div>
	`
	const { iframeMainCode } = require('../iframe.manager')
	iframeMainCode(buildP() as any)
	await flush()

	// 1. the child announced itself (handshake answer the parent waits for) before any init arrived
	expect(toParent.some(m => m.data.action === 'childReady')).toBe(true)

	// 2. first init (the parent's re-send, the original ones being lost while the srcdoc navigated)
	;(window as any).onmessage({ data: INIT })
	await flush()
	expect((window as any).__runs).toBe(1)

	// 3. duplicate init (parent retry / childReady re-sent) must be ignored
	;(window as any).onmessage({ data: INIT })
	await flush()
	expect((window as any).__runs).toBe(1)
	expect(toParent.filter(m => m.data.action === 'iframeError').length).toBe(0)
})
