import React, { useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

//
// INTERFACES
//
export interface iMoveApi {
	file: (
		initPath: string,
		endPath: string,
		cb?: (files: iFile[]) => void
	) => void

}

export const useMoveApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// FUNCTIONS
	// 
	const moveFile: iMoveApi['file'] = (
		initPath,
		endPath,
		cb
	) => {
		const idReq = genIdReq('move-file-get-files');
		// 1. add a listener function, we are already listening to get-files w files.api.hook.ts
		p.eventBus.subscribe(idReq, cb ? cb : () => { });
		// 2. move file
		console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
		clientSocket2.emit('moveFile', { initPath, endPath, idReq, token: getLoginToken() })
	}

	//
	// EXPORTS
	//
	const api: iMoveApi = {
		file: moveFile
	}

	return api
}

