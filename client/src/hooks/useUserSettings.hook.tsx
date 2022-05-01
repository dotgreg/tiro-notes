import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useBackendState } from './useBackendState.hook';

type iUserSettingName =
	'ui_sidebar' |
	'ui_other'

export type iUserSettings = { [setting in iUserSettingName]?: any }

const defaultVals: iUserSettings = {
	ui_sidebar: true
}

export const useUserSettings = () => {
	const [userSettings, setUserSettings, refreshUserSettingsFromBackend] = useBackendState<iUserSettings>('user-settings', {})

	const updateUserSetting = (name: iUserSettingName, value: any) => {
		console.log(`[USER SETTINGS] 0011 : updateUserSettings ${name} to ${value}`);
		const nSettings = cloneDeep(userSettings)
		nSettings[name] = value
		setUserSettings(nSettings)
	}

	const getUserSetting = (name: iUserSettingName) => {
		// if settings not configured, return default
		let res = defaultVals[name]
		if (name in userSettings) res = userSettings[name]
		console.log(`[USER SETTINGS] 0011 : get ${name} > ${res}`);
		return res
	}

	return {
		getUserSetting,
		updateUserSetting,
		refreshUserSettingsFromBackend
	}
}
