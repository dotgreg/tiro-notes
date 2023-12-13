import { each, random } from "lodash";
import { getRessourceIdFromUrl } from "../../../shared/helpers/id.helper";
import { sharedConfig } from "../../../shared/shared.config";
import { iDownloadRessourceOpts } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { createDir } from "./dir.manager";
import { log } from "./log.manager";
import { p } from "./path.manager";

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

export const moveFile = async (pathInit: string, pathEnd: string): Promise<void> => {
	pathInit = p(pathInit)
	pathEnd = p(pathEnd)
	// check if file exists/not
	if (!fileExists(pathInit)) {
		shouldLog && log(`[MOVEFILE] ERROR : PATHINIT ${pathInit} DOESNT EXISTS`);
	} else {
		shouldLog && log(`[MOVEFILE] starting moving ${pathInit} -> ${pathEnd}`);

		// return new Promise(async (resolve, reject) => {
			// , (err) => {
			// 	if (err) { shouldLog && log(`[MOVEFILE] Error ${err.message} (${pathInit} -> ${pathEnd})`); reject() }
			// 	else resolve()
			// });
		// })

		try {
			await fs.renameSync(pathInit, pathEnd)
		} catch (error) {
			// console.log(h, `error rename file ${pathInit} -> ${pathEnd}`, error)
			log(`[MOVEFILE] Error ${error.message} (${pathInit} -> ${pathEnd})`);
		}
			
	}

}

export const saveFile = async (path: string, content: string): Promise<void> => {
	path = p(path)
	const h = `[SAVEFILE]`
	shouldLog && log(`${h} starting save ${path}`);

	path = p(path)

	try {
		await fs.writeFileSync(path, content)
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

export const downloadFile = async (url: string, folder: string, opts?:iDownloadRessourceOpts): Promise<string> => {
	folder = p(folder)
	let path = `${folder}/${getRessourceIdFromUrl(url)}`
	if (opts.fileName) path = `${folder}/${opts.fileName}`

	if (!url) return
	let client = isHttps(url) ? https : http
	url = url.replace("localhost", "127.0.0.1") // otherwise would crash


	// shouldLog && log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder} => ${path}`);
	console.log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder} => ${path}`);

	return new Promise((resolve, reject) => {
		let fileStream = fs.createWriteStream(path); 
		const optionsReq = {
			method: opts?.method || 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0',
				// 'Host':'tiro-notes.org'
			}
		}
		console.log(`[DOWNLOAD FILE] options`, JSON.stringify({optionsReq, opts}));

		let postData: string | undefined 
		if (opts?.body && opts.method === 'POST') {
			postData = new URLSearchParams(opts.body as any).toString();
			console.log(postData)
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

		console.log(11111111111111, client.request)
		const req = client.request(url, optionsReq, (response) => {
			console.log(2222222, response)
			// Check the content-type from the headers and adjust the encoding accordingly
			const contentType = response.headers['content-type'].toLowerCase();
			if (contentType.includes(contentType.includes('charset=utf8'))) {
			  response.setEncoding('utf8');
			} else if (contentType.includes('charset=iso-8859-1')) {
			  response.setEncoding('latin1');
			}

			response.pipe(fileStream);
			fileStream.on('finish', () => {
				fileStream.close();  // close() is async, call cb after close completes.
				shouldLog && log(`[DOWNLOAD FILE] downloaded ${url} to ${path}`);
				console.log(122, `[DOWNLOAD FILE] downloaded ${url} to ${path}`)
				resolve(path)
			});
		}).on('error', (err) => { // Handle errors
			fs.unlink(path, () => { }); // Delete the file async. (But we don't check the result)
			shouldLog && log(`[DOWNLOAD FILE] error  ${err.message} (${url} to ${path})`)
			console.log(133, `[DOWNLOAD FILE] downloaded ${url} to ${path}`)
			reject(err.message);
		});
		if (postData) {
			req.write(postData);
		}
		req.end();
	})
}


// const isHttps = (url: string) => url.indexOf("https") === 0;
// import { promises as fsPromises } from 'fs';
// import * as path from 'path';
// export const downloadFile = async (url: string, folder: string, opts?: iDownloadRessourceOpts): Promise<string> => {
// 	if (!url) throw new Error('URL must be provided.');
	
// 	const isHttps = (url: string) => new URL(url).protocol === 'https:';
// 	let client = isHttps(url) ? https : http;
// 	url = url.replace("localhost", "127.0.0.1"); // otherwise would crash
  
// 	// shouldLog && log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder} => ${pathToFile}`);
// 	console.log(`[DOWNLOAD FILE] ${isHttps(url)} ${url} to folder ${folder}`);
	
// 	return new Promise((resolve, reject) => {
// 	  const pathToFile = path.join(folder, opts?.fileName || ''); // Replace with logic to determine file name
		
// 	  let postData: string | undefined;
// 	  const options = {
// 		method: opts?.method || 'GET',
// 		headers: {
// 		  'User-Agent': 'Mozilla/5.0',
// 		}
// 	  };
	  
// 	  if (opts?.headers) {
// 		opts.headers.forEach(([header, value]) => options.headers[header] = value);
// 	  }
	  
// 	  if (opts?.body && options.method === 'POST') {
// 		postData = new URLSearchParams(opts.body as any).toString();
// 		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
// 		options.headers['Content-Length'] = Buffer.byteLength(postData).toString();
// 	  }
  
// 	  if (opts?.noCacheArg !== true) {
// 		url += `?${Math.floor(Math.random() * 10000000)}`;
// 	  }
  
// 	  const req = client.request(url, options, (response) => {
// 		const contentType = response.headers['content-type']?.toLowerCase() || '';
// 		if (contentType.includes('charset=utf-8')) {
// 		  response.setEncoding('utf8');
// 		} else if (contentType.includes('charset=iso-8859-1')) {
// 		  response.setEncoding('latin1');
// 		}
  
// 		const fileStream = fs.createWriteStream(pathToFile);
// 		response.pipe(fileStream);
  
// 		fileStream.on('finish', () => {
// 		  fileStream.close(); // close() is async, call cb after close completes.
// 		  console.log(`[DOWNLOAD FILE] downloaded ${url} to ${pathToFile}`);
// 		  resolve(pathToFile);
// 		});
// 	  }).on('error', (err) => { // Handle errors
// 		fsPromises.unlink(pathToFile).catch(() => {}); // Ignore unlink errors
// 		console.error(`[DOWNLOAD FILE] error ${err.message} (${url} to ${pathToFile})`);
// 		reject(err.message);
// 	  });
  
// 	  if (postData) {
// 		req.write(postData);
// 	  }
  
// 	  req.end();
// 	});
//   };
// export const fsApi = {
// 	downloadFile,
// 	isDir,
// 	isHttps,
// 	saveFile,
// 	openFile,
// 	openMetadataFile,
// 	userHomePath,
// 	get
// }

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
