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

	folder: (
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
		p.eventBus.subscribe(idReq, cb ? cb : () => { });
		console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
		clientSocket2.emit('moveFile', { initPath, endPath, idReq, token: getLoginToken() })
	}

	const moveFolder: iMoveApi['folder'] = (
		initPath,
		endPath,
		cb
	) => {
		const idReq = genIdReq('move-folder-get-files');
		p.eventBus.subscribe(idReq, cb ? cb : () => { });
		console.log(`[MOVEFOLDER] ${initPath} -> ${endPath}`);
		clientSocket2.emit('moveFolder', { initPath, endPath, idReq, token: getLoginToken() })
	}

	//
	// EXPORTS
	//
	const api: iMoveApi = {
		file: moveFile,
		folder: moveFolder
	}

	return api
}

