import { each, random, reject } from "lodash";
import { createGunzip, createGzip} from 'zlib';
import { getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { sharedConfig } from "../../../shared/shared.config";
import { iDownloadRessourceOpts } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { createDir } from "./dir.manager";
import { log } from "./log.manager";
import { p } from "./path.manager";
import { perf } from "./performance.manager";
import { evalBackendCode, iAnswerBackendEval } from "./eval.manager";
import { ioServer } from "../server";

// var http = require('http');
// var https = require('https');
var http = require('follow-redirects').http;
var https = require('follow-redirects').https;
var fs = require('fs');


//////////////////////////
// METADATA FILES
//////////////////////////

const h = `[FS FILE]`
const shouldLog = sharedConfig.server.log.fs
// const shouldLog = true

export default interface iMetadataFile {
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
			if (err) { shouldLog && log(`[READFILE] could not read ${path}`); reject('NO_FILE') }
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
		shouldLog && log(`createFoldersRecursively`, { path, pathArr, fullPath });
		if (!fileExists(fullPath)) {
			shouldLog && log('doesnt exists create it');
			await createDir(fullPath)
		}

		if (pathArr.length > 1) {
			pathArr.shift()
			shouldLog && log('pathArr > 1, new ', { pathArr });
			await createFoldersRecursively(fullPath, pathArr)
		}
	}
	await createFoldersRecursively(backConfig.dataFolder, pathArr)
	return
}

export const moveFile = async (pathInit: string, pathEnd: string): Promise<{ success: boolean, error?: string }> => {
	pathInit = p(pathInit)
	pathEnd = p(pathEnd)
	// check if file exists/not
	if (!fileExists(pathInit)) {
		shouldLog && log(`[MOVEFILE] ERROR : PATHINIT ${pathInit} DOESNT EXISTS`);
		return { success: false, error: `PATHINIT_DOES_NOT_EXIST pathInit:${pathInit} pathEnd:${pathEnd}`};
	} else {
		shouldLog && log(`[MOVEFILE] starting moving ${pathInit} -> ${pathEnd}`);

		try {
			await fs.renameSync(pathInit, pathEnd)
			return { success: true };
		} catch (error) {
			// console.log(h, `error rename file ${pathInit} -> ${pathEnd}`, error)
			log(`[MOVEFILE] Error ${error.message} (${pathInit} -> ${pathEnd})`);
			return { success: false, error: `${error.message} pathInit:${pathInit} pathEnd:${pathEnd}` };
		}
	}
}


export const saveFile = async (path: string, content: string, opts?:{updateClients?: boolean}): Promise<void> => {
	if (!opts) opts = {}
	if (opts.updateClients == null) opts.updateClients = false

	path = p(path)
	const h = `[SAVEFILE]`
	shouldLog && log(`${h} starting save ${path}`);


	path = p(path)

	try {
		await fs.writeFileSync(path, content)

		if (opts?.updateClients === true) {
			console.log('EMIT IO NOTE WATCH UPDATE')
			ioServer.emit('onNoteWatchUpdate', {
				filePath: path,
				fileContent: content
			})
		}

	} catch (error) {
		console.log(h, error)
		return error 
	}
}

export const prependToFile = async (path: string, content: string): Promise<void> => {
	path = p(path)
	shouldLog && log(`[PREPENDFILE] starting save ${path}`);
	// get existing content
	let currContent = ""
	try {
		currContent = await openFile(path)
	} catch(e) {}

	let nContent = content + currContent
	return await saveFile(path, nContent)
}

export const createFolder = async (path: string): Promise<void> => {
	path = p(path)

	shouldLog && log(`[CREATEFOLDER] at ${path}`);
	return new Promise((resolve, reject) => {
		fs.mkdir(path, (err) => {
			if (err) { shouldLog && log(`[CREATEFOLDER] Error ${err.message} (${path})`); reject() }
			else resolve()
		});
	})
}

export const copyFile = async (pathOriginal: string, pathDestination: string): Promise<void> => {
	pathOriginal = p(pathOriginal)
	pathDestination = p(pathDestination)

	return new Promise((resolve, reject) => {
		fs.copyFile(pathOriginal, pathDestination, (err) => {
			if (err) { shouldLog && log(`[COPYFILE] Error ${err.message}`); reject() }
			else resolve()
		});
	})
}

export const deleteFolder = async (path: string): Promise<void|Error> => {
	path = p(path)
	const h = `[REMOVE FILE]`

	try {
		if (fs.existsSync(path)) {
			shouldLog && console.log(`${h} Deleting folder ${path}`)
			await fs.rmSync(path, { recursive: true })
		} else {
			shouldLog && console.log(`${h} ${path} does not exists, do nothing`)
		}
	} catch (error) {
		shouldLog && log(`${h} Error removing ${path} : ${error.message}`); 
		return error
	}
	return
}



// zip/unzip using unzipper
export const unzip = (
	zipFilePath: string, 
	destFolder: string, 
	cb: (res:any) => void,
	opts?:{override:boolean}
) => {
	if (!opts) opts = { override: true }
	if (!opts.override) opts.override = true
	const unzipper = require('unzipper');

	zipFilePath = p(zipFilePath)
	destFolder = p(destFolder)
	shouldLog && log(`[UNZIP] ${zipFilePath} -> ${destFolder}`);

	fs.createReadStream(zipFilePath)
		.pipe(unzipper.Extract({ path: destFolder }))
		.on('close', (message) => {
			shouldLog && log(`[UNZIP] Finished unzipping ${zipFilePath} to ${destFolder}`);
			cb({ success: true, message });
		})
		.on('error', (err) => {
			shouldLog && log(`[UNZIP] Error unzipping ${zipFilePath} : ${err.message}`);
			cb({success:false, error: err.message});
		});
};




export const createArchive = async (folderOrFilePath: string, archiveFilePath: string, cb: (err?: Error) => void): Promise<void> => {
	const archive = createGzip();
	// if archiveFilePath does not end with .gz, add it
	if (!archiveFilePath.endsWith('.gz')) {
		archiveFilePath += '.gz';
	}
	fs.createReadStream(folderOrFilePath)
		.pipe(archive)
		.pipe(fs.createWriteStream(archiveFilePath))
		.on('close', cb)
		.on('error', (err) => {
			shouldLog && log(`[ARCHIVE] Error ${err.message}`);
			cb(err);
		});
};

// export const removeFile = async (filepath: string): Promise<void> => {
// 	filepath = p(filepath)
// 	return new Promise((resolve, reject) => {
// 		fs.unlink(filepath, (err) => {
// 			if (err) { shouldLog && log(`[REMOVE FILE] Error ${err.message}`); reject() }
// 			else resolve()
// 		});
// 	})
// }

export const fileExists = (path: string): boolean => {
	path = p(path)
	try {
		return fs.existsSync(path)
	} catch (error) {
		shouldLog && log(`[fileExists] error : `, error);

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

const getDownloadedFilePath = (folder:string, url:string):string => {
	folder = p(folder)
	let path = `${folder}/${getRessourceIdFromUrl(url)}`
	return path
}

export const downloadFile = async (url: string, folder: string, opts?:iDownloadRessourceOpts): Promise<string> => {
	let endPerf = perf(`⬇️   askRessourceDownload ${url}`)
	await upsertRecursivelyFolders(folder)

	folder = p(folder)
	let path = getDownloadedFilePath(folder, url)
	if (!opts) opts = {}
	if (opts.fileName) path = `${folder}/${opts.fileName}`

	if (!url) return
	let client = isHttps(url) ? https : http
	url = url.replace("localhost", "127.0.0.1") // otherwise would crash


	// shouldLog && log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder} => ${path}`);
	// console.log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder} => ${path}`);

	return new Promise((resolve, reject) => {
		let fileStream = fs.createWriteStream(path); 
		const optionsReq = {
			method: opts?.method || 'GET',
			// add headers to looks like as a browser
			headers: {
				
				// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				// 'Accept-Language': 'en-US,en;q=0.5',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				// 'Accept-Encoding': 'gzip, deflate, br',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
				'Cache-Control': 'max-age=0'
			}
			
		}
		// console.log(`⬇️ [DOWNLOAD FILE] url ${url}`);

		let postData: string | undefined 
		if (opts?.body && opts.method === 'POST') {
			postData = new URLSearchParams(opts.body as any).toString();
			optionsReq.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			optionsReq.headers['Content-Length'] = Buffer.byteLength(postData).toString();
		}
		
		if(opts.headers) each(opts.headers, (header) => optionsReq.headers[header[0]] = header[1])
		let cacheArg = true 
		if (opts.noCacheArg === true) cacheArg = false

		if (cacheArg) {
			let randomizedArgNoCache = `?${random(0, 10000000)}`
			url = url + randomizedArgNoCache
		}

		const req = client.request(url, optionsReq, (response) => {
			// Check the content-type from the headers and adjust the encoding accordingly
			// const contentType = response.headers['content-type']?.toLowerCase();
			// if (contentType && contentType.includes(contentType.includes('charset=utf8'))) {
			// 	response.setEncoding('utf8');
			// } else if (contentType && contentType.includes('charset=iso-8859-1')) {
			// 	response.setEncoding('latin1');
			// } else {
			// 	response.setEncoding('utf8');
			// }
			const encoding = response.headers['content-encoding'];
			// console.log(`[DOWNLOAD FILE] encoding ${encoding}`);
			if (encoding === 'gzip') {
				const gunzip = createGunzip();
				response.pipe(gunzip).pipe(fileStream);
			} else {
				response.pipe(fileStream);
			}

			// response.pipe(fileStream);
			fileStream.on('finish', () => {
				fileStream.close();  // close() is async, call cb after close completes.
				shouldLog && log(`[DOWNLOAD FILE] downloaded ${url} to ${path}`);
				endPerf()
				resolve(path)
			});
		}).on('error', (err) => { // Handle errors
			fs.unlink(path, () => { }); // Delete the file async. (But we don't check the result)
			shouldLog && log(`[DOWNLOAD FILE] error  ${err.message} (${url} to ${path})`)
			endPerf()
			reject(err.message);
		}).on('timeout', () => {
			// on timeout, retry 1 time
			shouldLog && log(`[DOWNLOAD FILE] timeout  (${url} to ${path})`)
			req.abort()
			endPerf()
			reject('TIMEOUT')

		});
		if (postData) {
			req.write(postData);
		}
		req.end();
	})
}


// download file and return its content
export const fetchFile = async (url: string, opts?: iFetchEvalBackendOpts): Promise<string> => {
	if (!opts) opts = {
		cache: false
	}

	const cacheFolder =  `/.tiro/cache/fetch/`
	const pathToFile = `${backConfig.dataFolder}/${cacheFolder}`;
	let folder = p(pathToFile)
	let path = getDownloadedFilePath(folder, url)
	if (!fileExists(path) || !opts.cache) {
		await downloadFile(url, folder);
	}
	// now we have a path, get content from it
	let fileContent = ""
	try {
		fileContent = await openFile(path)
	} catch(e) {}
	if (opts.cb) opts.cb(fileContent)
	return fileContent;
}

export type iFetchEvalBackendOpts = {
	cache:boolean
	cb?:Function
}
const fetchEvalCache:{[url:string]:string} = {};
export const fetchEval = async (
	url: string, 
	fnParamsObj?: any, 
	opts?:iFetchEvalBackendOpts
): Promise<iAnswerBackendEval> => {
	if (!opts) opts = { cache:true }
	if (opts.cb == null) opts.cb = (res:any) => {}	
	if (opts.cache !== false && opts.cache !== true) opts.cache = true
	if (fnParamsObj == null) fnParamsObj = {}
	
	let codeTxt = ""
	if (opts.cache && fetchEvalCache[url]) {
		console.log(`[FETCH EVAL BACKEND] cached ram > cache found in ram for ${url}`);
		codeTxt = fetchEvalCache[url]
	} else {
		console.log(`[FETCH EVAL BACKEND] NOCACHE > fetching and exec ${url} with opts ${JSON.stringify(opts)}`);
		codeTxt = await fetchFile(url)
		// cache the result
		fetchEvalCache[url] = codeTxt
	}

	return new Promise((resolve) => {
		evalBackendCode(codeTxt, fnParamsObj, (answer:iAnswerBackendEval) => {
			opts.cb(answer.result)
			resolve(answer.result)
		})
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
