// Unit tests for createNewNote — the new note must LOAD in the active window
// (bug: goTo only refreshes the files list, so the window never jumped to the note)

jest.mock('../../hooks/api/api.hook', () => ({
	getApi: (cb: Function) => cb((global as any).__api),
}))

import { createNewNote } from '../newNote.manager'

const newFile = {
	nature: 'file' as const, name: '15 21-10-26.md', realname: '15 21-10-26.md',
	path: '/15 21-10-26.md', folder: '/', created: 1792600000000,
}

const setup = (currentFolder: string, activeWindow: any) => {
	const api: any = {
		ui: {
			browser: {
				folders: { current: { get: () => currentFolder } },
				goTo: jest.fn(),
			},
			windows: { active: { get: jest.fn(() => activeWindow), setContent: jest.fn() } },
			floatingPanel: { create: jest.fn() },
		},
		tabs: { openInNewTab: jest.fn() },
		file: { create: (folder: string, cb: Function) => cb([newFile]) },
	}
	;(global as any).__api = api
	return api
}

test(`createNewNote loads the new note in the active window`, () => {
	const api = setup('/', { i: 'w0' })
	createNewNote({ openIn: 'activeWindow' })
	expect(api.ui.windows.active.setContent).toHaveBeenCalledWith(newFile)
})

// the exact reported failure: no folder selected (localStorage 'selected-folder' empty)
// goTo skips empty folder paths, so nothing used to open
test(`createNewNote opens the note when no folder is selected`, () => {
	const api = setup('', { i: 'w0' })
	createNewNote({ openIn: 'activeWindow' })
	expect(api.ui.windows.active.setContent).toHaveBeenCalledWith(newFile)
	expect(api.ui.browser.goTo).toHaveBeenCalledWith('/', '15 21-10-26.md')
})

test(`createNewNote opens a tab when there is no window open`, () => {
	const api = setup('/', undefined)
	createNewNote({ openIn: 'activeWindow' })
	expect(api.ui.windows.active.setContent).not.toHaveBeenCalled()
	expect(api.tabs.openInNewTab).toHaveBeenCalledWith(newFile)
})
