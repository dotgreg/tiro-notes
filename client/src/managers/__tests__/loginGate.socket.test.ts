import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { armLoginGate, initClientSocketManager, loginGatePending, openLoginGate } from '../sockets/socket.manager'

// Backend restarts regenerate every token, so a cold page load used to fire all its requests
// before the login/token check finished: each one got WRONG_TOKEN (dropped by the backend +
// login popup flashing). Emits are now queued while the gate is armed and replayed with the
// token that just got accepted.
describe('socket login gate', () => {
	const sent: [string, any][] = []
	const raw: any = { on: () => { }, off: () => { }, emit: (endpoint: string, payload: any) => sent.push([endpoint, payload]) }
	const socketManager = initClientSocketManager<iApiDictionary>(raw)

	beforeEach(() => { sent.length = 0 })

	test('emits made before login is settled are queued, then replayed with the fresh token', () => {
		armLoginGate()
		socketManager.emit('askForFiles', { folderPath: '/', token: 'expired', idReq: 'r1' })
		expect(sent.length).toBe(0)
		expect(loginGatePending()).toBe(1)
		openLoginGate((endpoint, payload) => sent.push([endpoint, { ...payload, token: 'fresh' }]))
		expect(sent).toEqual([['askForFiles', { folderPath: '/', token: 'fresh', idReq: 'r1' }]])
		expect(loginGatePending()).toBe(0)
	})

	test('login endpoints bypass the gate, so the gate can always be opened', () => {
		armLoginGate()
		socketManager.emit('sendLoginInfos', { user: 'u', password: 'p', token: '' })
		socketManager.emit('checkLoginToken', { token: '' })
		expect(sent.length).toBe(2)
		expect(loginGatePending()).toBe(0)
		openLoginGate(() => { })
	})

	test('gate stays open when it was never armed (PublicApp has no login popup)', () => {
		socketManager.emit('askForFileContent', { filePath: '/a.md', token: 't', idReq: 'r2' })
		expect(sent.length).toBe(1)
	})

	// an old server version (no checkLoginToken endpoint) or a server in setup mode never answers
	// the probe: without the safety timeout every request stays queued forever.
	// 8 s of queueing was the mobile freeze on the login page: the page loaded, then sat idle.
	test('gate opens by itself after 3 s when the backend never answers the probe', () => {
		jest.useFakeTimers()
		armLoginGate((endpoint, payload) => sent.push([endpoint, payload]))
		socketManager.emit('askForFiles', { folderPath: '/', token: 'expired', idReq: 'r3' })
		expect(loginGatePending()).toBe(1)
		jest.advanceTimersByTime(2999)
		expect(loginGatePending()).toBe(1)
		jest.advanceTimersByTime(1001)
		jest.useRealTimers()
		expect(loginGatePending()).toBe(0)
		expect(sent).toEqual([['askForFiles', { folderPath: '/', token: 'expired', idReq: 'r3' }]])
	})
})
