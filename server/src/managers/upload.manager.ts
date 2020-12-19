import { backConfig } from "../config.back";
import { socketEvents, iSocketEventsParams } from "../../../shared/sockets/sockets.events";
import { getFileInfos } from "../../../shared/helpers/filename.helper";
import { generateNewFileName } from "./move.manager";
import { moveFile } from "./fs.manager";

var siofu = require("socketio-file-upload");

export let folderToUpload = {value: ''}

export const initUploadFileRoute = (socket:SocketIO.Socket) => {
    // file upload starts listening
    var uploader = new siofu();
    uploader.dir = `${backConfig.dataFolder}\\${backConfig.uploadFolder}`;
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
        // let newPath = `${finfos.folder}/${generateNewFileName()}.${finfos.extension}`
        let newName = `${generateNewFileName()}.${finfos.extension}`
        let newRelPath = `${backConfig.relativeUploadFolderName}/${newName}`
        let newAbsPath = `${backConfig.dataFolder}/${folderToUpload.value}/${newRelPath}`
        console.log({oldPath, newAbsPath});
        
        await moveFile(oldPath, newAbsPath)
 
        socket.emit(socketEvents.getUploadedFile, {name: newName, path:newRelPath} as iSocketEventsParams.getUploadedFile)  
        
    })
}