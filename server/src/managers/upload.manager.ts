import { backConfig } from "../config.back";
import { socketEvents, iSocketEventsParams } from "../../../shared/sockets/sockets.events";

var siofu = require("socketio-file-upload");

export const initUploadFileRoute = (socket:SocketIO.Socket) => {
    // file upload starts listening
    var uploader = new siofu();
    uploader.dir = `${backConfig.dataFolder}\\${backConfig.uploadFolder}`;
    uploader.listen(socket);
    uploader.on('start', (e) => {
        console.log('FILE UPLOAD STARTED', e); 
        
    })
    uploader.on('complete', (e) => {
        // console.log('FILE UPLOAD COMPLETED', e);

        if (!e.file) return console.error(`file could not be uploaded`)
        let actualFileNameArr = e.file.pathName.split('\\')
        let actualFileName = actualFileNameArr[actualFileNameArr.length-1]
        socket.emit(socketEvents.getUploadedFile, {name: e.file.name, path: `${backConfig.uploadFolder}/${actualFileName}`} as iSocketEventsParams.getUploadedFile)  
        
    })
}