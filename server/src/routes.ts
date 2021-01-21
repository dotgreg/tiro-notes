import { iSockerRoute } from "./managers/socket/socket.manager"
import { socketEvents, iSocketEventsParams } from "../../shared/sockets/sockets.events";
import { backConfig } from "./config.back";
import {  exec3 } from "./managers/exec.manager";
import { createDir, fileNameFromFilePath, getFolderHierarchySync, scanDir, workerGetFolderHierarchy } from "./managers/dir.manager";
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./managers/fs.manager";
import {  analyzeTerm, liveSearch } from "./managers/search.manager";
import { formatDateNewNote, formatDateHistory, formatDateTag } from "./managers/date.manager";
import { focusOnWinApp } from "./managers/win.manager";
import { debouncedFolderScan, moveNoteResourcesAndUpdateContent, debouncedHierarchyScan } from "./managers/move.manager";
import { folderToUpload } from "./managers/upload.manager";
import { random } from "lodash";
import { triggerWorker } from "./managers/workers/worker.manager";
import { iFolder } from "../../shared/types.shared";

export const socketRoutes:iSockerRoute[] = [
    {
        event: socketEvents.askForFiles,
        action: async (socket, data:iSocketEventsParams.askForFiles) => {
            let apiAnswer = await scanDir(`${backConfig.dataFolder}${data.folderPath}`)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, { files: apiAnswer } as iSocketEventsParams.getFiles) 
        }
    },
    {
        event: socketEvents.askForFileContent,
        action: async (socket, data:iSocketEventsParams.askForFileContent) => {
            let apiAnswer = await openFile(`${backConfig.dataFolder}/${data.filePath}`)
            socket.emit(socketEvents.getFileContent, {fileContent: apiAnswer} as iSocketEventsParams.getFileContent)
        }
    },
    {
        event: socketEvents.searchFor,
        action: async (socket, data:iSocketEventsParams.searchFor) => {
            // see if need to restrict search to a folder
            let termObj = analyzeTerm(data.term)
            console.log({termObj});

            // // first retrieve cached results if exists
            // let cachedRes = await retrieveCachedSearch(termObj.termId)
            // socket.emit(socketEvents.getFiles, {files: cachedRes, temporaryResults: true} as iSocketEventsParams.getFiles)
            
            // Then trigger api
            // let apiAnswer = await search(termObj.term, termObj.folderToSearch)
            // if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            // socket.emit(socketEvents.getFiles, {files: apiAnswer} as iSocketEventsParams.getFiles)
            
            liveSearch({
                term: termObj.term, 
                folder: termObj.folderToSearch, 
                onSearchUpdate : files => {
                    socket.emit(socketEvents.getFiles, {files: files, temporaryResults: true} as iSocketEventsParams.getFiles)
                },
                onSearchEnded : files => {
                    socket.emit(socketEvents.getFiles, {files: files} as iSocketEventsParams.getFiles)
                }
            })
            
            // finally update cached search
            // await cacheSearchResults(termObj.termId, apiAnswer)
        }
    },
    {
        event: socketEvents.askFolderHierarchy,
        action: async (socket, data:iSocketEventsParams.askFolderHierarchy) => {
            triggerWorker('getFolderHierarchySync', {folder: `${backConfig.dataFolder}${data.folderPath}`}, (folder:iFolder) => {
              socket.emit(socketEvents.getFolderHierarchy, {folder: folder} as iSocketEventsParams.getFolderHierarchy)
            })  
        }
    },
    
    {
        event: socketEvents.saveFileContent,
        action: async (socket, data:iSocketEventsParams.saveFileContent) => {
            console.log(`SAVING ${backConfig.dataFolder}${data.filepath} with new content`);
            await saveFile(`${backConfig.dataFolder}${data.filepath}`, data.newFileContent)
        },
        disableDataLog: true
    },
    {
        event: socketEvents.createNote,
        action: async (socket, data:iSocketEventsParams.createNote) => {
            let time = new Date() 
            let nameNote = `/new-note-${random(0,10000)}.md`
            let notePath = `${backConfig.dataFolder}${data.folderPath}${nameNote}`
            console.log(`CREATING ${notePath}`);
            await saveFile(`${notePath}`, ``)

            let apiAnswer = await scanDir(`${backConfig.dataFolder}${data.folderPath}`)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, { files: apiAnswer } as iSocketEventsParams.getFiles) 
        }
    },
    { 
        event: socketEvents.moveFile,
        action: async (socket, data:iSocketEventsParams.moveFile) => {
            console.log(`=> MOVING FILE ${backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
            // upsert folders if not exists and move file
            console.log(`===> 1/4 creating folders ${data.endPath}`);
            await upsertRecursivelyFolders(data.endPath)
            
            console.log(`===> 2/4 moveNoteResourcesAndUpdateContent`);
            await moveNoteResourcesAndUpdateContent(data.initPath, data.endPath)
            
            console.log(`===> 3/4 moveFile`);
            await moveFile(`${backConfig.dataFolder}${data.initPath}`, `${backConfig.dataFolder}${data.endPath}`)
            
            // rescan the current dir
            // @TODO => VOIR PRK SI LENT
            console.log(`===> 4/4 debouncedScanAfterMove`);
            await debouncedFolderScan(socket, data.initPath)
            await debouncedHierarchyScan(socket)
        }
    },
    {
        event: socketEvents.createHistoryFile,
        action: async (socket, data:iSocketEventsParams.createHistoryFile) => {
            
            let historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.history`
            upsertRecursivelyFolders(`${historyFolder}/`) 

            let fileName = fileNameFromFilePath(data.filePath)
            fileName = `${formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`
            await saveFile(`${historyFolder}/${fileName}`, data.content)
        }
    },
    {
        event: socketEvents.onFileDelete,
        action: async (socket, data:iSocketEventsParams.onFileDelete) => {
            console.log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

            let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
            if (!fileExists(trashFolder)) await createDir(trashFolder)

            let fileName = fileNameFromFilePath(data.filepath)
            await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)
        }
    },
    {
        event: socketEvents.askForExplorer,
        action: async (socket, data:iSocketEventsParams.askForExplorer) => {
            let fullPath = `${data.folderpath}`
            console.log(`ASK FOR EXPLORER ${fullPath}`);
            fullPath = fullPath.split('/').join('\\')
            exec3(`%windir%\\explorer.exe \"${fullPath}\"`)
            setTimeout(() => { focusOnWinApp('explorer') }, 500)
        }
    }, 
    {
        event: socketEvents.askForNotepad,
        action: async (socket, data:iSocketEventsParams.askForNotepad) => {
            let fullPath = `${backConfig.dataFolder}${data.filepath}`
            console.log(`ASK FOR NOTEPAD ${fullPath}`);
            fullPath = fullPath.split('/').join('\\')
            exec3(`%windir%\\notepad.exe \"${fullPath}\"`)
            setTimeout(() => { focusOnWinApp('notepad') }, 500)
        }
    }, 
    {
        event: socketEvents.uploadResourcesInfos,
        action: async (socket, data:iSocketEventsParams.uploadResourcesInfos) => {
            folderToUpload.value = data.folderpath
        }
    }, 
    {
        event: socketEvents.disconnect,
        action: async (socket) => {
            
        }
    },
    
    // ...roomsRoutes,
]
