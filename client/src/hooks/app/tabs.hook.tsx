import React, { useContext } from 'react';
import { iFile, iGrid, iTab, iViewType, iWindowContent } from '../../../../shared/types.shared';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { cloneDeep, each, isNumber } from 'lodash';
import { increment } from '../../../../shared/helpers/number.helper';
import { useBackendState } from '../useBackendState.hook';
import { draggableGridConfig } from '../../components/windowGrid/DraggableGrid.component';
import { ClientApiContext, getClientApi2 } from '../api/api.hook';

export type iTabUpdate = 'close' | 'rename' | 'move' | 'add' | 'activate'
export type onTabUpdateFn = (type: iTabUpdate, tab?: iTab) => void

export type iTabsApi = {
	get: () => iTab[]
	close: (tabId: string) => void
	openInNewTab: (file: iFile) => void
	reorder: (oldPos, newPos) => void
}
export type iWindowsApi = {
	close: (windowIds: string[]) => void
	updateActive: (file: iFile) => void
	updateWindows: (windowIds: string[], file: iFile) => void
	getIdsFromFile: (filepath: string) => string[]
}


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
			view: 'editor' as iViewType
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
		console.log(`${h} closing tab: ${tabId}`);
		const nTabs: iTab[] = []
		const oTabs = cloneDeep(tabs)
		each(oTabs, (otab, index) => {
			if (otab.id !== tabId) nTabs.push(otab)
		})
		setTabs(nTabs);
	}


	const reorderTabs: iTabsApi['reorder'] = (oldPos, newPos) => {
		const nTabs = cloneDeep(tabs)
		console.log(`${h} reordering tab ${oldPos} -> ${newPos}`);
		const elToMove = nTabs[oldPos]
		// remove el from array
		nTabs.splice(oldPos, 1)
		// add to new location 
		nTabs.splice(newPos, 0, elToMove)
		setTabs(nTabs)
	}

	const updateTab: onTabUpdateFn = (type, tab) => {
		console.log(`[TAB] UPDATE ${type} ${tab ? `on tab ${tab.name}` : ''}`);

		if (type === 'add') {
			// if active tab exists, copy it in new one
			//const nTab = generateNewTab(getActiveTab(tabs))
			//tab with one window
			getClientApi2().then(api => {
				openInNewTab(api.ui.browser.files.active.get)
			})

		} else if (type === 'close') {
			if (!tab) return
			closeTab(tab.id)
		} else if (type === 'rename') {

		} else if (type === 'activate') {

			// change tab
			if (!tab) return
			const nTabs = setActiveTab(tab.id, tabs)

			// refresh all tabs to view changes
			const nTabs2 = refreshTabsViews(nTabs)

			// disable active list item
			getClientApi2().then(api => {
				api.ui.browser.files.active.set(-1)
			})

			setTabs(nTabs2)

		} else if (type === 'move') {
		}
	}


	// on layout resizing, adding/removing windows etc...
	const updateActiveTabGrid = (grid: iGrid) => {
		const nTabs = cloneDeep(tabs)
		const aId = getActiveTabIndex(nTabs)
		if (!isNumber(aId)) return
		nTabs[aId].grid = grid
		console.log(`[TAB LAYOUT] update tab grid n:${aId}`, grid);
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
		console.log(`${h2} closing window`);
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
		console.log(`${h2} updating windows with file ${file.name}`);
		const nTabs2 = refreshTabsViews(nTabs)
		setTabs(nTabs2)
	}

	//@ts-ignore
	window.tabs = tabs



	// changing active window file
	const updateActiveWindowContent: iWindowsApi['updateActive'] = (nFile) => {
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
		// update tab name
		aTab.name = createTabNameFromFile(nFile)
		// refresh all tabs to view changes
		const nTabs2 = refreshTabsViews(nTabs)
		console.log(`${h2} active content => ${nFile.name} ${nTabs2[0].refresh}`, nFile);
		// save tabs
		//console.log('0045', nFile.folder, nTabs2);
		setTabs(nTabs2)
	}




	//
	// EXPORTS
	//

	const tabsApi: iTabsApi = {
		get: getTabs,
		close: closeTab,
		openInNewTab,
		reorder: reorderTabs
	}

	const windowsApi: iWindowsApi = {
		close: closeWindows,
		updateActive: updateActiveWindowContent,
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

const createTabNameFromFile = (file: iFile): string => {
	return file.name.length > 10 ? `${file.name.substring(0, 10)}..` : file.name
}

export const getActiveTabIndex = (tabs: iTab[]): number | undefined => {
	let res: number | undefined = undefined
	each(tabs, (tab, index) => { if (tab.active) { res = index } })
	return res
}

export const getActiveTab = (tabs: iTab[]): iTab | undefined => {
	let aTab: iTab | undefined = undefined
	each(tabs, tab => { if (tab.active) { aTab = tab } })
	return aTab
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
			name: createTabNameFromFile(p.fullWindowFile),
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
