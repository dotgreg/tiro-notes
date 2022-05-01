import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useBackendState } from './useBackendState.hook';

export interface iUserSettings {
	sidebar?: boolean
}

type iUserSettingName =
	'ui_sidebar' |
	'ui_other'

export type iUs = { [setting in iUserSettingName]?: any }


export const useUserSettings = () => {
	const [userSettings, setUserSettings, refreshUserSettingsFromBackend] = useBackendState<iUs>('user-settings', {})

	const updateUserSetting = (name: iUserSettingName, value: any) => {
		const nSettings = cloneDeep(userSettings)
		nSettings[name] = value
		setUserSettings(nSettings)
	}

	return {
		userSettings,
		updateUserSetting,
		refreshUserSettingsFromBackend
	}
}
