import { iAppView, iFile, iFileImage, iFilePreview, iFolder, iSearchWordRes, iSetupCode, iSetupForm } from "./types.shared";


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

	saveFileContent: { filePath: string, newFileContent: string }

	moveFile: { initPath: string, endPath: string, idReq: string }
	moveFolder: { initPath: string, endPath: string }

	searchFor: { term: string, type: iAppView, idReq: string }

	searchWord: { word: string, folder: string, idReq: string }
	getWordSearch: { result: iSearchWordRes, idReq: string }

	getUploadedFile: { name: string, path: string, idReq: string }

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

	askFolderCreate: { newFolderName: string, parent: iFolder }
	askFolderDelete: { folderToDelete: iFolder }

	sendSetupInfos: { form: iSetupForm }
	getSetupInfos: { code: iSetupCode, defaultFolder?: string, message?: string }

	sendLoginInfos: { user: string, password: string }
	getLoginInfos: { code: 'WRONG_TOKEN' | 'WRONG_USER_PASSWORD' | 'SUCCESS', token?: string },

	askFileHistory: { filepath: string }
	getFileHistory: { files: iFile[] }
}
