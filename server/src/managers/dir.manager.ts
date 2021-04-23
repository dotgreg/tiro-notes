import execa = require("execa");
import { exists } from "fs";
import { getDefaultFormatCodeSettings } from "typescript";
import { iFile, iFolder } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { fileExists } from "./fs.manager";
import { getPlatform } from "./platform.manager";
var fs = require('fs')
const path = require ('path')

export let dirDefaultBlacklist = ['.resources', '_resources']

export const createDir = async (path:string, mask:number = 0o775):Promise<null|string> => {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, 0o775, (err) =>  {
            if (err) {
                if (err.code == 'EEXIST') resolve(null); // ignore the error if the folder already exists
                else reject(err.message); // something else went wrong
            } else {  
                resolve(null); // successfully created folder
            }
        });
    });
}

export const isDir = (path:string):boolean => fs.lstatSync(path).isDirectory() 


export const fileNameFromFilePath = (path:string):string => {
    let fileName = path.split('/').join('_')
    fileName = fileName.split('\\').join('_')
    return fileName
}

export const scanDirForFolders = (folderPath:string):iFolder => {
    const fullFolderPath = `${backConfig.dataFolder}${folderPath}`
    if (!fileExists(fullFolderPath)) return
    var folderStats = fs.lstatSync(fullFolderPath)
    let relativeFolder = fullFolderPath.replace(backConfig.dataFolder, '')
    const resultFolder:iFolder = {
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
                let childStats = fs.lstatSync(fullChildPath)
                if (childStats.isDirectory() && dirDefaultBlacklist.indexOf(path.basename(child)) === -1) {
                    // if (fullChildPath.indexOf('.tiro') !== -1) console.log('1212', fullChildPath)
                    let relativeChildFolder = fullChildPath.replace(backConfig.dataFolder, '')
                    let childFolder:iFolder = {
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
                    // LAST + CONSOLE LOG EACH ITE = 4s = PERFS /100!!!
                    
                    const subchildren:string[] = fs.readdirSync(fullChildPath)
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
                console.log("scanDirForFolders => error "+ error);    
            }
        });
    } 
    return resultFolder
}

export const scanDirForFiles = async (path:string, blacklist:string[]=dirDefaultBlacklist):Promise<iFile[]|string> => {
    console.log(`[scanDirForFiles] path : ${path}`);
    
    return new Promise((resolve, reject) => {
        let filesScanned:iFile[] = []
        fs.readdir(path, async (err, files) => {
            if (!files) return reject(err.message)
            let counterFilesStats = 0
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i]; 
                let filePath = `${path}/${fileName}`
                if (!fileExists(filePath)) {
                    counterFilesStats++
                    if (counterFilesStats === files.length) resolve(filesScanned)
                }  else {
                    fs.lstat(filePath, {}, (err,stats) => {
                        
                        // ON LINUX ONLY, MAKE SURE CREATION DATE IS IN RIGHT 
                        let createdDate = stats.atimeMs
                        if (getPlatform() === 'linux') {
                            if (stats.mtimeMs < stats.atimeMs) {
                                createdDate = stats.mtimeMs
                                const ndate = new Date(stats.mtimeMs)
                                const touchDateFormat = ndate.getFullYear() +''+ ( '0'+ndate.getMonth()).slice(-2) +''+ ('0'+ndate.getDay()).slice(-2)+ ('0'+ndate.getHours()).slice(-2)+ ('0'+ndate.getMinutes()).slice(-2)
                                const cmd = `touch -t ${touchDateFormat} '${filePath}'`
                                console.log(`[scanDirForFiles > STAT] ${filePath} stats.mtimeMs < stats.atimeMs => equalize : ${cmd}`);
                                execa.command(cmd)
                            }
                        }
                        

                        // counter++
                        
                        let extensionArr = fileName.split('.')
                        let extension = extensionArr[extensionArr.length-1]
                        let folder = path.replace(backConfig.dataFolder, '').replace('//', '/')
                        
                        // packs everything
                        let fileObj:iFile = {
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
                        if (counterFilesStats === files.length) resolve(filesScanned)
                    })
                }
            }
        });
    })
}
