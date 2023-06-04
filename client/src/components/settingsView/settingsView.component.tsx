import styled from '@emotion/styled';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';
import { strings } from '../../managers/strings.manager';
import { Popup } from '../Popup.component';
import { Input, InputType } from '../Input.component';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { useBackendState } from '../../hooks/useBackendState.hook';
import { cloneDeep, debounce, each } from 'lodash';
import { configClient } from '../../config';
import { cssVars } from '../../managers/style/vars.style.manager';
import { replaceAll } from '../../managers/string.manager';
import { disconnectUser } from '../../hooks/app/loginToken.hook';

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
}


type SettingParam = 'backend-port' | 'backend-protocol'
export const getSetting = (settingName: SettingParam) => {
	let res = localStorage.getItem(`settings-${settingName}`) || ""
	return replaceAll(res, [["\"", ""]])
}


export const SettingsPopup = (p: {
	onClose: Function
}) => {














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
			{
				title: "Devices",
				fields: [
					{
						type: 'text',
						var: tiroUrl,
						customHtml: `
																				<div class="qrcode-wrapper">
																				// <img src="${qrcodeUrl}"/>
																				<br>
																				</div>`,
						title: "Tiro Url",
						readOnly: true,
						expl: `Access Tiro on another device on the <b>same wifi/local network</b> either by :
												<br>
												 - Entering that url in a browser
												 <br>
												 - Scanning that qrcode (on desktop, go to a website like <a href='https://webqr.com/'>webqr.com </a>)`,
						modifier: () => { },
						onCustomHtmlClick: () => {
							api.ui.lightbox.open(0, [qrcodeUrl])
						}
					},
					{
						type: 'none',
						var: "",
						// customHtml: `${renderToString(<Icon name="faLink" />)}`,
						customHtml: `<button> Open Tiro Window </button>`,
						title: "Open Tiro Window",
						readOnly: true,
						expl: `Open Tiro in a separate window (Desktop only)`,
						modifier: () => { },
						onCustomHtmlClick: () => {
							window.open(window.location.href, `popup-tiro`, 'width=800,height=1000')
							// window.close();
							// @ts-ignore
							window.open('', '_self').close();
						}
					},
				],
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
						expl: "Send the selected text as a question to an AI",
						var: us.get('ui_editor_ai_text_selection'),
						modifier: val => {
							us.set('ui_editor_ai_text_selection', val)
						}
					},
					{
						type: 'text',
						title: "AI Suggest command line",
						expl: "Which AI API command to be called, {{input}} will be replaced by the selection",
						var: us.get('ui_editor_ai_command'),
						modifier: val => {
							us.set('ui_editor_ai_command', val)
						}
					},
					{
						type: 'checkbox',
						title: "Markdown Preview",
						expl: "Markdown preview",
						var: us.get('ui_editor_markdown_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Markdown Preview",
						expl: "Markdown preview",
						var: us.get('ui_editor_markdown_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Enhanced Markdown Preview for files, documents etc",
						expl: "Enhanced Markdown Preview for files, documents etc",
						var: us.get('ui_editor_markdown_enhanced_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_enhanced_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Links button",
						expl: "Replace http links into buttons in the editor by adding a '/' at the end of it.",
						var: us.get('ui_editor_links_as_button'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_links_as_button', val)
						}
					},
					{
						type: 'checkbox',
						title: "Latex preview",
						expl: "Add Latex preview. Add '--latex' in the note to activate it then use $_latex_expression_$",
						var: us.get('ui_editor_markdown_latex_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_latex_preview', val)
						}
					},
					{
						type: 'checkbox',
						title: "Improved Markdown Table",
						expl: "Improves the display of markdown table. Add '--table' in the note to activate it.",
						var: us.get('ui_editor_markdown_table_preview'),
						modifier: val => {
							setDisplayReload(true);
							us.set('ui_editor_markdown_table_preview', val)
						}
					},
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
						type: 'checkbox',
						title: "Activity Logging",
						expl: "Enable the activity logging for events like read/write files, you can then consult it using api.activity.getReport(). \n Requires an app restart to take effect.",
						var: us.get('server_activity_logging_enable'),
						modifier: val => {
							us.set('server_activity_logging_enable', val)
						}
					},
				]
			}
		]
	}



	//
	// TOGGLING PANELS LOGIC
	//
	const [panelsOpened, setPanelsOpened, refreshConf] = useBackendState<boolean[]>('config-panels-opened', [])
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
														label={field.title}
														type={field.type}
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
											</div>

											<div
												className="explanation"
												dangerouslySetInnerHTML={{
													__html: field.expl || ""
												}}
											></div>
										</div>
									)
								}
							</div>

						</div>
					)
				}
				{displayReload &&
					<button onClick={e => { window.location.reload() }}>Reload App</button>
				}
			</Popup >
		</div >
	)
}

export const settingsPopupCss = () => `
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

.settings-popup-wrapper .popup-wrapper .popupContent {
    padding: 0px 20px;
		width: 50vw;
		min-height: 50vh;
		max-height: 70vh;
		overflow-y: scroll;

}

.settings-panel {

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
						display: flex;
						padding-bottom: 11px;
						align-items: center;
						.input-and-html-wrapper {
								width: 50%;
								display: flex;
								.input-component {
										flex: 1;
										padding: 0px;
										input {
												font-size: 10px;
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
						.explanation {
								width: 50%;
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
