import { iPerformanceReport, iPerfStat } from "../server/src/managers/performance.manager";
import { iActivityReport, iActivityReportParams, iAppView, iBackConfig, iCommandStreamChunk, iDownloadRessourceOpts, iFile, iFileImage, iFilePreview, iFolder, iFolderDeleteType, iNotification, iPlatform, iPlugin, iSearchWordRes, iSetupCode, iSetupForm, iUpdateConfigJsonOpts } from "./types.shared";


export interface iApiDictionary {
	connection: {}
	disconnect: {}
	connect: {}
	reconnect: {}
	connectionSuccess: { isRgGood: boolean, ipsServer: string[] }

	askForFiles: { folderPath: string, token: string, idReq: string }
	getFiles: { files: iFile[], temporaryResults?: boolean, initialResults?: boolean, idReq: string }

	askForImages: { folderPath: string, token: string }
	getImages: { images: iFileImage[] }

	askForFileContent: { filePath: string, idReq: string }
	getFileContent: { fileContent: string, filePath: string, idReq: string, error?: string }

	saveFileContent: { filePath: string, newFileContent: string, idReq: string, withCb?:boolean }

	moveFile: { initPath: string, endPath: string, idReq: string }
	moveFileAnswer: { idReq: string }
	moveFolder: { initPath: string, endPath: string, idReq: string }
	moveFolderAnswer: { idReq: string }

	searchFor: { term: string, type: iAppView, idReq: string }

	searchWord: { word: string, folder: string, idReq: string }
	getWordSearch: { result: iSearchWordRes, idReq: string }

	getUploadedFile: { name: string, path: string, absPath:string, idReq: string }

	askFolderHierarchy: { folderPath: string }
	getFolderHierarchy: { folder: iFolder, pathBase: string }

	createNote: { folderPath: string, idReq: string }

	createHistoryFile: { filePath: string, content: string, historyFileType: string }

	onFileDelete: { filepath: string, idReq: string }
	askForExplorer: { folderpath: string }

	uploadResourcesInfos: { folderpath: string }

	askFilesPreview: { filesPath: string[], idReq: string }
	getFilesPreview: { filesPreview: iFilePreview[], idReq: string }

	askFoldersScan: { foldersPaths: string[], idReq: string }
	getFoldersScan: { folders: iFolder[], pathBase: string, idReq: string }

	askFolderCreate: { newFolderPath: string, idReq: string}

	askFolderDelete: { cacheFolderName?: string, typeFolder: iFolderDeleteType }

	sendSetupInfos: { form: iSetupForm }
	getSetupInfos: { code: iSetupCode, defaultFolder?: string, message?: string }

	sendLoginInfos: { user: string, password: string }
	getLoginInfos: {
		code: 'WRONG_TOKEN' | 'WRONG_USER_PASSWORD' | 'SUCCESS',
		token?: string
		loginInfos?: {
			viewer_enabled: boolean
			viewer_password: string
			demo_mode: boolean
		}
	},

	askFileHistory: { filepath: string }
	getFileHistory: { files: iFile[] }

	askRessourceDelete: { path: string, idReq: string }
	askRessourceDownload: { url: string, folder: string, opts?:iDownloadRessourceOpts, idReq: string }
	getRessourceApiAnswer: { status: string, message: string, idReq: string }
	askRessourceScan: { folderPath: string, idReq: string }
	getRessourceScan: { files: iFile[], idReq: string }

	updateSetupJson: { paramName: string, paramValue: string, opts?:iUpdateConfigJsonOpts, idReq: string }

	onNoteWatchUpdate: { filePath: string, fileContent: string }

	askCommandExec: { commandString: string, idReq: string }
	getCommandExec: { resultCommand: string, idReq: string }

	askCommandExecStream: { commandString: string, idReq: string }
	getCommandExecStream: { streamChunk: iCommandStreamChunk, idReq: string }
	
	askPluginsList: { noCache:boolean, idReq: string }
	getPluginsList: { plugins: iPlugin[], scanLog:string[], idReq: string }
	
	emitNotification: { notification:iNotification}
	getNotification: { notification:iNotification }

	askPerformanceReport: { idReq: string  }
	getPerformanceReport: { report:iPerformanceReport, idReq: string }

	askActivityReport: { idReq: string, params?:iActivityReportParams  }
	getActivityReport: { report:iActivityReport, idReq: string }

	askBackendConfig: { idReq: string }
	getBackendConfig: { config: iBackConfig, idReq: string }

	onServerTaskFinished: { status:"ok"|"ko", idReq: string}
	onServerError: { status:"NO_RIPGREP_COMMAND_AVAILABLE"|"NULL", platform:iPlatform}

	// askServerRestart: { }
}
