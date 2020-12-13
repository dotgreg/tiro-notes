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

export const saveFile = async (path: string, content:string):Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, (err) => {
            if (err) {console.error(`[SAVEFILE] Error ${err.message} (${path}/${content})`); reject()}
            else resolve()
        }); 
    })
}

export const copyFile = async (pathOriginal:string, pathDestination:string):Promise<void> => {
    const fs = require('fs');

    return new Promise((resolve, reject) => {
        fs.copyFile(pathOriginal, pathDestination, (err) => {
            if (err) {console.error(`[COPYFILE] Error ${err.message}`); reject()}
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