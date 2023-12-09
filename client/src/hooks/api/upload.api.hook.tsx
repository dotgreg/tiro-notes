import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { uploadFileInt } from '../../managers/upload.manager';
import { genIdReq, iApiEventBus } from './api.hook';
import { useDebounce } from '../lodash.hooks';
import { each } from 'lodash';
import { notifLog } from '../../managers/devCli.manager';

//
// INTERFACES
//
export interface iFileToUpload {
	file: File,
	folderPath: string,
	onSuccess?: onUploadSuccessFn,
	onProgress?: onUploadProgressFn
}
export interface iUploadApi {
	uploadFile: (
		p: iFileToUpload, 
		// for CTAG call
		cb?: onUploadCallback
	) => void
}

export type iUploadedFileInfos = { path: string, name: string }
export type onUploadSuccessFn = (p: iUploadedFileInfos) => void
export type onUploadProgressFn = (percentUpload: number) => void
export type onUploadCallback = (p:{
	message: "progress" | "success", 
	succesObj?: { path: string, name: string }, 
	percentUpload?:number
})   => void

export const useUploadApi = (p: {
	eventBus: iApiEventBus
}) => {

	const { eventBus } = { ...p }

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getUploadedFile', data => {
			eventBus.notify(data.idReq, data)
		})
	}, [])

	//
	// FUNCTIONS
	// 
	// const uploadFile: iUploadApi['uploadFile'] = (p2, cb) => {
	// 	// console.log(111, "try UPLOAD", p2)
	// 	try {
	// 		const idReq = genIdReq('upload-file');
	// 		// 1. add a listener function
	// 		eventBus.subscribe(idReq, answer => {
	// 			// console.log(123, "SUCCESS UPLOAD", answer)
	// 			delete answer.idReq
	// 			if (p2.onSuccess) p2.onSuccess(answer)
	// 			if (cb) cb({message:"success", succesObj:answer})
	// 		});
	// 		// 2. upload file
	// 		uploadFileInt({
	// 			file: p2.file,
	// 			path: p2.folderPath,
	// 			idReq: idReq,
	// 			onProgress: (percent: number) => { 
	// 				if (p2.onProgress) p2.onProgress(percent)
	// 				// if (cb) cb({message:"progress", percentUpload:percent})
	// 			}
	// 		})
	// 	} catch (error) {
	// 		console.warn(error)
	// 	}
	// }

	const filesToUploadQueue = useRef<{file:iFileToUpload, cb?:Function}[]>([])
	const debouncedBatchUpload = useDebounce(() => {
		if (filesToUploadQueue.current.length < 1) return
		let length = filesToUploadQueue.current.length
		let doneFiles = 0
		notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info")

		each(filesToUploadQueue.current, (uploadItemQueue, index) => {
			setTimeout(() => {
				console.log(`[UPLOAD] starting upload item ${uploadItemQueue.file.file.name}` )
				const p2 = uploadItemQueue.file
				try {
					const idReq = genIdReq('upload-file');
					// 1. add a listener function
					eventBus.subscribe(idReq, answer => {
						// console.log(123, "SUCCESS UPLOAD", answer)
						delete answer.idReq
						if (p2.onSuccess) p2.onSuccess(answer)
						if (uploadItemQueue.cb) uploadItemQueue.cb({message:"success", succesObj:answer})
						doneFiles++
						notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info")
						
					});
					// 2. upload file
					uploadFileInt({
						file: p2.file,
						path: p2.folderPath,
						idReq: idReq,
						onProgress: (percent: number) => { 
							if (p2.onProgress) p2.onProgress(percent)
							// if (cb) cb({message:"progress", percentUpload:percent})
						}
					})
				} catch (error) {
					console.warn(error)
				}
			}, 500 * index)
		})

		filesToUploadQueue.current = []
	}, 500)

	const uploadFile: iUploadApi['uploadFile'] = (p2, cb) => {
		// get all the file uploads requests in an array
		filesToUploadQueue.current.push({file:p2, cb})
		// once the last request is done, debouce the upload process to avoid flooding the server on limited connections
		debouncedBatchUpload()
	}


	//
	// EXPORTS
	//
	const uploadApi = {
		uploadFile,
	}

	return uploadApi
}
