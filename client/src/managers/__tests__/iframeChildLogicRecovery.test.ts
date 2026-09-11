/**
 * Recovery path: the <script> load FAILS (onerror: 404 missing file / 403 expired
 * token / network quirk) -> the child must force a backend re-download (fresh token,
 * nocache url) and recover. This is the hole that used to leave the iframe silently
 * empty: loadLocalRessourceInHtml had no onerror at all.
 * (one file per scenario = one fresh srcdoc-like window, as in production)
 */
import { setup, reply, flush, scriptsInWrapper, downloadCalls, errorsSent } from '../iframeChildLogic.helper'

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

test('recovery: script onerror forces re-download with fresh url, then renders', async () => {
	const toParent = setup(() => Promise.resolve({ ok: false })) // local cache always misses
	await flush()

	// 1st download request (cache miss -> backend download)
	const dl1 = downloadCalls(toParent)
	expect(dl1.length).toBe(1)
	reply(dl1[0].data.data.reqId, { status: 'SUCCESS', message: 'ok' })
	await flush()

	const s1 = scriptsInWrapper()[0]
	expect(s1).toBeTruthy()
	// simulate the script load failing (missing file / 403 expired token / network)
	s1.onerror()
	await flush()

	// a 2nd download must have been requested, and the retried script URL must differ (nocache)
	const dls = downloadCalls(toParent)
	expect(dls.length).toBe(2)
	reply(dls[1].data.data.reqId, { status: 'SUCCESS', message: 'ok' })
	await flush()

	const s2 = scriptsInWrapper()[1]
	expect(s2).toBeTruthy()
	expect(s2.src).not.toBe(s1.src)
	expect(s2.src).toContain('nocache=')

	;(window as any).initCustomTag = () => '<b>RENDERED-RETRY</b>'
	s2.onload()
	await flush()

	expect(document.body.innerHTML).toContain('RENDERED-RETRY')
	expect(errorsSent(toParent).length).toBe(0)
})
