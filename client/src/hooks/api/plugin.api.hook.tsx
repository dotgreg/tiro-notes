import { each, isArray, sortBy } from "lodash-es"
import { useEffect } from "react"
import { sharedConfig } from "../../../../shared/shared.config"
import { iPlugin, iPluginType } from "../../../../shared/types.shared"
import { notifLog } from "../../managers/devCli.manager"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { genIdReq, getApi, iApiEventBus } from "./api.hook"
import { extractDocumentation } from "../../managers/apiDocumentation.manager"

const h = `[PLUGINS]`
type iPluginVersion = {
	version:string
	date: string
	comment?: string
	hash: string
}
type iPluginConfig = {
	type: string
	description: string
	id: string
}
export type iPluginDescription = {
	name: string
	description: string
	images?: string[]
	icon?:string
	configuration?: iPluginConfig[]
	versions: iPluginVersion[]
}

export interface iPluginsApi {
	documentation?: () => any,
	list: (
		cb: (plugins: iPlugin[], scanLog:string[]) => void,
		opts?:{
			noCache?: boolean,
		}
	) => void,

	get: (
		pluginName:string, 
		pluginType:iPluginType, 
		cb:(plugin:iPlugin|null) => void
	) => void,

	cronCache: {
		set: (pluginBgName:string, state: any) => void
	},

	marketplace: {
		fetchList: (
			cb:(pluginDescriptions: iPluginDescription[]) => void
		) => void
	}
}

export const usePluginsApi = (p: {
	eventBus: iApiEventBus,
}) => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getPluginsList', data => {
			p.eventBus.notify(data.idReq, data)
		})
	}, [])


	//
	// FUNCTIONS
	// 

	//  V2 get files list but frontend only



	//  V1 get files list
	const listPlugins: iPluginsApi['list'] = (cb, opts) => {
		if (!opts) opts = {}
		if (!opts.noCache) opts.noCache = false
		if (sharedConfig.client.log.socket) console.log(`${h} get plugins`);
		const idReq = genIdReq('get-plugins-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, data => {
			if (data.scanLog.length > 0) {
				getApi(api => api.ui.notification.emit({
					content:`PLUGIN SCAN LOG:<br/>${JSON.stringify(data.scanLog)}`,
					options: {
						hideAfter: 60
					}
				}))
			}
			// sort plugins
			// let sortedPlugins:iPlugin[] = data.plugins
			let sortedPlugins = sortBy(data.plugins, p => p.name)
			// console.log()
			cb(sortedPlugins, data.scanLog)
		});
		// 2. emit request 
		clientSocket2.emit('askPluginsList', {
			noCache: opts.noCache,
			token: getLoginToken(),
			idReq
		})
	}

	const getPlugin: iPluginsApi['get'] = (name, type, cb) => {
		listPlugins((plugins,log) => {
			let res = plugins.filter(p => p.name === name && p.type === type)[0] || null
			cb(res)
		}, {noCache: true})
	}

	const setCronVars: iPluginsApi['cronCache']['set'] = (pluginBgName, nvars) => {
		let cacheId = "plugins-cron-infos"
		getApi(api => {
			api.cache.get(cacheId, cronState => {
				if (!cronState) cronState = {}
				if (!cronState[pluginBgName]) cronState[pluginBgName] = {vars:{}}
				cronState[pluginBgName].vars = nvars
				api.cache.set(cacheId, cronState, -1)
			})
		})
	}

	//
	// MARKETPLACE
	//
	
	const fetchMarketPlaceList:iPluginsApi['marketplace']['fetchList'] = cb => {
		getApi(api => {
			let mktUrl = api.userSettings.get("plugins_marketplace_url")
			let errorStr = `${h} api.plugins.marketplace.fetchList error for url: ${mktUrl} :`
			api.ressource.fetch(mktUrl, (content) => {
				try {
					let list:any = JSON.parse(content)
					const pluginsDescriptions:iPluginDescription[] = []
					if (isArray(list)) {
						each(list, pluginDescRaw => {
							let nPluginDescription:iPluginDescription = {
								name: "",
								description: "",
								versions: [],
								configuration:[]
							}
							if (pluginDescRaw.name) nPluginDescription.name = pluginDescRaw.name
							if (pluginDescRaw.description) nPluginDescription.description = pluginDescRaw.description
							if (pluginDescRaw.versions) nPluginDescription.versions = pluginDescRaw.versions
							if (pluginDescRaw.images) nPluginDescription.images = pluginDescRaw.images
							if (pluginDescRaw.icon) nPluginDescription.icon = pluginDescRaw.icon
							if (pluginDescRaw.configuration) nPluginDescription.configuration = pluginDescRaw.configuration

							if (nPluginDescription.name === "") return
							pluginsDescriptions.push(nPluginDescription)
						})
						cb(pluginsDescriptions)
					} else {
						notifLog(`${errorStr}: did not find a plugin list`)
					}
				} catch (error) {
					notifLog(`${errorStr} ${JSON.stringify(error)}, url: ${mktUrl}`)
				}
			}, {disableCache:true})
		})
	}


	//
	// EXPORTS
	//
	const api: iPluginsApi = {
		list: listPlugins,
		get: getPlugin,
		cronCache: {
			set: setCronVars
		},
		marketplace: {
			fetchList: fetchMarketPlaceList
		}
	}
	api.documentation = () => extractDocumentation( api, "api.plugins", "client/src/hooks/api/plugin.api.hook.tsx" )

	return api
}
