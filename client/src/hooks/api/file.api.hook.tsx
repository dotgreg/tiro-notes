import React, { useEffect, useRef } from 'react';
import { getFolderPath } from '../../../../shared/helpers/filename.helper';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { iFile } from '../../../../shared/types.shared';
import { perf } from '../../managers/performance.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getClientApi2, iApiEventBus } from './api.hook';
import { iNoteHistoryApi } from './history.api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';
import { useDebounce } from '../lodash.hooks';
import { debounce, throttle } from 'lodash-es';
import { addBackMetaToContent, metasObjToHeaderString } from '../../managers/headerMetas.manager';


//
// INTERFACES
//

export type iInsertMethod = "prepend" | "append"
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
	insertContent: (
		noteLink: string,
		content: string,
		options?: {
			insertMethod?: iInsertMethod,
			onError?: Function
		},
		cb?: (res:any) => void,
	) => void
	saveContent: (
		noteLink: string, 
		content: string,
		options?: { 
			withMetas?: iFile, 
			history?: boolean, 
			debounced?: number | false
			withThrottle?: boolean
		},
		cb?: (res:any) => void
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
		clientSocket2.on('onServerTaskFinished', data => {
			p.eventBus.notify(data.idReq, { data })
		})
		clientSocket2.on('getFileContent', data => {
			if (data.error) {
				p.eventBus.notify(data.idReq, { error: data.error })
			} else {
				// let filterRes = filterMetaFromFileContent(data.fileContent)
				p.eventBus.notify(data.idReq, { content: data.fileContent })
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
		const end = perf("getFileContent " + noteLink)
		const filePath = noteLinkToPath(noteLink);
		const idReq = genIdReq('get-file-content');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, answer => {
			if (answer.error && options && options.onError) options.onError(answer.error)
			else if (answer.error && (!options || !options.onError)) cb(answer.error)
			else if (!answer.error) cb(answer.content)
			end()
		});
		// 2. emit request 
		clientSocket2.emit('askForFileContent', {
			filePath,
			token: getLoginToken(),
			idReq
		})
	}





	//
	// 2. SET CONTENT
	//

	// default debounced time for perfs improvements when typing
	const saveDebouncedTime = 500

	// const debouncedFilesContent: {[path:string]: string} = {}
	const lastNoteWHistory = useRef('');

	const saveFileInt =  (noteLink, content, options, cb) => {
		// const end = perf("saveFileContent " + noteLink)
		const history = (options && options.history) ? options.history : false
		const withMetas = (options && options.withMetas) ? options.withMetas : false

		// if withMetas
		// if (withMetas) content = updateMetaHeaderNote(content)
		
		//
		// 2. wait for callback
		const idReq = genIdReq('save-file-content');
		if (cb) {
			// 1. add a listener function
			p.eventBus.subscribe(idReq, answer => {
				if (cb) cb(answer)
			});
		}

		//
		// 1 FILE CREATION
		const filePath = noteLinkToPath(noteLink);
		clientSocket2.emit('saveFileContent', {
			filePath, newFileContent: content,
			// options: optsApi,
			token: getLoginToken(),
			idReq,
			withCb: cb ? true : false
		})

		
		if (history) {
			// console.log("save file hist!")
			if (noteLink !== lastNoteWHistory.current) {
				getClientApi2().then(api => {
					const browserFolder = api.ui.browser.folders.current.get()
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
	const saveFileIntDebounced =  useDebounce((noteLink, content, options, cb) => {
		saveFileInt(noteLink, content, options, cb)
	}, saveDebouncedTime)
	
	//
	// If debounced save asked, first create and store a debounced function for each debounced time, then use that latter one
	//
	const debouncedFuncsRef = useRef({})
	const throttledFuncsRef = useRef({})
	const getFnId = (noteLink, debouncedTime) => `${noteLink}-${debouncedTime}`
	const saveFileIntDebounced2 = (debouncedTime:number, withThrottle:boolean, noteLink, content, options, cb) =>  {
		const fnId = getFnId(noteLink, debouncedTime)
		if (!debouncedFuncsRef.current[fnId]) {
			// console.log("create debouncedFuncs", fnId)
			debouncedFuncsRef.current[fnId] = debounce((noteLink, content, options, cb) => {
				// console.log("debouncedFuncs", debouncedTime, noteLink)
				saveFileInt(noteLink, content, options, cb)
			}, debouncedTime)

			if (withThrottle === true) {
				throttledFuncsRef.current[fnId] = throttle((noteLink, content, options, cb) => {
					console.log("throttledFuncs", debouncedTime, noteLink)
					saveFileInt(noteLink, content, options, cb)
				}, debouncedTime)
			}

		}
		debouncedFuncsRef.current[fnId](noteLink, content, options, cb)
		if (withThrottle === true) throttledFuncsRef.current[fnId](noteLink, content, options, cb)
	}


	const saveFileContent: iFileApi['saveContent'] = (noteLink, content, options, cb) => {
		const debounced = (options && options.debounced) ? options.debounced : false
		const withThrottle = (options && options.withThrottle) ? options.withThrottle : false
		
		const isNoteLinkInsideTiroConfig = noteLink.includes("/.tiro/")
		if (options?.withMetas && !isNoteLinkInsideTiroConfig) {
			const fileInfosForMeta = options?.withMetas
			fileInfosForMeta.modified = Date.now()
			// if date already exists (real date), take it
			const newContentWithMeta = addBackMetaToContent(content, {
				created: fileInfosForMeta.created || Date.now(),
				updated: fileInfosForMeta.modified
			})
			content = newContentWithMeta
		}

		if (debounced) {
			// saveFileIntDebounced(noteLink, content, options, cb)
			saveFileIntDebounced2(debounced, withThrottle,  noteLink, content, options, cb)
		} else {
			saveFileInt(noteLink, content, options, cb)
		}
	}

	const insertContent: iFileApi['insertContent'] = (noteLink, content,  options, cb) => {
		const method = (options && options.insertMethod) ? options.insertMethod : "prepend"
		const insertLogic = (currContent) => {
			let newContent = ""
			if (method === "prepend") newContent = content + currContent
			else newContent = currContent + content
			saveFileContent(noteLink, newContent, {}, (res) => {
				cb && cb(res)
			})
		}
		getFileContent(noteLink, (currentContent) => {
			insertLogic(currentContent)
		}, {
			onError: (err) => {
				// console.error("Error while inserting content", err)
				// options?.onError && options.onError(err)
				console.log("file does not exists, creating it")
				insertLogic("")
			}
		})

	}




	//
	// Send/Receive logic (with chunker if content too large) => NOPE, more a config pb on nginx side
	//
	// const saveFileContentInChunks: iFileApi['saveContent'] = (noteLink, content, options) => {
	// 	if (content.length > 100000) {
	// 		// chunk content in 100k blocks
	// 		// save all contents chunks
	// 		// the first content chunk
	// 	} else {
	// 		return saveFileContent(noteLink, content, options)
	// 	}
	// }
	// const getFileContentInChunks: iFileApi['getContent'] = ( noteLink, cb, options ) => {
	// 	// get the first 
	// }

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
		insertContent: insertContent,
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

