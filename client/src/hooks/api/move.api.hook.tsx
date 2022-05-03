import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { iApiEventBus } from './api.hook';

//
// INTERFACES
//
export interface iMoveApi {
	file: (initPath: string, endPath: string) => void

}

export const useMoveApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// FUNCTIONS
	// 
	const moveFile: iMoveApi['file'] = (initPath, endPath) => {
		console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
		//clientSocket2.emit('moveFile', { initPath, endPath, token: getLoginToken() })
	}

	//
	// EXPORTS
	//
	const api: iMoveApi = {
		file: moveFile
	}

	return api
}

