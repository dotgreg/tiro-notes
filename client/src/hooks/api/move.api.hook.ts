import React, { useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { extractDocumentation } from '../../managers/apiDocumentation.manager';

//
// INTERFACES
//
export interface iMoveApi {
	documentation?: () => any
	file: (
		initPath: string,
		endPath: string,
		cb?: (files: iFile[]) => void
	) => void

	folder: (
		initPath: string,
		endPath: string,
		cb?: (res:any) => void
	) => void
}

export const useMoveApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('moveFolderAnswer', data => {
			p.eventBus.notify(data.idReq, data)
		})
	}, [])

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

	api.documentation = () => extractDocumentation( api, "api.move", "client/src/hooks/api/move.api.hook.ts" );

	return api
}

