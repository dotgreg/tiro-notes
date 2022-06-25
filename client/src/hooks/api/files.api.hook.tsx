import React, { useEffect, useRef } from 'react';
import { iFile, iFilePreview } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { iSearchApi } from './search.hook.api';
import { iStatusApi } from './status.api.hook';

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

	getSuggestions: (
		folderPath: string,
		cb: (suggestions: string[]) => void
	) => void

	search: iSearchApi['files']['search']
}
const h = `[CLIENT API] 002104`

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

		clientSocket2.on('getSuggestions', data => {
			p.eventBus.notify(data.idReq, data.suggestions)
		})
	}, [])


	//
	// FUNCTIONS
	// 

	// get files list
	const getFiles: iFilesApi['get'] = (folderPath, cb) => {
		console.log(`${h} get files ${folderPath}`);
		const idReq = genIdReq('get-files-');
		p.statusApi.searching.set(true)
		// 1. add a listener function
		p.eventBus.subscribe(idReq, nFiles => {
			p.statusApi.searching.set(false)
			cb(nFiles)
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
		console.log(`${h} get files previews for ${filesPath.length} files`);
		const idReq = genIdReq('get-files-preview-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askFilesPreview', {
			filesPath,
			idReq,
			token: getLoginToken()
		})
	}

	// get files suggestions for suggestBar
	const getFolderSuggestions: iFilesApi['getSuggestions'] = (folderPath, cb) => {
		console.log(`${p} get suggestions files for forder "${folderPath}"`);
		const idReq = genIdReq('get-files-suggestions-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askSuggestions', {
			folder: folderPath,
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
		search: p.searchApi.files.search,
		getSuggestions: getFolderSuggestions,
	}

	return api
}
