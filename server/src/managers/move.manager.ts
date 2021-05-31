import { debounce, random } from "lodash"
import { iApiDictionary} from "../../../shared/apiDictionary.type"
import { regexs } from "../../../shared/helpers/regexs.helper"
import { iFolder } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { normalizeString, removeSpecialChars } from "../helpers/string.helper"
import { dirDefaultBlacklist, scanDirForFiles } from "./dir.manager"
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { ServerSocketManager } from "./socket.manager"
import { triggerWorker } from "./workers/worker.manager"

export const generateNewFileName = (actualFileName: string):string => `${removeSpecialChars(normalizeString(actualFileName))}-${random(0, 1000)}`

export const debouncedFolderScan = debounce( async(socket:ServerSocketManager<iApiDictionary>, initPath:string) => {
    let folderPathArr = initPath.split('/')
    folderPathArr.pop()
    let folderPath = folderPathArr.join('/')
    console.log(`[HEAVY] ==> debouncedScanAfterMove for ${folderPath}`);
    
    let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${folderPath}`)
    if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
    socket.emit('getFiles', { files: apiAnswer }) 
}, 100)

export const debouncedHierarchyScan = debounce( async(socket:ServerSocketManager<iApiDictionary>) => {
    triggerWorker('getFolderHierarchySync', {
        folder: `${backConfig.dataFolder}`,
        config: {  dataFolder: backConfig.dataFolder, blacklist: dirDefaultBlacklist }
    }, (folder:iFolder) => {
      socket.emit('getFolderHierarchy', {folder, pathBase: backConfig.dataFolder})
    })  
}, 2000)

export const moveNoteResourcesAndUpdateContent = async (initPath:string, endPath:string, simulate: boolean = false) => {
    if(simulate) console.log(`[moveNoteResourcesAndUpdateContent] SIMULATE MODE`);
    
    let filecontent = await openFile(`${backConfig.dataFolder}/${initPath}`)
    
    let initFolderPathArr = initPath.split('/')
    initFolderPathArr.pop()
    let initFolderPath = initFolderPathArr.join('/')
    
    let endFolderPathArr = endPath.split('/')
    endFolderPathArr.pop()
    let endFolderPath = endFolderPathArr.join('/')
    
    let matches = filecontent.match(regexs.ressource)
    let newFileContent = filecontent
    if (!matches || !matches.length) return console.log('[moveNoteResourcesAndUpdateContent] no resources found, skipping');
    

    for (let i = 0; i < matches.length; i++) {
        const rawResource = matches[i];
        
        const nameResource = rawResource.replace(regexs.ressource, '$1')
        const pathResource = rawResource.replace(regexs.ressource, '$2')
        let pathsToCheck = [
            `${backConfig.dataFolder}/${pathResource}`,
            `${backConfig.dataFolder}/${initFolderPath}/${pathResource}`,
        ]
        
        for (let y = 0; y < pathsToCheck.length; y++) {
            let fileDoesExist = fileExists(pathsToCheck[y])
            !fileDoesExist && console.log(`===> ${pathsToCheck[y]} not found`);
            if (fileDoesExist) {
                // if yes, move it to endPath/.resources/UNIQUEID.jpg
                let initResourcePathArr = pathsToCheck[y].split('/')
                let filenameArr = initResourcePathArr.pop().split('.')
                let extension = filenameArr[filenameArr.length-1]

                let newFilename = `${generateNewFileName(nameResource)}.${extension}`

                let endResourcePath = `${backConfig.dataFolder}/${endFolderPath}/${backConfig.relativeUploadFolderName}/${newFilename}`
                let moveSumup = `[MOVE] Resource note move:  ${pathsToCheck[y]} (exists) -> ${endResourcePath}`
                await upsertRecursivelyFolders(endResourcePath)
                if(!simulate) {
                    await moveFile(pathsToCheck[y], endResourcePath)
                    // change contentfile
                    let mdResource = `![${nameResource}](./${backConfig.relativeUploadFolderName}/${newFilename})`
                    newFileContent = newFileContent.replace(matches[i], mdResource)
                }
            }
        }
    }

    if(!simulate) await saveFile(`${backConfig.dataFolder}/${initPath}`, newFileContent)
}