import { iSocketEventsParams, socketEvents } from "../../../../shared/sockets/sockets.events";
import { clientSocket } from "../../managers/sockets/socket.manager";

export const useFileMove = (
    multiSelectArray,
    files,
    cleanMultiSelect,
    emptyFileDetails,
) => {
    const askForMoveFile = (initPath:string, endPath:string) => {
        console.log(`[MOVEFILE] ${initPath} -> ${endPath}`);
        clientSocket.emit(socketEvents.moveFile, {initPath, endPath, shouldRescan: true} as iSocketEventsParams.moveFile)  
    }
    
    const promptAndBatchMoveFiles = (folderpath:string) => {
        let userAccepts = window.confirm(`Are you sure you want to move ${multiSelectArray.length} files and their resources to ${folderpath}`)
        if (userAccepts) {
            for (let i = 0; i < multiSelectArray.length; i++) {
            const fileId = multiSelectArray[i];
            let file = files[fileId]
            let filenameArr = file.name.split('/')
            // in case we are in research, the file.name === file.path
            let realFileName = filenameArr[filenameArr.length-1]
            askForMoveFile(file.path, `${folderpath}/${realFileName}`)
            }
            cleanMultiSelect() 
            emptyFileDetails()
        }
    }

    return {askForMoveFile, promptAndBatchMoveFiles}
}