/**
 * Success path: cached script loads -> initCustomTag called -> ctag renders, no error.
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

test('success: cached script loads, ctag renders, no error', async () => {
	const toParent = setup(url => Promise.resolve({ ok: url.includes('cacheId=') }))
	await flush()

	const scripts = scriptsInWrapper()
	expect(scripts.length).toBe(1)
	expect(scripts[0].src).toContain('ctag-ressources')
	expect(scripts[0].src).toContain('token=tok-abc')
	// cache hit: no backend download needed
	expect(downloadCalls(toParent).length).toBe(0)

	// the plugin script "loads" and defines its init entry point
	;(window as any).initCustomTag = (innerTag: string) => `<b>RENDERED ${innerTag}</b>`
	scripts[0].onload()
	await flush()

	expect(document.body.innerHTML).toContain('RENDERED innerTag')
	expect(errorsSent(toParent).length).toBe(0)
})
