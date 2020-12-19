import { max } from "lodash";
import { backConfig } from "../config.back";
import { createDir } from "./dir.manager";

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
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err,data:string) => {
            if (err) {console.error(`[READFILE] Error ${err.message}`); reject()}
            else resolve(data)
        }); 
    })
}

export const upsertRecursivelyFolders = async (fullPathToCheck:string) => {
    // check for each folder if it exists, else create it
    fullPathToCheck = fullPathToCheck.replace(backConfig.dataFolder, '')
    let pathArr = fullPathToCheck.split('/')
    pathArr.pop() // remove object.jpg
    pathArr.shift() // remove ""
    console.log({pathArr});

    let createFoldersRecursively = async (path:string, pathArray:string[]) => {
        let fullPath = `${path}/${pathArray[0]}`
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
    console.log(`[MOVEFILE] starting move ${pathInit} -> ${pathEnd}`);
    
    return new Promise(async (resolve, reject) => {
        fs.rename(pathInit, pathEnd, (err) => {
            if (err) {console.error(`[MOVEFILE] Error ${err.message} (${pathInit} -> ${pathEnd})`); reject()}
            else resolve()
        }); 
    })
}

export const saveFile = async (path: string, content:string):Promise<void> => {
    console.log(`[SAVEFILE] starting save ${path}`);
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, (err) => {
            if (err) {console.error(`[SAVEFILE] Error ${err.message} (${path})`); reject()}
            else resolve()
        }); 
    })
}

export const copyFile = async (pathOriginal:string, pathDestination:string):Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.copyFile(pathOriginal, pathDestination, (err) => {
            if (err) {console.error(`[COPYFILE] Error ${err.message}`); reject()}
            else resolve()
        });
    })
}

export const removeFile = async (filepath:string):Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
            if (err) {console.error(`[REMOVE FILE] Error ${err.message}`); reject()}
            else resolve()
        });
    })
}

export const fileExists = (path:string):boolean => {
    return fs.existsSync(path)
}

const isHttps = (url:string) => url.indexOf("https") === 0;

export const downloadFile = async (url:string, path:string):Promise<string> => {
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

export const getFileStats = async (path: string):Promise<iFileStats> => {
    return new Promise((resolve, reject) => {
        fs.stat(path,(err,data:iFileStats) => {
            if (err) {console.error(`[GetFileStats] Error ${err.message}`); reject()}
            else resolve(data)
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