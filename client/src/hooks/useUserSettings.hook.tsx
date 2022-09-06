import { cloneDeep, debounce, each, isNull, isUndefined } from 'lodash';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { sharedConfig } from '../../../shared/shared.config';
import { cssVars } from '../managers/style/vars.style.manager';
import { useDebounce } from './lodash.hooks';
import { useBackendState } from './useBackendState.hook';

type iUserSettingName =
	'ui_filesList_sortMode' |
	'ui_layout_colors_main' |
	'ui_sidebar' |
	'ui_other'

type keyVal = { key: iUserSettingName, val: any }
export type iUserSettings = { [setting in iUserSettingName]?: any }
export type iUserSettingsApi = {
	get: (name: iUserSettingName) => any
	set: (name: iUserSettingName, val: any) => void
	list: () => keyVal[]
	refresh: {
		css: { get: number }
	}
}

const defaultVals: iUserSettings = {
	ui_sidebar: true,
	ui_filesList_sortMode: 2
}

const h = `[USER SETTINGS] :`
const log = sharedConfig.client.log.verbose

export const useUserSettings = () => {

	// storage
	const [userSettings, setUserSettings, refreshUserSettingsFromBackend] = useBackendState<iUserSettings>('user-settings', {})


	const [refreshCss, setRefreshCss] = useState(0)
	const triggerRefresh = () => {
		setRefreshCss(refreshCss + 1)
	}

	//
	// DEFAULT VALS OVERRIDING LOGIC
	//


	const defaultVars = useRef<any[]>([])
	const replaceDefaultByUserVar =
		(userVar: iUserSettingName, toReplaceObj: any, toReplaceProp: string) => {
			if (!defaultVars.current[userVar]) defaultVars.current[userVar] = toReplaceObj[toReplaceProp]
			let val = userSettings[userVar]
			if (isNull(val) || isUndefined(val)) return
			if (val === '' && defaultVars.current[userVar]) {
				val = defaultVars.current[userVar]
			}
			toReplaceObj[toReplaceProp] = val
		}

	useEffect(() => {
		debounceChange()
	}, [userSettings])

	const debounceChange = useDebounce(() => {
		log && console.log(h, 'UPDATE!', userSettings, refreshCss);
		replaceDefaultByUserVar('ui_layout_colors_main', cssVars.colors, 'main')

		triggerRefresh()
	}, 1000)






	// api
	const userSettingsApi: iUserSettingsApi = {
		set: (name, value) => {
			log && console.log(h, `updateUserSettings ${name} to ${value}`);
			const nSettings = cloneDeep(userSettings)
			nSettings[name] = value
			setUserSettings(nSettings)
		},

		get: name => {
			// if settings not configured, return default
			let res = defaultVals[name]
			if (name in userSettings) res = userSettings[name]
			return res
		},
		list: () => {
			const res: keyVal[] = []
			each(userSettings, (val, name) => {
				const key = name as iUserSettingName
				res.push({ key, val })
			})
			return res
		},
		refresh: {
			css: {
				get: refreshCss
			}
		}

	}

	return {
		userSettingsApi,
		refreshUserSettingsFromBackend
	}
}
