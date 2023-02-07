import React, { useEffect, useRef } from 'react';
import { getFolderPath } from '../../../../shared/helpers/filename.helper';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { iFile } from '../../../../shared/types.shared';
import { onFileDeleteFn } from '../../components/windowGrid/WindowGrid.component';
import { getFolderParentPath } from '../../managers/folder.manager';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getClientApi2, iApiEventBus } from './api.hook';
import { iBrowserApi } from './browser.api.hook';
import { iNoteHistoryApi } from './history.api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';


//
// INTERFACES
//
export type iGetFilesCb = (files: iFile[]) => void

export interface iFileApi {
	/**
	 * Fetch the content of a note from its absolute link
	 * noteLink should be relative from tiro folder 
	 */
	getContent: (
		noteLink: string,
		cb: (noteContent: string) => void,
		options?: {
			onError?: Function
		}
	) => void
	saveContent: (noteLink: string, content: string,
		options?: { withMetas?: boolean, history?: boolean }
	) => void
	delete: (file: iFile, cb: iGetFilesCb) => void
	move: iMoveApi['file']
	create: (folderPath: string, cb: iGetFilesCb) => void
}


export const useFileApi = (p: {
	eventBus: iApiEventBus
	historyApi: iNoteHistoryApi
}) => {
	const h = `[FILE API] 005363 `

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getFileContent', data => {
			if (data.error) {
				p.eventBus.notify(data.idReq, { error: data.error })
			} else {
				let filterRes = filterMetaFromFileContent(data.fileContent)
				p.eventBus.notify(data.idReq, { content: filterRes.content })
			}
		})
	}, [])

	//
	// FUNCTIONS
	// 

	// 1. GET CONTENT
	const getFileContent: iFileApi['getContent'] = (
		noteLink,
		cb,
		options
	) => {
		// console.log(`${h} get file content ${noteLink}`);
		const filePath = noteLinkToPath(noteLink);
		const idReq = genIdReq('get-file-content');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, answer => {
			if (answer.error && options && options.onError) options.onError(answer.error)
			else if (answer.error && (!options || !options.onError)) cb(answer.error)
			else if (!answer.error) cb(answer.content)
		});
		// 2. emit request 
		clientSocket2.emit('askForFileContent', {
			filePath,
			token: getLoginToken(),
			idReq
		})
	}


	// 2. SET CONTENT
	const lastNoteWHistory = useRef('');
	const saveFileContent: iFileApi['saveContent'] = (noteLink, content, options) => {

		const history = (options && options.history) ? options.history : false
		const withMetas = (options && options.withMetas) ? options.withMetas : true

		const filePath = noteLinkToPath(noteLink);
		clientSocket2.emit('saveFileContent', {
			filePath, newFileContent: content,
			// options: optsApi,
			token: getLoginToken(),
		})

		if (history) {
			if (noteLink !== lastNoteWHistory.current) {
				getClientApi2().then(api => {
					const browserFolder = api.ui.browser.folders.current.get
					const currFolder = getFolderPath(noteLink)
					if (browserFolder === currFolder) {

						// update browser list if same path than edited file
						let fileTitle = ""
						const aWindow = api.ui.windows.active.get()
						if (aWindow) { fileTitle = aWindow.content.file?.name || "" }

						api.ui.browser.goTo(browserFolder, fileTitle)
					}
				})
			}
			p.historyApi.intervalSave(noteLink, content)
			lastNoteWHistory.current = noteLink
		}
	}

	// 3. DELETE
	const deleteFile: iFileApi['delete'] = (file, cb) => {
		const idReq = genIdReq('delete-file');
		console.log(`${h} delete file ${file.path}`);
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('onFileDelete', { filepath: file.path, idReq, token: getLoginToken() })
	}

	// 4. CREATE
	const createFile: iFileApi['create'] = (folderPath, cb) => {
		const idReq = genIdReq('create-file');
		console.log(`${h} create file in ${folderPath}`);
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('createNote', { folderPath, idReq, token: getLoginToken() })
	}





	// IMPORTS
	const moveApi = useMoveApi({ eventBus: p.eventBus });


	//
	// EXPORTS
	//
	const fileApi: iFileApi = {
		getContent: getFileContent,
		saveContent: saveFileContent,
		delete: deleteFile,
		move: moveApi.file,
		create: createFile,
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

