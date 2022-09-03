import { info } from "console"
import { debounce, random } from "lodash"
import { iApiDictionary } from "../../../shared/apiDictionary.type"
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper"
import { regexs } from "../../../shared/helpers/regexs.helper"
import { iFolder } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { normalizeString, removeSpecialChars } from "../helpers/string.helper"
import { dirDefaultBlacklist, scanDirForFiles } from "./dir.manager"
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { log } from "./log.manager"
import { ServerSocketManager } from "./socket.manager"

export const generateNewFileName = (actualFileName: string): string => `${removeSpecialChars(normalizeString(actualFileName))}-${random(0, 1000)}`

export const generateUniqueAbsFilePath = (absFilePath: string, increment?: number): string => {
	if (!increment) increment = 0
	let res = ''
	let finfos = getFileInfos(absFilePath)

	// first check if that file exists
	const incrementStr = increment !== 0 ? `-${increment}` : ''
	const processedFileName = removeSpecialChars(normalizeString(finfos.filenameWithoutExt))
	let newAbsPathToTest = `${finfos.folder}${processedFileName}${incrementStr}.${finfos.extension}`

	if (fileExists(newAbsPathToTest)) {
		console.log(665, finfos, incrementStr, newAbsPathToTest);
		return generateUniqueAbsFilePath(absFilePath, increment + 1)
	} else {
		console.log(666, finfos, incrementStr, newAbsPathToTest);
		return newAbsPathToTest
	}
}




export const debouncedFolderScan = debounce(
	async (
		socket: ServerSocketManager<iApiDictionary>,
		initPath: string,
		idReq: string
	) => {
		let folderPathArr = initPath.split('/')
		folderPathArr.pop()
		let folderPath = folderPathArr.join('/')
		log(`[HEAVY] ==> debouncedScanAfterMove for ${folderPath}`);

		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${folderPath}`)
		if (typeof (apiAnswer) === 'string') return log(apiAnswer)
		socket.emit('getFiles', { files: apiAnswer, idReq })
	}, 100)





export const moveNoteResourcesAndUpdateContent = async (initPath: string, endPath: string, simulate: boolean = false) => {
	if (simulate) log(`[moveNoteResourcesAndUpdateContent] SIMULATE MODE`);

	let filecontent = null
	try {
		filecontent = await openFile(`${backConfig.dataFolder}/${initPath}`)
	} catch { }
	if (!filecontent) return

	let initFolderPathArr = initPath.split('/')
	initFolderPathArr.pop()
	let initFolderPath = initFolderPathArr.join('/')

	let endFolderPathArr = endPath.split('/')
	endFolderPathArr.pop()
	let endFolderPath = endFolderPathArr.join('/')

	let matches = filecontent.match(regexs.ressource)
	let newFileContent = filecontent
	if (!matches || !matches.length) return log('[moveNoteResourcesAndUpdateContent] no resources found, skipping');


	for (let i = 0; i < matches.length; i++) {
		const rawResource = matches[i];

		const nameResource = rawResource.replace(regexs.ressource, '$1')
		const pathResource = rawResource.replace(regexs.ressource, '$2')
		let pathsToCheck = [
			`${backConfig.dataFolder}/${pathResource}`,
			`${backConfig.dataFolder}/${initFolderPath}/${pathResource}`,
		]

		for (let y = 0; y < pathsToCheck.length; y++) {
			let fileDoesExist = fileExists(pathsToCheck[y])
			!fileDoesExist && log(`===> ${pathsToCheck[y]} not found`);
			if (fileDoesExist) {
				// if yes, move it to endPath/.resources/UNIQUEID.jpg
				let initResourcePathArr = pathsToCheck[y].split('/')
				let filenameArr = initResourcePathArr.pop().split('.')
				let extension = filenameArr[filenameArr.length - 1]

				// let newFilename = `${generateNewFileName(nameResource)}.${extension}`
				let endFolderPathAbs = cleanPath(`${backConfig.dataFolder}/${endFolderPath}/`)
				let uncheckedEndResourcePath = `${endFolderPathAbs}${backConfig.relativeUploadFolderName}/${nameResource}.${extension}`
				let checkedEndResourcePath = generateUniqueAbsFilePath(uncheckedEndResourcePath)
				let checkedEndResourceRelPath = checkedEndResourcePath.replace(endFolderPathAbs, '')



				let moveSumup = `[MOVE] Resource note move:  ${pathsToCheck[y]} (exists) -> ${checkedEndResourcePath}`
				await upsertRecursivelyFolders(checkedEndResourcePath)
				if (!simulate) {
					await moveFile(pathsToCheck[y], checkedEndResourcePath)
					// change contentfile
					let mdResource = `![${nameResource}](${checkedEndResourceRelPath})`
					newFileContent = newFileContent.replace(matches[i], mdResource)
				}
			}
		}
	}

	if (!simulate) await saveFile(`${backConfig.dataFolder}/${initPath}`, newFileContent)
}
