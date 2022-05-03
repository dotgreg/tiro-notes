import React, { useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

//
// INTERFACES
//
export interface iFilesApi {
	get: (folderPath: string, cb: (files: iFile[]) => void) => void
}

export const useFilesApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getFiles', data => {
			p.eventBus.notify(data.idReq, data.files)
		})
	}, [])

	//
	// FUNCTIONS
	// 
	const getFiles: iFilesApi['get'] = (folderPath, cb) => {
		console.log(`[CLIENT API] 002104 get files ${folderPath}`);
		const idReq = genIdReq('get-files-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askForFiles', {
			folderPath,
			token: getLoginToken(),
			idReq
		})
	}

	//
	// EXPORTS
	//
	const api: iFilesApi = {
		get: getFiles
	}

	return api
}
