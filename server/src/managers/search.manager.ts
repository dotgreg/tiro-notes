import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { createDir, isDir } from "./dir.manager";
import { exec2 } from "./exec.manager";
import { fileExists, openFile, saveFile } from "./fs.manager";
const execa = require('execa');


// export const search = async (term: string, folder:string):Promise<iFile[]|string> => {
//     return new Promise(async (resolve, reject) => {
//         let filesScanned:iFile[] = []

//         let processTerm = term.split('-').join('\\-') 
//         console.log({term, processTerm});
        
//         let answerApi = await exec2([
//             'rg', 
//             processTerm, 
//             backConfig.dataFolder+folder, 
//             '--count-matches',
//             // '--sortr',
//             // 'created',
//             '--type',
//             'md',
//         ]) as string
        
//         answerApi = answerApi.split(/\:[0-9]*/g).join('') 
//         answerApi = answerApi.split(`${backConfig.dataFolder+folder}\\`).join('') 
//         var array = answerApi.match(/[^\r\n]+/g);
//         answerApi = answerApi.split(`\\`).join('/') 
        
//         for (let i = 0; i < array.length; i++) {
//             let element = array[i];
//             element = element.split(`\\`).join('/') 
//             filesScanned.push({
//                 nature: 'file',
//                 name: `${folder}/${element}`,
//                 path: `${folder}/${element}`,
//             })
//         }
//         console.log(filesScanned);
//         resolve(filesScanned)
//     })
// }

var fs = require('fs')
export const liveSearch = async (params:{
    term:string, 
    folder:string, 
    onSearchUpdate: (filesScanned:iFile[]) => void,
    onSearchEnded: (filesScanned:iFile[]) => void
}):Promise<void> => {

    let processTerm = params.term.split('-').join('\\-') 
    console.log({params});

    const ripGrepStreamProcess = execa.command([
        'rg', 
        processTerm, 
        backConfig.dataFolder+params.folder, 
        '--count-matches',
        '--type',
        'md',
    ].join(' '))
    

    let processDataToFiles = (dataRaw:string):iFile[] => {
        let res:iFile[] = []
        
        dataRaw = dataRaw.split(/\:[0-9]+/g).join('')  // remove file.md:1
        dataRaw = dataRaw.split(`${backConfig.dataFolder+params.folder}\\`).join('') // remove absolute path C:/Users/...
        dataRaw = dataRaw.split(`${backConfig.dataFolder+params.folder}/`).join('') // absolute path x2
        var array = dataRaw.match(/[^\r\n]+/g); // split string in array
        
        
        for (let i = 0; i < array.length; i++) {
            let filePath = array[i];
            filePath = filePath.split(`\\`).join('/') 
            console.log(222, filePath,backConfig.dataFolder);
            
            try {
                let stats = fs.lstatSync(`${backConfig.dataFolder}/${params.folder}/${filePath}`)
                filesScanned.push({
                    nature: 'file',
                    extension: 'md',
                    index: i,
                    created: Math.round(stats.birthtimeMs),
                    modified: Math.round(stats.ctimeMs),
                    // created: -1,
                    // modified: -1,
                    name: `${params.folder}/${filePath}`,
                    realname: `${filePath}`,
                    path: `${params.folder}/${filePath}`,
                    folder: `${params.folder}`,
                })
            } catch (error) {
                console.log('[SEARCH] ERROR : ', error);
            }
        }
        return res
    }

    let filesScanned:iFile[] = []
    ripGrepStreamProcess.stdout.on('data', dataRaw => {
        let data = dataRaw.toString()
        console.log({data}, backConfig.dataFolder);
        
        filesScanned.push(...processDataToFiles(data))
        console.log(`SEARCH => temporary search : ${filesScanned.length} elements found`);
        params.onSearchUpdate(filesScanned)
    })
    ripGrepStreamProcess.stdout.on('close', dataRaw => {
        let data = dataRaw.toString()
        console.log(`SEARCH => search ENDED : ${filesScanned.length} elements found`);  
        params.onSearchEnded(filesScanned)
    })
}

// export const search2 = async (term: string, folder:string):Promise<iFile[]|string> => {
//     return new Promise(async (resolve, reject) => {
//         let filesScanned:iFile[] = []

//         let processTerm = term.split('-').join('\\-') 
//         console.log({term, processTerm});
        
        // let answerApi = await exec2([
        //     'rg', 
        //     processTerm, 
        //     backConfig.dataFolder+folder, 
        //     '--count-matches',
        //     // '--sortr',
        //     // 'created',
        //     '--type',
        //     'md',
        // ]) as string
        
        // answerApi = answerApi.split(/\:[0-9]*/g).join('') 
        // answerApi = answerApi.split(`${backConfig.dataFolder+folder}\\`).join('') 
        // var array = answerApi.match(/[^\r\n]+/g);
    //     // answerApi = answerApi.split(`\\`).join('/') 
        
    //     for (let i = 0; i < array.length; i++) {
    //         let element = array[i];
    //         element = element.split(`\\`).join('/') 
    //         filesScanned.push({
    //             nature: 'file',
    //             name: `${folder}/${element}`,
    //             path: `${folder}/${element}`,
    //         })
    //     }
    //     console.log(filesScanned);
    //     resolve(filesScanned)
    // })
// }

export const cacheSearchResults = async (term:string, results:iFile[]) => {
    let cachedFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.cached`
    let searchFolder = `${cachedFolder}/search`
    let searchResultsFile = `${searchFolder}/${term}`
    if (!fileExists(cachedFolder)) await createDir(cachedFolder)
    if (!fileExists(searchFolder)) await createDir(searchFolder)

    await saveFile(searchResultsFile, JSON.stringify(results))
}

export const retrieveCachedSearch = async (term:string):Promise<iFile[]> => {
    return new Promise(async (resolve, reject) => {
        // check if folders exists, otherwise create them
        let cachedFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.cached`
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

export const analyzeTerm = (term:string):{rawTerm:string, termId:string, term:string, folderToSearch:string} => {
    let res = {rawTerm:term, termId:term, term:term, folderToSearch:''}

    // if folder in 'toto /hello/world'
    let folderRaw = term.match(/\ \/([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\\ ]*)$/gm)
    if (folderRaw && folderRaw[0]) {
        res.term = term.replace(folderRaw[0], '')
        res.folderToSearch = folderRaw[0].substr(1)
    }

    res.termId = res.termId.replace('/', '')
    
    return res
}