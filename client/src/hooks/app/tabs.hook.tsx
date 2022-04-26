import React, { useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';
import { generateUUID } from '../../../../shared/helpers/id.helper';
import { useLocalStorage } from '../useLocalStorage.hook';
import { cloneDeep, each, filter, isNumber } from 'lodash';

export type iTabUpdate = 'close' | 'rename' | 'move' | 'add'
export type onTabUpdateFn = (type: iTabUpdate, tab?: iTab) => void

export const useTabs = (p: {
}) => {

	const [tabs, setTabs] = useLocalStorage<iTab[]>('tabs', [])

	const onTabUpdate: onTabUpdateFn = (type, tab) => {
		console.log(`[TAB] UPDATE ${type} ${tab ? `on tab ${tab.name}` : ''}`);

		if (type === 'add') {
			// if active tab exists, copy it in new one
			const nTab = generateNewTab(getActiveTab(tabs))
			setTabs([...tabs, nTab])

		} else if (type === 'close') {
			if (!tab) return
			//console.log('close', JSON.stringify({ tabs, tab }));
			console.log('close', { tabs, tab });
			const nTabs = filter(tabs, ctab => ctab.id !== tab.id)
			setTabs(nTabs);

		} else if (type === 'rename') {
		} else if (type === 'move') {
		}

	}

	const getActiveTab = (tabs: iTab[]): iTab | undefined => {
		let aTab: iTab | undefined = undefined
		each(tabs, tab => { if (tab.active) { aTab = tab } })
		return aTab
	}

	const setActiveTab = (tabId: string, tabs: iTab[]): iTab[] => {
		const nTabs = cloneDeep(tabs)
		each(nTabs, tab => {
			if (tab.id === tabId) { tab.active = true }
			else { tab.active = false }
		})
		return nTabs
	}

	const renameActiveTab = (newName: string) => {

	}

	return {
		tabs, setTabs,
		onTabUpdate,
		renameActiveTab
	}
}

// SUPPORT FUNCTION
const generateNewTab = (copiedTab?: iTab): iTab => {
	if (copiedTab) {
		const tab = cloneDeep(copiedTab)
		tab.id = generateUUID()
		tab.name = incrementName(copiedTab.name)
		return tab
	} else {
		return {
			id: generateUUID(),
			name: 'New Tab',
			active: true,
			layout: [],
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
