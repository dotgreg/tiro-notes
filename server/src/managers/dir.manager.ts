import execa = require("execa");
import { exists } from "fs";
import { random } from "lodash";
import { getDefaultFormatCodeSettings } from "typescript";
import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { cleanPath } from "../../../shared/helpers/filename.helper";
import { iFile, iFolder } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { getServerTaskId, setServerTaskId } from "../routes";
import { fileExists, fileStats, isDir } from "./fs.manager";
import { log } from "./log.manager";
import { p } from "./path.manager";
import { getPlatform } from "./platform.manager";
import { ServerSocketManager } from './socket.manager'

var fs = require('fs')
const path = require('path')

export let dirDefaultBlacklist = ['.resources', '_resources']

export const createDir = async (path: string, mask: number = 0o775): Promise<null | string> => {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, 0o775, (err) => {
			if (err) {
				if (err.code == 'EEXIST') resolve(null); // ignore the error if the folder already exists
				else reject(err.message); // something else went wrong
			} else {
				resolve(null); // successfully created folder
			}
		});
	});
}

export const fileNameFromFilePath = (path: string): string => {
	let fileName = path.split('/').join('_')
	fileName = fileName.split('\\').join('_')
	return fileName
}

export const scanDirForFolders = (folderPath: string): iFolder => {
	const fullFolderPath = cleanPath(`${backConfig.dataFolder}${folderPath}`)

	if (!fileExists(fullFolderPath)) return
	var folderStats = fileStats(fullFolderPath)
	let relativeFolder = cleanPath(fullFolderPath).replace(cleanPath(backConfig.dataFolder), '')
	const resultFolder: iFolder = {
		path: relativeFolder,
		hasChildren: false,
		title: path.basename(fullFolderPath),
		key: relativeFolder
	};
	if (folderStats.isDirectory()) {
		resultFolder.hasChildren = true
		resultFolder.children = []
		fs.readdirSync(fullFolderPath).map((child) => {

			let fullChildPath = fullFolderPath + '/' + child

			try {
				let childStats = fileStats(fullChildPath)
				if (childStats.isDirectory() && dirDefaultBlacklist.indexOf(path.basename(child)) === -1) {
					// if (fullChildPath.indexOf('.tiro') !== -1) log('1212', fullChildPath)
					let relativeChildFolder = cleanPath(fullChildPath).replace(cleanPath(backConfig.dataFolder), '')

					let childFolder: iFolder = {
						hasChildren: false,
						path: relativeChildFolder,
						title: path.basename(relativeChildFolder),
						key: relativeChildFolder
					}

					// WITHOUT READDIR 0.026s
					// WITH READDIR fullChildPath 0.026s kiff kiff
					// WITH READDIR fullChildPath + loop 0.026s kiff kiff
					// WITH READDIR fullChildPath + loop + lstatSync + isDir 0.300s /10 perfs
					// WITH READDIR fullChildPath + loop + checkDir from name 0.030s x10 times faster
					// LAST + LOG EACH ITE = 4s = PERFS /100!!!

					const subchildren: string[] = fs.readdirSync(fullChildPath)
					for (let i = 0; i < subchildren.length; i++) {
						const child2 = subchildren[i];
						let fullChild2Path = fullChildPath + '/' + child2

						// take in account .folder like .tiro and .trash
						let child2temp = child2[0] === '.' ? child2.substr(1) : child2
						const hasExtension = child2temp.split('.').length > 1

						if (dirDefaultBlacklist.indexOf(path.basename(child2)) === -1 && !hasExtension) {
							childFolder.hasChildren = true
							break;
						}

						// 10x times slower
						// let child2Stats = fs.lstatSync(fullChild2Path)
						// if (child2Stats.isDirectory() && dirDefaultBlacklist.indexOf(path.basename(child2)) === -1) {
						//     childFolder.hasChildren = true
						//     break;
						// }
					}

					resultFolder.children.push(childFolder)
				}
			} catch (error) {
				log("scanDirForFolders => error " + error);
			}
		});
	}
	return resultFolder
}

export const lastFolderFilesScanned = { value: "" }
export const rescanEmitDirForFiles = async (serverSocket2: ServerSocketManager<iApiDictionary>) => {
	let apiAnswer = await scanDirForFiles(lastFolderFilesScanned.value)
	if (typeof (apiAnswer) === 'string') return log(apiAnswer)
	serverSocket2.emit('getFiles', { files: apiAnswer })
}

export const scanDirForFiles = async (path: string): Promise<iFile[] | string> => {
	path = p(path)

	lastFolderFilesScanned.value = path
	const blacklist = dirDefaultBlacklist
	const taskId = random(0, 10000)
	setServerTaskId(taskId)

	log(`[scanDirForFiles] path : ${path} w taskid ${taskId}`);

	return new Promise((resolve, reject) => {
		let filesScanned: iFile[] = []
		fs.readdir(path, async (err, files) => {
			if (!files) return reject(err.message)
			let counterFilesStats = 0
			if (files.length === 0) resolve([])
			for (let i = 0; i < files.length; i++) {

				// if taskId changed, stop the for loop
				if (taskId !== getServerTaskId()) {
					log(`[SCANDIRFORFILE] taskId changed, stopping it, scanId ${taskId} !== ${getServerTaskId()}`)
					break;
				}

				const fileName = files[i];
				let filePath = `${path}/${fileName}`
				const stats = fileStats(filePath)
				if (!fileExists(filePath) || !stats) {
					counterFilesStats++
					if (counterFilesStats === files.length) resolve(filesScanned)
				} else {
					// ON LINUX ONLY, MAKE SURE CREATION DATE IS IN RIGHT 
					let createdDate = stats.atimeMs
					if (getPlatform() === 'linux') {
						if (stats.mtimeMs < stats.atimeMs) {
							createdDate = stats.mtimeMs
							const ndate = new Date(stats.mtimeMs)
							const touchDateFormat = ndate.getFullYear() + '' + ('0' + ndate.getMonth()).slice(-2) + '' + ('0' + ndate.getDay()).slice(-2) + ('0' + ndate.getHours()).slice(-2) + ('0' + ndate.getMinutes()).slice(-2)
							const cmd = `touch -t ${touchDateFormat} '${filePath}'`
							log(`[scanDirForFiles > STAT] ${filePath} stats.mtimeMs < stats.atimeMs => equalize : ${cmd}`);
							execa.command(cmd)
						}
					}


					// counter++
					let extensionArr = fileName.split('.')
					let extension = extensionArr[extensionArr.length - 1]
					let folder = path.replace(backConfig.dataFolder, '').replace('//', '/')

					// packs everything
					let fileObj: iFile = {
						nature: isDir(`${path}/${fileName}`) ? 'folder' : 'file',
						name: fileName,
						realname: fileName,
						index: i,
						extension,
						folder,
						created: Math.round(createdDate),
						modified: Math.round(stats.ctimeMs),
						path: `${folder}/${fileName}`,
					}
					if (blacklist.indexOf(fileName) === -1) {
						filesScanned.push(fileObj)
					}

					counterFilesStats++
					if (counterFilesStats === files.length) {
						setServerTaskId(-1)
						resolve(filesScanned)
					}
				}
			}
		});
	})
}
