// useBackendState: writes made before the initial backend read lands must not be lost,
// and an unreadable file must not brick the store for the whole session.
// (regression: settings > Custom Shortcuts emptied on close, because us.set was a silent no-op
// until the initial read of user-settings.md completed)
import { renderHook, act } from '@testing-library/react'
import { useBackendState } from '../useBackendState.hook'
import { getApi } from '../api/api.hook'
import { sharedConfig } from '../../../../shared/shared.config'

jest.mock('../api/api.hook', () => ({
	getApi: jest.fn(),
	getClientApi2: jest.fn(),
}))

const gApi = getApi as jest.Mock

const PATH = `/${sharedConfig.path.configFolder}/${sharedConfig.path.backendStateFolder}/user-settings.md`

const makeApi = () => ({
	file: {
		getContent: jest.fn(),
		saveContent: jest.fn(),
	},
	history: { save: jest.fn() },
})

beforeEach(() => {
	jest.clearAllMocks()
	jest.spyOn(console, 'error').mockImplementation(() => { })
})

afterEach(() => {
	jest.restoreAllMocks()
})

it('keeps a write made before the initial load and saves it when the load lands', () => {
	const api = makeApi()
	gApi.mockImplementation((cb) => cb(api))
	let loadCb: (raw: string) => void
	// initial read: hold it in flight until the test fires it
	api.file.getContent.mockImplementation((_path: string, cb: any) => { loadCb = cb })

	const { result } = renderHook(() => useBackendState<any>('user-settings', {}))
	expect(gApi).toHaveBeenCalledTimes(1)
	expect(result.current[0]).toEqual({})

	// write while the read is still in flight (typing in settings right after app start)
	act(() => {
		result.current[1]({ a: 99, c: 3, keyboard_shortcuts_textarea: 'ctrl+shift > e | toggle_note | /note.md' })
	})
	// nothing written to disk yet: the full object would clobber data not loaded yet
	expect(api.file.saveContent).not.toHaveBeenCalled()

	// the read lands: loaded file + pending writes merged, merged result persisted
	act(() => {
		loadCb(JSON.stringify({ a: 1, c: 3 }))
	})
	expect(result.current[0]).toEqual({ a: 99, c: 3, keyboard_shortcuts_textarea: 'ctrl+shift > e | toggle_note | /note.md' })
	expect(api.file.saveContent).toHaveBeenCalledTimes(1)
	expect(api.file.saveContent).toHaveBeenCalledWith(
		PATH,
		JSON.stringify({ a: 99, c: 3, keyboard_shortcuts_textarea: 'ctrl+shift > e | toggle_note | /note.md' }),
		{ debounced: false, withThrottle: false }
	)
})

it('falls back to initial value on an unreadable file and saves again instead of no-oping', () => {
	const api = makeApi()
	gApi.mockImplementation((cb) => cb(api))
	api.file.getContent.mockImplementation((_path: string, cb: any) => cb('not json at all'))

	const { result } = renderHook(() => useBackendState<any>('user-settings', { a: 0 }))
	// garbage read completed during mount: store usable with the initial value
	expect(result.current[0]).toEqual({ a: 0 })

	// previously this write was dropped (guard: "var user-settings not loaded yet")
	act(() => {
		result.current[1]({ a: 5, keyboard_shortcuts_textarea: 'shift + alt > 1 | toggle_note | /x.md' })
	})
	expect(api.file.saveContent).toHaveBeenCalledTimes(1)
	expect(api.file.saveContent).toHaveBeenCalledWith(
		PATH,
		JSON.stringify({ a: 5, keyboard_shortcuts_textarea: 'shift + alt > 1 | toggle_note | /x.md' }),
		{ debounced: false, withThrottle: false }
	)
})

it('still initializes from initial value when the file does not exist, and saves arrays as-is', () => {
	const api = makeApi()
	gApi.mockImplementation((cb) => cb(api))
	api.file.getContent.mockImplementation((_path: string, cb: any) => cb('NO_FILE'))

	const { result } = renderHook(() => useBackendState<string[]>('tabs', []))
	expect(result.current[0]).toEqual([])

	act(() => {
		result.current[1](['t1', 't2'])
	})
	expect(api.file.saveContent).toHaveBeenCalledWith(
		`/${sharedConfig.path.configFolder}/${sharedConfig.path.backendStateFolder}/tabs.md`,
		JSON.stringify(['t1', 't2']),
		{ debounced: false, withThrottle: false }
	)
})
