import { isString } from 'lodash-es';
import React, { useEffect, useRef } from 'react';
import { iCommandStreamChunk } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

export interface iCommandApi {
	exec: ( commandString: string, cb: (resCmd: string) => void ) => void
	stream: ( commandString: string, cb: (streamChunk: iCommandStreamChunk) => void ) => void
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
		clientSocket2.on('getCommandExecStream', data => {
			p.eventBus.notify(data.idReq, data.streamChunk)
		})
	}, [])

	
	const exec: iCommandApi['exec'] = (commandString, cb) => {
		console.log(h, 'exec', { commandString })//TO KEEP FOR DEBUG
		const idReq = genIdReq(`command-exec-`);
		p.eventBus.subscribe(idReq, resCmd => {
			if (!isString(resCmd)) resCmd = JSON.stringify(resCmd)
			cb(resCmd)
		}, { persistent: true });

		// start request
		clientSocket2.emit('askCommandExec', {
			commandString,
			token: getLoginToken(),
			idReq
		})
	}
	
	const stream: iCommandApi['stream'] = (commandString, cb) => {
		console.log(h, 'stream', { commandString })//TO KEEP FOR DEBUG
		const idReq = genIdReq(`command-stream-`);
		// 1. add a PERSISTENT listener function
		p.eventBus.subscribe(idReq, answer => {
			cb(answer)
			// unsubscribe when the last chunk is received
			if (answer.isLast) p.eventBus.unsubscribe(idReq)
		}, { persistent: true });

		// 2start request
		clientSocket2.emit('askCommandExecStream', {
			commandString,
			token: getLoginToken(),
			idReq
		})
	}

	const api: iCommandApi = { exec, stream }
	return api
}
