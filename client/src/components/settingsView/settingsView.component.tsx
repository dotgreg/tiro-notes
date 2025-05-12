import styled from '@emotion/styled';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';
import { strings } from '../../managers/strings.manager';
import { Popup } from '../Popup.component';
import { Input, InputType } from '../Input.component';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { useBackendState } from '../../hooks/useBackendState.hook';
import { cloneDeep, debounce, each } from 'lodash-es';
import { configClient } from '../../config';
import { cssVars } from '../../managers/style/vars.style.manager';
import { replaceAll } from '../../managers/string.manager';
import { disconnectUser } from '../../hooks/app/loginToken.hook';
import { defaultValsUserSettings } from '../../hooks/useUserSettings.hook';
import { devCliExecFn } from '../../managers/devCli.manager';
import { iUserSettingName } from '../../../../shared/types.shared';
import { deviceType } from '../../managers/device.manager';
import { getFontSize } from '../../managers/font.manager';

type ConfigPanel = {
	title: string,
	fields: ConfigField[],
}

type ConfigField = {
	type: InputType | "none",
	var: any,
	title: string,
	modifier: Function
	onCustomHtmlClick?: Function
	expl?: string
	readOnly?: boolean
	customHtml?: string
	max?: number
	min?: number
}


type SettingParam = 'backend-port' | 'backend-protocol'
export const getSetting = (settingName: SettingParam) => {
	let res = localStorage.getItem(`settings-${settingName}`) || ""
	return replaceAll(res, [["\"", ""]])
}

const showDefaultString = (us:iUserSettingName):string => {
	return `<br/> <br/> Default value: ${defaultValsUserSettings[us].toString().replaceAll("\n", "<br/>")}`
}

export const SettingsPopup = (p: {
	onClose: Function
}) => {






	let requireReloadStr = `<br/> Requires interface reload`







	/////////////////////////////////////////////////////////////////////////////////
	// CONFIG LOGIC
	//

	const [backendPort, setBackendPort] = useLocalStorage<number>('settings-backend-port', -1)
	const [backendProtocol, setBackendProtocol] = useLocalStorage<'http' | 'https' | 'same'>('settings-backend-protocol', 'same')
	const api = useContext(ClientApiContext)
	const s = strings.settingsPopup
	let conf: ConfigPanel[] = []
	if (api) {
		const us = api.userSettings
		const currProtocol = `${window.location.protocol}//`
		const tiroUrl = `${currProtocol}${api.status.ipsServer.getLocal()}${configClient.global.port}`
		const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=50&data=${tiroUrl}`
		conf = [
			// {
				// title: "Devices",
				// fields: [
				// 	{
				// 		type: 'text',
				// 		var: tiroUrl,
				// 		customHtml: `
				// 			<div class="qrcode-wrapper">
				// 			 <img src="${qrcodeUrl}"/>
				// 			<br>
				// 			</div>`,
				// 		title: "Tiro Url",
				// 		readOnly: true,
				// 		expl: `Access Tiro on another device on the <b>same wifi/local network</b> either by :
				// 		<br>
				// 			- Entering that url in a browser
				// 			<br>
				// 			- Scanning that qrcode (on desktop, go to a website like <a href='https://webqr.com/'>webqr.com </a>)`,
				// 		modifier: () => { },
				// 		onCustomHtmlClick: () => {
				// 			api.ui.lightbox.open(0, [qrcodeUrl])
				// 		}
				// 	},
					// {
					// 	type: 'none',
					// 	var: "",
					// 	customHtml: `<button> Open Tiro Window </button>`,
					// 	title: "Open Tiro Window",
					// 	readOnly: true,
					// 	expl: `Open Tiro in a separate window (Desktop only)`,
					// 	modifier: () => { },
					// 	onCustomHtmlClick: () => {
					// 		window.open(window.location.href, `popup-tiro`, 'width=800,height=1000')
					// 		// window.close();
					// 		// @ts-ignore
					// 		window.open('', '_self').close();
					// 	}
					// },
				// ],
			// },
			{
				title: "Privacy",
				fields: [
					{
						type: 'checkbox',
						title: "Disable notification popups",
						expl: "Force notification popups to not appear on the interface" + requireReloadStr,
						var: us.get('view_disable_notification_popups'),
						modifier: val => {
							setDisplayReload(true)
							us.set('view_disable_notification_popups', val)
						}
					},
					{
						type: 'checkbox',
						title: "Work mode ",
						expl: "Only displays notifications and omnibar history items related to your work" ,
						var: us.get('privacy_work_mode_enable'),
						modifier: val => {
							setDisplayReload(true)
							us.set('privacy_work_mode_enable', val)
						}
					},
					{
						type: 'text',
						title: "Work mode filter",
						expl: `Only shows notifications and omnibar history items that contain this string. <br> Separate multiple filters with a comma.  ${showDefaultString("privacy_work_mode_filters")}` ,
						var: us.get('privacy_work_mode_filters'),
						modifier: val => { us.set('privacy_work_mode_filters', val) }
					},
					{
						type: 'checkbox',
						title: "Activity Logging",
						expl: "Enable the activity logging for events like read/write files, you can then consult it using api.activity.getReport(). \n Requires an app restart to take effect.",
						var: us.get('server_activity_logging_enable'),
						modifier: val => {
							us.set('server_activity_logging_enable', val)
						}
					},
				]
			},
			{
				title: "plugins",
				fields: [
					{
						type: 'text',
						title: "Plugins Marketplace URL",
						expl: "Custom Plugins Marketplace URL, should redirect to a marketplace.json file <br> Goes to the official 'https://raw.githubusercontent.com/dotgreg/tiro-notes/master/docs/marketplace.json' by default/if empty.",
						var: us.get('plugins_marketplace_url'),
						modifier: val => { us.set('plugins_marketplace_url', val) }
					},
					{
						type: 'none',
						var: "",
						customHtml: `<button> Clean Plugins Cache </button>`,
						title: "Clean Plugins Cache",
						readOnly: true,
						expl: `Clean Plugins Cache`,
						modifier: () => { },
						onCustomHtmlClick: () => {
							devCliExecFn("cache", "clean_cache")
						}
					}
				]
			},
			{
				title: "layout",
				fields: [
					{
						type: 'text',
						title: "Main color",
						expl: "A color string like 'orange' or 'blue' or an Hex string like '#E86666' (tiro red) or '#729fc4'",
						var: us.get('ui_layout_colors_main'),
						modifier: val => { us.set('ui_layout_colors_main', val) }
					},
					{
						type: 'text',
						title: "Font color for main color",
						expl: "Font color for items with main color as background",
						var: us.get('ui_layout_colors_main_font'),
						modifier: val => { us.set('ui_layout_colors_main_font', val) }
					},
					{
						type: 'number',
						title: "Font size (desktop)",
						expl: "General font size for desktop" + showDefaultString("ui_layout_general_font_size") + requireReloadStr,
						var: us.get('ui_layout_general_font_size'),
						modifier: val => { 
							us.set('ui_layout_general_font_size', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'text',
						title: "Font family for interface",
						expl: "Font family for interface" + showDefaultString("ui_layout_font_family_interface") + requireReloadStr,
						var: us.get('ui_layout_font_family_interface'),
						modifier: val => { 
							us.set('ui_layout_font_family_interface', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'text',
						title: "Font family for editor",
						expl: "Font family for editor" + showDefaultString("ui_layout_font_family_editor") + requireReloadStr,
						var: us.get('ui_layout_font_family_editor'),
						modifier: val => { 
							us.set('ui_layout_font_family_editor', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'checkbox',
						title: "Enable Background Image",
						expl: "Enable Background Image" + requireReloadStr,
						var: us.get('ui_layout_background_image_enable'),
						modifier: val => { 
							us.set('ui_layout_background_image_enable', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'checkbox',
						title: "Enable Background Video",
						expl: "Enable Background Video" + requireReloadStr,
						var: us.get('ui_layout_background_video_enable'),
						modifier: val => { 
							us.set('ui_layout_background_video_enable', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'text',
						title: "Background image/video url",
						expl: "Background image/video url.<br>- it can start with http. <br> - You can also upload a picture in Tiro, then copy the uploaded image link here, in that case only keep the part without the hostname <br>(ex: 'static/_new/useful/.resources/wintersolstice.jpg'). <br> - you can add a youtube video/webcam stream in background by using the embed url like 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' or 'https://www.skaping.com/batz-sur-mer/plage-valentin' or even websites",
						var: us.get('ui_layout_background_image'),
						modifier: val => { 
							us.set('ui_layout_background_image', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'number',
						title: "Windows opacity",
						expl: "If Background image, how opaque should the windows be (between 0 and 100)" + showDefaultString("ui_layout_background_image_window_opacity") + requireReloadStr,
						var: us.get('ui_layout_background_image_window_opacity'),
						max: 100,
						min: 0,
						modifier: val => { 
							us.set('ui_layout_background_image_window_opacity', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'number',
						title: "Active Windows opacity",
						expl: "If Background image, how opaque should the active windows be (between 0 and 100)" + showDefaultString("ui_layout_background_image_window_opacity_active") + requireReloadStr,
						var: us.get('ui_layout_background_image_window_opacity_active'),
						max: 100,
						min: 0,
						modifier: val => { 
							us.set('ui_layout_background_image_window_opacity_active', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'number',
						title: "background video width",
						expl: "background video width in percent (between 0 and 200)" + showDefaultString("ui_layout_background_video_width") + requireReloadStr,
						var: us.get('ui_layout_background_video_width'),
						max: 200,
						min: 0,
						modifier: val => { 
							us.set('ui_layout_background_video_width', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'number',
						title: "background video height",
						expl: "background video height percent (between 0 and 200)" + showDefaultString("ui_layout_background_video_height") + requireReloadStr,
						var: us.get('ui_layout_background_video_height'),
						max: 200,
						min: 0,
						modifier: val => { 
							us.set('ui_layout_background_video_height', val) 
							setDisplayReload(true);
						}
					},
					{
						type: 'checkbox',
						title: "Sidebar Shortcut Panel",
						expl: "Adds a shortcuts/scratchpad space in the sidebar. To edit it, create a note in '.tiro/shortcuts.md'",
						var: us.get('ui_layout_shortcuts_panel'),
						modifier: val => { us.set('ui_layout_shortcuts_panel', val) }
					},
				]
			},

			{
				title: "editor",
				fields: [
					{
						type: 'checkbox',
						title: "AI Suggest",
						expl: "Send the selected text as a question to an AI" + requireReloadStr,
						var: us.get('ui_editor_ai_text_selection'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_ai_text_selection', val)
						}
					},
					{
						type: 'textarea',
						title: "AI Suggest command line",
						// expl: "Which AI API command to be called, {{input}} will be replaced by the selection. <br/><br/> For ChatGPT, you need an <a href='https://platform.openai.com/account/api-keys'  target='_blank'>api key</a> and enter the following command : " + `<br/><code>${defaultValsUserSettings.ui_editor_ai_command}</code>`,
						expl: `Custom command lines, great for AI, <br/> One custom command per line with the following format: 

						<br><br> name | <a href='https://fontawesome.com/search?q=wand&o=r&m=free'> icon name </a> | 'new' or 'current'  | command 
						<br> - 'new' or 'current': answer inserted in a new window or current one 
						<br> - command: {{input}} will be replaced by the selection. 

						<br><br/> For ChatGPT, you need an <a href='https://platform.openai.com/account/api-keys'  target='_blank'>api key</a> and enter the following command : 
						<br/><code>${defaultValsUserSettings.ui_editor_ai_command}</code>	

						<br><br> System tested with the following command lines applications (they should be installed prior using them) :
						<br> - npx chatgpt
						<br> - <a href='https://github.com/sigoden/aichat' target="_blank">aichat</a> : "mistral | m | new | echo "Instructions: if answer does not start by 'full>', be concise in answer. if question about code, only give code  \n\n{{input}}" | aichat -m mistral:open-mistral-7b"
						
						` ,
						var: us.get('ui_editor_ai_command'),
						modifier: val => {
							us.set('ui_editor_ai_command', val)
						}
					},
					{
						type: 'checkbox',
						title: "Inline Suggestions",
						expl: "Will suggest words and lines according to the current note content. You can add more words suggested by creating a file at '.tiro/suggestions.md'. Can be heavy on performances on longer notes" + requireReloadStr ,
						var: us.get('ui_editor_inline_suggestion'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_inline_suggestion', val)
						}
					},
					{
						type: 'checkbox',
						title: "Search Selected Text Button",
						expl: "Send the selected text as a question to a search engine" + requireReloadStr,
						var: us.get('ui_editor_search_highlight_enable'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_search_highlight_enable', val)
						}
					},
					{
						type: 'text',
						title: "Search Selected Text Button",
						expl: "Search engine url. Default value:" + defaultValsUserSettings.ui_editor_search_highlight_url,
						var: us.get('ui_editor_search_highlight_url'),
						modifier: val => {
							us.set('ui_editor_search_highlight_url', val)
						}
					},
					{
						type: 'checkbox',
						title: "Synced Title scrolling",
						expl: "When scrolling to a title on the editor, will scroll to its preview counterpart" + requireReloadStr,
						var: us.get('ui_editor_synced_title_scrolling'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_synced_title_scrolling', val)
						}
					},
					{
						type: 'checkbox',
						title: "Markdown Tags",
						expl: "Displays #tag as clickable tag you can interact with " + requireReloadStr,
						var: us.get('ui_editor_markdown_tags'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_tags', val)
						}
					},
					{
						type: 'checkbox',
						title: "Markdown Preview",
						expl: "Markdown preview " + requireReloadStr,
						var: us.get('ui_editor_markdown_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Enhanced Markdown Preview",
						expl: "Enhanced Markdown Preview for files, documents, date etc" + requireReloadStr,
						var: us.get('ui_editor_markdown_enhanced_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_enhanced_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Enhanced Markdown Syntax",
						expl: "Enhance Markdown Syntax (**bold**, ~~text~~, and other)",
						var: us.get('ui_editor_markdown_syntax'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_syntax', val)
						}
					},
					{
						type: 'checkbox',
						title: "Improved Markdown Table",
						expl: "Improves the display of markdown table. Add '--table' in the note to activate it." + requireReloadStr,
						var: us.get('ui_editor_markdown_table_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_table_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Links button",
						expl: "Replace http links into buttons in the editor by adding a '/' at the end of it." + requireReloadStr,
						var: us.get('ui_editor_links_as_button'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_links_as_button', val)
						}
					},
					// {
					// 	type: 'text',
					// 	title: "Links Preview Zoom",
					// 	expl: "Zoom of the link preview functionality (eye button, should be number between 0 and 1)",
					// 	var: us.get('ui_editor_links_preview_zoom'),
					// 	modifier: val => {
					// 		us.set('ui_editor_links_preview_zoom', val)
					// 	}
					// },
					{
						type: 'checkbox',
						title: "Latex preview",
						expl: "Add Latex preview. Add '--latex' in the note to activate it then use $_latex_expression_$" + requireReloadStr,
						var: us.get('ui_editor_markdown_latex_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_latex_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Spellcheck",
						expl: "Enable/disable native browser spellcheck for all notes. <br> You can also activate it per note by adding '--spellcheck' inside the note content <br>" + requireReloadStr,
						var: us.get('ui_editor_spellcheck'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_spellcheck', val)
						}
					},
					{
						type: 'checkbox',
						title: "Image title",
						expl: "Show image title on interface and exports" + requireReloadStr,
						var: us.get('ui_editor_show_image_title'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_show_image_title', val)
						}
					},
					{
						type: 'checkbox',
						title: "Live Edition",
						expl: "If other clients edit the same note, update everybody on live. <br> That functionality is required for AI assistant and the inline calculator" + requireReloadStr,
						var: us.get('ui_editor_live_watch'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_live_watch', val)
						}
					},
				]
			},
			{
				title: "keyboard",
				fields: [
					{
						type: 'textarea',
						title: "Custom Shortcuts",
						expl: `Define custom shortcuts. One shortcut per line with the following format: 
						<br>shortcut | command_name | command_content 
						<br>- shortcut: the key combination (ex: 'ctrl+shift > e') 
						<br>- command_name: the command to execute (toggle_note | highlight_to_ai)
						<br>- command_content: the content of the command (ex: '/path/to/note.md' | 'ai_model_name')
						<br>	
						<br>Commands available:
						<br>- toggle_note: Toggle a note in a floating window. The command content should be the relative note path like /path/to/note.md
						<br>- highlight_to_ai: Send the selected text to an AI, if nothing is selected, send the cursor line to the AI. The AI suggest function should be enabled. The command content can be the AI model name, but can also be left empty, it will select the first ai model (ref AI Suggest command line)
						<br>
						<br> Example:
						<br> shift + alt > 1 | toggle_note |/path/to/note.md 
						<br> ctrl + shift > 2 | highlight_to_ai | ai_mode_name`,
						var: us.get('keyboard_shortcuts_textarea'),
						modifier: val => {
							// setDisplayReload(true);
							us.set('keyboard_shortcuts_textarea', val)
						}
					}
				]
			},
			{
				title: "exports",
				fields: [
					{
						type: 'textarea',
						title: "Options for Pandoc exporter",
						expl: `Modify how pandoc exports files. All options can be found at <a href='https://pandoc.org/MANUAL.html' target="_blank">pandoc options manual</a>. One file extension options per line.<br/><br/>format: <br/> file extention | options  ${showDefaultString("export_pandoc_cli_options")}`,
						var: us.get('export_pandoc_cli_options'),
						modifier: val => { us.set('export_pandoc_cli_options', val) }
					},
					{
						type: 'none',
						var: "",
						customHtml: ` `,
						title: "Export Install",
						readOnly: true,
						expl: `In order to export in many formats, Tiro notes needs to install Pandoc on your computer. (At least v2.9) <br/>
						<a href="https://pandoc.org/installing.html" target="_blank">Guide here </a>
						<br/><br/>
						For Beamer presentation in PDF, make sure pdflatex is installed 
						<br/> - if you are on Ubuntu: <a href="https://gist.github.com/rain1024/98dd5e2c6c8c28f9ea9d" target="_blank">Guide here </a>
						<br/> - if you are on Termux: <code>pkg install texlive-installer texlive-tlmgr; termux-install-tl</code>`,
						modifier: () => { },
						onCustomHtmlClick: () => {
						}
					}
				]
			},
			
			{
				title: "Users and Rights",
				fields: [
					{
						type: 'checkbox',
						title: "Enable read-only viewer",
						expl: "Create a \"viewer\" user that can read but not edit the content",
						var: us.get('users_viewer_user_enable'),
						modifier: val => {
							us.set('users_viewer_user_enable', val, { writeInSetupJson: true })
						},
					}, {
						type: 'text',
						title: "Viewer user password",
						expl: "Define the \"viewer\" user password",
						var: us.get('users_viewer_user_password'),
						modifier: val => {
							us.set('users_viewer_user_password', val, { writeInSetupJson: true })
						}
					},
					{
						type: 'checkbox',
						title: "Demo Mode",
						expl: "Autofill the 'viewer' user and password on login popup for easier access during a demo mode",
						var: us.get('demo_mode_enable'),
						modifier: val => {
							us.set('demo_mode_enable', val, { writeInSetupJson: true })
						},
					},
					{
						type: 'none',
						var: "",
						customHtml: `<button> Logout </button>`,
						title: "Logout current User",
						readOnly: true,
						expl: `Logout Current User`,
						modifier: () => { },
						onCustomHtmlClick: () => {
							disconnectUser()
							p.onClose()
							// random api call to retrigger login popup
							getApi(api => { api.folders.get(['/'], () => { }) })
						}
					},
				]
			},

			{
				title: "Advanced",
				fields: [
					{ type: 'text', var: backendPort, title: s.backend.port, expl: s.backend.portExpl, modifier: setBackendPort },
					// { type: 'text', var: backendProtocol, title: s.backend.protocol, expl: s.backend.protocolExpl, modifier: setBackendProtocol },
					
					
					{
						type: 'textarea',
						title: "Options for Image compression",
						expl: `Modify default image compression settings  ${showDefaultString("advanced_image_compression_settings")}`,
						var: us.get('advanced_image_compression_settings'),
						modifier: val => { us.set('advanced_image_compression_settings', val) }
					},
				]
			},
			
			{
				title: "Beta",
				fields: [
					// {
					// 	type: 'checkbox',
					// 	title: "Floating Windows",
					// 	expl: "Enable the floating window system" + requireReloadStr,
					// 	var: us.get('beta_floating_windows'),
					// 	modifier: val => {
					// 		setDisplayReload(true)
					// 		us.set('beta_floating_windows', val)
					// 	}
					// },
					{
						type: 'checkbox',
						title: "Plugins Marketplace",
						expl: "Enable the plugin marketplace system",
						var: us.get('beta_plugins_marketplace'),
						modifier: val => {
							us.set('beta_plugins_marketplace', val)
						}
					},
				]
			}
		]
	}



	//
	// TOGGLING PANELS LOGIC
	//
	const [panelsOpened, setPanelsOpened, refreshConf] = useBackendState<boolean[]>('config-panels-opened', [], {editIfNotLoaded:true})
	const togglePanel = (panelId: number) => {
		const nP = cloneDeep(panelsOpened)
		nP[panelId] = !nP[panelId]
		setPanelsOpened(nP)
	}

	// const debounceOnChange = debounce((e, field) => {
	// 	console.log(`[SETTINGS] frontend setting ${field.title} changed for ${e}`);
	// 	field.modifier(e)
	// })
	const [displayReload, setDisplayReload] = useState(false)

	return (
		<div className="settings-popup-wrapper">
			<Popup
				title={`${s.title}`}
				onClose={() => {
					p.onClose()
				}}
			>

				{
					conf.map((panel, i) =>
						<div className="settings-panel">
							<h3 onClick={() => { togglePanel(i) }}>
								<div className="arrow">{panelsOpened[i] ? '▼' : '►'}</div>
								{panel.title}
							</h3>
							<div className={`fields-wrapper ${panelsOpened[i] ? 'active' : ''}`} >
								{
									panel.fields.map(field =>
										<div className="field-wrapper">
											<div className="input-and-html-wrapper">
												{field.type === "none" &&
													<span>{field.title}</span>
												}
												{field.type !== "none" &&
													< Input
														value={field.var}
														shouldNotSelectOnClick={true}
														label={field.title}
														type={field.type}
														max={field.max}
														min={field.min}
														readonly={field.readOnly}
														onChange={e => {
															if (field.type === "checkbox") return
															// console.log(`[SETTINGS] frontend setting ${field.title} changed for ${e}`);
															field.modifier(e)
														}}
														onCheckedChange={e => {
															if (field.type !== "checkbox") return
															// console.log(`[SETTINGS] frontend setting ${field.title} changed for ${e}`);
															field.modifier(e)
														}}
													/>
												}
												{
													field.customHtml &&
													<div
														className="custom-html-wrapper"
														onClick={e => { field.onCustomHtmlClick && field.onCustomHtmlClick() }}
														dangerouslySetInnerHTML={{
															__html: field.customHtml
														}}
													></div>
												}
												<div
												className="explanation"
												dangerouslySetInnerHTML={{
													__html: field.expl || "" + "woop"
												}}
											></div>
											</div>

											
										</div>
									)
								}
							</div>

						</div>
					)
				}
				{displayReload &&
					<button className='submit-button reload-btn' onClick={e => { window.location.reload() }}>Reload App</button>
				}
			</Popup >
		</div >
	)
}

export const settingsPopupCss = () => `
//
// mobile version
//

.device-view-mobile {
	.settings-popup-wrapper .popup-wrapper .popupContent {
				width: 80vw;
				.field-wrapper {
						display: block;
						.explanation {
								width: 100%;
								padding: 5px 0px;
						}
						input {
						}
				}

		}
}

.settings-popup-wrapper .popup-wrapper  {
	height: 70%;
}
.settings-popup-wrapper .popup-wrapper .popupContent {
    padding: 0px 20px;
		width: 70vw;
		// min-height: 50vh;
		// max-height: 70vh;
		overflow-y: scroll;

}

.reload-btn {
	position: absolute;
	bottom: 10px;
	right: 10px;
}


.settings-panel {
		
		.input-and-html-wrapper {
			// width: 50%;
			.input-component-wrapper  {
				.input-component  {
					.input-wrapper {
						textarea, input {
							${deviceType() === 'desktop' ? " " : "width: calc(100% - 30px); margin: 5px 0px; "}
						}
						input[type=checkbox] {
							width: 20px;
						}
						input[type="text"] {
							${deviceType() === 'desktop' ? " " : "width: calc(100% - 40px);"}
						}
					}
				}
			}
		}

		h3 {
				cursor: pointer;
				text-transform: uppercase;
				.arrow {
						display: inline-block;
						font-size: 7px;
						position: relative;
						bottom: 2px;
						margin-right: 10px;
				}
		}
		.fields-wrapper {
				display: none;
				&.active {
						display: block;
						display: block;
						padding: 12px 12px 0px 12px;
						background: ${cssVars.colors.bgPopup2};
						border-radius: 5px;
						border: 1px ${cssVars.colors.bgPopup3} solid;
						margin-top: 10px;
				}
				.field-wrapper {
						textarea {
							width: 100%;
						}
						
						display: flex;
						padding-bottom: 11px;
						align-items: center;
						// 3 EXPLANATION
						
						@media (min-width: 1000px) {
							.input-and-html-wrapper{
								display: flex;
							}
							.explanation {
								padding-left: 20px;
							}
						}
						// else
						@media (max-width: 1000px) {
							.explanation {
								padding-bottom: 20px;
							}
						}
						.input-and-html-wrapper {
							// display: ${deviceType() === "mobile" ? "block" : "flex"} ;
							// display: flex;
							.input-component {
								// 1 TITLE
								span {
									width: 100px;
								}
								// 2 INPUT
								.input-wrapper {
									width: 300px;
								}
								display: flex;
								justify-content: space-evenly;
								padding: 0px;
								input {
									font-size: ${getFontSize()}px;
								}
							}
							.custom-html-wrapper {
									margin-left: 20px;
									.qrcode-wrapper {
											img {
													margin: 5px 25px 0px 0px;
													cursor: pointer;
													width: 50px;
													&:hover {
															//	width: 150px;
													}
											}
									}
							}
						}
						
				}
		}

}




.buttons {
    display: flex;
    padding: 20px 0px 0px 0px;
    button {
        width: 30%;
        padding: 10px;
    }
}
`
