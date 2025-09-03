import { cloneDeep, debounce, each } from "lodash-es";
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
// const uploadsToInsert:{curr: iUploadedFileInfos[]} = { curr: [] }
const uploadsToInsert:{curr: {file:iUploadedFileInfos, inserted:boolean}[]} = { curr: [] }

const debounceInsertUploads = debounce((windowId:string) => {
	console.log(`[UPLOAD] inserting ${uploadsToInsert.curr.length} files after debounce`)
	getApi(api => {
		let stringToInsert = ""
		each(uploadsToInsert.curr, (f, i) => {
			if(!f.inserted) {
				// replace [ or ] in name
				let fileName = f.file.name.replace(/\[/g, "").replace(/\]/g, "")
				stringToInsert += `![${fileName}](${f.file.path})\n`
				f.inserted = true
			}
		})
		api.ui.note.editorAction.dispatch({
			type: "insertText", 
			insertPos: "currentLineStart",
			insertText: stringToInsert,
			windowId: windowId
		})	
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
				uploadsToInsert.curr.push({file:nUpFile, inserted:false})
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
	// const file2 = cloneDeep(file)
	// @ts-ignore
	// file.name = file.name + "-woop"

	// newName => image.png > image-YYYY-MM-DD-HHhMMmSS.png
	let newManualName = file.name
	// if file.name is jpg, png, gif, webp, jpeg, svg then modify its name
	const extension = file.name.split('.').pop() 
	if (extension && ['jpg', 'png', 'gif', 'webp', 'jpeg', 'svg'].includes(extension)) {
		const date = new Date()
		const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}h${date.getMinutes()}m-${date.getSeconds()}s`
		const extension = file.name.split('.').pop()
		newManualName = newManualName.replace(`.${extension}`, `-${dateStr}.${extension}`)
	}

	var instanceFile = new siofu(clientSocket);
	instanceFile.addEventListener("start", event => {
		event.file.meta.newManualName = newManualName
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

