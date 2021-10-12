import { max } from "lodash";
import { backConfig } from "../config.back";
import { createDir } from "./dir.manager";
import { p } from "./path.manager";

var http = require('http');
var https = require('https');
var fs = require('fs');


//////////////////////////
// METADATA FILES
//////////////////////////

export interface iMetadataFile {
    name: string
}

export const openMetadataFile = async (path: string):Promise<iMetadataFile> => {
    return new Promise((resolve, reject) => {

    })
}

//////////////////////////
// LOW LEVEL
//////////////////////////

export const openFile = async (path: string):Promise<string> => {
    path = p(path)

    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err,data:string) => {
            if (err) {console.error(`[READFILE] could not read ${path}`);}
            else resolve(data)
        }); 
    })
}

export const upsertRecursivelyFolders = async (fullPathToCheck:string) => {
    fullPathToCheck = p(fullPathToCheck)
    // check for each folder if it exists, else create it
    fullPathToCheck = fullPathToCheck.replace(backConfig.dataFolder, '')
    let pathArr = fullPathToCheck.split('/')
    pathArr.pop() // remove object.jpg
    pathArr.shift() // remove ""

    let createFoldersRecursively = async (path:string, pathArray:string[]) => {
        let fullPath = `${p(path)}/${pathArray[0]}`
        console.log(`createFoldersRecursively`,{path,pathArr,fullPath});
        if (!fileExists(fullPath)) {
            console.log('doesnt exists create it');
            await createDir(fullPath)
        } 

        if (pathArr.length > 1) {
            pathArr.shift()
            console.log('pathArr > 1, new ',{pathArr});
            await createFoldersRecursively(fullPath, pathArr)
        }
    }
    await createFoldersRecursively(backConfig.dataFolder, pathArr)
    return
} 

export const moveFile = async (pathInit: string, pathEnd:string):Promise<void> => {
    pathInit = p(pathInit)
    pathEnd = p(pathEnd)
    // check if file exists/not
    if (!fileExists(pathInit)) {
        console.log(`[MOVEFILE] ERROR : PATHINIT ${pathInit} DOESNT EXISTS`);
    } else {
        console.log(`[MOVEFILE] starting moving ${pathInit} -> ${pathEnd}`);
        
        return new Promise(async (resolve, reject) => {
            fs.rename(pathInit, pathEnd, (err) => {
                if (err) {console.error(`[MOVEFILE] Error ${err.message} (${pathInit} -> ${pathEnd})`); reject()}
                else resolve()
            }); 
        })
    }
    
}

export const saveFile = async (path: string, content:string):Promise<void> => {
    path = p(path)
    console.log(`[SAVEFILE] starting save ${path}`);
    return new Promise((resolve, reject) => {
        // fs.truncateSync(path)
        // fs.appendFile(path, content, (err) => {
        //     if (err) {console.error(`[SAVEFILE] Error ${err.message} (${path})`); reject()}
        //     else resolve()
        // }); 
        fs.writeFile(path, content, (err) => {
            if (err) {console.error(`[SAVEFILE] Error ${err.message} (${path})`); reject()}
            else resolve()
        }); 
    })
}

export const createFolder = async (path: string):Promise<void> => {
    path = p(path)

    console.log(`[CREATEFOLDER] at ${path}`);
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (err) => {
            if (err) {console.error(`[CREATEFOLDER] Error ${err.message} (${path})`); reject()}
            else resolve()
        }); 
    })
}

export const copyFile = async (pathOriginal:string, pathDestination:string):Promise<void> => {
    pathOriginal = p(pathOriginal)
    pathDestination = p(pathDestination)

    return new Promise((resolve, reject) => {
        fs.copyFile(pathOriginal, pathDestination, (err) => {
            if (err) {console.error(`[COPYFILE] Error ${err.message}`); reject()}
            else resolve()
        });
    })
}

export const removeFile = async (filepath:string):Promise<void> => {
    filepath = p(filepath)
    return new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
            if (err) {console.error(`[REMOVE FILE] Error ${err.message}`); reject()}
            else resolve()
        });
    })
}

export const fileExists = (path:string):boolean => {
    path = p(path)
    try {
        // console.log(133, path);
        return fs.existsSync(path)
    } catch (error) {
        console.log(`[fileExists] error : `, error);
        
        return false
    }
}

export const fileStats = (path:string):any => {
    try {
        return fs.lstatSync(path)
    } catch (error) {
        return false
    }
}

export const isDir = (path:string):boolean => {
    try {
        let stats = fileStats(path)
        return stats ? stats.isDirectory() : false
    } catch (error) {
        // console.log(3, error);
        return false
    }
}

const isHttps = (url:string) => url.indexOf("https") === 0;

export const downloadFile = async (url:string, path:string):Promise<string> => {
    path = p(path)
    console.log(`===== DL FILE ${url} ${path}`);
    if (!url) return
    let client = isHttps(url) ? https : http
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(path);
        client.get(url,(response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();  // close() is async, call cb after close completes.
                console.log(`[DLFILE] downloaded ${url} to ${path}`);
                resolve(path)
            });
        }).on('error', (err) => { // Handle errors
            fs.unlink(path); // Delete the file async. (But we don't check the result)
            console.error(`[SAVEFILE] error  ${err.message} ({url} to ${path})$`)
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