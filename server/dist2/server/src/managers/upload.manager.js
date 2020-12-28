"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUploadFileRoute = exports.folderToUpload = void 0;
const config_back_1 = require("../config.back");
const sockets_events_1 = require("../../../shared/sockets/sockets.events");
const filename_helper_1 = require("../../../shared/helpers/filename.helper");
const move_manager_1 = require("./move.manager");
const fs_manager_1 = require("./fs.manager");
var siofu = require("socketio-file-upload");
exports.folderToUpload = { value: '' };
exports.initUploadFileRoute = (socket) => {
    // file upload starts listening
    var uploader = new siofu();
    uploader.dir = `${config_back_1.backConfig.dataFolder}/${config_back_1.backConfig.uploadFolder}`;
    uploader.listen(socket);
    uploader.on('start', (e) => {
        console.log('FILE UPLOAD STARTED', e);
    });
    uploader.on('complete', async (e) => {
        // console.log('FILE UPLOAD COMPLETED', e);
        if (!e.file)
            return console.error(`file could not be uploaded`);
        // e.file.path => is with ../../data 
        let finfos = filename_helper_1.getFileInfos(e.file.pathName);
        // do modification => namefile to unique ID here
        let oldPath = `${e.file.pathName}`;
        // let newPath = `${finfos.folder}/${generateNewFileName()}.${finfos.extension}`
        let newName = `${move_manager_1.generateNewFileName()}.${finfos.extension}`;
        let newRelPath = `${config_back_1.backConfig.relativeUploadFolderName}/${newName}`;
        let newAbsPath = `${config_back_1.backConfig.dataFolder}/${exports.folderToUpload.value}/${newRelPath}`;
        console.log({ oldPath, newAbsPath });
        await fs_manager_1.moveFile(oldPath, newAbsPath);
        socket.emit(sockets_events_1.socketEvents.getUploadedFile, { name: finfos.filename, path: newRelPath });
    });
};
