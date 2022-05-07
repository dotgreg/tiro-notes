import React, { useEffect, useRef } from 'react';
import { iFolder } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

//
// INTERFACES
//

export interface iFoldersApi {
	get: (
		folderPaths: string[],
		cb: (folders: iFolder[], pathBase: string) => void
	) => void
}

export const useFoldersApi = (p: {
	eventBus: iApiEventBus
}): iFoldersApi => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getFoldersScan', data => {
			p.eventBus.notify(data.idReq, {
				folders: data.folders,
				pathBase: data.pathBase
			})
		})
	}, [])


	//
	// FUNCTIONS
	// 

	// get folders list scan
	const getFolders: iFoldersApi['get'] = (folders, cb) => {
		console.log(`[FOLDERS API] 002104 get folders ${folders}`);
		const idReq = genIdReq('get-folders-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askFoldersScan', {
			foldersPaths: folders,
			token: getLoginToken(),
			idReq
		})
	}


	//
	// EXPORTS
	//

	return {
		get: getFolders
	}
}
