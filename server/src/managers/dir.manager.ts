import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import * as fs2 from "./fs.manager";
import { getFileData } from "./fileData.manager";

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


export const scanDir = async (path:string):Promise<iFile[]|string> => {
    return new Promise((resolve, reject) => {
        let filesScanned:iFile[] = []
        fs.readdir(path, async (err, files) => {
            if (!files) return reject(err.message)
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
            
                // get json info if it exists
                const jsonPath = `${backConfig.internalPath}/${backConfig.dbDirName}/${fileName}.json`
                const fileData = await getFileData(jsonPath) || {}

                // packs everything
                let fileObj:iFile = {
                    nature: isDir(`${path}/${fileName}`) ? 'folder' : 'file',
                    name: fileName,
                    link: `${backConfig.absolutePath}/${fileName}`,
                    image: `${backConfig.absolutePath}/${backConfig.dbDirName}/${fileName}.jpg`,
                    data: fileData
                }
                filesScanned.push(fileObj)
            }
            resolve(filesScanned)
        });
    })
}