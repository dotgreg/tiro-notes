import { backConfig } from "../config.back";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { generateUniqueAbsFilePath } from "./move.manager";
import { moveFile, upsertRecursivelyFolders } from "./fs.manager";
import { ServerSocketManager } from "./socket.manager"
import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { rescanEmitDirForFiles } from "./dir.manager";
import { debounce } from "lodash";
import { log } from "./log.manager";
import { getUserFromToken } from "./loginToken.manager";

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
		if (!e.file) return log(`file could not be uploaded`)
		let finfos = getFileInfos(e.file.pathName)
		const idReq = (e.file.meta && e.file.meta.idReq) ? e.file.meta.idReq : false
		const pathToUpload = (e.file.meta && 'path' in e.file.meta) ? e.file.meta.path : false


		const loginToken = (e.file.meta && e.file.meta.token) ? e.file.meta.token : false
		let user = getUserFromToken(loginToken)
		let hasEditorRole = user && user.roles.includes("editor")

		if (!idReq || !pathToUpload) return console.log('[UPLOAD] NO IDREQ/PATHTOUPLOAD, cancelling upload', JSON.stringify(e.file.meta), idReq, pathToUpload)

		if (!hasEditorRole) return console.log('[UPLOAD] no editor role, cancelling upload', JSON.stringify({ meta: e.file.meta, user }), pathToUpload)

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
