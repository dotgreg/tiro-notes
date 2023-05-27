import { iApiDictionary } from "../../shared/apiDictionary.type";
import { backConfig } from "./config.back";
import { createDir, fileNameFromFilePath, scanDirForFiles, scanDirForFolders } from "./managers/dir.manager";
import { createFolder, deleteFolder, downloadFile, fileExists, moveFile, openFile, prependToFile, saveFile, upsertRecursivelyFolders } from "./managers/fs.manager";
import { analyzeTerm, searchWithRipGrep } from "./managers/search/search-ripgrep.manager";
import { dateId, formatDateHistory, formatDateNewNote } from "./managers/date.manager";
import { focusOnWinApp } from "./managers/win.manager";
import { debouncedFolderScan, moveNoteResourcesAndUpdateContent } from "./managers/move.manager";
import { folderToUpload } from "./managers/upload.manager";
import { iFile, iFolder, iPlugin } from "../../shared/types.shared";
import { getFilesPreviewLogic } from "./managers/filePreview.manager";
import { processClientSetup, updateSetupJsonParam } from "./managers/configSetup.manager";
import { restartTiroServer } from "./managers/serverRestart.manager";
import { checkUserPassword, getUserToken } from "./managers/loginToken.manager";
import { ServerSocketManager } from './managers/socket.manager'
import { log } from "./managers/log.manager";
import { debounceCleanHistoryFolder } from "./managers/history.manager";
import { getFolderPath } from "./managers/path.manager";
import { searchWord } from "./managers/search/word.search.manager";
import { ioServer } from "./server";
import { regexs } from "../../shared/helpers/regexs.helper";
import { execString } from "./managers/exec.manager";
import { getFileInfos } from "../../shared/helpers/filename.helper";
import { getSocketClientInfos, security } from "./managers/security.manager";
import { scanPlugins } from "./managers/plugins.manager";
import { sharedConfig } from "../../shared/shared.config";
import { perf, getPerformanceReport } from "./managers/performance.manager";

const serverTaskId = { curr: -1 }
let globalDateFileIncrement = { id: 1, date: dateId(new Date()) }

export const getServerTaskId = () => serverTaskId.curr
export const setServerTaskId = (nb) => { serverTaskId.curr = nb }


export const listenSocketEndpoints = (serverSocket2: ServerSocketManager<iApiDictionary>) => {

	serverSocket2.on('askForFiles', async data => {
		searchWithRipGrep({
			term: '',
			folder: data.folderPath,
			typeSearch: 'folder',
			titleSearch: false,
			onSearchEnded: async res => {
				if (res.files) await serverSocket2.emit('getFiles', { files: res.files, idReq: data.idReq })
			}
		})
	})

	serverSocket2.on('askForImages', async data => {
		searchWithRipGrep({
			term: '',
			typeSearch: 'folder-image',
			folder: data.folderPath,
			titleSearch: false,
			onSearchEnded: async res => {
				if (res.images) await serverSocket2.emit('getImages', { images: res.images })
			}
		})
	})

	serverSocket2.on('askForFileContent', async data => {
		let file = `${backConfig.dataFolder}/${data.filePath}`
		let endPerf = perf('askForFileContent ' + file)
		try {
			let apiAnswer = await openFile(file)
			serverSocket2.emit('getFileContent', { fileContent: apiAnswer, filePath: data.filePath, idReq: data.idReq })
		} catch {
			serverSocket2.emit('getFileContent', { fileContent: '', error: 'NO_FILE', filePath: data.filePath, idReq: data.idReq })
		}
		endPerf()
	})

	serverSocket2.on('searchWord', async data => {
		// replace * by ANY word
		data.word = data.word.split("*").join(regexs.strings.charWithAccents)
		searchWord({
			term: data.word,
			folder: data.folder,
			cb: res => {
				serverSocket2.emit('getWordSearch', { result: res, idReq: data.idReq })
			}
		})
	})

	serverSocket2.on('searchFor', async data => {
		// see if need to restrict search to a folder
		let termObj = analyzeTerm(data.term)
		if (data.type === 'text') {
			searchWithRipGrep({
				term: termObj.term,
				folder: termObj.folderToSearch,
				typeSearch: 'term',
				titleSearch: termObj.titleSearch,
				onSearchEnded: async res => {
					if (res.files) await serverSocket2.emit('getFiles', { files: res.files, idReq: data.idReq })
				}
			})
		}
		else if (data.type === 'image') {
			searchWithRipGrep({
				term: termObj.term,
				typeSearch: 'term-image',
				folder: termObj.folderToSearch,
				titleSearch: termObj.titleSearch,
				onSearchEnded: async res => {
					if (res.images) await serverSocket2.emit('getImages', { images: res.images })
				}
			})
		}
	})

	serverSocket2.on('askFoldersScan', async data => {
		let endPerf = perf('askFoldersScan ' + JSON.stringify(data.foldersPaths))
		let folders: iFolder[] = []
		for (let i = 0; i < data.foldersPaths.length; i++) {
			folders.push(scanDirForFolders(data.foldersPaths[i]))
		}
		serverSocket2.emit('getFoldersScan', {
			folders,
			idReq: data.idReq,
			pathBase: backConfig.dataFolder
		})
		endPerf()
	})





	serverSocket2.on('saveFileContent', async data => {
		const pathToFile = `${backConfig.dataFolder}${data.filePath}`;
		let endPerf = perf('saveFileContent ' + pathToFile)

		await upsertRecursivelyFolders(pathToFile)
		await saveFile(pathToFile, data.newFileContent)
		// ioServer.emit(socketEvents.getFileContent, {fileContent: data.newFileContent, filePath: data.filepath} as .getFileContent)

		// sends back to all sockets the updated content
		if (!pathToFile.includes("/.tiro/")) {
			// log("=========================== WATCH UPDATE", pathToFile);
			// send to everybody but the sender
			// serverSocket2.raw.broadcast.emit('onNoteWatchUpdate', {

			// actually send to to everybody and apply a smart/selective behavior on frontend
			ioServer.emit('onNoteWatchUpdate', {
				filePath: data.filePath,
				fileContent: data.newFileContent
			})
		}

		endPerf()
	}, { disableDataLog: true, checkRole: "editor" })




	serverSocket2.on('createNote', async data => {
		

		const checkAndGenNewNoteName = (): string => {
			let newNameNote = `/Note ${globalDateFileIncrement.id} of ${formatDateNewNote(new Date())}.md`
			let newNotePath = `${backConfig.dataFolder}${data.folderPath}${newNameNote}`
			if (globalDateFileIncrement.date !== dateId(new Date())) {
				globalDateFileIncrement.id = 0
				globalDateFileIncrement.date = dateId(new Date())
			}
			globalDateFileIncrement.id = globalDateFileIncrement.id + 1
			if (fileExists(newNotePath)) {
				return checkAndGenNewNoteName()
			} else {
				return newNotePath
			}
		}
		const notePath = checkAndGenNewNoteName();
		let endPerf = perf('createNote ' + notePath)
		
		log(`CREATING ${notePath}`);
		await saveFile(`${notePath}`, ``)

		// rescan folder files list
		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${data.folderPath}`)
		if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		serverSocket2.emit('getFiles', { files: apiAnswer, idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('moveFile', async data => {
		log(`=> MOVING FILE ${backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
		let endPerf = perf('moveFile ' + data.initPath + ' to ' + data.endPath)
		// upsert folders if not exists and move file
		log(`===> 1/4 creating folders ${data.endPath}`);
		await upsertRecursivelyFolders(data.endPath)

		let f1 = getFileInfos(data.initPath)
		let f2 = getFileInfos(data.endPath)
		if (f1.folder !== f2.folder) {
			log(`===> 2/4 moveNoteResourcesAndUpdateContent`);
			await moveNoteResourcesAndUpdateContent(data.initPath, data.endPath)
		} else {
			log(`===> 2/4 DO NOTHING, SAME FOLDER moveNoteResourcesAndUpdateContent`);

		}

		log(`===> 3/4 moveFile`);
		await moveFile(`${backConfig.dataFolder}${data.initPath}`, `${backConfig.dataFolder}${data.endPath}`)

		// rescan the current dir
		log(`===> 4/4 debouncedScanAfterMove`);
		await debouncedFolderScan(serverSocket2, data.initPath, data.idReq)
		// await debouncedHierarchyScan(socket)

		serverSocket2.emit('moveFileAnswer', { idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('moveFolder', async data => {
		log(`=> MOVING FOLDER ${data.initPath} -> ${data.endPath}`);
		let endPerf = perf('moveFolder ' + data.initPath + ' to ' + data.endPath)
		// simplier, as no need to move ressources
		await upsertRecursivelyFolders(data.endPath)
		await moveFile(data.initPath, data.endPath)
		serverSocket2.emit('moveFolderAnswer', { idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('createHistoryFile', async data => {
		let historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
		let endPerf = perf('createHistoryFile ' + data.filePath)
		// IF path is inside history folder, do NOT BACKUP
		if (data.filePath.includes(historyFolder)) return

		// IF data.content contains --disable-history-- do NOT BACKUP
		const disableString = `--disable-history--`
		if (data.content.includes(disableString)) {
			console.log(`[HISTORY] "${disableString}" found in data.filepath, NO HISTORY`);
		} else {

			await upsertRecursivelyFolders(`${historyFolder}/`)

			// save history note
			let fileName = fileNameFromFilePath(data.filePath)
			fileName = `${formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`
			await saveFile(`${historyFolder}/${fileName}`, data.content)

			// only keep up to x days of history files
			debounceCleanHistoryFolder()
			endPerf()
		}
	}, { checkRole: "editor", disableDataLog: true })


	serverSocket2.on('onFileDelete', async data => {
		log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

		let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
		if (!fileExists(trashFolder)) await createDir(trashFolder)

		let fileName = fileNameFromFilePath(data.filepath)
		await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)

		// rescan folder files list
		const folderPath = getFolderPath(data.filepath)
		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${folderPath}`)
		if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		serverSocket2.emit('getFiles', { files: apiAnswer, idReq: data.idReq })
	}, { checkRole: "editor" })

	// DELETING TRASH
	serverSocket2.on('askFolderDelete', async data => {
		

		if (data.typeFolder === "trash") {
			let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
			log(`DELETING ${trashFolder}`);
			if (!fileExists(trashFolder)) return
			await deleteFolder(trashFolder)
			if (!fileExists(trashFolder)) await createDir(trashFolder)
		}

		if (data.typeFolder === "cache" && data.cacheFolderName) {
			log(`DELETING cache folder ${data.cacheFolderName}`);
			let cacheFolderToDelete = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.cacheFolder}/${data.cacheFolderName}`
			if (!fileExists(cacheFolderToDelete)) return
			await deleteFolder(cacheFolderToDelete)
		}

		// let apiAnswer = await scanDirForFiles(trashFolder)
		// if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		// serverSocket2.emit('getFiles', { files: apiAnswer, idReq: data.idReq })
	}, { checkRole: "editor" })

	// serverSocket2.on('askForExplorer', async data => {
	// 	let fullPath = `${data.folderpath}`
	// 	log(`ASK FOR EXPLORER ${fullPath}`);
	// 	fullPath = fullPath.split('/').join('\\')
	// 	exec3(`%windir%\\explorer.exe \"${fullPath}\"`)
	// 	setTimeout(() => { focusOnWinApp('explorer') }, 500)
	// })

	serverSocket2.on('uploadResourcesInfos', async data => {
		// should not be used anymore w new upload api
		folderToUpload.value = data.folderpath
	}, { checkRole: "editor" })

	serverSocket2.on('disconnect', async data => {

	}, { bypassLoginTokenCheck: true })

	serverSocket2.on('askFilesPreview', async data => {
		let endPerf = perf('askFilesPreview ')
		let res = await getFilesPreviewLogic(data)
		serverSocket2.emit('getFilesPreview', { filesPreview: res, idReq: data.idReq })
		endPerf()
	})

	serverSocket2.on('askFolderCreate', async data => {
		createFolder(`${backConfig.dataFolder}${data.parent.path}/${data.newFolderName}`)
	}, { checkRole: "editor" })

	serverSocket2.on('sendSetupInfos', async data => {
		const answer = await processClientSetup(data)
		serverSocket2.emit('getSetupInfos', answer)

		// if setup success, restart server
		// NOT WORKING ON DEV NODEMON
		if (answer.code === 'SUCCESS_CONFIG_CREATION') restartTiroServer()
	}, { duringSetup: true })


	serverSocket2.on('sendLoginInfos', async data => {
		let endPerf = perf('sendLoginInfos ')
		const areClientInfosCorrect = await checkUserPassword(data.user, data.password)
		
		security.log(`LOGIN : ${areClientInfosCorrect ? "OK": `UNSUCCESSFULL!!! => ${JSON.stringify(data)}`} [${getSocketClientInfos(serverSocket2, "small")}]`)

		if (!areClientInfosCorrect) {
			serverSocket2.emit('getLoginInfos', { code: 'WRONG_USER_PASSWORD' })
			
		} else {
			serverSocket2.emit('getLoginInfos', { code: 'SUCCESS', token: getUserToken(data.user) })

			// // do also a root scan for first time
			// let folders = [scanDirForFolders('/')]
			// serverSocket2.emit('getFoldersScan', {
			// 	folders,
			// 	pathBase: backConfig.dataFolder
			// })
		}
		endPerf()
	}, { bypassLoginTokenCheck: true, disableDataLog: true })

	serverSocket2.on('askFileHistory', async data => {
		
		// get all the history files 
		const historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
		let endPerf = perf('askFileHistory '+ historyFolder)
		const allHistoryFiles = await scanDirForFiles(historyFolder)
		const fileNameToSearch = fileNameFromFilePath(data.filepath)
		const historyFiles: iFile[] = []
		if (typeof allHistoryFiles === 'string') return
		for (let i = 0; i < allHistoryFiles.length; i++) {
			const file = allHistoryFiles[i];
			if (file.name.includes(fileNameToSearch)) historyFiles.push(file)
		}
		serverSocket2.emit('getFileHistory', { files: historyFiles })
		endPerf()
	})


	//
	// RESSOURCE API
	//
	serverSocket2.on('askRessourceDelete', async data => {
		// let res = await getFilesPreviewLogic(data)
		// serverSocket2.emit('getFilesPreview', { filesPreview: res, idReq: data.idReq })

		// const pathToFile = `${backConfig.dataFolder}${data.filePath}`;
		// await upsertRecursivelyFolders(pathToFile)
		// await saveFile(pathToFile, data.newFileContent)
	}, { checkRole: "editor" })

	serverSocket2.on('askRessourceDownload', async data => {
		const pathToFile = `${backConfig.dataFolder}/${data.folder}`;
		let endPerf = perf(`askRessourceDownload ${data.url}`)
		await upsertRecursivelyFolders(pathToFile)
		downloadFile(data.url, pathToFile).then(message => {
			serverSocket2.emit('getRessourceApiAnswer', { status: "SUCCESS", message, idReq: data.idReq })
			endPerf()
		}).catch(message => {
			serverSocket2.emit('getRessourceApiAnswer', { status: "FAIL", message, idReq: data.idReq })
			endPerf()
		})

	})


	//
	// COMMAND EXEC
	// 
	serverSocket2.on('askCommandExec', async data => {
		let endPerf = perf('askCommandExec '+ data.commandString)
		let res = await execString(data.commandString)
		serverSocket2.emit('getCommandExec', { resultCommand: res, idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })


	//
	// PLUGINS
	// 
	serverSocket2.on('askPluginsList', async data => {
		let endPerf = perf('askPluginsList ')
		// let res = await execString(data.commandString)
		// let plugins:iPlugin[] = []
		let {plugins, scanLog} = await scanPlugins(data.noCache)
		serverSocket2.emit('getPluginsList', { plugins, scanLog, idReq: data.idReq })
		endPerf()
	})

	//
	// NOTIFICATIONS
	// 
	serverSocket2.on('emitNotification', async data => {
		let endPerf = perf('emitNotification ')
		// actually send to to everybody
		ioServer.emit('getNotification', {...data})

		// and appends notif in notification history
		if (data.notification.options?.keepInHistory) {
			let notifHistoryFile = `${backConfig.dataFolder}/${sharedConfig.path.configFolder}/notification_history.md`
			await prependToFile(notifHistoryFile, `${new Date().toJSON()} : ${data.notification.content}`)
		}
		endPerf()
		
	}, { checkRole: "editor" })


	//
	// SETUP JSON 
	// 
	serverSocket2.on('updateSetupJson', async data => {
		updateSetupJsonParam(data.paramName, data.paramValue)
	}, { checkRole: "editor" })


	serverSocket2.on('askPerformanceReport', async data => {
		serverSocket2.emit('getPerformanceReport', { report: getPerformanceReport(), idReq: data.idReq })
	}, { checkRole: "editor" })

}

