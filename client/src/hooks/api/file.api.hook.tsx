import React, { useEffect, useRef } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { onFileDeleteFn } from '../../components/windowGrid/WindowGrid.component';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';


//
// INTERFACES
//
export interface iFileApi {
	getContent: (noteLink: string, cb: (noteContent: string) => void) => void
	saveContent: (noteLink: string, content: string) => void
	delete: onFileDeleteFn
	move: iMoveApi['file']
}


export const useFileApi = (p: {
	eventBus: iApiEventBus
}) => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getFileContent', data => {
			let filterRes = filterMetaFromFileContent(data.fileContent)
			p.eventBus.notify(data.idReq, filterRes.content)
		})
	}, [])

	//
	// FUNCTIONS
	// 

	// 1. GET CONTENT
	const apiGetFileContent: iFileApi['getContent'] = (noteLink, cb) => {
		console.log(`[CLIENT API] 005363 get file content ${noteLink}`);
		const filePath = noteLinkToPath(noteLink);
		const idReq = genIdReq('get-file-content');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askForFileContent', {
			filePath,
			token: getLoginToken(),
			idReq
		})
	}


	// 2. SET CONTENT
	const apiSaveFileContent: iFileApi['saveContent'] = (
		noteLink: string,
		content: string
	) => {
		console.log(`[CLIENT API] 005363 save file content ${noteLink}`);
		const filePath = noteLinkToPath(noteLink);
		clientSocket2.emit('saveFileContent', {
			filePath, newFileContent: content,
			token: getLoginToken()
		})
	}

	// 3. DELETE
	const deleteFile: iFileApi['delete'] = filepath => {
		console.log(`[CLIENT API] 005363 delete file ${filepath}`);
		clientSocket2.emit('onFileDelete', { filepath, token: getLoginToken() })
	}


	// IMPORTS
	const moveApi = useMoveApi({ eventBus: p.eventBus });


	//
	// EXPORTS
	//
	const fileApi: iFileApi = {
		getContent: apiGetFileContent,
		saveContent: apiSaveFileContent,
		delete: deleteFile,
		move: moveApi.file
	}

	return fileApi
}

//
// SUPPORT FUNCTIONS
//

const noteLinkToPath = (noteLink: string): string => {
	const subst = `$2/$1`;
	return noteLink.replace(regexs.linklink, subst);
}

