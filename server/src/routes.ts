import { iSockerRoute } from "./managers/socket/socket.manager"
import { socketEvents, iSocketEventsParams } from "../../shared/sockets/sockets.events";
import { backConfig } from "./config.back";
import { exec2 } from "./managers/exec.manager";
import { getFolderHierarchy, scanDir } from "./managers/dir.manager";
import { openFile } from "./managers/fs.manager";
import { search } from "./managers/search.manager";

export const socketRoutes:iSockerRoute[] = [
    {
        event: socketEvents.askForFiles,
        action: async (socket, data:iSocketEventsParams.askForFiles) => {
            let apiAnswer = await scanDir(`${backConfig.dataFolder}/${data.folderPath}`)
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
            let apiAnswer = await search(data.term)
            if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            socket.emit(socketEvents.getFiles, {files: apiAnswer} as iSocketEventsParams.getFiles)
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
        event: socketEvents.disconnect,
        action: async (socket) => {
            
        }
    },
    
    // ...roomsRoutes,
]
