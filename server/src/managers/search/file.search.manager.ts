import { cleanPath, getFileInfos } from "../../../../shared/helpers/filename.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileNameFromFilePath } from "../dir.manager";
import { fileStats } from "../fs.manager";
import { log } from "../log.manager";
import { getRelativePath, p } from "../path.manager";
const path = require('path');
const h = `[RIPGREP SEARCH2] `
const shouldLog = sharedConfig.server.log.ripgrep

// goal is to remove from a multiline string 1) the searchFolder 2) the rootPath
export const getRelativePathFromSearchPath = (rawString: string, searchFolder:string) => {
	let end = rawString
	// if folder does not end with /, add it

	// CAN BE MULTILINES
	let lines = rawString.split(/\r?\n/)
	let nLines: string[] = []
	lines = lines.map(rawLine => {
		// l = l.trim()
		// if (l.startsWith('/')) l = l.substring(1)
		// return l
		rawLine = rawLine.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1

		let fileName = path.basename(rawLine);
		// if starts by / remove it
		// fileName = fileName.substring(1)
		// return fileName
		let relativePath = rawLine
		relativePath = relativePath.split(`${backConfig.dataFolder}/${searchFolder}`).join('') 
		relativePath = relativePath.split(`${backConfig.dataFolder}${searchFolder}`).join('') 
		relativePath = relativePath.split(`${backConfig.dataFolder}\\${searchFolder}`).join('') 
		relativePath = relativePath.split(`${backConfig.dataFolder}`).join('') 
		relativePath = relativePath.split(`${fileName}`).join('') 

		let finalPath = cleanPath(`${relativePath}/${fileName}`)
		return finalPath

		
	})
	end = lines.join('\n')

	// if (!folder.endsWith('/')) folder = folder + '/'
	// end = end.split(`${folder}`).join('') // remove if folder is inside rawpath
	// end = end.split(`${backConfig.dataFolder}`).join('') 
	// end = end.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1
	// end = end.split(`${backConfig.dataFolder + folder}\\`).join('') // remove absolute path C:/Users/...
	// end = end.split(`${backConfig.dataFolder + folder}/`).join('') // remove absolute path x2
	// end = end.split(`${backConfig.dataFolder + folder}`).join('') // remove absolute path x3

	// rawString = rawString.split(/\:[0-9]+/g).join('')  // remove numbers like file.md:1
	// let fileName = path.basename(rawString);
	// // if starts by / remove it
	// if (fileName.startsWith('/')) fileName = fileName.substring(1)
	// end = fileName

	// let foldFull = backConfig.dataFolder + folder
	return end
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
	
	// console.log(1000, p)
	let res: iFile
	let relativeFilePath = getRelativePathFromSearchPath(rawPath, folder)
	relativeFilePath = cleanPath(relativeFilePath)

	// if relativeFilePath is a folder and not a file, relativeFilePath is the folder
	if (!relativeFilePath.includes(folder)) relativeFilePath = `${folder}/${relativeFilePath}`
	const isFolder = relativeFilePath.endsWith('/')
	let relativeFolder = isFolder ? relativeFilePath : path.dirname(relativeFilePath)

	

	// TITLE FILTER
	if (titleFilter !== '' && !relativeFilePath.toLowerCase().includes(titleFilter.toLowerCase())) return

	// get filename from filePath
	let fileName = path.basename(relativeFilePath);

	try {
		// let fullPath = `${backConfig.dataFolder}/${folder}/${relativeFilePath}`
		let fullPath = `${backConfig.dataFolder}/${relativeFilePath}`

		// if folder is not included in relativeFilePath, add it
		fullPath = cleanPath(fullPath)
		let stats = fileStats(fullPath)
		// console.log(223333, {fileName, fullPath, folder, relativeFilePath, relativeFolder})

		res = createIFile(fileName, relativeFolder, index, stats)
	} catch (error) {
		console.log(333, error)
		shouldLog && log(h, 'ERROR : ', error);
	}
	
	
	return res
}

export const processRawDataToFiles = (dataRaw: string, titleFilter: string = '', folder: string): iFile[] => {
	let res: iFile[] = []

	let cleanedData = getRelativePathFromSearchPath(dataRaw, folder)
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
