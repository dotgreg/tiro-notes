import { uniqWith } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { iApiEventBus } from './api.hook';


//
// INTERFACES
//
type iWatchUpdate =  { filePath: string, fileContent: string }
export interface iWatchApi {
	/**
	 * Watch for file changes
	 */
	file: (
		notePath: string,
		cb: (res:iWatchUpdate) => void,
	) => void
}

// let watchCounter

export const useWatchApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[WATCH API]`
	const uniqueIdReq = `watch-api-unique-id-request`

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('onNoteWatchUpdate', data => {
			p.eventBus.notify(uniqueIdReq, data)
		})
	}, [])

	//
	// FUNCTIONS
	// 

	// 1. GET CONTENT
	const watchFile: iWatchApi['file'] = (noteLink, cb) => {
		// 1. add a PERSISTENT listener function
		p.eventBus.subscribe(uniqueIdReq, answer => {
			if (noteLink === answer.filePath) {
				cb(answer)
			}
		}, { persistent: true });
	}

	//
	// EXPORTS
	//
	const watchApi: iWatchApi = {
		file: watchFile,
	}

	return watchApi
}

