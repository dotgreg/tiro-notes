import React, { useContext, useEffect, useRef, useState } from 'react';
import { getApi } from '../../hooks/api/api.hook';
import { iPluginDescription } from '../../hooks/api/plugin.api.hook';
import { cssVars } from '../../managers/style/vars.style.manager';
import { Popup } from '../Popup.component';

export const PluginsMarketplacePopup = (p: {
	onClose: Function
}) => {

	const [pluginsDescriptions, setpluginsDescriptions] = useState<iPluginDescription[]>([])
	useEffect(() => {
		getApi(api => {
			api.plugins.marketplace.fetchList(list => {
				setpluginsDescriptions(list)
			})
		})
	}, [])


	return (
		<div className="plugins-marketplace-popup-wrapper">
			<Popup
				title={`Plugins Marketplace`}
				onClose={() => {
					p.onClose()
				}}
			>
				{
					pluginsDescriptions.map(p => 
						<>
						<div>{p.name}</div>
						<div>{p.description}</div>
						</>
					)
				}

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
