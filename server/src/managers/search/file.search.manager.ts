import { cleanPath } from "../../../../shared/helpers/filename.helper";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileStats } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath } from "../path.manager";

const h = `[RIPGREP SEARCH] `
export const cleanFilePath = (rawString: string) => {
	rawString = rawString.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1
	rawString = rawString.split(`${backConfig.dataFolder}\\`).join('') // remove absolute path C:/Users/...
	rawString = rawString.split(`${backConfig.dataFolder}/`).join('') // remove absolute path x2
	rawString = rawString.split(`${backConfig.dataFolder}`).join('') // remove absolute path x3
	// rawString = rawString.split(`${backConfig.dataFolder}`).join('') // remove absolute path x3
	// rawString = rawString.split(`${folder}`).join('') // remove absolute path x3
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
	index?: number
	titleFilter?: string
}): iFile => {
	let { rawPath, index, titleFilter } = { ...p }
	if (!index) index = 0
	if (!titleFilter) titleFilter = ''

	let res: iFile
	let cleanedData = cleanPath(cleanFilePath(rawPath))
	// let folder = cleanedData.split("/").pop().join("/")
	let folderArr = cleanedData.split("/")
	folderArr.pop()
	let folder = folderArr.join("/")

	// console.log(33555, cleanedData, folder);
	let filePath = cleanPath(cleanedData)

	// TITLE FILTER
	if (titleFilter !== '' && !filePath.toLowerCase().includes(titleFilter.toLowerCase())) return

	try {
		const absPath = `${backConfig.dataFolder}/${folder}/${filePath}`
		let stats = fileStats(absPath)
		res = createIFile(filePath, folder, index, stats)
	} catch (error) {
		log(h, 'ERROR : ', error);
	}
	return res
}

export const processRawDataToFiles = (dataRaw: string, titleFilter: string = ''): iFile[] => {
	let res: iFile[] = []

	let cleanedData = cleanFilePath(dataRaw)
	var array = cleanedData.match(/[^\r\n]+/g); // split string in array

	for (let i = 0; i < array.length; i++) {
		let filePath = array[i];
		const fileRes = processRawPathToFile({ rawPath: filePath, index: i, titleFilter })
		res.push(fileRes)
	}
	return res
}


export const createIFile = (name: string, folder: string, index: number, stats: any): iFile => {
	folder = getRelativePath(cleanPath(folder))
	// clean name of possibe path inside
	const nameArr = name.split('/')
	let realName = nameArr.pop()

	// console.log(447, { folder, nameArr, realName });
	return {
		nature: 'file',
		extension: 'md',
		index,
		created: Math.round(stats.birthtimeMs),
		modified: Math.round(stats.ctimeMs),
		name: `${realName}`,
		realname: `${realName}`,
		path: cleanPath(`/${folder}/${realName}`),
		folder: cleanPath(`/${folder}/`),
	}
}
