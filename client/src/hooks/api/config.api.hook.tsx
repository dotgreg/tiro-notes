import React, { useEffect, useRef } from 'react';
import { iBackConfig, iPlatform} from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getApi, iApiEventBus } from './api.hook';
import { get } from 'http';

//
// INTERFACES
//
export interface iConfigApi {

	get: (
		cb: (config: iBackConfig) => void
	) => void
	getPlatform: () => iPlatform
	getSync: () => iBackConfig | undefined
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

	const configSyncRef = useRef<iBackConfig | undefined>(undefined);
	useEffect(() => {
		getConfig(config => {
			configSyncRef.current = config
		})
	}, [])

	//
	// EXPORTS
	//
	const api: iConfigApi = {
		get: getConfig,
		getPlatform,
		getSync: () => configSyncRef.current
	}

	return api
}
