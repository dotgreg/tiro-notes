import React, { useEffect, useRef } from 'react';
import { cleanPath } from '../../../../shared/helpers/filename.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFolder } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import {  askFolderDelete,  iFolderDeleteFn } from './browser.api.hook';
import { iMoveApi, useMoveApi } from './move.api.hook';

//
// INTERFACES
//

/**
 * take list of folders and returns their subfolders
 */
export interface iFoldersApi {
	/**
	 * take list of folders and returns their subfolders
	 */
	get: (
		folderPaths: string[],
		cb: (data: { folders: iFolder[], pathBase: string, folderPaths: string[] }) => void,
		options?: {
			depth?: number
		}
	) => void
	move: iMoveApi['folder']
	create: (
		newFolderPath: string, 
		cb?:(status:string) => void
	) => void,
	delete: iFolderDeleteFn,
}

export const useFoldersApi = (p: {
	eventBus: iApiEventBus
}): iFoldersApi => {

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getFoldersScan', data => {
			p.eventBus.notify(data.idReq, {
				folders: data.folders,
				pathBase: data.pathBase
			})
		})
		clientSocket2.on('onServerTaskFinished', data => {
			p.eventBus.notify(data.idReq,data.status)
		})
	}, [])


	//
	// FUNCTIONS
	// 

	// 
	const getFolders: iFoldersApi['get'] = (folders, cb, options) => {
		if (sharedConfig.client.log.socket) console.log(`[FOLDERS API] get folders `, folders, options);
		const idReq = genIdReq('get-folders-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, data => {
			let nData = { ...data }
			nData.folderPaths = folders
			cb(nData)
		});
		// 2. emit request 
		clientSocket2.emit('askFoldersScan', {
			foldersPaths: folders,
			depth: options?.depth || 0,
			token: getLoginToken(),
			idReq
		})
	}

	// get all subfolders recursively starting by root folder
	// const getAllFolders: iFoldersApi['getAll'] = (cb) => {
	// 	let startTime = Date.now()
	// 	let folders: string[] = []
	// 	let counter = { toScan: 0, scanned: 0 }
	// 	const recGetFolders = (parentPath: string, cb: (data: { folders: iFolder[], pathBase: string, folderPaths: string[] }) => void) => {
	// 		console.log(`[getAllFolders]`, parentPath, Date.now() - startTime, "ms");
	// 		getFolders([parentPath], data => {
	// 			folders.push(parentPath)
	// 			console.log(110, data)
	// 			// folders = folders.concat(data.folders)
	// 			if (data.folders.length > 0) {
	// 				counter.toScan += data.folders.length
	// 				data.folders.forEach(folder => {
	// 					if (folder.children) {
	// 						counter.toScan += folder.children.length
	// 						folder.children.forEach(child => {
	// 							folders.push(child.path)
	// 							console.log(111, child.path, folders)
	// 							if (parentPath !== child.path) recGetFolders(child.path, cb)
	// 							counter.scanned++
	// 							console.log(112, counter.toScan, counter.scanned)
	// 						})
	// 					}
	// 					console.log(113, counter.toScan, counter.scanned)
	// 					counter.scanned++

	// 				})
	// 			} else {
	// 				// cb({ folders, pathBase: data.pathBase, folderPaths: [parentPath] })
	// 			}
	// 		})
	// 	}
	// 	recGetFolders("/", cb)
	// }

	const moveApi = useMoveApi({ eventBus: p.eventBus });

	const askFolderCreate: iFoldersApi['create'] = (newFolderPath, cb) => {
		console.log(`[askFolderCreate]`, newFolderPath);
		const idReq = genIdReq('create-folder-');
		newFolderPath = cleanPath(newFolderPath)

		// 1. add a listener function
		if (cb) {
			p.eventBus.subscribe(idReq, data => {
				cb(data)
			});
		}
		// 2. emit request 
		clientSocket2.emit('askFolderCreate', { newFolderPath, token: getLoginToken(), idReq })
	}


	//
	// EXPORTS
	//

	return {
		get: getFolders,
		move: moveApi.folder,
		create: askFolderCreate,
		delete: askFolderDelete
	}
}
