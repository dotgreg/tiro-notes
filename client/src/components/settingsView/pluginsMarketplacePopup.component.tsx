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
import { defaultValsUserSettings } from '../../hooks/useUserSettings.hook';

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
	let res = localStorage.getItem(`plugins-marketplace-${settingName}`) || ""
	return replaceAll(res, [["\"", ""]])
}


export const PluginsMarketplacePopup = (p: {
	onClose: Function
}) => {


	return (
		<div className="plugins-marketplace-popup-wrapper">
			<Popup
				title={`Plugins Marketplace`}
				onClose={() => {
					p.onClose()
				}}
			>

			</Popup >
		</div >
	)
}

export const pluginsMarketplacePopupCss = () => `
.device-view-mobile {
	.plugins-marketplace-popup-wrapper .popup-wrapper .popupContent {
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

.plugins-marketplace-popup-wrapper .popup-wrapper .popupContent {
    padding: 0px 20px;
		width: 50vw;
		min-height: 50vh;
		max-height: 70vh;
		overflow-y: scroll;

}

.plugins-marketplace-panel {

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
						// 3 EXPLANATION
						.explanation {
							// width: 50%;
						}
						.input-and-html-wrapper {
							display: flex;
							width: 300px;
							.input-component {
								// 1 TITLE
								span {
									width: 100px;
								}
								// 2 INPUT
								.input-wrapper {
									width: 200px;
								}
								display: flex;
								justify-content: space-evenly;
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
