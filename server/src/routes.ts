import { iSockerRoute } from "./managers/socket/socket.manager"
import { socketEvents, iSocketEventsParams } from "../../shared/sockets/sockets.events";
import { backConfig } from "./config.back";
import { exec2 } from "./managers/exec.manager";
import { createDir, fileNameFromFilePath, getFolderHierarchy, scanDir } from "./managers/dir.manager";
import { fileExists, moveFile, openFile, removeFile, saveFile } from "./managers/fs.manager";
import { cacheSearchResults, retrieveCachedSearch, search } from "./managers/search.manager";
import { formatDateNewNote, formatDateHistory, formatDateTag } from "./managers/date.manager";

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

            // first retrieve cached results if exists
            let cachedRes = await retrieveCachedSearch(data.term)
            socket.emit(socketEvents.getFiles, {files: cachedRes} as iSocketEventsParams.getFiles)
            
            // Then trigger api
            let apiAnswer = await search(data.term)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, {files: apiAnswer} as iSocketEventsParams.getFiles)
            
            // finally update cached search
            await cacheSearchResults(data.term, apiAnswer)
        }
    },
    {
        event: socketEvents.askFolderHierarchy,
        action: async (socket, data:iSocketEventsParams.askFolderHierarchy) => {
            let folder = await getFolderHierarchy(`${backConfig.dataFolder}${data.folderPath}`)
            socket.emit(socketEvents.getFolderHierarchy, {folder: folder} as iSocketEventsParams.getFolderHierarchy)
        }
    },
    
    {
        event: socketEvents.saveFileContent,
        action: async (socket, data:iSocketEventsParams.saveFileContent) => {
            console.log(`SAVING ${backConfig.dataFolder}${data.filepath} with new content`,data.newFileContent);
            await saveFile(`${backConfig.dataFolder}${data.filepath}`, data.newFileContent)
        }
    },
    {
        event: socketEvents.createNote,
        action: async (socket, data:iSocketEventsParams.createNote) => {
            let time = new Date() 
            let nameNote = `/Note from ${formatDateNewNote(time)}.md`
            let notePath = `${backConfig.dataFolder}${data.folderPath}${nameNote}`
            console.log(`CREATING ${notePath}`);
            await saveFile(`${notePath}`, `--date-${formatDateTag(time)}`)

            let apiAnswer = await scanDir(`${backConfig.dataFolder}${data.folderPath}`)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, { files: apiAnswer } as iSocketEventsParams.getFiles) 
        }
    },
    { 
        event: socketEvents.moveFile,
        action: async (socket, data:iSocketEventsParams.moveFile) => {
            // upsert folders if not exists and move file
            console.log(`MOVING FILE ${backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
            await moveFile(`${backConfig.dataFolder}${data.initPath}`, `${backConfig.dataFolder}${data.endPath}`)

            // rescan whole tree
            let folder = await getFolderHierarchy(`${backConfig.dataFolder}`)
            socket.emit(socketEvents.getFolderHierarchy, {folder: folder} as iSocketEventsParams.getFolderHierarchy)

            // rescan the current dir
            let folderPathArr = data.initPath.split('/')
            folderPathArr.pop()
            let folderPath = folderPathArr.join('/')
            let apiAnswer = await scanDir(`${backConfig.dataFolder}${folderPath}`)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, { files: apiAnswer } as iSocketEventsParams.getFiles) 
        }
    },
    {
        event: socketEvents.createHistoryFile,
        action: async (socket, data:iSocketEventsParams.createHistoryFile) => {
            
            let historyFolder = `${backConfig.dataFolder}/.history`
            if (!fileExists(historyFolder)) await createDir(historyFolder)

            let fileName = fileNameFromFilePath(data.filePath)
            fileName = `${formatDateHistory(new Date())}-${fileName}`
            await saveFile(`${historyFolder}/${fileName}`, data.content)
        }
    },
    {
        event: socketEvents.onFileDelete,
        action: async (socket, data:iSocketEventsParams.onFileDelete) => {
            console.log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

            let trashFolder = `${backConfig.dataFolder}/.trash`
            if (!fileExists(trashFolder)) await createDir(trashFolder)

            let fileName = fileNameFromFilePath(data.filepath)
            await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)
        }
    },
    {
        event: socketEvents.disconnect,
        action: async (socket) => {
            
        }
    },
    
    // ...roomsRoutes,
]
