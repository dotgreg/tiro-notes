import { sortBy } from "lodash"
import { useEffect } from "react"
import { sharedConfig } from "../../../../shared/shared.config"
import { iPlugin, iPluginType } from "../../../../shared/types.shared"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { genIdReq, getApi, iApiEventBus } from "./api.hook"

const h = `[PLUGINS]`
export interface iPluginsApi {
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
	// EXPORTS
	//
	const api: iPluginsApi = {
		list: listPlugins,
		get: getPlugin,
		cronCache: {
			set: setCronVars
		}
	}

	return api
}
