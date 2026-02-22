import React, { useEffect, useRef } from 'react';
import { iBackConfig, iPlatform} from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getApi, iApiEventBus } from './api.hook';
import { get } from 'http';
import { extractDocumentation } from '../../managers/apiDocumentation.manager';

//
// INTERFACES
//
export interface iConfigApi {

	get: (
		cb: (config: iBackConfig) => void
	) => void
	getPlatform: () => iPlatform
	getSync: () => iBackConfig | undefined
	getCustomApiToken: () => string | undefined
	documentation?: () => any
}

export const useConfigApi = (p: {
	eventBus: iApiEventBus,
}) => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getBackendConfig', data => {
			p.eventBus.notify(data.idReq, data.config)
		})
	}, [])


	//
	// FUNCTIONS
	// 

	// get files list
	const getConfig: iConfigApi['get'] = ( cb) => {
		const idReq = genIdReq('get-config-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, config => {
			configSyncRef.current = config
			cb(config)
		});
		// 2. emit request 
		clientSocket2.emit('askBackendConfig', {
			token: getLoginToken(),
			idReq
		})
	}

	const getPlatform: iConfigApi['getPlatform'] = () => {
		return getPlatform()
	}
	const getCustomApiToken: iConfigApi['getCustomApiToken'] = () => {
		return configSyncRef.current?.jsonConfig?.customBackendApiToken
	}

	const configSyncRef = useRef<iBackConfig | undefined>(undefined);
	useEffect(() => {
		// will refresh sync
		getConfig(() => {})
	}, [])

	//
	// EXPORTS
	//
	const api: iConfigApi = {
		get: getConfig,
		getPlatform,
		getCustomApiToken,
		getSync: () => configSyncRef.current
	}
	api.documentation = () => extractDocumentation( api, "api.config", "client/src/hooks/api/config.api.hook.tsx");

	return api
}
