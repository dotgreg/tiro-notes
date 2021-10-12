import { cleanPath } from "../../../../shared/helpers/filename.helper";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { fileStats } from "../fs.manager";
import { createIFile } from "./search-js.manager";

export const cleanFilePath = (rawString:string, folder) => {
    rawString = rawString.split(/\:[0-9]+/g).join('')  // remove file.md:1
    rawString = rawString.split(`${backConfig.dataFolder+folder}\\`).join('') // remove absolute path C:/Users/...
    rawString = rawString.split(`${backConfig.dataFolder+folder}/`).join('') // remove absolute path x2
    rawString = rawString.split(`${backConfig.dataFolder+folder}`).join('') // remove absolute path x3
    return rawString
}

export const processRawPathToFile = (rawPath:string, index:number, titleFilter:string = '', folder:string):iFile => {
    let res:iFile
    let cleanedData = cleanFilePath(rawPath, folder)
    let filePath = cleanPath(cleanedData)

    // TITLE FILTER
    if (titleFilter !== '' && !filePath.toLowerCase().includes(titleFilter.toLowerCase())) return

    try {
        let stats = fileStats(`${backConfig.dataFolder}/${folder}/${filePath}`)
        res = createIFile(filePath, folder, index, stats)
    } catch (error) {
        console.log('[RIPGREP SEARCH] ERROR : ', error);
    }
    return res
}

export const processRawDataToFiles = (dataRaw:string, titleFilter:string = '', folder:string):iFile[] => {
    let res:iFile[] = []
    
    let cleanedData = cleanFilePath(dataRaw, folder)
    var array = cleanedData.match(/[^\r\n]+/g); // split string in array
    
    for (let i = 0; i < array.length; i++) {
        let filePath = array[i];
        const fileRes = processRawPathToFile(filePath, i, titleFilter, folder)
        res.push(fileRes)
    }
    return res
}