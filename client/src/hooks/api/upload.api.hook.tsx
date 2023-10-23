import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { uploadFileInt } from '../../managers/upload.manager';
import { genIdReq, iApiEventBus } from './api.hook';

//
// INTERFACES
//
export interface iUploadApi {
	uploadFile: (
		p: {
			file: File,
			folderPath: string,
			onSuccess?: onUploadSuccessFn
			onProgress?: onUploadProgressFn
		}, 
		// for CTAG call
		cb?: onUploadCallback
	) => void
}

export type onUploadSuccessFn = (p: { path: string, name: string }) => void
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
	const uploadFile: iUploadApi['uploadFile'] = (p2, cb) => {
		// console.log(111, "try UPLOAD", p2)
		try {
			const idReq = genIdReq('upload-file');
			// 1. add a listener function
			eventBus.subscribe(idReq, answer => {
				// console.log(123, "SUCCESS UPLOAD", answer)
				delete answer.idReq
				if (p2.onSuccess) p2.onSuccess(answer)
				if (cb) cb({message:"success", succesObj:answer})
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
	}


	//
	// EXPORTS
	//
	const uploadApi = {
		uploadFile,
	}

	return uploadApi
}
