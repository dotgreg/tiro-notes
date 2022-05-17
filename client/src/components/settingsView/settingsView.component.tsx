import styled from '@emotion/styled';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';
import { strings } from '../../managers/strings.manager';
import { Popup } from '../Popup.component';
import { Input, InputType } from '../Input.component';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { useBackendState } from '../../hooks/useBackendState.hook';
import { cloneDeep, debounce, each } from 'lodash';
import { configClient } from '../../config';

type ConfigPanel = {
	title: string,
	fields: ConfigField[],
}

type ConfigField = {
	type: InputType,
	var: any,
	title: string,
	modifier: Function
	expl?: string
	readOnly?: boolean
	customHtml?: string
}


type SettingParam = 'backend-port' | 'backend-protocol'
export const getSetting = (settingName: SettingParam) => {
	return localStorage.getItem(`settings-${settingName}`)?.replaceAll("\"", "");
}


export const SettingsPopup = (p: {
	onClose: Function
}) => {






	//
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
		const tiroUrl = `${currProtocol}${api.status.ipServer.get[0]}${configClient.global.port}`
		const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tiroUrl}`
		conf = [
			{
				title: "Devices",
				fields: [
					{
						type: 'text',
						var: tiroUrl,
						customHtml: `<div class="qrcode-wrapper"><img src="${qrcodeUrl}"/></div>`,
						title: "Tiro Url",
						readOnly: true,
						expl: "Access Tiro on another device on the same wifi/local network by entering that url in a browser",
						modifier: setBackendPort,
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
				]
			}
			, {
				title: "Advanced",
				fields: [
					{ type: 'text', var: backendPort, title: s.backend.port, expl: s.backend.portExpl, modifier: setBackendPort },
					// { type: 'text', var: backendProtocol, title: s.backend.protocol, expl: s.backend.protocolExpl, modifier: setBackendProtocol },
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
												<Input
													value={field.var}
													label={field.title}
													type={field.type}
													readonly={field.readOnly}
													onChange={e => {
														// debounceOnChange(e, field)
														console.log(`[SETTINGS] frontend setting ${field.title} changed for ${e}`);
														field.modifier(e)
													}}
												/>
												{
													field.customHtml &&
													<div
														className="custom-html-wrapper"
														dangerouslySetInnerHTML={{
															__html: field.customHtml
														}}
													></div>
												}
											</div>

											<div className="explanation">{field.expl}</div>
										</div>
									)
								}
							</div>

						</div>
					)
				}
			</Popup>
		</div >
	)
}

export const settingsPopupCss = () => `
&.device-view-mobile {
		.popup-wrapper .popupContent {
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


.popup-wrapper .popupContent {
    padding: 0px 20px;
		width: 50vw;
		min-height: 50vh;
		max-height: 70vh;
		overflow-y: scroll;

}

.settings-panel {
		h3 {
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
						background: #f9f9f9;
						border-radius: 5px;
						border: 1px #f5efef solid;
						margin-top: 10px;
				}
				.field-wrapper {
						display: flex;
						padding-bottom: 11px;
						align-items: center;
						.input-and-html-wrapper {
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
														width: 50px;
														&:hover {
																width: 150px;
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
