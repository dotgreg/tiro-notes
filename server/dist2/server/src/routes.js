"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketRoutes = void 0;
const sockets_events_1 = require("../../shared/sockets/sockets.events");
const config_back_1 = require("./config.back");
const exec_manager_1 = require("./managers/exec.manager");
const dir_manager_1 = require("./managers/dir.manager");
const fs_manager_1 = require("./managers/fs.manager");
const search_manager_1 = require("./managers/search.manager");
const date_manager_1 = require("./managers/date.manager");
const win_manager_1 = require("./managers/win.manager");
const move_manager_1 = require("./managers/move.manager");
const upload_manager_1 = require("./managers/upload.manager");
const lodash_1 = require("lodash");
const worker_manager_1 = require("./managers/workers/worker.manager");
exports.socketRoutes = [
    {
        event: sockets_events_1.socketEvents.askForFiles,
        action: async (socket, data) => {
            let apiAnswer = await dir_manager_1.scanDir(`${config_back_1.backConfig.dataFolder}${data.folderPath}`);
            if (typeof (apiAnswer) === 'string')
                return console.error(apiAnswer);
            socket.emit(sockets_events_1.socketEvents.getFiles, { files: apiAnswer });
        }
    },
    {
        event: sockets_events_1.socketEvents.askForFileContent,
        action: async (socket, data) => {
            let apiAnswer = await fs_manager_1.openFile(`${config_back_1.backConfig.dataFolder}/${data.filePath}`);
            socket.emit(sockets_events_1.socketEvents.getFileContent, { fileContent: apiAnswer });
        }
    },
    {
        event: sockets_events_1.socketEvents.searchFor,
        action: async (socket, data) => {
            // see if need to restrict search to a folder
            let termObj = search_manager_1.analyzeTerm(data.term);
            console.log({ termObj });
            // // first retrieve cached results if exists
            // let cachedRes = await retrieveCachedSearch(termObj.termId)
            // socket.emit(socketEvents.getFiles, {files: cachedRes, temporaryResults: true} as iSocketEventsParams.getFiles)
            // Then trigger api
            // let apiAnswer = await search(termObj.term, termObj.folderToSearch)
            // if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
            // socket.emit(socketEvents.getFiles, {files: apiAnswer} as iSocketEventsParams.getFiles)
            search_manager_1.liveSearch({
                term: termObj.term,
                folder: termObj.folderToSearch,
                onSearchUpdate: files => {
                    socket.emit(sockets_events_1.socketEvents.getFiles, { files: files, temporaryResults: true });
                },
                onSearchEnded: files => {
                    socket.emit(sockets_events_1.socketEvents.getFiles, { files: files });
                }
            });
            // finally update cached search
            // await cacheSearchResults(termObj.termId, apiAnswer)
        }
    },
    {
        event: sockets_events_1.socketEvents.askFolderHierarchy,
        action: async (socket, data) => {
            worker_manager_1.triggerWorker('getFolderHierarchySync', { folder: `${config_back_1.backConfig.dataFolder}${data.folderPath}` }, (folder) => {
                socket.emit(sockets_events_1.socketEvents.getFolderHierarchy, { folder: folder });
            });
        }
    },
    {
        event: sockets_events_1.socketEvents.saveFileContent,
        action: async (socket, data) => {
            console.log(`SAVING ${config_back_1.backConfig.dataFolder}${data.filepath} with new content`);
            await fs_manager_1.saveFile(`${config_back_1.backConfig.dataFolder}${data.filepath}`, data.newFileContent);
        },
        disableDataLog: true
    },
    {
        event: sockets_events_1.socketEvents.createNote,
        action: async (socket, data) => {
            let time = new Date();
            let nameNote = `/new-note-${lodash_1.random(0, 10000)}.md`;
            let notePath = `${config_back_1.backConfig.dataFolder}${data.folderPath}${nameNote}`;
            console.log(`CREATING ${notePath}`);
            await fs_manager_1.saveFile(`${notePath}`, ``);
            let apiAnswer = await dir_manager_1.scanDir(`${config_back_1.backConfig.dataFolder}${data.folderPath}`);
            if (typeof (apiAnswer) === 'string')
                return console.error(apiAnswer);
            socket.emit(sockets_events_1.socketEvents.getFiles, { files: apiAnswer });
        }
    },
    {
        event: sockets_events_1.socketEvents.moveFile,
        action: async (socket, data) => {
            console.log(`=> MOVING FILE ${config_back_1.backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
            // upsert folders if not exists and move file
            console.log(`===> 1/4 creating folders ${data.endPath}`);
            await fs_manager_1.upsertRecursivelyFolders(data.endPath);
            console.log(`===> 2/4 moveNoteResourcesAndUpdateContent`);
            await move_manager_1.moveNoteResourcesAndUpdateContent(data.initPath, data.endPath);
            console.log(`===> 3/4 moveFile`);
            await fs_manager_1.moveFile(`${config_back_1.backConfig.dataFolder}${data.initPath}`, `${config_back_1.backConfig.dataFolder}${data.endPath}`);
            // rescan the current dir
            // @TODO => VOIR PRK SI LENT
            console.log(`===> 4/4 debouncedScanAfterMove`);
            await move_manager_1.debouncedFolderScan(socket, data.initPath);
            await move_manager_1.debouncedHierarchyScan(socket);
        }
    },
    {
        event: sockets_events_1.socketEvents.createHistoryFile,
        action: async (socket, data) => {
            let historyFolder = `${config_back_1.backConfig.dataFolder}/${config_back_1.backConfig.configFolder}/.history`;
            if (!fs_manager_1.fileExists(historyFolder))
                await dir_manager_1.createDir(historyFolder);
            let fileName = dir_manager_1.fileNameFromFilePath(data.filePath);
            fileName = `${date_manager_1.formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`;
            await fs_manager_1.saveFile(`${historyFolder}/${fileName}`, data.content);
        }
    },
    {
        event: sockets_events_1.socketEvents.onFileDelete,
        action: async (socket, data) => {
            console.log(`DELETING ${config_back_1.backConfig.dataFolder}${data.filepath}`);
            let trashFolder = `${config_back_1.backConfig.dataFolder}/${config_back_1.backConfig.configFolder}/.trash`;
            if (!fs_manager_1.fileExists(trashFolder))
                await dir_manager_1.createDir(trashFolder);
            let fileName = dir_manager_1.fileNameFromFilePath(data.filepath);
            await fs_manager_1.moveFile(`${config_back_1.backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`);
        }
    },
    {
        event: sockets_events_1.socketEvents.askForExplorer,
        action: async (socket, data) => {
            let fullPath = `${data.folderpath}`;
            console.log(`ASK FOR EXPLORER ${fullPath}`);
            fullPath = fullPath.split('/').join('\\');
            exec_manager_1.exec3(`%windir%\\explorer.exe \"${fullPath}\"`);
            setTimeout(() => { win_manager_1.focusOnWinApp('explorer'); }, 500);
        }
    },
    {
        event: sockets_events_1.socketEvents.askForNotepad,
        action: async (socket, data) => {
            let fullPath = `${config_back_1.backConfig.dataFolder}${data.filepath}`;
            console.log(`ASK FOR NOTEPAD ${fullPath}`);
            fullPath = fullPath.split('/').join('\\');
            exec_manager_1.exec3(`%windir%\\notepad.exe \"${fullPath}\"`);
            setTimeout(() => { win_manager_1.focusOnWinApp('notepad'); }, 500);
        }
    },
    {
        event: sockets_events_1.socketEvents.uploadResourcesInfos,
        action: async (socket, data) => {
            upload_manager_1.folderToUpload.value = data.folderpath;
        }
    },
    {
        event: sockets_events_1.socketEvents.disconnect,
        action: async (socket) => {
        }
    },
];
