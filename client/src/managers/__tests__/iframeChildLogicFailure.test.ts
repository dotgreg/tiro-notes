/**
 * Loud-failure path: the backend CANNOT download the resource (ex: github 403 /
 * rate limit). Before the fix the child blindly appended <script src=missing> and
 * the iframe stayed silently empty forever. Now it must send a visible iframeError
 * naming the cause, and append no script for the missing file.
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

test('loud failure: backend download FAIL is reported, no script added for missing file', async () => {
	const toParent = setup(() => Promise.resolve({ ok: false }))
	await flush()

	const dl1 = downloadCalls(toParent)
	expect(dl1.length).toBe(1)
	reply(dl1[0].data.data.reqId, { status: 'FAIL', message: '403 rate limit by github' })
	await flush()

	const errs = errorsSent(toParent)
	expect(errs.length).toBe(1)
	expect(errs[0].data.data.error).toContain('DOWNLOAD FAILED')
	expect(errs[0].data.data.error).toContain('403 rate limit')
	// no <script> appended for the file that does not exist
	expect(scriptsInWrapper().length).toBe(0)
})
