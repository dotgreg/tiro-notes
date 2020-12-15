import { getDefaultFormatCodeSettings } from "typescript";
import { iFile, iFolder } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { formatDateHistory } from "./date.manager";
var glob = require("glob")


var fs = require('fs');

// mask 484 => 0777
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

export const scanDir = async (path:string):Promise<iFile[]|string> => {
    console.log(`[SCANDIR] path : ${path}`);
    
    return new Promise((resolve, reject) => {
        let filesScanned:iFile[] = []
        fs.readdir(path, async (err, files) => {
            if (!files) return reject(err.message)
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
            
                // packs everything
                let fileObj:iFile = {
                    nature: isDir(`${path}/${fileName}`) ? 'folder' : 'file',
                    name: fileName,
                    path: `${path.replace(backConfig.dataFolder, '').replace('//', '/')}/${fileName}`,
                }
                filesScanned.push(fileObj)
            }
            resolve(filesScanned)
        });
    })
}


var fs = require('fs')
var path = require('path')

export const getFolderHierarchy = async (folder):Promise<iFolder> => {
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
                if (stats2.isDirectory()) {
                    if (!info.children) info.children = []
                    info.children.push(await getFolderHierarchy(childFile))
                } 
            });
        } 
        resolve(info)
    })
}