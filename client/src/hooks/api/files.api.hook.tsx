import React, { useEffect, useRef } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile, iFilePreview } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { iSearchApi } from './search.hook.api';
import { iStatusApi } from './status.api.hook';
import { extractDocumentation } from '../../managers/apiDocumentation.manager';

//
// INTERFACES
//

export interface FilesPreviewObject { [path: string]: iFilePreview }

export interface iFilesApi {
	documentation?: () => any

	get: (
		folderPath: string,
		cb: (files: iFile[], folderPath:string) => void
	) => void

	getPreviews: (
		filesPath: string[],
		cb: (previews: iFilePreview[]) => void
	) => void

	search: iSearchApi['files']['search']
}

export const useFilesApi = (p: {
	eventBus: iApiEventBus,
	searchApi: iSearchApi,
	statusApi: iStatusApi
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
		if (sharedConfig.client.log.socket) console.log(`[CLIENT API] get files ${folderPath}`);
		const idReq = genIdReq('get-files-');
		p.statusApi.searching.set(true)
		// 1. add a listener function
		p.eventBus.subscribe(idReq, (nFiles:iFile[]) => {
			p.statusApi.searching.set(false)
			// filter files   f.extension !== 'md'
			nFiles = nFiles.filter(f => f.extension === 'md')
			cb(nFiles, folderPath)
		});
		// 2. emit request 
		clientSocket2.emit('askForFiles', {
			folderPath,
			token: getLoginToken(),
			idReq
		})
	}


	// get files list preview
	const getFilesPreview: iFilesApi['getPreviews'] = (filesPath, cb) => {
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
		getPreviews: getFilesPreview,
		search: p.searchApi.files.search
	}
	api.documentation = () => extractDocumentation( api, "api.files", "client/src/hooks/api/files.api.hook.tsx");

	return api
}
