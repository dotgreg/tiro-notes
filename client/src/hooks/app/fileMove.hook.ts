import { iSocketEventsParams, socketEvents } from "../../../../shared/sockets/sockets.events";
import { iFile, iFolder } from "../../../../shared/types.shared";
import { clientSocket } from "../../managers/sockets/socket.manager";
import { updateUrl } from "../../managers/url.manager";

export const useFileMove = (
    emptyFileDetails,
    cleanFilesList,
    cleanFolderHierarchy
) => {

    const askForMoveFile = (initPath:string, endPath:string) => {
        console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
        clientSocket.emit(socketEvents.moveFile, {initPath, endPath} as iSocketEventsParams.moveFile)  
    }

    const askForMoveFolder = (initPath:string, endPath:string) => {
        console.log(`[MOVEFOLDER] ${initPath} -> ${endPath}`);
        clientSocket.emit(socketEvents.moveFolder, {initPath, endPath} as iSocketEventsParams.moveFolder)  
    }
    
    const promptAndBatchMoveFiles = (files: iFile[], folderToDropInto:iFolder) => {
        let userAccepts = window.confirm(`move ${files?.length} files to ${folderToDropInto.key }? (example: ${files[0].path} to ${folderToDropInto.key}/${files[0].name}`)
        if (userAccepts) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let initPath = `${file.path}`
                let endPath = `${folderToDropInto.key}/${file.name}`
                askForMoveFile(initPath, endPath)
            }
            emptyFileDetails()
        }
    }

    const promptAndMoveFolder = (folder: iFolder, folderToDropInto:iFolder) => {
        let userAccepts = window.confirm(`move folder ${folder.path} to ${folderToDropInto.path}/${folder.title}?`)
        if (userAccepts) {
            let initPath = folder.path
            let endPath = `${folderToDropInto.path}/${folder.title}`
            askForMoveFolder(initPath, endPath)
            emptyFileDetails()
            cleanFilesList()
            cleanFolderHierarchy()
            updateUrl({})
        }
    }

    // let warn = `You are about to move the ${item.type} ${item.folder?.path} to ${folderToDropInto}${item.folder?.path}`
    // alert(warn)

    return {askForMoveFile, promptAndBatchMoveFiles, promptAndMoveFolder}
}