import { backConfig } from "../config.back";
import { socketEvents, iSocketEventsParams } from "../../../shared/sockets/sockets.events";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { generateNewFileName } from "./move.manager";
import { moveFile, upsertRecursivelyFolders } from "./fs.manager";

var siofu = require("socketio-file-upload");

export let folderToUpload = {value: ''}

export const initUploadFileRoute = async (socket:SocketIO.Socket) => {
    // file upload starts listening
    var uploader = new siofu();
    let initialUploadPath = `${backConfig.dataFolder}/${backConfig.uploadFolder}`
    console.log(initialUploadPath);
    
    await upsertRecursivelyFolders(`${initialUploadPath}/`)
    uploader.dir = initialUploadPath;
    uploader.listen(socket);
    uploader.on('start', (e) => {
        console.log('FILE UPLOAD STARTED', e); 
        
    })
    uploader.on('complete', async (e) => {
        // console.log('FILE UPLOAD COMPLETED', e);

        if (!e.file) return console.error(`file could not be uploaded`)
        // e.file.path => is with ../../data 
        let finfos = getFileInfos(e.file.pathName)

        // do modification => namefile to unique ID here
        let oldPath = `${e.file.pathName}`
        let newName = `${generateNewFileName()}.${finfos.extension}`
        let newRelPath = cleanPath(`${backConfig.relativeUploadFolderName}/${newName}`)
        let newAbsPath = cleanPath(`${backConfig.dataFolder}/${folderToUpload.value}/${newRelPath}`)
        console.log({oldPath, newAbsPath});
        
        await upsertRecursivelyFolders(newAbsPath)
        await moveFile(oldPath, newAbsPath)
 
        socket.emit(socketEvents.getUploadedFile, {name: finfos.filename, path:newRelPath} as iSocketEventsParams.getUploadedFile)  
        
    })
}