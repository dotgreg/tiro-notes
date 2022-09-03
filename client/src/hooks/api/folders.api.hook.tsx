import React, { useEffect, useRef } from 'react';
import { iFolder } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';

//
// INTERFACES
//

/**
 * take list of folders and returns their subfolders
 */
export interface iFoldersApi {
	/**
	 * take list of folders and returns their subfolders
	 */
	get: (
		folderPaths: string[],
		cb: (data: { folders: iFolder[], pathBase: string }) => void
	) => void
	move: iMoveApi['folder']
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

	// 
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

	const moveApi = useMoveApi({ eventBus: p.eventBus });


	//
	// EXPORTS
	//

	return {
		get: getFolders,
		move: moveApi.folder,
	}
}
