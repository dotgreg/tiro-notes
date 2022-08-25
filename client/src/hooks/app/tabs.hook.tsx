import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { iFile, iGrid, iTab, iViewType, iWindow, iWindowContent } from '../../../../shared/types.shared';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { cloneDeep, each, isNumber } from 'lodash';
import { increment } from '../../../../shared/helpers/number.helper';
import { useBackendState } from '../useBackendState.hook';
import { draggableGridConfig } from '../../components/windowGrid/DraggableGrid.component';
import { ClientApiContext, getClientApi2 } from '../api/api.hook';
import { act } from 'react-dom/test-utils';

export type iTabUpdate = 'close' | 'rename' | 'move' | 'add' | 'activate'
export type onTabUpdateFn = (type: iTabUpdate, tab?: iTab, newVal?: any) => void

export type iTabsApi = {
	get: () => iTab[]
	close: (tabId: string) => void
	openInNewTab: (file: iFile) => void
	reorder: (oldPos, newPos) => void
	active: {
		get: () => iTab | null
	}
}
export type iWindowsApi = {
	close: (windowIds: string[]) => void
	updateWindows: (windowIds: string[], file: iFile) => void
	getIdsFromFile: (filepath: string) => string[]
	active: {
		get: (tab?: iTab) => iWindowLayoutAndContent | null
		setContent: (file: iFile) => void
	}
}

export interface iWindowLayoutAndContent { layout: iWindow, content: iWindowContent }

export const addNewWindowConfig = (p: {
	file: iFile,
	w?: number,
	h?: number
	x?: number
	y?: number
}) => {
	let { w, h, x, y, file } = { ...p }
	if (!h) h = draggableGridConfig.rows
	if (!w) w = draggableGridConfig.cols
	if (!x) x = 0
	if (!y) y = 0

	const id = generateUUID()
	return {
		layout: {
			i: id,
			x, y, w, h,
			minH: 1, maxH: 2,
			forceRender: 0
		},
		content: {
			i: id,
			active: false,
			file: file,
			view: 'both' as iViewType
		}
	}
}


export const useTabs = () => {
	const h = `[TABS] 00542`

	const [tabs, setTabsInt, refreshTabsFromBackend] = useBackendState<iTab[]>('tabs', [])
	const setTabs = (nTabs: iTab[]) => {
		//nTabs = refreshAllTabsName(nTabs);
		setTabsInt(nTabs)
	}

	const getTabs: iTabsApi['get'] = () => {
		return tabs
	}

	const openInNewTab: iTabsApi['openInNewTab'] = (file: iFile) => {
		const nTab = generateNewTab({ fullWindowFile: file })
		if (!nTab) return
		const nTabs = [...tabs, nTab]
		const nTabs2 = setActiveTab(nTab.id, nTabs)
		setTabs(nTabs2)
	}

	const closeTab: iTabsApi['close'] = tabId => {
		// console.log(`${h} closing tab: ${tabId}`);
		const nTabs: iTab[] = []
		const oTabs = cloneDeep(tabs)
		each(oTabs, (otab, index) => {
			if (otab.id !== tabId) nTabs.push(otab)
		})
		setTabs(nTabs);
	}

	const getActiveTab: iTabsApi['active']['get'] = () => {
		let res: iTab | null = null
		each(tabs, tab => { if (tab.active) res = tab })
		return res
	}

	const reorderTabs: iTabsApi['reorder'] = (oldPos, newPos) => {
		const nTabs = cloneDeep(tabs)
		// console.log(`${h} reordering tab ${oldPos} -> ${newPos}`);
		const elToMove = nTabs[oldPos]
		// remove el from array
		nTabs.splice(oldPos, 1)
		// add to new location 
		nTabs.splice(newPos, 0, elToMove)
		setTabs(nTabs)
	}

	const updateTab: onTabUpdateFn = (type, tab, newVal) => {
		// console.log(`[TAB] UPDATE ${type} ${tab ? `on tab ${tab.name}` : ''}`);

		if (type === 'add') {
			// if active tab exists, copy it in new one
			//tab with one window
			getClientApi2().then(api => {
				openInNewTab(api.ui.browser.files.active.get)
			})

		} else if (type === 'close') {
			if (!tab) return
			closeTab(tab.id)

		} else if (type === 'rename') {

			if (!tab) return
			if (newVal.length > 15) return
			const nTabs = cloneDeep(tabs)
			each(nTabs, cTab => {
				if (cTab.id === tab.id) {
					cTab.name = newVal
					cTab.manualName = true
				}
			})
			setTabs(nTabs)

		} else if (type === 'activate') {

			// change tab
			if (!tab) return
			const nTabs = setActiveTab(tab.id, tabs)

			// refresh all tabs to view changes
			const nTabs2 = refreshTabsViews(nTabs)

			// BEHAVIOR 1: disable active list item
			// getClientApi2().then(api => {
			// 	api.ui.browser.files.active.set(-1)
			// })

			setTabs(nTabs2)

			// BEHAVIOR 2: go to file in browser ui
			const file = getActiveWindow(tab)?.content.file
			if (!file) return
			getClientApi2().then(api => {
				api.ui.browser.goTo(file.folder, file.name)
			})


		} else if (type === 'move') {
		}
	}


	// on layout resizing, adding/removing windows etc...
	const updateActiveTabGrid = (grid: iGrid) => {
		const nTabs = cloneDeep(tabs)
		const aId = getActiveTabIndex(nTabs)
		if (!isNumber(aId)) return
		nTabs[aId].grid = grid
		// console.log(`[TAB LAYOUT] update tab grid n:${aId}`, grid);
		//const nTabs2 = refreshTabsViews(tabs)
		setTabs(nTabs)
	}


	const refreshWindowGrid = () => {
		const nTabs = refreshTabsViews(tabs)
		setTabs(nTabs)
	}










	//
	// WINDOWS MANAGEMENT
	//
	const h2 = `[WINDOWS] 00543`


	// get all ids from a single FilePath
	const getIdsFromFile: iWindowsApi['getIdsFromFile'] = filePath => {
		const ids: string[] = []
		each(tabs, tab => {
			each(tab.grid.content, window => {
				if (window.file && window.file.path === filePath) ids.push(window.i)
			})
		})
		return ids
	}

	// close
	const closeWindows: iWindowsApi['close'] = ids => {
		const nTabs = cloneDeep(tabs)
		each(ids, id => {
			each(nTabs, (tab, i) => {
				for (let j = 0; j < tab.grid.content.length; j++) {
					const c = tab.grid.content[j];
					const l = tab.grid.layout[j];
					if (c.i === id) tab.grid.content.splice(j, 1)
					if (l.i === id) tab.grid.layout.splice(j, 1)
				}
			})
		})
		// console.log(`${h2} closing window`);
		const nTabs2 = refreshTabsViews(nTabs)
		setTabs(nTabs2)
	}

	const updateWindows: iWindowsApi['updateWindows'] = (ids, file) => {
		const nTabs = cloneDeep(tabs)
		each(ids, id => {
			each(nTabs, (tab, i) => {
				each(tab.grid.content, wcontent => {
					if (wcontent.i === id) wcontent.file = file
				})
			})
		})
		// console.log(`${h2} updating windows with file ${file.name}`);
		const nTabs2 = refreshTabsViews(nTabs)
		setTabs(nTabs2)
	}


	const getActiveWindow: iWindowsApi['active']['get'] = tab => {
		if (!tab) {
			// get active tab
			const nTabs = cloneDeep(tabs)
			const aId = getActiveTabIndex(nTabs)
			if (!isNumber(aId)) return
			tab = nTabs[aId]
		}

		if (!tab.grid.layout[0]) return
		const g = tab.grid
		let res
		each(g.content, (c, i) => {
			if (c.active) res = { layout: g.layout[i], content: g.content[i] }
		})
		return res
	}

	// changing active window file
	const updateActiveWindowContent: iWindowsApi['active']['setContent'] = (nFile) => {
		if (!nFile) return
		// get active tab
		const nTabs = cloneDeep(tabs)
		const aId = getActiveTabIndex(nTabs)
		if (!isNumber(aId)) return

		// get active window, if none, select first one
		const aTab = nTabs[aId]
		const aContent = aTab.grid.content
		if (aContent.length < 1) return
		let aWindowIndex = 0
		each(aContent, (window, index) => { if (window.active === true) aWindowIndex = index })

		// change awindow.file
		aContent[aWindowIndex].file = cloneDeep(nFile)
		// update tab name only if tab name not manually edited
		if (!aTab.manualName) aTab.name = createTabName(nFile.name)
		// refresh all tabs to view changes
		const nTabs2 = refreshTabsViews(nTabs)
		// save tabs
		setTabs(nTabs2)
	}




	//
	// EXPORTS
	//

	const tabsApi: iTabsApi = {
		get: getTabs,
		close: closeTab,
		openInNewTab,
		reorder: reorderTabs,
		active: {
			get: getActiveTab
		}
	}

	const windowsApi: iWindowsApi = {
		close: closeWindows,
		active: {
			get: getActiveWindow,
			setContent: updateActiveWindowContent
		},
		updateWindows,
		getIdsFromFile
	}


	return {
		tabs,
		updateTab,
		refreshTabsFromBackend,
		updateActiveTabGrid,
		refreshWindowGrid,

		tabsApi,
		windowsApi
	}
}


// SUPPORT FUNCTION

export const getActiveWindowContent = (aTab: iTab): iWindowContent | undefined => {
	let nCon: iWindowContent | undefined = undefined
	each(aTab.grid.content, con => { if (con.active) { nCon = con } })
	// if none, get first one
	if (!nCon) nCon = aTab.grid.content[0]
	return nCon
}

const refreshTabsViews = (tabs: iTab[]): iTab[] => {
	const nTabs = cloneDeep(tabs)
	each(nTabs, tab => { tab.refresh = increment(tab.refresh) })
	return nTabs
}

const createTabName = (str: string): string => {
	return str.length > 15 ? `${str.substring(0, 13)}..` : str
}

export const getActiveTabIndex = (tabs: iTab[]): number | undefined => {
	let res: number | undefined = undefined
	each(tabs, (tab, index) => { if (tab.active) { res = index } })
	return res
}


const setActiveTab = (tabId: string, tabs: iTab[]): iTab[] => {
	const nTabs = cloneDeep(tabs)
	each(nTabs, tab => {
		tab.refresh = isNumber(tab.refresh) ? tab.refresh++ : 1
		if (tab.id === tabId) { tab.active = true }
		else { tab.active = false }
	})
	return nTabs
}


const generateNewTab = (p: {
	copiedTab?: iTab
	fullWindowFile?: iFile
}) => {
	if (p.copiedTab) {
		const tab = cloneDeep(p.copiedTab)
		tab.id = generateUUID()
		tab.name = incrementName(p.copiedTab.name)
		return tab
	} else if (p.fullWindowFile) {
		const newWindowConf = addNewWindowConfig({ file: p.fullWindowFile })

		return {
			id: generateUUID(),
			name: createTabName(p.fullWindowFile.name),
			active: true,
			// generate a full window
			grid: {
				layout: [
					newWindowConf.layout
				],
				content: [
					newWindowConf.content
				]
			}
		}

	}
}



const incrementName = (cName: string): string => {
	let nName = cName
	const lastChar = nName[nName.length - 1]
	if (!isNaN(parseInt(lastChar))) {
		nName = nName.slice(0, -1);
		nName += `${parseInt(lastChar) + 1}`
	} else {
		nName += ' 1'
	}
	return nName
}




