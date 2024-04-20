import { iApiDictionary } from "../../shared/apiDictionary.type";
import { backConfig } from "./config.back";
import { createDir, fileNameFromFilePath, scanDirForFiles, scanDirForFolders, scanDirForFoldersRecursive } from "./managers/dir.manager";
import { createFolder, deleteFolder, downloadFile, fileExists, moveFile, openFile, prependToFile, saveFile, upsertRecursivelyFolders } from "./managers/fs.manager";
import { analyzeTerm, searchWithRgGeneric, searchWithRipGrep } from "./managers/search/search-ripgrep.manager";
import { dateId, formatDateNewNote } from "./managers/date.manager";
import { debouncedFolderScan, moveFileLogic, moveNoteResourcesAndUpdateContent } from "./managers/move.manager";
import { folderToUpload } from "./managers/upload.manager";
import { iFile, iFolder, iPlugin } from "../../shared/types.shared";
import { getFilesPreviewLogic } from "./managers/filePreview.manager";
import { processClientSetup, updateSetupJsonParam } from "./managers/configSetup.manager";
import { restartTiroServer } from "./managers/serverRestart.manager";
import { checkUserPassword, getUserToken } from "./managers/loginToken.manager";
import { ServerSocketManager } from './managers/socket.manager'
import { log } from "./managers/log.manager";
import { getFolderPath, p } from "./managers/path.manager";
import { searchWord } from "./managers/search/word.search.manager";
import { ioServer } from "./server";
import { regexs } from "../../shared/helpers/regexs.helper";
import { execString, execStringStream } from "./managers/exec.manager";
import { cleanPath, getFileInfos, pathToIfile } from "../../shared/helpers/filename.helper";
import { getSocketClientInfos, security } from "./managers/security.manager";
import { pluginsListCache, relPluginsFolderPath, rescanPluginList, scanPlugins } from "./managers/plugins.manager";
import { sharedConfig } from "../../shared/shared.config";
import { perf, getPerformanceReport } from "./managers/performance.manager";
import { getActivityReport, logActivity } from "./managers/activity.manager";
import { createFileHistoryVersion,  fileHistoryParams, getHistoryFolder, processFileHistoryHousekeeping } from "./managers/fileHistory.manager";
import { getDateObj } from "../../shared/helpers/date.helper";
import { each, isArray } from "lodash";
import { relative } from "path";
import { getPlatform } from "./managers/platform.manager";
import { compressImageJimp } from "./managers/imageManip.manager";

const serverTaskId = { curr: -1 }
let globalDateFileIncrement = { id: 1, date: dateId(new Date()) }

export const getServerTaskId = () => serverTaskId.curr
export const setServerTaskId = (nb) => { serverTaskId.curr = nb }

export const listenSocketEndpoints = (serverSocket2: ServerSocketManager<iApiDictionary>) => {
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// PRE LOGIN APIs
	//
	serverSocket2.on('sendSetupInfos', async data => {
		const answer = await processClientSetup(data)
		serverSocket2.emit('getSetupInfos', answer)

		// if setup success, restart server
		// NOT WORKING ON DEV NODEMON
		if (answer.code === 'SUCCESS_CONFIG_CREATION') restartTiroServer()
	}, { duringSetup: true, checkRole: "none" })

	
	serverSocket2.on('disconnect', async data => {

	}, { bypassLoginTokenCheck: true, checkRole: "none" })



	serverSocket2.on('sendLoginInfos', async data => {
		let endPerf = perf('sendLoginInfos ')
		const areClientInfosCorrect = await checkUserPassword(data.user, data.password)

		security.log(`LOGIN : ${areClientInfosCorrect ? "OK" : `UNSUCCESSFULL!!! => ${JSON.stringify(data)}`} [${getSocketClientInfos(serverSocket2, "small")}]`)
		logActivity(`LOGIN:${areClientInfosCorrect ? "OK" : "UNSUCCESSFULL"} ${data.user}`, `SECURITY:LOGIN`, serverSocket2)

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
	}, { bypassLoginTokenCheck: true, disableDataLog: true, checkRole: "none" })


	
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// VIEWER APIs
	//
	serverSocket2.on('askForFiles', async data => {
		searchWithRipGrep({
			term: '',
			folder: data.folderPath,
			typeSearch: 'folder',
			titleSearch: false,
			onSearchEnded: async res => {
				if (res.files) await serverSocket2.emit('getFiles', { files: res.files, idReq: data.idReq })
			},
			onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
		})
	}, { checkRole: "viewer" })

	serverSocket2.on('askForImages', async data => {
		searchWithRipGrep({
			term: '',
			typeSearch: 'folder-image',
			folder: data.folderPath,
			titleSearch: false,
			onSearchEnded: async res => {
				if (res.images) await serverSocket2.emit('getImages', { images: res.images })
			},
			onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
		})
	}, { checkRole: "viewer" })

	


	serverSocket2.on('askForFileContent', async data => {
		if (!data.filePath.includes(".tiro")) logActivity("read", data.filePath, serverSocket2)
		let file = `${backConfig.dataFolder}/${data.filePath}`
		file = cleanPath(file)
		let endPerf = perf('👁️  askForFileContent ' + file)
		try {
			let apiAnswer = await openFile(file)
			serverSocket2.emit('getFileContent', { fileContent: apiAnswer, filePath: data.filePath, idReq: data.idReq })
		} catch {
			serverSocket2.emit('getFileContent', { fileContent: '', error: 'NO_FILE', filePath: data.filePath, idReq: data.idReq })
		}
		endPerf()
	}, { checkRole: "viewer" })

	serverSocket2.on('searchWord', async data => {
		// replace * by ANY word
		data.word = data.word.split("*").join(regexs.strings.charWithAccents)
		searchWord({
			term: data.word,
			folder: data.folder,
			cb: res => {
				serverSocket2.emit('getWordSearch', { result: res, idReq: data.idReq })
			},
			onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
		})
	}, { checkRole: "viewer" })

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
				},
				onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
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
				},
				onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
			})
		}
	}, { checkRole: "viewer" })

	serverSocket2.on('askFoldersScan', async data => {
		let depth = data.depth || 0
		let endPerf = perf('📂  askFoldersScan ' + JSON.stringify(data.foldersPaths))
		let folders: iFolder[] = []
		for (let i = 0; i < data.foldersPaths.length; i++) {
			folders.push(scanDirForFoldersRecursive(data.foldersPaths[i], depth))
		}
		serverSocket2.emit('getFoldersScan', {
			folders,
			idReq: data.idReq,
			pathBase: backConfig.dataFolder
		})
		endPerf()
	}, { checkRole: "viewer" })
	serverSocket2.on('askFileHistory', async data => {
		// get all the history files 
		let endPerf = perf('👁️  askFileHistory ' + data.filepath)
		const file = pathToIfile(data.filepath)
		const historyFolder = getHistoryFolder(file)
		let allHistoryFiles = await scanDirForFiles(historyFolder, serverSocket2)
		if (!isArray(allHistoryFiles)) allHistoryFiles = []
		// filter .infos.md
		allHistoryFiles = allHistoryFiles.filter(f => f.name !== fileHistoryParams.infosFile)
		serverSocket2.emit('getFileHistory', { files: allHistoryFiles })
		endPerf()
	}, { checkRole: "viewer" })
	serverSocket2.on('askFilesPreview', async data => {
		let endPerf = perf('👁️  askFilesPreview ')
		let res = await getFilesPreviewLogic(data)
		serverSocket2.emit('getFilesPreview', { filesPreview: res, idReq: data.idReq })
		endPerf()
	}, { checkRole: "viewer" })
	serverSocket2.on('askRessourceDownload', async data => {
		const pathToFile = `${backConfig.dataFolder}/${data.folder}`;
		let endPerf = perf(`⬇️   askRessourceDownload ${data.url}`)
		const opts = data.opts ? data.opts : {}

		await upsertRecursivelyFolders(pathToFile)
		downloadFile(data.url, pathToFile, opts).then(message => {
			serverSocket2.emit('getRessourceApiAnswer', { status: "SUCCESS", message, idReq: data.idReq })
			endPerf()
		}).catch(message => {
			serverSocket2.emit('getRessourceApiAnswer', { status: "FAIL", message, idReq: data.idReq })
			endPerf()
		})
    
	}, { checkRole: "viewer" }) 
	//
	// PLUGINS
	// 
	serverSocket2.on('askPluginsList', async data => {
		let endPerf = perf(`📂  askPluginsList shouldRescanPluginFolder?:${pluginsListCache.shouldRescan}`)
		let { plugins, scanLog } = await scanPlugins(data.noCache)
		serverSocket2.emit('getPluginsList', { plugins, scanLog, idReq: data.idReq })
		endPerf()
	}, { checkRole: "viewer" })



	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// EDITOR APIs
	//
	serverSocket2.on('saveFileContent', async data => {
		if (!data.filePath.includes(".tiro")) logActivity("write", data.filePath, serverSocket2)

		// plugin rescan if folder edited
		if (data.filePath.includes(relPluginsFolderPath)) rescanPluginList()

		const pathToFile = p(`${backConfig.dataFolder}/${data.filePath}`);
		let endPerf = perf('✏️  saveFileContent ' + pathToFile)

		await upsertRecursivelyFolders(pathToFile)
		await saveFile(pathToFile, data.newFileContent)

		// actually send to to everybody and apply a smart/selective behavior on frontend
		ioServer.emit('onNoteWatchUpdate', {
			filePath: data.filePath,
			fileContent: data.newFileContent
		})

		// if withCb, sends back cb
		if (data.withCb) serverSocket2.emit('onServerTaskFinished', {status:"ok", idReq:data.idReq})

		endPerf()
	}, { disableDataLog: true, checkRole: "editor" })




	serverSocket2.on('createNote', async data => {


		const checkAndGenNewNoteName = (): string => {
			let newNameNote = `/${globalDateFileIncrement.id} ${formatDateNewNote(new Date())}.md`
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
		let endPerf = perf('✏️  createNote ' + notePath)

		log(`CREATING ${notePath}`);
		await saveFile(`${notePath}`, ``)

		// rescan folder files list
		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${data.folderPath}`, serverSocket2)
		if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		serverSocket2.emit('getFiles', { files: apiAnswer, idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('moveFile', async data => {
		await moveFileLogic(data.initPath, data.endPath)

		// rescan the current dir
		log(`===> 4/4 debouncedScanAfterMove`);
		await debouncedFolderScan(serverSocket2, data.initPath, data.idReq)

		serverSocket2.emit('moveFileAnswer', { idReq: data.idReq })
	}, { checkRole: "editor" })

	serverSocket2.on('moveFolder', async data => {
		log(`=> MOVING FOLDER ${data.initPath} -> ${data.endPath}`);
		let endPerf = perf('📁➡️  moveFolder ' + data.initPath + ' to ' + data.endPath)
		// simplier, as no need to move ressources
		await upsertRecursivelyFolders(data.endPath)
		await moveFile(data.initPath, data.endPath)
		serverSocket2.emit('moveFolderAnswer', { idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('createHistoryFile', async data => {
		// createFileHistoryVersion_OLD(data)
		const date = getDateObj()
		let histFile = await createFileHistoryVersion(data, date)
		processFileHistoryHousekeeping(histFile, date)
	}, { checkRole: "editor", disableDataLog: true })

	



	serverSocket2.on('onFileDelete', async data => {
		log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

		let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
		if (!fileExists(trashFolder)) await createDir(trashFolder)

		let fileName = fileNameFromFilePath(data.filepath)
		await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)

		// rescan folder files list
		const folderPath = getFolderPath(data.filepath)
		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${folderPath}`, serverSocket2)
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

	

	serverSocket2.on('askFolderCreate', async data => {
		// createFolder(`${backConfig.dataFolder}${data.parent.path}/${data.newFolderName}`)
		// let newFolderPath = `${backConfig.dataFolder}${data.parent.path}/${data.newFolderName}`
		let newFolderPath = `${backConfig.dataFolder}${data.newFolderPath}`
		await upsertRecursivelyFolders(newFolderPath)
		serverSocket2.emit('onServerTaskFinished', {status:"ok", idReq:data.idReq})
	}, { checkRole: "editor" })

	




	//
	// RESSOURCE API
	//
	serverSocket2.on('askRessourceDelete', async data => {
		const pathToFile = `${backConfig.dataFolder}/${data.path}`;
		logActivity("delete", data.path, serverSocket2)
		let res = await deleteFolder(pathToFile)
		if (res && res.message) {
			serverSocket2.emit('getRessourceApiAnswer', { status: "FAIL", message: res.message, idReq: data.idReq })
		} else {
			serverSocket2.emit('getRessourceApiAnswer', { status: "SUCCESS", message: `File ${data.path} deleted successfully`, idReq: data.idReq })
		}
	}, { checkRole: "editor" })

	


	//
	// COMPRESS IMAGE API
	// 
	serverSocket2.on('askRessourceImageCompress', async data => {
		try {
			let res = await compressImageJimp(data.params)
			serverSocket2.emit('getRessourceApiAnswer', { status:"SUCCESS", message:JSON.stringify(res), idReq: data.idReq })
		} catch (error) {
			const message = `Failed compressing ${JSON.stringify(data.params)} -> ${JSON.stringify(error)}`
			serverSocket2.emit('getRessourceApiAnswer', { status:"FAIL",message, idReq: data.idReq })
		}
	}, { checkRole: "editor" })



	//
	// COMMAND EXEC
	// 
	serverSocket2.on('askCommandExec', async data => {
		let endPerf = perf('⚡  askCommandExec ' + data.commandString)
		logActivity("exec", data.commandString, serverSocket2)
		// let res = await execString(data.commandString)
		let res = await execString(data.commandString)
		serverSocket2.emit('getCommandExec', { resultCommand: res, idReq: data.idReq })
		endPerf()
	}, { checkRole: "editor" })

	serverSocket2.on('askCommandExecStream', async data => {
		let endPerf = perf('⚡  askCommandExecStrea, ' + data.commandString)
		logActivity("exec", data.commandString, serverSocket2)
		execStringStream(data.commandString, (streamChunk) => {
			serverSocket2.emit('getCommandExecStream', { streamChunk: streamChunk, idReq: data.idReq })
		})
		endPerf()
	}, { checkRole: "editor" })


	

	//
	// NOTIFICATIONS
	// 
	serverSocket2.on('emitNotification', async data => {
		let endPerf = perf('💬 emitNotification ')
		// actually send to to everybody
		ioServer.emit('getNotification', { ...data })

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
		await updateSetupJsonParam(data.paramName, data.paramValue)
		serverSocket2.emit('onServerTaskFinished', {status:"ok", idReq:data.idReq})
		if (data.opts.requiresServerRestart) {
			restartTiroServer()
		}
	}, { checkRole: "editor" })


	serverSocket2.on('askPerformanceReport', async data => {
		serverSocket2.emit('getPerformanceReport', { report: getPerformanceReport(), idReq: data.idReq })
	}, { checkRole: "editor" })

	serverSocket2.on('askActivityReport', async data => {
		const report = await getActivityReport(data.params || {})
		// console.log(22,report)
		serverSocket2.emit('getActivityReport', { report, idReq: data.idReq })
	}, { checkRole: "editor" })

	// 
	// CONFIG API
	// 
	serverSocket2.on('askBackendConfig', async data => {
		serverSocket2.emit('getBackendConfig', {config: backConfig, idReq: data.idReq })
	}, { checkRole: "editor" })


	// 
	// RESSOURCE SCAN
	// 
	serverSocket2.on('askRessourceScan', async data => {
		// rg --files ./demos/.resources/
		if (!data.folderPath.endsWith("/.resources")) data.folderPath += "/.resources"
		data.folderPath = p(data.folderPath)
		let objRes:{[path:string]: iFile} = {}
		searchWithRgGeneric({
			term: "",
			folder: data.folderPath,
			options: {
				wholeLine: true,
				debug: true,
				filetype: "all",
			},
			processRawLine: lineInfos => {
				let l = lineInfos
				if (!objRes[l.file.path]) objRes[l.file.path] = l.file
			},
			onSearchEnded: async () => {
				let arrRes:iFile[] = []
				each(objRes, prop => {
					arrRes.push(prop)
				})
				serverSocket2.emit('getRessourceScan', {files: arrRes, idReq: data.idReq })
			},
			onRgDoesNotExists: () => { serverSocket2.emit('onServerError', { status:"NO_RIPGREP_COMMAND_AVAILABLE", platform: getPlatform()})}
		})
	}, { checkRole: "editor" })


	// serverSocket2.on('askServerRestart', async data => {
	// 	restartTiroServer()
	// }, { checkRole: "editor" })


}

