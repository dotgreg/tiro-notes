import { info } from "console"
import { debounce, random } from "lodash"
import { iApiDictionary } from "../../../shared/apiDictionary.type"
import { cleanPath, getFileInfos, pathToIfile } from "../../../shared/helpers/filename.helper"
import { regexs } from "../../../shared/helpers/regexs.helper"
import { iFolder } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { normalizeString, removeSpecialChars } from "../helpers/string.helper"
import { dirDefaultBlacklist, scanDirForFiles } from "./dir.manager"
import { getHistoryFolder } from "./fileHistory.manager"
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { log } from "./log.manager"
import { perf } from "./performance.manager"
import { ServerSocketManager } from "./socket.manager"


export const moveFileLogic = async (initPath:string, endPath:string) => {
	log(`=> MOVING FILE ${backConfig.dataFolder}${initPath} -> ${endPath}`);
	let endPerf = perf('moveFile ' + initPath + ' to ' + endPath)
	// upsert folders if not exists and move file
	log(`===> 1/5 creating folders ${endPath}`);
	await upsertRecursivelyFolders(endPath)

	let f1 = getFileInfos(initPath)
	let f2 = getFileInfos(endPath)
	if (f1.folder !== f2.folder) {
		log(`===> 2/5 moveNoteResourcesAndUpdateContent`);
		await moveNoteResourcesAndUpdateContent(initPath, endPath)
	} else {
		log(`===> 2/5 DO NOTHING, SAME FOLDER moveNoteResourcesAndUpdateContent`);
	}

	log(`===> 3/5 moveFile`);
	let fullInitPath = `${backConfig.dataFolder}${initPath}`
	let fullEndPath = `${backConfig.dataFolder}${endPath}`
	await moveFile(fullInitPath, fullEndPath)
	
	log(`===> 4/5 moveFileHistory`);
	let initFile = pathToIfile(fullInitPath)
	let endFile = pathToIfile(fullEndPath)
	if (initFile.extension === "md") {
		let initFolderHistory = getHistoryFolder(initFile)
		let endFolderHistory = getHistoryFolder(endFile)
		await upsertRecursivelyFolders(endFolderHistory)
		console.log(initFolderHistory, endFolderHistory)
		await moveFile(initFolderHistory, endFolderHistory)
	}


	endPerf()
}

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
		return generateUniqueAbsFilePath(absFilePath, increment + 1)
	} else {
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

		let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${folderPath}`, socket)
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

		const nameResourceMd = rawResource.replace(regexs.ressource, '$1')
		const pathResource = rawResource.replace(regexs.ressource, '$2')
		let pathsToCheck = [
			`${backConfig.dataFolder}/${pathResource}`,
			`${backConfig.dataFolder}/${initFolderPath}/${pathResource}`,
		]

		for (let y = 0; y < pathsToCheck.length; y++) {
			let fileDoesExist = fileExists(pathsToCheck[y])
			!fileDoesExist && log(`===> ${pathsToCheck[y]} not found`);
			if (fileDoesExist) {
				// let initResourcePathArr = pathsToCheck[y].split('/')
				// let filenameArr = initResourcePathArr.pop().split('.')
				// let extension = filenameArr[filenameArr.length - 1]

				let initFileInfos = getFileInfos(pathsToCheck[y])

				// if yes, move it to endPath/.resources/UNIQUEID.jpg
				let endFolderPathAbs = cleanPath(`${backConfig.dataFolder}/${endFolderPath}/`)
				let uncheckedEndResourcePath = `${endFolderPathAbs}${backConfig.relativeUploadFolderName}/${initFileInfos.filename}`
				let checkedEndResourcePath = generateUniqueAbsFilePath(uncheckedEndResourcePath)
				let checkedEndResourceRelPath = checkedEndResourcePath.replace(endFolderPathAbs, '')





				let moveSumup = `[MOVE] Resource note move:  ${pathsToCheck[y]} (exists) -> ${checkedEndResourcePath}`
				await upsertRecursivelyFolders(checkedEndResourcePath)
				if (!simulate) {
					await moveFile(pathsToCheck[y], checkedEndResourcePath)
					// change contentfile
					let mdResource = `![${nameResourceMd}](${checkedEndResourceRelPath})`
					newFileContent = newFileContent.replace(matches[i], mdResource)
				}
			}
		}
	}

	if (!simulate) await saveFile(`${backConfig.dataFolder}/${initPath}`, newFileContent)
}
