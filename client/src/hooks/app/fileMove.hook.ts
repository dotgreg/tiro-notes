import { iFile, iFolder } from "../../../../shared/types.shared";
import { getFolderParentPath } from "../../managers/folder.manager";
import { strings } from "../../managers/strings.manager";
import { updateUrl } from "../../managers/url.manager";
import { getClientApi2 } from "../api/api.hook";
import { iPopupApi } from "./usePromptPopup.hook";

export const useFileMove = (
	emptyFileDetails,
	cleanFilesList,
	cleanFolderHierarchy,
	askForFolderScan,
	popupApi: iPopupApi
) => {

	const askForMoveFile = (initPath: string, endPath: string) => {
		console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
		// clientSocket2.emit('moveFile', { initPath, endPath, idReq: '-', token: getLoginToken() })

		// move then reload browser
		getClientApi2().then(api => {
			api.file.move(initPath, endPath, () => {
				api && api.ui.browser.goTo(api.ui.browser.folders.current.get)
			})
		})
	}

	const askForMoveFolder = (initPath: string, endPath: string) => {
		console.log(`[MOVEFOLDER] ${initPath} -> ${endPath}`);
		// back will then scan and send back whole hierarchy... maybe doing it here is better
		// clientSocket2.emit('moveFolder', { initPath, endPath, token: getLoginToken() })
		getClientApi2().then(api => {
			api.folders.move(initPath, endPath, () => {
				api && api.ui.browser.goTo(api.ui.browser.folders.current.get)
			})
		})
	}

	const promptAndBatchMoveFiles = (files: iFile[], folderToDropInto: iFolder) => {
		if (popupApi.confirm) popupApi.confirm(
			`
Move ${files?.length} file(s) to "${folderToDropInto.key}"?<br>
Ressources links will be automatically updated<br>
(example: "${files[0].path}" to "${folderToDropInto.key}/${files[0].name}") `,
			() => {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					let initPath = `${file.path}`
					let endPath = `${folderToDropInto.key}/${file.name}`
					askForMoveFile(initPath, endPath)
					emptyFileDetails()
				}
			}
		);
	}



	const promptAndMoveFolder = (p: {
		folder: iFolder,
		folderToDropInto: iFolder,
		folderBasePath: string,
		newTitle?: string
		renameOnly?: boolean
	}) => {
		const { folder, folderToDropInto, folderBasePath, newTitle, renameOnly } = { ...p }

		let rels = [
			folder.path,
			`${renameOnly ? getFolderParentPath(folderToDropInto) : folderToDropInto.path}/${newTitle ? newTitle : folder.title}`
		]

		let initPath = `${folderBasePath}/${rels[0]}`
		let endPath = `${folderBasePath}/${rels[1]}`

		if (popupApi.confirm) popupApi.confirm(
			`${strings.moveFolderPrompt} ${initPath} to ${endPath}?`,
			() => {
				askForMoveFolder(initPath, endPath)
				emptyFileDetails()
				cleanFilesList()
				cleanFolderHierarchy()
				updateUrl({})
				askForFolderScan([getFolderParentPath(folder), folderToDropInto.path])
				setTimeout(() => {
					askForFolderScan([getFolderParentPath(folder), folderToDropInto.path])
				}, 1000)
			}
		);
	}

	// let warn = `You are about to move the ${item.type} ${item.folder?.path} to ${folderToDropInto}${item.folder?.path}`
	// alert(warn)

	return { askForMoveFile, promptAndBatchMoveFiles, promptAndMoveFolder }
}
