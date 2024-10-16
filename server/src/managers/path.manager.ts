import { cleanPath } from '../../../shared/helpers/filename.helper'
import { backConfig } from '../config.back'
import { userHomePath } from './fs.manager'
import { log } from './log.manager'

const nodeEnv = process.env.NODE_ENV || ''
export const isEnvDev = (): boolean => nodeEnv.trim() === 'development' ? true : false
export const getAppPathBase2 = () => isEnvDev() ? '../../..' : '..'
export const getAppPathBase = () => isEnvDev() ? '..' : '..'


const path = require('path')

// export const

const isAbsolute = (filePath: string) => {
	let res = false
	if (filePath.endsWith('/') || filePath.endsWith('\\')) filePath = filePath.slice(0, -1)
	const res1 = path.resolve(filePath)
	const norm = path.normalize(filePath)
	res = res1 === norm

	// if (filePath.startsWith(userHomePath())) res = true
	return res
}

export const getFolderPath = (filePath: string): string => {
	return path.dirname(filePath)
}

// /absolutePath/image.jpg to ./image.jpeg
export const getRelativePath = (pathFile: string): string => {

	if (backConfig && backConfig.dataFolder) {
		pathFile = cleanPath(pathFile)
		// remove dataFolder
		pathFile = pathFile.split(backConfig.dataFolder).join('')
		// pathFile = pathFile.replace(backConfig.dataFolder, '')
	}
	return pathFile
}
// export const getAbsolutePath = (pathFile: string): string => {
// 	let res = getRelativePath(pathFile)
// 	res = cleanPath(backConfig.dataFolder + res)
// 	return res
// }

export const relativeToAbsolutePath = (pathFile: string): string => {

	let oldpathFile = pathFile
	// if (pathFile) {
	//     if (pathFile[0] === '/' || pathFile[0] === '\\') pathFile = pathFile.substr(1)
	// } else {
	//     pathFile = ''
	// }
	if (!pathFile) {
		pathFile = ''
	}

	let osHomeDir = require('os').homedir()
	if (pathFile.startsWith(osHomeDir)) {
		// do nothing, already absolute

	} else if (backConfig && backConfig.dataFolder) {
	    pathFile = pathFile.split(backConfig.dataFolder).join('')
	    pathFile = `${backConfig.dataFolder}${pathFile}`
	
		// let rootFolder
		// let basePath
		// if (!isAbsolute(pathFile)) {
		// 	if (insideSnapshot) {
		// 		basePath = isEnvDev() ? '../../..' : '..'
		// 		rootFolder = __dirname
		// 	} else {
		// 		// will be exec 
		// 		basePath = isEnvDev() ? '..' : ''
		// 		rootFolder = process.cwd()
		// 	}
		// 	pathFile = path.join(rootFolder, `${basePath}/${pathFile}`)
		// }
	}
	
	pathFile = cleanPath(pathFile)
	// console.log({oldpathFile, pathFile, insideSnapshot})
	return pathFile
}

export const p = relativeToAbsolutePath

export const getFrontendRelativePath = (pathFile:string) => {
	let rootFolder
	let basePath
	let old = pathFile
	if (!isAbsolute(pathFile)) {
		// if (insideSnapshot) {
			basePath = isEnvDev() ? '../../..' : '..'
			rootFolder = __dirname
		// } else {
		// 	// will be exec 
		// 	basePath = isEnvDev() ? '..' : ''
		// 	rootFolder = process.cwd()
		// }
	}
	
	pathFile = path.join(rootFolder, `${basePath}/${pathFile}`)
	console.log("getFrontendRelativePath", {old, pathFile, isAbsolute: isAbsolute(pathFile)})
	return pathFile
}