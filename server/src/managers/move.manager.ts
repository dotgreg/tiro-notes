import { debounce, random } from "lodash"
import { iSocketEventsParams, socketEvents } from "../../../shared/sockets/sockets.events"
import { iFolder } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { scanDir, workerGetFolderHierarchy } from "./dir.manager"
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { triggerWorker } from "./workers/worker.manager"

export const generateNewFileName = ():number => random(0, 10000000000)

export const debouncedFolderScan = debounce( async(socket:any, initPath:string) => {
    let folderPathArr = initPath.split('/')
    folderPathArr.pop()
    let folderPath = folderPathArr.join('/')
    console.log(`[HEAVY] ==> debouncedScanAfterMove for ${folderPath}`);
    
    let apiAnswer = await scanDir(`${backConfig.dataFolder}${folderPath}`)
    if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
    socket.emit(socketEvents.getFiles, { files: apiAnswer } as iSocketEventsParams.getFiles) 
}, 100)

export const debouncedHierarchyScan = debounce( async(socket:any) => {
    triggerWorker('getFolderHierarchySync', {folder: backConfig.dataFolder}, (folder:iFolder) => {
        socket.emit(socketEvents.getFolderHierarchy, {folder: folder} as iSocketEventsParams.getFolderHierarchy)
    })  
}, 2000)

export const moveNoteResourcesAndUpdateContent = async (initPath:string, endPath:string, simulate: boolean = false) => {
    if(simulate) console.log(`[moveNoteResourcesAndUpdateContent] SIMULATE MODE`);
    
    let filecontent = await openFile(`${backConfig.dataFolder}/${initPath}`)
    // let replacementSymbol = '--*|_|*--'
    // let tempFileContent = filecontent.replace(regex, replacementSymbol)
    
    let initFolderPathArr = initPath.split('/')
    initFolderPathArr.pop()
    let initFolderPath = initFolderPathArr.join('/')
    
    let endFolderPathArr = endPath.split('/')
    endFolderPathArr.pop()
    let endFolderPath = endFolderPathArr.join('/')
    
    let regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\))/g
    let matches = filecontent.match(regex)
    let newFileContent = filecontent
    if (!matches || !matches.length) return console.log('[moveNoteResourcesAndUpdateContent] no resources found, skipping');
    

    for (let i = 0; i < matches.length; i++) {
        const rawResource = matches[i];
        
        const nameResource = rawResource.replace(regex, '$2')
        // console.log('nameResource->',nameResource);
        const pathResource = rawResource.replace(regex, '$3')
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
                let newFilename = `${generateNewFileName()}.${extension}`

                let endResourcePath = `${backConfig.dataFolder}/${endFolderPath}/${backConfig.relativeUploadFolderName}/${newFilename}`
                let moveSumup = `[MOVE] Resource note move:  ${pathsToCheck[y]} (exists) -> ${endResourcePath}`
                console.log(moveSumup);
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
    console.log(newFileContent);
}