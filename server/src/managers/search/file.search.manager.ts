import { cleanPath, getFileInfos } from "../../../../shared/helpers/filename.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileStats } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath, p } from "../path.manager";

const h = `[RIPGREP SEARCH2] `
const shouldLog = sharedConfig.server.log.ripgrep

export const cleanFileNamePath = (rawString: string, folder) => {
	let init = rawString
	// if folder does not end with /, add it
	if (!folder.endsWith('/')) folder = folder + '/'
	rawString = rawString.split(`${folder}`).join('') // remove if folder is inside rawpath
	// rawString = rawString.split(`${folder}/`).join('') // remove if folder is inside rawpath
	// rawString = rawString.split(`${folder}\\`).join('') // remove if folder is inside rawpath
	rawString = rawString.split(`${backConfig.dataFolder}`).join('') 
	rawString = rawString.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1
	rawString = rawString.split(`${backConfig.dataFolder + folder}\\`).join('') // remove absolute path C:/Users/...
	rawString = rawString.split(`${backConfig.dataFolder + folder}/`).join('') // remove absolute path x2
	rawString = rawString.split(`${backConfig.dataFolder + folder}`).join('') // remove absolute path x3
	// let foldFull = backConfig.dataFolder + folder
	// console.log(JSON.stringify({init, foldFull, rawString, folder}))
	return rawString
}

export const cleanFolderPath = ( folder) => {
	folder = folder.split(`${backConfig.dataFolder}`).join('') 
	return folder
}

export const processRawPathToFile = (p: {
	rawPath: string
	folder: string
	index?: number
	titleFilter?: string
}): iFile => {
	let { rawPath, folder, index, titleFilter } = { ...p }
	if (!index) index = 0
	if (!titleFilter) titleFilter = ''

	let res: iFile
	let cleanedFileNamePath = cleanPath(cleanFileNamePath(rawPath, folder))
	folder = cleanFolderPath(folder)

	// TITLE FILTER
	if (titleFilter !== '' && !cleanedFileNamePath.toLowerCase().includes(titleFilter.toLowerCase())) return

	try {
		let fullPath = `${backConfig.dataFolder}/${folder}/${cleanedFileNamePath}`
		let stats = fileStats(fullPath)
		res = createIFile(cleanedFileNamePath, folder, index, stats)
	} catch (error) {
		shouldLog && log(h, 'ERROR : ', error);
	}
	
	return res
}

export const processRawDataToFiles = (dataRaw: string, titleFilter: string = '', folder: string): iFile[] => {
	let res: iFile[] = []

	let cleanedData = cleanFileNamePath(dataRaw, folder)
	var array = cleanedData.match(/[^\r\n]+/g); // split string in array

	if (!array || array.length ===0) return res
	for (let i = 0; i < array.length; i++) {
		let filePath = array[i];
		const fileRes = processRawPathToFile({ rawPath: filePath, folder, index: i, titleFilter })
		res.push(fileRes)
	}
	return res
}


export const createIFile = (name: string, folder: string, index: number, stats: any): iFile => {
	folder = getRelativePath(folder)
	// clean name of possibe path inside
	const nameArr = name.split('/')
	let realName = nameArr.pop()
	let fullFolder = folder
	fullFolder = `${fullFolder}/${nameArr.join('/')}`
	const path = cleanPath(`${fullFolder}/${realName}`)
	let filesInfos = getFileInfos(path)

	
	return {
		nature: 'file',
		extension: `${filesInfos.extension}`,
		index,
		created: Math.round(stats.birthtimeMs),
		modified: Math.round(stats.ctimeMs),
		name: cleanPath(`${realName}`),
		realname: `${realName}`,
		filenameWithoutExt: `${filesInfos.filenameWithoutExt}`,
		path,
		folder: cleanPath(`${fullFolder}/`),
		stats
	}
}
