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
            let counterFilesStats = 0
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
            
                fs.lstat(`${path}/${fileName}`, {}, (err,stats) => {
                    
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
                        created: Math.round(stats.birthtimeMs),
                        modified: Math.round(stats.ctimeMs),
                        path: `${folder}/${fileName}`, 
                        
                    }
                    if (blacklist.indexOf(fileName) === -1) {
                        filesScanned.push(fileObj)
                    }

                    counterFilesStats++
                    // console.log(1, i,counterFilesStats,files.length );
                    if (counterFilesStats === files.length) {
                        resolve(filesScanned)
                    }
                })
            }
        });
    })
}








const { job, start, stop } = require("microjob");
export const workerGetFolderHierarchy = async (folder):Promise<iFolder>  => {
    let configDataFolder = backConfig.dataFolder
    try {
        console.log(1);
        
        await start();
        console.log(2);
        let resThreaded:iFolder = await job( async () => {
            console.log(3);
            const fs = require('fs')
            const path = require('path')
            const getFolderHierarchySync = async (folder, blacklist:string[]=defaultBlacklist):Promise<iFolder> => {
                return new Promise((resolve, reject) => {
                    var stats = fs.lstatSync(folder)
                    let relativeFolder = folder.replace(configDataFolder, '')
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
                                info.children.push(await getFolderHierarchySync(childFile,blacklist))
                            } 
                        });
                    } 
                    resolve(info)
                })
            }
            console.log(4);
            let res = await getFolderHierarchySync(folder)
            return res
        },{ ctx: { folder,defaultBlacklist,configDataFolder } }) 
        return resThreaded
    } 
    catch (err) {console.log('threaded err', err);}
    finally {await stop();}
}



















export const getFolderHierarchySync = async (folder, blacklist:string[]=defaultBlacklist):Promise<iFolder> => {
    // console.log(`getFolderHierarchySync ${folder}`);
    
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
                    info.children.push(await getFolderHierarchySync(childFile,blacklist))
                } 
            });
        } 
        resolve(info)
    })
}
 
export const getFolderHierarchyParallel = async (folder, blacklist:string[]=defaultBlacklist):Promise<iFolder> => {
    // console.log('getFolderHierarchy');
    
    return new Promise((resolve, reject) => {
        fs.lstat(folder, (err, stats) => {
            // console.log(stats);
            
            let relativeFolder = folder.replace(backConfig.dataFolder, '')
            let info:iFolder= {
                path: folder,
                title: path.basename(folder),
                key: relativeFolder
            }; 
            if (stats.isDirectory()) {
                fs.readdir(folder, (err, files) => {
                    let c = 0
                    files.map(async (child) => {
                        let childFile = folder + '/' + child
                        fs.lstat(childFile, async (err, stats2) => {
                            if (stats2.isDirectory() && blacklist.indexOf(path.basename(child)) === -1) {
                                if (!info.children) info.children = []
                                info.children.push(await getFolderHierarchyParallel(childFile,blacklist))
                            } 
                            c++
                            if (c === files.length) {
                                resolve(info)
                            }
                        })
                    });
                })
            } 
        })
    })
}