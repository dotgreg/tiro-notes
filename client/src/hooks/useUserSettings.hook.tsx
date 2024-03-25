import { cloneDeep, debounce, each, isNull, isUndefined, uniqueId } from 'lodash-es';
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



export const userSettingsSync: {curr:iUserSettings} = {curr: {}}
export const getUserSettingsSync = () => userSettingsSync.curr

export type iUserSettings = { [setting in iUserSettingName]?: any }
export type iUserSettingsApi = {
	get: (name: iUserSettingName, cb?:(res:{currentValue: any, defaultValue:any}) => void) => any
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

// get params from url
const getUrlParams = (url: string):{[key:string]:string} => {
	const res:{[key:string]:string} = {}
	const params = new URLSearchParams(url)
	params.forEach((val, key) => {
		res[key] = val
	})
	return res
}
const paramsUrl = getUrlParams(window.location.search)
const c = {}
// replace params of c from paramsUrl not using lodash
for (const key in paramsUrl) {
	c[key] = paramsUrl[key]
}


export const defaultValsUserSettings: iUserSettings = {
	ui_sidebar: true,
	ui_filesList_sortMode: 2,
	ui_layout_colors_main: "#E86666",
	ui_layout_colors_main_font: "#FFFFFF",
	ui_editor_markdown_preview: true,
	ui_editor_markdown_latex_preview: true,
	ui_editor_markdown_enhanced_preview: true,
	ui_editor_markdown_table_preview: true,
	ui_editor_spellcheck: true,
	ui_editor_live_watch: true,
	ui_editor_links_as_button: true,
	ui_editor_markdown_tags: true,
	ui_editor_links_preview_zoom: 0.8,
	ui_editor_show_image_title: false,
	export_pandoc_cli_options: "\ndocx | --wrap=preserve --toc --number-sections \n revealjs | -V theme=moon \n beamer | --wrap=preserve --include-in-header=./include-tex.md ",
	advanced_image_compression_settings: JSON.stringify({quality: 80, maxWidth: 1500}),
	ui_editor_ai_text_selection: true,
	ui_editor_ai_command: "export OPENAI_API_KEY='YOUR_OPENAI_API_KEY'; npx chatgpt \" {{input}}\" --continue --model gpt-4 ",
	server_activity_logging_enable: false,
	view_disable_notification_popups: false,
	privacy_work_mode_enable: false,
	privacy_work_mode_filters: "work,meeting",
	beta_floating_windows: false,
	beta_plugins_marketplace: false,
	plugins_marketplace_url: "https://raw.githubusercontent.com/dotgreg/tiro-notes/master/docs/marketplace.json",
	ui_layout_general_font_size: 10,
	ui_layout_background_image_enable: false,
	ui_layout_background_video_enable: false,
	ui_layout_background_image_window_opacity: 70,
	ui_layout_background_image_window_opacity_active: 90,
	ui_layout_background_video_width: 100,
	ui_layout_background_video_height: 100,
	ui_layout_font_family_interface: `Helvetica neue, Open sans, arial, sans-serif`,
	// ui_layout_font_family_editor: `Consolas, monaco, monospace`,
	ui_layout_font_family_editor: `Helvetica neue, Open sans, arial, sans-serif`,
}
const defaultVals = defaultValsUserSettings

const h = `[USER SETTINGS] :`
const log = sharedConfig.client.log.verbose

const genUserSettingsList = (userSettings:iUserSettings):iUserSettingList => {
	const res: iUserSettingList = []
	each(userSettings, (val, name) => {
		
		const key = name as iUserSettingName
		res.push({ key, val })
	})
	// adds defaultValsUserSettings
	each(defaultValsUserSettings, (val, name) => {
		const key = name as iUserSettingName
		if (!res.find(r => r.key === key)) res.push({ key, val })
	})
	return res
}


export const useUserSettings =  (p: {
	eventBus: iApiEventBus
}) => {
	// storage
	const [userSettings, setUserSettings, refreshUserSettingsFromBackend] = useBackendState<iUserSettings>('user-settings', {}, {history: true})
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
		userSettingsSync.curr = userSettings
		// add in userSettingsSync.curr default values
		each(defaultVals, (val, name) => {
			// if userSettings[name] is undefined, set it to default
			if (isUndefined(userSettings[name])) userSettings[name] = val
		})
	}, [userSettings])

	const debounceChange = useDebounce(() => {
		log && console.log(h, 'UPDATE!', userSettings, refreshCss);
		replaceDefaultByUserVar('ui_layout_colors_main', cssVars.colors, 'main')
		replaceDefaultByUserVar('ui_layout_colors_main_font', cssVars.colors, 'mainFont')
		replaceDefaultByUserVar('ui_layout_font_family_editor', cssVars.font, 'editor')
		replaceDefaultByUserVar('ui_layout_font_family_interface', cssVars.font, 'main')
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

		

		get: (name,cb) => {
			// if settings not configured, return default
			let resDefault = defaultVals[name]
			let res = resDefault
			if (name in userSettings) res = userSettings[name]
			if (res === '') res = resDefault
			if (cb) cb({currentValue: res, defaultValue: resDefault})
			return res
		},
		list: () => {
			return genUserSettingsList(userSettings)
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
