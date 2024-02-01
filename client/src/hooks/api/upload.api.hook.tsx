import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { uploadFileInt } from '../../managers/upload.manager';
import { genIdReq, iApiEventBus } from './api.hook';
import { useDebounce } from '../lodash.hooks';
import { each } from 'lodash-es';
import { notifLog } from '../../managers/devCli.manager';
import { deviceType } from '../../managers/device.manager';

//
// INTERFACES
//
export interface iUploadInfos {
	file: File,
	folderPath: string,
	onSuccess?: onUploadSuccessFn,
	onProgress?: onUploadProgressFn
}
export interface iUploadApi {
	uploadFile: (
		p: iUploadInfos, 
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
	// doneFiles++
	// 			notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info")

	const processFileUpload = (uploadInfos: iUploadInfos, cb) => {
		try {
			const idReq = genIdReq('upload-file');
			// 1. add a listener function
			eventBus.subscribe(idReq, answer => {
				// console.log(123, "SUCCESS UPLOAD", answer)
				delete answer.idReq
				if (uploadInfos.onSuccess) uploadInfos.onSuccess(answer)
				if (cb) cb({message:"success", succesObj:answer})
				
				
			});
			// 2. upload file
			uploadFileInt({
				file: uploadInfos.file,
				path: uploadInfos.folderPath,
				idReq: idReq,
				onProgress: (percent: number) => { 
					if (uploadInfos.onProgress) uploadInfos.onProgress(percent)
					// if (cb) cb({message:"progress", percentUpload:percent})
				}
			})
		} catch (error) {
			console.warn(error)
		}
	}

	const filesToUploadQueue = useRef<{uploadInfos:iUploadInfos, cb?:Function}[]>([])

	const debouncedBatchUpload = useDebounce(async () => {
		if (filesToUploadQueue.current.length < 1) return
		let length = filesToUploadQueue.current.length
		let doneFiles = 0
		notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info")

		if (deviceType() === "mobile") {
			// on mobile, upload one by one
			for (let i = 0; i < filesToUploadQueue.current.length; i++) {
				await new Promise((resolve, reject) => {
					const uploadObj = filesToUploadQueue.current[i]
					console.log("uploadObj", uploadObj)
					if (!uploadObj) return reject(void 0)
					console.log(`[UPLOAD] starting upload item ${uploadObj.uploadInfos.file.name}` )
					processFileUpload(uploadObj.uploadInfos, res => {
						doneFiles++
						let timeoutNotif = doneFiles === length ? 5 : 60
						notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info", timeoutNotif)
						if (uploadObj && uploadObj.cb) uploadObj.cb(res)
						resolve(void 0)
					})
				})
			}
			filesToUploadQueue.current = []
		} else {
			// on desktop, upload with slight delay in between each file
			each(filesToUploadQueue.current, (uploadItemQueue, index) => {
				setTimeout(() => {
					console.log(`[UPLOAD] starting upload item ${uploadItemQueue.uploadInfos.file.name}` )
					processFileUpload(uploadItemQueue.uploadInfos, res => {
						doneFiles++
						let timeoutNotif = doneFiles === length ? 5 : 60
						notifLog(`Files Uploaded: \n ${doneFiles}/${length}`, "upload-info", timeoutNotif)
						if (uploadItemQueue.cb)	uploadItemQueue.cb(res)
					})
				}, 500 * index)
			})
			filesToUploadQueue.current = []
		}



	}, 500)

	const uploadFile: iUploadApi['uploadFile'] = (p2, cb) => {
		let length = filesToUploadQueue.current.length
		notifLog(`Starting Uploading ${length} Files`, "upload-info")
		// get all the file uploads requests in an array
		filesToUploadQueue.current.push({uploadInfos:p2, cb})
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
