import { iFile, iFolder } from "../../../../shared/types.shared";
import { getFolderParentPath } from "../../managers/folder.manager";
import { strings } from "../../managers/strings.manager";
import { getClientApi2 } from "../api/api.hook";



const popupCommonStyle = `
<style>
.popupContent p {
		background: #dadada;
    padding: 3px 5px;
		margin: 0px 4px;
		display: inline-block;
}
</style>
`

export const useFileMove = (
	emptyFileDetails,
	cleanFilesList,
	cleanFolderHierarchy,
	askForFolderScan,
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

	const askForMoveFolder = (initPath: string, endPath: string, cb?:Function) => {
		console.log(`[MOVEFOLDER] ${initPath} -> ${endPath}`);
		// back will then scan and send back whole hierarchy... maybe doing it here is better
		// clientSocket2.emit('moveFolder', { initPath, endPath, token: getLoginToken() })
		getClientApi2().then(api => {
			api.folders.move(initPath, endPath, () => {
				console.log(22223);
				api && api.ui.browser.goTo(api.ui.browser.folders.current.get)
				cb && cb()
			})
		})
	}

	const promptAndBatchMoveFiles = (files: iFile[], folderToDropInto: iFolder) => {
		getClientApi2().then(api => {
			api.popup.confirm(
				`Move <p>${files?.length}</p> file(s) to <p>"${folderToDropInto.key}"</p>?
<br>
<br>
Ressources links will be automatically updated<br>
${popupCommonStyle}
`,
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
		});
	}



	const promptAndMoveFolder = (p: {
		folder: iFolder,
		folderToDropInto: iFolder,
		folderBasePath: string,
		newTitle?: string,
		renameOnly?: boolean,
		onMoveFn?: Function
	}) => {
		
		const { folder, folderToDropInto, folderBasePath, newTitle, renameOnly } = { ...p }

		let rels = [
			folder.path,
			`${renameOnly ? getFolderParentPath(folderToDropInto) : folderToDropInto.path}/${newTitle ? newTitle : folder.title}`
		]

		let initPath = `${folderBasePath}/${rels[0]}`
		let endPath = `${folderBasePath}/${rels[1]}`

		getClientApi2().then(api => {
			api.popup.confirm(
				`
${strings.moveFolderPrompt} <p>${rels[0]}</p> to <p>${rels[1]}</p>?
${popupCommonStyle}
`,
				() => {
					
					askForMoveFolder(initPath, endPath, () => {
						emptyFileDetails()
						cleanFilesList()
						//cleanFolderHierarchy()
						askForFolderScan([getFolderParentPath(folder)],{ cache: false })
						if (p.onMoveFn) p.onMoveFn();
					})
					
				}
			);
		})
	}

	// let warn = `You are about to move the ${item.type} ${item.folder?.path} to ${folderToDropInto}${item.folder?.path}`
	// alert(warn)

	return { askForMoveFile, promptAndBatchMoveFiles, promptAndMoveFolder }
}
