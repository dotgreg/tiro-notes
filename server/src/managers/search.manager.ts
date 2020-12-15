import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { createDir, isDir } from "./dir.manager";
import { exec2 } from "./exec.manager";
import { fileExists, openFile, saveFile } from "./fs.manager";

export const search = async (term: string):Promise<iFile[]|string> => {
    return new Promise(async (resolve, reject) => {
        let filesScanned:iFile[] = []

        let processTerm = term.split('-').join('\\-') 
        console.log({term, processTerm});
        
        let answerApi = await exec2(['rg', processTerm, backConfig.dataFolder, '--count-matches']) as string
        answerApi = answerApi.split(/\:[0-9]*/g).join('') 
        answerApi = answerApi.split(`${backConfig.dataFolder}\\`).join('') 
        var array = answerApi.match(/[^\r\n]+/g);
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            filesScanned.push({
                nature: 'file',
                name: element,
                path: element,
            })
        }
        console.log(filesScanned);
        resolve(filesScanned)
    })
}

export const cacheSearchResults = async (term:string, results:iFile[]) => {
    let cachedFolder = `${backConfig.dataFolder}/.cached`
    let searchFolder = `${cachedFolder}/search`
    let searchResultsFile = `${searchFolder}/${term}`
    if (!fileExists(cachedFolder)) await createDir(cachedFolder)
    if (!fileExists(searchFolder)) await createDir(searchFolder)

    await saveFile(searchResultsFile, JSON.stringify(results))
}

export const retrieveCachedSearch = async (term:string):Promise<iFile[]> => {
    return new Promise(async (resolve, reject) => {
        // check if folders exists, otherwise create them
        let cachedFolder = `${backConfig.dataFolder}/.cached`
        let searchFolder = `${cachedFolder}/search`
        let searchResultsFile = `${searchFolder}/${term}`
        if (!fileExists(cachedFolder)) await createDir(cachedFolder)
        if (!fileExists(searchFolder)) await createDir(searchFolder)

        if (fileExists(searchResultsFile)) {
            console.log(`[CACHE] cached search found for ${term}`);
            let rawContent = await openFile(searchResultsFile)
            let result = JSON.parse(rawContent) as iFile[]
            resolve(result) 
        } else {
            console.log(`[CACHE] NO RESULT FOUND for ${term}`);
            resolve([])
        }
    })
}