import { cloneDeep, debounce, each, isNull, isUndefined, uniqueId } from 'lodash';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { sharedConfig } from '../../../shared/shared.config';
import { iUpdateConfigJsonOpts, iUserSettingList, iUserSettingName } from '../../../shared/types.shared';
import { clientSocket2 } from '../managers/sockets/socket.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { iApiEventBus } from './api/api.hook';
import { getLoginToken } from './app/loginToken.hook';
import { useDebounce } from './lodash.hooks';
import { useBackendState } from './useBackendState.hook';




export type iUserSettings = { [setting in iUserSettingName]?: any }
export type iUserSettingsApi = {
	get: (name: iUserSettingName) => any
	set: (name: iUserSettingName, val: any, options?: { writeInSetupJson?: boolean }) => void
	list: () => iUserSettingList
	refresh: {
		css: { get: number }
	}
	updateSetupJson: (
		paramName: string, 
		paramValue: string, 
		cb?:(res:any) => void, 
		opts?: iUpdateConfigJsonOpts,
	) => void
	refreshUserSettingsFromBackend: Function,
}

export const defaultValsUserSettings: iUserSettings = {
	ui_sidebar: true,
	ui_filesList_sortMode: 2,
	ui_layout_colors_main: "#E86666",
	ui_editor_markdown_preview: true,
	ui_editor_markdown_latex_preview: true,
	ui_editor_markdown_enhanced_preview: true,
	ui_editor_markdown_table_preview: true,
	ui_editor_links_as_button: true,
	ui_editor_links_preview_zoom: 0.8,
	ui_editor_ai_text_selection: true,
	ui_editor_ai_command: "export OPENAI_API_KEY='YOUR_OPENAI_API_KEY'; npx chatgpt \" {{input}}\" --continue",
	server_activity_logging_enable: false,
	plugins_marketplace_url: "https://raw.githubusercontent.com/dotgreg/tiro-notes/master/docs/marketplace.json",
}
const defaultVals = defaultValsUserSettings

const h = `[USER SETTINGS] :`
const log = sharedConfig.client.log.verbose



export const useUserSettings =  (p: {
	eventBus: iApiEventBus
}) => {
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


	const updateSetupJson: iUserSettingsApi['updateSetupJson'] = (name, value, cb, opts) => {
		const idReq =  `updateSetupJson-${generateUUID()}`
		// 1. add a listener function
		p.eventBus.subscribe(idReq, data => {
			cb && cb(data)
		});
		// 2. emit request 
		clientSocket2.emit('updateSetupJson', {
			paramName: name,
			paramValue: value,
			opts,
			token: getLoginToken(),
			idReq
		})
	}
	useEffect(() => {
		clientSocket2.on('onServerTaskFinished', data => {
			p.eventBus.notify(data.idReq, { data })
		})
	}, [])

	// api
	const userSettingsApi: iUserSettingsApi = {
		refreshUserSettingsFromBackend,
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
			const res: iUserSettingList = []
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
	}
}
