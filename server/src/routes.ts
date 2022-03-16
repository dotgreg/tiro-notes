import { iApiDictionary } from "../../shared/apiDictionary.type";
import { backConfig } from "./config.back";
import { exec3 } from "./managers/exec.manager";
import { createDir, fileNameFromFilePath, scanDirForFiles, scanDirForFolders } from "./managers/dir.manager";
import { createFolder, fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./managers/fs.manager";
import { analyzeTerm, searchWithRipGrep } from "./managers/search/search-ripgrep.manager";
import { dateId, formatDateHistory, formatDateNewNote } from "./managers/date.manager";
import { focusOnWinApp } from "./managers/win.manager";
import { debouncedFolderScan, moveNoteResourcesAndUpdateContent } from "./managers/move.manager";
import { folderToUpload } from "./managers/upload.manager";
import { iFile, iFolder } from "../../shared/types.shared";
import { getFilesPreviewLogic } from "./managers/filePreview.manager";
import { processClientSetup } from "./managers/configSetup.manager";
import { restartTiroServer } from "./managers/serverRestart.manager";
import { checkUserPassword, getLoginToken } from "./managers/loginToken.manager";
import { ServerSocketManager } from './managers/socket.manager'
import { log } from "./managers/log.manager";

const serverTaskId = { curr: -1 }
let globalDateFileIncrement = { id: 1, date: dateId(new Date()) }

export const getServerTaskId = () => serverTaskId.curr
export const setServerTaskId = (nb) => { serverTaskId.curr = nb }

export const listenSocketEndpoints = (serverSocket2: ServerSocketManager<iApiDictionary>) => {

	serverSocket2.on('askForFiles', async data => {
		searchWithRipGrep({
			term: '',
			folder: data.folderPath,
			titleSearch: false,
			recursive: false,
			onSearchEnded: async res => {
				if (res.files) await serverSocket2.emit('getFiles', { files: res.files })
			}
		})
	})

	serverSocket2.on('askForImages', async data => {
		searchWithRipGrep({
			term: '',
			imageSearch: true,
			folder: data.folderPath,
			titleSearch: false,
			recursive: false,
			onSearchEnded: async res => {
				if (res.images) await serverSocket2.emit('getImages', { images: res.images })
			}
		})
	})

	serverSocket2.on('askForFileContent', async data => {
		let apiAnswer = await openFile(`${backConfig.dataFolder}/${data.filePath}`)
		serverSocket2.emit('getFileContent', { fileContent: apiAnswer, filePath: data.filePath })
	})

	serverSocket2.on('searchFor', async data => {
		// see if need to restrict search to a folder
		let termObj = analyzeTerm(data.term)
		if (data.type === 'text') {
			searchWithRipGrep({
				term: termObj.term,
				folder: termObj.folderToSearch,
				titleSearch: termObj.titleSearch,
				recursive: true,
				onSearchEnded: async res => {
					if (res.files) await serverSocket2.emit('getFiles', { files: res.files })
				}
			})
		}
		else if (data.type === 'image') {
			searchWithRipGrep({
				term: termObj.term,
				folder: termObj.folderToSearch,
				titleSearch: termObj.titleSearch,
				imageSearch: true,
				recursive: true,
				onSearchEnded: async res => {
					if (res.images) await serverSocket2.emit('getImages', { images: res.images })
				}
			})
		}
	})

	serverSocket2.on('askFoldersScan', async data => {
		let folders: iFolder[] = []
		for (let i = 0; i < data.foldersPaths.length; i++) {
			folders.push(scanDirForFolders(data.foldersPaths[i]))
		}
		serverSocket2.emit('getFoldersScan', { folders, pathBase: backConfig.dataFolder })
	})

	serverSocket2.on('saveFileContent', async data => {
		log(`SAVING ${backConfig.dataFolder}${data.filepath} with new content`);
		await saveFile(`${backConfig.dataFolder}${data.filepath}`, data.newFileContent)
		// sends back to all sockets the updated content
		// ioServer.emit(socketEvents.getFileContent, {fileContent: data.newFileContent, filePath: data.filepath} as .getFileContent)
	}, { disableDataLog: true })

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
		log(`CREATING ${notePath}`);
		await saveFile(`${notePath}`, ``)

		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${data.folderPath}`)

		if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		serverSocket2.emit('getFiles', { files: apiAnswer })
	})

	serverSocket2.on('moveFile', async data => {
		log(`=> MOVING FILE ${backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
		// upsert folders if not exists and move file
		log(`===> 1/4 creating folders ${data.endPath}`);
		await upsertRecursivelyFolders(data.endPath)

		log(`===> 2/4 moveNoteResourcesAndUpdateContent`);
		await moveNoteResourcesAndUpdateContent(data.initPath, data.endPath)

		log(`===> 3/4 moveFile`);
		await moveFile(`${backConfig.dataFolder}${data.initPath}`, `${backConfig.dataFolder}${data.endPath}`)

		// rescan the current dir
		log(`===> 4/4 debouncedScanAfterMove`);
		await debouncedFolderScan(serverSocket2, data.initPath)
		// await debouncedHierarchyScan(socket)
	})

	serverSocket2.on('moveFolder', async data => {
		log(`=> MOVING FOLDER ${data.initPath} -> ${data.endPath}`);
		await upsertRecursivelyFolders(data.endPath)
		await moveFile(data.initPath, data.endPath)
	})

	serverSocket2.on('createHistoryFile', async data => {
		let historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
		upsertRecursivelyFolders(`${historyFolder}/`)

		let fileName = fileNameFromFilePath(data.filePath)
		fileName = `${formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`
		await saveFile(`${historyFolder}/${fileName}`, data.content)
	})

	serverSocket2.on('onFileDelete', async data => {
		log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

		let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
		if (!fileExists(trashFolder)) await createDir(trashFolder)

		let fileName = fileNameFromFilePath(data.filepath)
		await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)
	})

	serverSocket2.on('askForExplorer', async data => {
		let fullPath = `${data.folderpath}`
		log(`ASK FOR EXPLORER ${fullPath}`);
		fullPath = fullPath.split('/').join('\\')
		exec3(`%windir%\\explorer.exe \"${fullPath}\"`)
		setTimeout(() => { focusOnWinApp('explorer') }, 500)
	})

	serverSocket2.on('uploadResourcesInfos', async data => {
		folderToUpload.value = data.folderpath
	})

	serverSocket2.on('disconnect', async data => {

	}, { bypassLoginTokenCheck: true })

	serverSocket2.on('askFilesPreview', async data => {
		let res = await getFilesPreviewLogic(data)
		serverSocket2.emit('getFilesPreview', { filesPreview: res })
	})

	serverSocket2.on('askFolderCreate', async data => {
		createFolder(`${backConfig.dataFolder}${data.parent.path}/${data.newFolderName}`)
	})

	serverSocket2.on('sendSetupInfos', async data => {
		const answer = await processClientSetup(data)
		serverSocket2.emit('getSetupInfos', answer)

		// if setup success, restart server
		// NOT WORKING ON DEV NODEMON
		if (answer.code === 'SUCCESS_CONFIG_CREATION') restartTiroServer()
	}, { duringSetup: true })


	serverSocket2.on('sendLoginInfos', async data => {
		const areClientInfosCorrect = await checkUserPassword(data.user, data.password)
		if (!areClientInfosCorrect) {
			serverSocket2.emit('getLoginInfos', { code: 'WRONG_USER_PASSWORD' })
		} else {
			serverSocket2.emit('getLoginInfos', { code: 'SUCCESS', token: getLoginToken() })

			// do also a root scan for first time
			let folders = [scanDirForFolders('/')]
			serverSocket2.emit('getFoldersScan', { folders, pathBase: backConfig.dataFolder })
		}
	}, { bypassLoginTokenCheck: true, disableDataLog: true })

	serverSocket2.on('askFileHistory', async data => {
		// get all the history files 
		const historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
		const allHistoryFiles = await scanDirForFiles(historyFolder)
		const fileNameToSearch = fileNameFromFilePath(data.filepath)
		const historyFiles: iFile[] = []
		if (typeof allHistoryFiles === 'string') return
		for (let i = 0; i < allHistoryFiles.length; i++) {
			const file = allHistoryFiles[i];
			if (file.name.includes(fileNameToSearch)) historyFiles.push(file)
		}
		serverSocket2.emit('getFileHistory', { files: historyFiles })
	})
}

