import { useContext } from "react";
import { iFile, iFolder } from "../../../../shared/types.shared";
import { getFolderParentPath } from "../../managers/folder.manager";
import { clientSocket, clientSocket2 } from "../../managers/sockets/socket.manager";
import { strings } from "../../managers/strings.manager";
import { updateUrl } from "../../managers/url.manager";
import { getLoginToken } from "./loginToken.hook";
import { iPopupsContext, PopupContext } from "./usePromptPopup.hook";

export const useFileMove = (
	emptyFileDetails,
	cleanFilesList,
	cleanFolderHierarchy,
	askForFolderScan,
	popups: iPopupsContext
) => {

	const askForMoveFile = (initPath: string, endPath: string) => {
		console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
		clientSocket2.emit('moveFile', { initPath, endPath, token: getLoginToken() })
	}

	const askForMoveFolder = (initPath: string, endPath: string) => {
		console.log(`[MOVEFOLDER] ${initPath} -> ${endPath}`);
		// back will then scan and send back whole hierarchy... maybe doing it here is better
		clientSocket2.emit('moveFolder', { initPath, endPath, token: getLoginToken() })
	}

	const promptAndBatchMoveFiles = (files: iFile[], folderToDropInto: iFolder) => {
		if (popups.confirm) popups.confirm(
			`move ${files?.length} files to "${folderToDropInto.key}"? (example: "${files[0].path}" to "${folderToDropInto.key}/${files[0].name}"`,
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

		if (popups.confirm) popups.confirm(
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
