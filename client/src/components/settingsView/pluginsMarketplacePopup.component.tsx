import React, { useContext, useEffect, useRef, useState } from 'react';
import { getApi } from '../../hooks/api/api.hook';
import { iPluginDescription } from '../../hooks/api/plugin.api.hook';
import { Popup } from '../Popup.component';

// import mecanism of function working both in simple html docs site + inside tiro
import './generatePluginsMarketplaceHtml.js';
//@ts-ignore
const generatePluginsMarketplaceHtml = window._tiro_generatePluginsMarketplaceHtml ? window._tiro_generatePluginsMarketplaceHtml : () => {}



export const PluginsMarketplacePopup = (p: {
	onClose: Function
}) => {

	const [pluginsDescriptions, setpluginsDescriptions] = useState<iPluginDescription[]>([])
	const [html, setHtml] = useState<string>("")
	useEffect(() => {
		getApi(api => {
			api.plugins.marketplace.fetchList(nDescrs => {
				setpluginsDescriptions(nDescrs)
				let nhtml = generatePluginsMarketplaceHtml({
					pluginsDescriptions:nDescrs,
					onPluginClick: (plugin) => {console.log("woooop", plugin)}
				})
				setHtml(nhtml)
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
				{pluginsDescriptions.length > 0 &&
					<div 
						id="plugin-marketplace-placeholder" 
						dangerouslySetInnerHTML={{__html: html}}
					/>
				}
				{pluginsDescriptions.length === 0 &&
					<div className="plugins-list-loading">
						loading...
					</div>
				}

			</Popup >
		</div >
	)
}

const PluginMarketItem = (p:{
	pluginDescription: iPluginDescription
}) => {
	const plugin = p.pluginDescription
	const imagePlaceholder = ""
	const firstImage = (plugin.images && plugin.images[0]) ? plugin.images[0] : imagePlaceholder
	return (
		<div className="plugin-item-wrapper">
			<div className="plugin-item-content">
				<div className="plugin-item-title">{plugin.name}</div>
				<div className="plugin-item-description">{plugin.description}</div>
			</div>
			<div 
				className="plugin-item-image" 
				style={{
					backgroundImage: `url('${firstImage}')`
				}}
			></div>
		</div>
	)
}

export const pluginsMarketplacePopupCss = () => `
.device-view-mobile {
	.plugins-marketplace-popup-wrapper .popup-wrapper .popupContent {
		width: 80vw;
	}
}

.plugins-list-loading {
	padding: 60px;
}

.plugins-marketplace-popup-wrapper .popup-wrapper .popupContent {
    padding: 0px 20px;
	width: 50vw;
	min-height: 50vh;
	max-height: 70vh;
	overflow-y: scroll;
}


`
