import { clientSocket2 } from "../sockets/socket.manager";
import { uploadFileInt } from "../upload.manager";
import { clientApiEventsBus, genIdReq } from "./api.manager";

//
// INIT LISTENER
//
export const initUploadApi = () => {
	clientSocket2.on('getUploadedFile', data => {
		clientApiEventsBus.addPermanentListener(data.idReq, data)
	})
}

//
// used function
//
const uploadFile: iUploadApi['uploadFile'] = p => {
	const idReq = genIdReq('upload-file');
	// 1. add a listener function
	clientApiEventsBus.triggerOnce(idReq, answer => {
		delete answer.idReq
		p.onSuccess(answer)
	});
	// 2. upload file
	uploadFileInt({
		file: p.file,
		path: p.folderPath,
		idReq: idReq,
		onProgress: (percent: number) => { if (p.onProgress) p.onProgress(percent) }
	})
}

//
// EXPORTS
//
export const uploadApi = {
	uploadFile,
}
export interface iUploadApi {
	uploadFile: (p: {
		file: File,
		folderPath: string,
		onSuccess: onUploadSuccessFn
		onProgress?: onUploadProgressFn
	}) => void
}

export type onUploadSuccessFn = (p: { path: string, name: string }) => void
export type onUploadProgressFn = (percentUpload: number) => void
