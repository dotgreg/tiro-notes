import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

export interface iCommandApi {
	exec: (
		commandString: string,
		cb: (resCmd: string) => void
	) => void
}


//
// API EXPORT 
//

export const useCommandApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[COMMAND API]`

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getCommandExec', data => {
			p.eventBus.notify(data.idReq, data.resultCommand)
		})
	}, [])

	const exec: iCommandApi['exec'] = (commandString, cb) => {
		const idReq = genIdReq(`command-exec-`);
		p.eventBus.subscribe(idReq, resCmd => {
			resCmd = resCmd
			cb(resCmd)
		});

		// start request
		clientSocket2.emit('askCommandExec', {
			commandString,
			token: getLoginToken(),
			idReq
		})
	}

	const api: iCommandApi = { exec }
	return api
}
