import { getDefaultFormatCodeSettings } from "typescript";
import { iFile, iFolder } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
var fs = require('fs')
var path = require('path')

let defaultBlacklist = ['.resources']






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

export const scanDir = async (path:string, blacklist:string[]=defaultBlacklist):Promise<iFile[]|string> => {
    console.log(`[SCANDIR] path : ${path}`);
    
    return new Promise((resolve, reject) => {
        let filesScanned:iFile[] = []
        fs.readdir(path, async (err, files) => {
            if (!files) return reject(err.message)
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
            
                let stats = fs.lstatSync(`${path}/${fileName}`)
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
                    created: Math.round(stats.birthtimeMs),
                    modified: Math.round(stats.ctimeMs),
                    path: `${folder}/${fileName}`,
                    
                }
                if (blacklist.indexOf(fileName) === -1) {
                    filesScanned.push(fileObj)
                }
            }
            resolve(filesScanned)
        });
    })
}

export const getFolderHierarchy = async (folder, blacklist:string[]=defaultBlacklist):Promise<iFolder> => {
    return new Promise((resolve, reject) => {
        var stats = fs.lstatSync(folder)
        let relativeFolder = folder.replace(backConfig.dataFolder, '')
        let info:iFolder= {
            path: folder,
            title: path.basename(folder),
            key: relativeFolder
        };
        if (stats.isDirectory()) {
            fs.readdirSync(folder).map(async (child) => {
                let childFile = folder + '/' + child
                let stats2 = fs.lstatSync(childFile)
                if (stats2.isDirectory() && blacklist.indexOf(path.basename(child)) === -1) {
                    if (!info.children) info.children = []
                    info.children.push(await getFolderHierarchy(childFile,blacklist))
                } 
            });
        } 
        resolve(info)
    })
}