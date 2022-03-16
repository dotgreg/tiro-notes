import { backConfig } from "../config.back";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { generateNewFileName } from "./move.manager";
import { moveFile, upsertRecursivelyFolders } from "./fs.manager";
import { ServerSocketManager } from "./socket.manager"
import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { rescanEmitDirForFiles } from "./dir.manager";
import { debounce } from "lodash";
import { log } from "./log.manager";

var siofu = require("socketio-file-upload");

export let folderToUpload = { value: '' }

export const initUploadFileRoute = async (socket: ServerSocketManager<iApiDictionary>) => {
	// file upload starts listening
	log('[initUploadFileRoute]');

	var uploader = new siofu();
	let initialUploadPath = `${backConfig.dataFolder}/${backConfig.uploadFolder}`
	log(initialUploadPath);

	await upsertRecursivelyFolders(`${initialUploadPath}/`)
	uploader.dir = initialUploadPath;
	uploader.listen(socket);
	uploader.on('start', (e) => {
		log('FILE UPLOAD STARTED', e);
	})
	uploader.on('complete', async (e) => {
		// log('FILE UPLOAD COMPLETED', e);
		if (!e.file) return log(`file could not be uploaded`)
		// e.file.path => is with ../../data 
		let finfos = getFileInfos(e.file.pathName)

		// do modification => namefile to unique ID here
		let oldPath = `${e.file.pathName}`
		let displayName = finfos.filenameWithoutExt.replace('-0', '')
		let newName = `${generateNewFileName(displayName)}.${finfos.extension}`

		let newRelPath = cleanPath(`${backConfig.relativeUploadFolderName}/${newName}`)
		// if md, upload directly in directory
		if (finfos.extension === 'md') newRelPath = cleanPath(`${newName}`)

		let newAbsPath = cleanPath(`${backConfig.dataFolder}/${folderToUpload.value}/${newRelPath}`)
		log({ oldPath, newAbsPath });

		await upsertRecursivelyFolders(newAbsPath)
		await moveFile(oldPath, newAbsPath)

		if (finfos.extension === 'md') {
			// debounce()
			rescanEmitDirForFiles(socket)
		} else {
			socket.emit('getUploadedFile', { name: displayName, path: newRelPath })
		}

	})
}
