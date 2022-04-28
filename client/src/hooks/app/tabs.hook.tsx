import React, { useEffect, useRef, useState } from 'react';
import { iFile, iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { useLocalStorage } from '../useLocalStorage.hook';
import { cloneDeep, each, filter, isNumber, stubString } from 'lodash';
import { configClient } from '../../config';
import { strings } from '../../managers/strings.manager';
import { increment } from '../../../../shared/helpers/number.helper';
import { useBackendState } from '../useBackendState.hook';

export type iTabUpdate = 'close' | 'rename' | 'move' | 'add' | 'activate'

export type onTabUpdateFn = (type: iTabUpdate, tab?: iTab) => void

export const addNewWindowConfig = (w: number = 3, h: number = 2) => {
	const id = generateUUID()
	return {
		layout: {
			i: id,
			x: 0, y: 0, w, h,
			minH: 1, maxH: 2,
			forceRender: 0
		},
		content: {
			i: id,
			active: false
		}
	}
}


export const useTabs = (p: {
}) => {

	const [tabs, setTabsInt, refreshTabsFromBackend] = useBackendState<iTab[]>('tabs', [])
	const setTabs = (nTabs: iTab[]) => {
		//nTabs = refreshAllTabsName(nTabs);
		setTabsInt(nTabs)
	}

	const updateTab: onTabUpdateFn = (type, tab) => {
		console.log(`[TAB] UPDATE ${type} ${tab ? `on tab ${tab.name}` : ''}`);

		if (type === 'add') {
			// if active tab exists, copy it in new one
			const nTab = generateNewTab(getActiveTab(tabs))
			const nTabs = [...tabs, nTab]
			const nTabs2 = setActiveTab(nTab.id, nTabs)
			setTabs(nTabs2)

		} else if (type === 'close') {
			if (!tab) return
			const nTabs: iTab[] = []
			const oTabs = cloneDeep(tabs)
			each(oTabs, (otab, index) => {
				if (otab.id !== tab.id) nTabs.push(otab)
			})
			setTabs(nTabs);

		} else if (type === 'rename') {

		} else if (type === 'activate') {

			// change tab
			if (!tab) return
			const nTabs = setActiveTab(tab.id, tabs)

			// refresh all tabs to view changes
			const nTabs2 = refreshTabsViews(nTabs)

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
		console.log(`[TAB LAYOUT] update GRID ${aId}`, grid);
		setTabs(nTabs)
	}


	const refreshWindowGrid = () => {
		const nTabs = refreshTabsViews(tabs)
		setTabs(nTabs)
	}

	// changing active window file
	const updateActiveWindowContent = (nFile: iFile) => {
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
		aTab.name = `${nFile.name.substring(0, 20)}`
		// refresh all tabs to view changes
		const nTabs2 = refreshTabsViews(nTabs)

		console.log(`[TAB LAYOUT] active content => ${nFile.name} ${nTabs2[0].refresh}`, nFile);
		// save tabs
		setTabs(nTabs2)
	}

	/* const refreshAllTabsName = (tabs: iTab[]): iTab[] => {
		each(tabs, tab => {
			tab.displayedName = `${tab.name} (${tab.grid.layout.length})`
		})
		return tabs
	}
 */

	return {
		tabs,
		refreshTabsFromBackend,
		getActiveTab,

		updateTab,

		updateActiveTabGrid,
		updateActiveWindowContent,

		refreshWindowGrid,
	}
}


// SUPPORT FUNCTION
const refreshTabsViews = (tabs: iTab[]): iTab[] => {
	const nTabs = cloneDeep(tabs)
	each(nTabs, tab => { tab.refresh = increment(tab.refresh) })
	return nTabs
}

const getActiveTabIndex = (tabs: iTab[]): number | undefined => {
	let res: number | undefined = undefined
	each(tabs, (tab, index) => { if (tab.active) { res = index } })
	return res
}

const getActiveTab = (tabs: iTab[]): iTab | undefined => {
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


const generateNewTab = (copiedTab?: iTab): iTab => {
	if (copiedTab) {
		const tab = cloneDeep(copiedTab)
		tab.id = generateUUID()
		tab.name = incrementName(copiedTab.name)
		return tab
	} else {

		const newWindowConf = addNewWindowConfig(3, 2)

		return {
			id: generateUUID(),
			name: strings.tabs.newTab,
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
