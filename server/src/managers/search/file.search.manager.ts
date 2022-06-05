import { cleanPath } from "../../../../shared/helpers/filename.helper";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileStats } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath } from "../path.manager";

const h = `[RIPGREP SEARCH] `
export const cleanFilePath = (rawString: string, folder) => {
	rawString = rawString.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1
	rawString = rawString.split(`${backConfig.dataFolder + folder}\\`).join('') // remove absolute path C:/Users/...
	rawString = rawString.split(`${backConfig.dataFolder + folder}/`).join('') // remove absolute path x2
	rawString = rawString.split(`${backConfig.dataFolder + folder}`).join('') // remove absolute path x3
	//rawString = rawString.split(`${backConfig.dataFolder}/${folder}`).join('') // remove absolute path x3
	//	rawString = rawString.split(`${backConfig.dataFolder}`).join('') // remove absolute path x4
	return rawString
}

// export const processRawPathToFile = (p:{
// 	rawPath: string
// 	folder: string
// 	index: number = 0
// 	titleFilter: string = ''
// }): iFile => {

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
	let cleanedData = cleanFilePath(rawPath, folder)
	let filePath = cleanPath(cleanedData)

	// TITLE FILTER
	if (titleFilter !== '' && !filePath.toLowerCase().includes(titleFilter.toLowerCase())) return

	try {
		let stats = fileStats(`${backConfig.dataFolder}/${folder}/${filePath}`)
		res = createIFile(filePath, folder, index, stats)
	} catch (error) {
		log(h, 'ERROR : ', error);
	}
	return res
}

export const processRawDataToFiles = (dataRaw: string, titleFilter: string = '', folder: string): iFile[] => {
	let res: iFile[] = []

	let cleanedData = cleanFilePath(dataRaw, folder)
	var array = cleanedData.match(/[^\r\n]+/g); // split string in array

	for (let i = 0; i < array.length; i++) {
		let filePath = array[i];
		const fileRes = processRawPathToFile({rawPath: filePath, folder, index: i, titleFilter})
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

	return {
		nature: 'file',
		extension: 'md',
		index,
		created: Math.round(stats.birthtimeMs),
		modified: Math.round(stats.ctimeMs),
		name: cleanPath(`${realName}`),
		realname: `${realName}`,
		path: cleanPath(`${fullFolder}/${realName}`),
		folder: cleanPath(`${fullFolder}/`),
	}
}
