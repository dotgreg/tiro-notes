import { backConfig } from "../config.back";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { generateUniqueAbsFilePath } from "./move.manager";
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
	// log('[initUploadFileRoute]');

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
		//console.log(2222, JSON.stringify(e.file));
		const idReq = (e.file.meta && e.file.meta.idReq) ? e.file.meta.idReq : false
		const pathToUpload = (e.file.meta && 'path' in e.file.meta) ? e.file.meta.path : false
		if (!idReq || !pathToUpload) return console.log('[UPLOAD] NO IDREQ/PATHTOUPLOAD, cancelling upload', JSON.stringify(e.file.meta), idReq, pathToUpload)

		// do modification => namefile to unique ID here
		let oldPath = `${e.file.pathName}`
		let displayName = finfos.filenameWithoutExt.replace('-0', '')

		// console.log(444, finfos);
		// let newName = `${generateNewFileName(displayName)}.${finfos.extension}`
		// let uncheckedNewAbsPath = cleanPath(`${backConfig.dataFolder}/${pathToUpload}/${backConfig.relativeUploadFolderName}/${finfos.filename}`)
		// let checkedNewAbsPath = generateUniqueFileName(uncheckedNewAbsPath)
		// let newRelPath = cleanPath(`${backConfig.relativeUploadFolderName}/${newName}`)

		// if md, upload directly in directory
		let newAbsFolderPath = cleanPath(`${backConfig.dataFolder}/${pathToUpload}/`)
		let uncheckedNewRelPath = finfos.extension === 'md' ? `${finfos.filename}` : `${backConfig.relativeUploadFolderName}/${finfos.filename}`

		let uncheckedNewAbsPath = cleanPath(`${newAbsFolderPath}${uncheckedNewRelPath}`)
		let checkedNewAbsPath = generateUniqueAbsFilePath(uncheckedNewAbsPath)

		let checkedNewRelPath = checkedNewAbsPath.replace(newAbsFolderPath, '')

		log({ oldPath, checkedNewAbsPath });

		await upsertRecursivelyFolders(checkedNewAbsPath)
		await moveFile(oldPath, checkedNewAbsPath)

		if (finfos.extension === 'md') {
			// debounce()
			rescanEmitDirForFiles(socket)
		} else {
			socket.emit('getUploadedFile', { name: displayName, path: checkedNewRelPath, idReq })
		}

	})
}
