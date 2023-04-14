import { useEffect } from "react"
import { sharedConfig } from "../../../../shared/shared.config"
import { iPlugin } from "../../../../shared/types.shared"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { genIdReq, iApiEventBus } from "./api.hook"

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
		cb:(plugin:iPlugin|null) => void
	) => void 
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

	// get files list
	const listPlugins: iPluginsApi['list'] = (cb, opts) => {
		if (!opts) opts = {}
		if (!opts.noCache) opts.noCache = false
		if (sharedConfig.client.log.socket) console.log(`${h} get plugins`);
		const idReq = genIdReq('get-plugins-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, data => {
			cb(data.plugins, data.scanLog)
		});
		// 2. emit request 
		clientSocket2.emit('askPluginsList', {
			noCache: opts.noCache,
			token: getLoginToken(),
			idReq
		})
	}

	const getPlugin: iPluginsApi['get'] = (name, cb) => {
		listPlugins((plugins,log) => {
			let res = plugins.filter(p => p.name === name)[0] || null
			cb(res)
		})
	}


	//
	// EXPORTS
	//
	const api: iPluginsApi = {
		list: listPlugins,
		get: getPlugin
	}

	return api
}
