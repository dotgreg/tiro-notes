import { getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { backConfig } from "../config.back";
import { createDir } from "./dir.manager";
import { log } from "./log.manager";
import { getAppPathBase, p } from "./path.manager";

var http = require('http');
var https = require('https');
var fs = require('fs');


//////////////////////////
// METADATA FILES
//////////////////////////

const h = `[FS FILE]`

export interface iMetadataFile {
	name: string
}

export const openMetadataFile = async (path: string): Promise<iMetadataFile> => {
	return new Promise((resolve, reject) => {

	})
}

export const userHomePath = (): string => {
	let path = '../../'
	const homedir = require('os').homedir();
	if (fileExists(homedir)) path = homedir
	return path
}

export const getDefaultDataFolderPath = (): string => {
	let path = ''
	const homedir = userHomePath();
	if (fileExists(homedir)) path = `${homedir}/${backConfig.defaultDataFolder}`
	if (fileExists(`${homedir}/Desktop`)) path = `${homedir}/Desktop/${backConfig.defaultDataFolder}`
	if (fileExists(`${homedir}/Documents`)) path = `${homedir}/Documents/${backConfig.defaultDataFolder}`
	return path
}

//////////////////////////
// LOW LEVEL
//////////////////////////

export const openFile = async (path: string): Promise<string> => {
	path = p(path)

	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', (err, data: string) => {
			if (err) { log(`[READFILE] could not read ${path}`); reject('NO_FILE') }
			else resolve(data)
		});
	})
}

export const upsertRecursivelyFolders = async (fullPathToCheck: string) => {
	fullPathToCheck = p(fullPathToCheck)
	// check for each folder if it exists, else create it
	fullPathToCheck = fullPathToCheck.replace(backConfig.dataFolder, '')
	let pathArr = fullPathToCheck.split('/')
	const lastItem = pathArr[pathArr.length - 1]
	if (looksLikeAFile(lastItem)) pathArr.pop()// remove object.jpg, if lastItem looks like a file 
	pathArr.shift() // remove ""

	let createFoldersRecursively = async (path: string, pathArray: string[]) => {
		let fullPath = `${p(path)}/${pathArray[0]}`
		log(`createFoldersRecursively`, { path, pathArr, fullPath });
		if (!fileExists(fullPath)) {
			log('doesnt exists create it');
			await createDir(fullPath)
		}

		if (pathArr.length > 1) {
			pathArr.shift()
			log('pathArr > 1, new ', { pathArr });
			await createFoldersRecursively(fullPath, pathArr)
		}
	}
	await createFoldersRecursively(backConfig.dataFolder, pathArr)
	return
}

export const moveFile = async (pathInit: string, pathEnd: string): Promise<void> => {
	pathInit = p(pathInit)
	pathEnd = p(pathEnd)
	// check if file exists/not
	if (!fileExists(pathInit)) {
		log(`[MOVEFILE] ERROR : PATHINIT ${pathInit} DOESNT EXISTS`);
	} else {
		log(`[MOVEFILE] starting moving ${pathInit} -> ${pathEnd}`);

		return new Promise(async (resolve, reject) => {
			fs.rename(pathInit, pathEnd, (err) => {
				if (err) { log(`[MOVEFILE] Error ${err.message} (${pathInit} -> ${pathEnd})`); reject() }
				else resolve()
			});
		})
	}

}

export const saveFile = async (path: string, content: string): Promise<void> => {
	path = p(path)
	log(`[SAVEFILE] starting save ${path}`);
	return new Promise((resolve, reject) => {
		// fs.truncateSync(path)
		// fs.appendFile(path, content, (err) => {
		//     if (err) {error(`[SAVEFILE] Error ${err.message} (${path})`); reject()}
		//     else resolve()
		// }); 
		fs.writeFile(path, content, (err) => {
			if (err) { log(`[SAVEFILE] Error ${err.message} (${path})`); reject() }
			else resolve()
		});
	})
}

export const createFolder = async (path: string): Promise<void> => {
	path = p(path)

	log(`[CREATEFOLDER] at ${path}`);
	return new Promise((resolve, reject) => {
		fs.mkdir(path, (err) => {
			if (err) { log(`[CREATEFOLDER] Error ${err.message} (${path})`); reject() }
			else resolve()
		});
	})
}

export const copyFile = async (pathOriginal: string, pathDestination: string): Promise<void> => {
	pathOriginal = p(pathOriginal)
	pathDestination = p(pathDestination)

	return new Promise((resolve, reject) => {
		fs.copyFile(pathOriginal, pathDestination, (err) => {
			if (err) { log(`[COPYFILE] Error ${err.message}`); reject() }
			else resolve()
		});
	})
}

export const removeFile = async (filepath: string): Promise<void> => {
	filepath = p(filepath)
	return new Promise((resolve, reject) => {
		fs.unlink(filepath, (err) => {
			if (err) { log(`[REMOVE FILE] Error ${err.message}`); reject() }
			else resolve()
		});
	})
}

export const fileExists = (path: string): boolean => {
	path = p(path)
	try {
		return fs.existsSync(path)
	} catch (error) {
		log(`[fileExists] error : `, error);

		return false
	}
}

export const fileStats = (path: string): any => {
	try {
		return fs.lstatSync(path)
	} catch (error) {
		return false
	}
}

export const looksLikeAFile = (path: string): boolean => {
	// a file looks like having an extension,
	// ie a string > "." > string (1 to 10)
	let res = false
	const pathArr = path.split('.')
	if (
		pathArr.length >= 2 &&
		pathArr[pathArr.length - 2].length > 0 &&
		pathArr[pathArr.length - 1].length > 0
	) res = true

	return res
}

export const isDir = (path: string): boolean => {
	try {
		let stats = fileStats(path)
		return stats ? stats.isDirectory() : false
	} catch (error) {
		// log(3, error);
		return false
	}
}

const isHttps = (url: string) => url.indexOf("https") === 0;

export const downloadFile = async (url: string, folder: string): Promise<string> => {
	folder = p(folder)
	let path = `${folder}/${getRessourceIdFromUrl(url)}`
	log(`[DOWNLOAD FILE] ${url} to folder ${folder} => ${path}`);
	if (!url) return
	let client = isHttps(url) ? https : http
	return new Promise((resolve, reject) => {
		let file = fs.createWriteStream(path);
		client.get(url, (response) => {
			response.pipe(file);
			file.on('finish', () => {
				file.close();  // close() is async, call cb after close completes.
				log(`[DOWNLOAD FILE] downloaded ${url} to ${path}`);
				resolve(path)
			});
		}).on('error', (err) => { // Handle errors
			fs.unlink(path, () => {}); // Delete the file async. (But we don't check the result)
			log(`[DOWNLOAD FILE] error  ${err.message} ({url} to ${path})$`)
			reject(err.message);
		});
	})
}


export interface iFileStats {
	dev: number
	mode: number
	nlink: number
	uid: number
	gid: number
	rdev: number
	blksize: number
	ino: number
	size: number
	blocks: number
	atimeMs: number
	mtimeMs: number
	ctimeMs: number
	birthtimeMs: number
	atime: Date
	mtime: Date
	ctime: Date
	birthtime: Date
}
