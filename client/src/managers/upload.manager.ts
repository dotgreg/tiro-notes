import { debounce } from "lodash";
import { getApi } from "../hooks/api/api.hook";
import { iUploadedFileInfos } from "../hooks/api/upload.api.hook";
import { getLoginToken } from "../hooks/app/loginToken.hook";
import { clientSocket, clientSocket2 } from "./sockets/socket.manager";

export interface iUploadedFile {
	name: string
	path: string
}

var siofu = require("socketio-file-upload");

//
// MAIN UPLOAD FUNCTION
//
const uploadsToInsert:{curr: iUploadedFileInfos[]} = { curr: [] }
const debounceInsertUploads = debounce((windowId:string) => {
	console.log(`[UPLOAD] inserting ${uploadsToInsert.curr.length} files after debounce`)
	getApi(api => {
		api.ui.note.editorAction.dispatch({
			type: "insertText", 
			insertPos: "currentLineStart",
			insertText: uploadsToInsert.curr.map(f => `![${f.name}](${f.path})`).join("\n"),
			windowId: windowId
		})	
		uploadsToInsert.curr = []
	})
}, 1000)

export const uploadFileToEditor = (p:{fileToUpload: File, folder:string, windowId:string}) => {
	console.log("[UPLOAD] FILE TO EDITOR started", p.fileToUpload)
	const { fileToUpload, folder, windowId } = { ...p }
	getApi(api => {
		api.upload.uploadFile({
			file: fileToUpload,
			folderPath: folder,
			onSuccess: nUpFile => {
				uploadsToInsert.curr.push(nUpFile)
				debounceInsertUploads(windowId)
				// setUploadedFile(nUpFile)
				// const fileMdStr = `![${nUpFile.name}](${nUpFile.path})\n`
				// console.log("inserting file", fileMdStr)
				// api.ui.note.editorAction.dispatch({
				// 	type: "insertText", 
				// 	insertPos: "currentLineStart",
				// 	insertText: fileMdStr,
				// 	windowId: windowId
				// })	
			},
			onProgress: res => {
				api.ui.note.editorAction.dispatch({
					type: "uploadProgress", 
					uploadProgress: res,
					windowId: windowId
				})	
				// const nCtx = cloneDeep(gridContext)
				// delete nCtx.upload.file
				// console.log("[UPLOAD] progress", res)
				// if(!nCtx.upload.markdownFile) nCtx.upload.markdownFile = mdFile
				// nCtx.upload.progress = res
				// setGridContext(nCtx)
				// console.log(12333, res)
				// setUploadPercent(res)
			}
		})
	})
}

//
// MAIN UPLOAD FUNCTION
//

export const uploadFileInt = (p: {
	file: File,
	path: string,
	idReq: string,
	onProgress: Function
}) => {
	const { file, path, idReq, onProgress } = { ...p }
	var instanceFile = new siofu(clientSocket);
	instanceFile.addEventListener("start", event => {
		event.file.meta.idReq = idReq
		event.file.meta.path = path
		event.file.meta.token = getLoginToken()
	});
	instanceFile.addEventListener("progress", (event: any) => {
		const percent = Math.round((event.bytesLoaded / event.file.size) * 100)
		onProgress(percent);
	})
	instanceFile.submitFiles([file]);
}

