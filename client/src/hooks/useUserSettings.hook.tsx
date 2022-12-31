import { cloneDeep, debounce, each, isNull, isUndefined, uniqueId } from 'lodash';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { sharedConfig } from '../../../shared/shared.config';
import { clientSocket2 } from '../managers/sockets/socket.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { getLoginToken } from './app/loginToken.hook';
import { useDebounce } from './lodash.hooks';
import { useBackendState } from './useBackendState.hook';

type iUserSettingName =
	'ui_filesList_sortMode' |
	'ui_layout_colors_main' |
	'ui_layout_shortcuts_panel' |
	'ui_sidebar' |

	'ui_editor_links_as_button' |
	'ui_editor_markdown_preview' |

	'users_viewer_user_enable' |
	'users_viewer_user_password' |

	'demo_mode_enable' |

	'ui_other'

type keyVal = { key: iUserSettingName, val: any }
export type iUserSettings = { [setting in iUserSettingName]?: any }
export type iUserSettingsApi = {
	get: (name: iUserSettingName) => any
	set: (name: iUserSettingName, val: any, options?: { writeInSetupJson?: boolean }) => void
	list: () => keyVal[]
	refresh: {
		css: { get: number }
	}
	updateSetupJson: (paramName: string, paramValue: string) => void
}

const defaultVals: iUserSettings = {
	ui_sidebar: true,
	ui_filesList_sortMode: 2,
	ui_layout_colors_main: "#E86666",
	ui_editor_markdown_preview: true,
	ui_editor_links_as_button: true,
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




	const updateSetupJson: iUserSettingsApi['updateSetupJson'] = (name, value) => {
		// 2. emit request 
		clientSocket2.emit('updateSetupJson', {
			paramName: name,
			paramValue: value,
			token: getLoginToken(),
			idReq: `updateSetupJson-${generateUUID()}`
		})
	}



	// api
	const userSettingsApi: iUserSettingsApi = {
		updateSetupJson,
		set: (name, value, opts) => {
			if (!opts) opts = {}
			if (!opts.writeInSetupJson) opts.writeInSetupJson = false

			// if JSON setup 
			if (opts.writeInSetupJson) updateSetupJson(name, `${value}`)

			log && console.log(h, `updateUserSettings ${name} to ${value}`);
			const nSettings = cloneDeep(userSettings)
			nSettings[name] = value
			setUserSettings(nSettings)
		},

		get: name => {
			// if settings not configured, return default
			let resDefault = defaultVals[name]
			let res = resDefault
			if (name in userSettings) res = userSettings[name]
			if (res === '') res = resDefault
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
		userSettings,
		userSettingsApi,
		refreshUserSettingsFromBackend
	}
}
