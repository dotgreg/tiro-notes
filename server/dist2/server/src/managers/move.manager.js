"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveNoteResourcesAndUpdateContent = exports.debouncedHierarchyScan = exports.debouncedFolderScan = exports.generateNewFileName = void 0;
const lodash_1 = require("lodash");
const sockets_events_1 = require("../../../shared/sockets/sockets.events");
const config_back_1 = require("../config.back");
const dir_manager_1 = require("./dir.manager");
const fs_manager_1 = require("./fs.manager");
const worker_manager_1 = require("./workers/worker.manager");
exports.generateNewFileName = () => lodash_1.random(0, 10000000000);
exports.debouncedFolderScan = lodash_1.debounce(async (socket, initPath) => {
    let folderPathArr = initPath.split('/');
    folderPathArr.pop();
    let folderPath = folderPathArr.join('/');
    console.log(`[HEAVY] ==> debouncedScanAfterMove for ${folderPath}`);
    let apiAnswer = await dir_manager_1.scanDir(`${config_back_1.backConfig.dataFolder}${folderPath}`);
    if (typeof (apiAnswer) === 'string')
        return console.error(apiAnswer);
    socket.emit(sockets_events_1.socketEvents.getFiles, { files: apiAnswer });
}, 100);
exports.debouncedHierarchyScan = lodash_1.debounce(async (socket) => {
    worker_manager_1.triggerWorker('getFolderHierarchySync', { folder: config_back_1.backConfig.dataFolder }, (folder) => {
        socket.emit(sockets_events_1.socketEvents.getFolderHierarchy, { folder: folder });
    });
}, 2000);
exports.moveNoteResourcesAndUpdateContent = async (initPath, endPath, simulate = false) => {
    if (simulate)
        console.log(`[moveNoteResourcesAndUpdateContent] SIMULATE MODE`);
    let filecontent = await fs_manager_1.openFile(`${config_back_1.backConfig.dataFolder}/${initPath}`);
    // let replacementSymbol = '--*|_|*--'
    // let tempFileContent = filecontent.replace(regex, replacementSymbol)
    let initFolderPathArr = initPath.split('/');
    initFolderPathArr.pop();
    let initFolderPath = initFolderPathArr.join('/');
    let endFolderPathArr = endPath.split('/');
    endFolderPathArr.pop();
    let endFolderPath = endFolderPathArr.join('/');
    let regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\))/g;
    let matches = filecontent.match(regex);
    let newFileContent = filecontent;
    if (!matches || !matches.length)
        return console.log('[moveNoteResourcesAndUpdateContent] no resources found, skipping');
    for (let i = 0; i < matches.length; i++) {
        const rawResource = matches[i];
        const nameResource = rawResource.replace(regex, '$2');
        // console.log('nameResource->',nameResource);
        const pathResource = rawResource.replace(regex, '$3');
        let pathsToCheck = [
            `${config_back_1.backConfig.dataFolder}/${pathResource}`,
            `${config_back_1.backConfig.dataFolder}/${initFolderPath}/${pathResource}`,
        ];
        for (let y = 0; y < pathsToCheck.length; y++) {
            let fileDoesExist = fs_manager_1.fileExists(pathsToCheck[y]);
            !fileDoesExist && console.log(`===> ${pathsToCheck[y]} not found`);
            if (fileDoesExist) {
                // if yes, move it to endPath/.resources/UNIQUEID.jpg
                let initResourcePathArr = pathsToCheck[y].split('/');
                let filenameArr = initResourcePathArr.pop().split('.');
                let extension = filenameArr[filenameArr.length - 1];
                let newFilename = `${exports.generateNewFileName()}.${extension}`;
                let endResourcePath = `${config_back_1.backConfig.dataFolder}/${endFolderPath}/${config_back_1.backConfig.relativeUploadFolderName}/${newFilename}`;
                let moveSumup = `[MOVE] Resource note move:  ${pathsToCheck[y]} (exists) -> ${endResourcePath}`;
                console.log(moveSumup);
                await fs_manager_1.upsertRecursivelyFolders(endResourcePath);
                if (!simulate) {
                    await fs_manager_1.moveFile(pathsToCheck[y], endResourcePath);
                    // change contentfile
                    let mdResource = `![${nameResource}](./${config_back_1.backConfig.relativeUploadFolderName}/${newFilename})`;
                    newFileContent = newFileContent.replace(matches[i], mdResource);
                }
            }
        }
    }
    if (!simulate)
        await fs_manager_1.saveFile(`${config_back_1.backConfig.dataFolder}/${initPath}`, newFileContent);
    console.log(newFileContent);
};
