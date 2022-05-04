import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useBackendState } from './useBackendState.hook';

type iUserSettingName =
	'ui_filesList_sortMode' |
	'ui_sidebar' |
	'ui_other'

export type iUserSettings = { [setting in iUserSettingName]?: any }
export type iUserSettingsApi = {
	get: (name: iUserSettingName) => any
	set: (name: iUserSettingName, val: any) => void
}

const defaultVals: iUserSettings = {
	ui_sidebar: true,
	ui_filesList_sortMode : 2
}

export const useUserSettings = () => {

	// storage
	const [userSettings, setUserSettings, refreshUserSettingsFromBackend] = useBackendState<iUserSettings>('user-settings', {})



	// api
	const userSettingsApi: iUserSettingsApi = {
		set: (name, value) => {
			console.log(`[USER SETTINGS] 0011 : updateUserSettings ${name} to ${value}`);
			const nSettings = cloneDeep(userSettings)
			nSettings[name] = value
			setUserSettings(nSettings)
		},

		get: name => {
			// if settings not configured, return default
			let res = defaultVals[name]
			if (name in userSettings) res = userSettings[name]
			// console.log(`[USER SETTINGS] 0011 : get ${name} > ${res}`);
			return res
		}
	}

	return {
		userSettingsApi,
		refreshUserSettingsFromBackend
	}
}
