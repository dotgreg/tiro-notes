import React, { useEffect, useRef } from 'react';
import { iFile, iFilePreview } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';

//
// INTERFACES
//

	export interface FilesPreviewObject { [path: string]: iFilePreview }
export interface iFilesApi {
	get: (
		folderPath: string,
		cb: (files: iFile[]) => void
	) => void
	getPreviews: (
		filesPath: string[],
		cb: (previews: iFilePreview[]) => void
	) => void
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

		clientSocket2.on('getFilesPreview', data => {
			p.eventBus.notify(data.idReq, data.filesPreview)
		})
	}, [])


	//
	// FUNCTIONS
	// 

	// get files list
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


	// get files list preview
	const getFilesPreview: iFilesApi['getPreviews'] = (filesPath, cb) => {
		console.log(`[CLIENT API] 002104 get files previews for ${filesPath.length} files`);
		const idReq = genIdReq('get-files-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askFilesPreview', {
			filesPath,
			idReq,
			token: getLoginToken()
		})
	}



	//
	// EXPORTS
	//
	const api: iFilesApi = {
		get: getFiles,
		getPreviews: getFilesPreview
	}

	return api
}
