import { socketEvents, iSocketEventsParams } from "../../shared/apiDictionary.type";
import { backConfig } from "./config.back";
import {  exec3 } from "./managers/exec.manager";
import { createDir, dirDefaultBlacklist, fileNameFromFilePath, scanDirForFiles, scanDirForFolders } from "./managers/dir.manager";
import { createFolder, fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./managers/fs.manager";
import {  analyzeTerm, liveSearch } from "./managers/search.manager";
import { formatDateHistory } from "./managers/date.manager";
import { focusOnWinApp } from "./managers/win.manager";
import { debouncedFolderScan, moveNoteResourcesAndUpdateContent, debouncedHierarchyScan } from "./managers/move.manager";
import { folderToUpload } from "./managers/upload.manager";
import { random } from "lodash";
import { triggerWorker } from "./managers/workers/worker.manager";
import { iFolder } from "../../shared/types.shared";
import { getFilesPreviewLogic } from "./managers/filePreview.manager";
import { hashPassword, verifyPassword } from "./managers/password.manager";
import { appConfigJsonPath, processClientSetup, TiroConfig } from "./managers/configSetup.manager";
import { restartTiroServer } from "./managers/serverRestart.manager";
import { serverSocket2 } from "./managers/socket.manager";
import { checkUserPassword, generateNewToken, getLoginToken, saveTokenInMemory } from "./managers/loginToken.manager";


export const listenSocketEndpoints = () => {

    serverSocket2.on('askForFiles', async data => {
        let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${data.folderPath}`)
        if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
        serverSocket2.emit('getFiles', { files: apiAnswer }) 
    })

    serverSocket2.on('askForFileContent', async data => {
        let apiAnswer = await openFile(`${backConfig.dataFolder}/${data.filePath}`)
        serverSocket2.emit('getFileContent', {fileContent: apiAnswer, filePath: data.filePath})
    })

    serverSocket2.on('searchFor', async data => {
        // see if need to restrict search to a folder
        let termObj = analyzeTerm(data.term)
        console.log({termObj});

        // // first retrieve cached results if exists
        // let cachedRes = await retrieveCachedSearch(termObj.termId)
        // socket.emit(socketEvents.getFiles, {files: cachedRes, temporaryResults: true} as iSocketEventsParams.getFiles)
        
        // Then trigger api
        // let apiAnswer = await search(termObj.term, termObj.folderToSearch)
        // if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
        // socket.emit(socketEvents.getFiles, {files: apiAnswer} as iSocketEventsParams.getFiles)
        
        liveSearch({
            term: termObj.term, 
            folder: termObj.folderToSearch, 
            titleSearch: termObj.titleSearch,
            
            onSearchUpdate : files => {
                serverSocket2.emit('getFiles', {files: files, temporaryResults: true})
            },
            onSearchEnded : files => {
                serverSocket2.emit('getFiles', {files: files})
            }
        })
        
        // finally update cached search
        // await cacheSearchResults(termObj.termId, apiAnswer)
    })

    serverSocket2.on('askFolderHierarchy', async data => {
        triggerWorker('getFolderHierarchySync', {
            folder: `${backConfig.dataFolder}${data.folderPath}`,
            config: {  dataFolder: backConfig.dataFolder, blacklist: dirDefaultBlacklist }
        }, (folder:iFolder) => {
            serverSocket2.emit('getFolderHierarchy', {folder, pathBase: backConfig.dataFolder})
        })  
    })

    serverSocket2.on('askFoldersScan', async data => {
        let folders:iFolder[] = []
        for (let i = 0; i < data.foldersPaths.length; i++) {
            folders.push(scanDirForFolders(data.foldersPaths[i]))
        }
        serverSocket2.emit('getFoldersScan', {folders, pathBase: backConfig.dataFolder})
    })

    serverSocket2.on('saveFileContent', async data => {
        console.log(`SAVING ${backConfig.dataFolder}${data.filepath} with new content`);
        await saveFile(`${backConfig.dataFolder}${data.filepath}`, data.newFileContent)
        // sends back to all sockets the updated content
        // ioServer.emit(socketEvents.getFileContent, {fileContent: data.newFileContent, filePath: data.filepath} as iSocketEventsParams.getFileContent)
    },{disableDataLog: true})

    serverSocket2.on('createNote', async data => {
        let nameNote = `/new-note-${random(0,10000)}.md`
        let notePath = `${backConfig.dataFolder}${data.folderPath}${nameNote}`
        console.log(`CREATING ${notePath}`);
        await saveFile(`${notePath}`, ``)

        let apiAnswer = await scanDirForFiles(`${backConfig.dataFolder}${data.folderPath}`)
        if (typeof(apiAnswer) === 'string') return console.error(apiAnswer)
        serverSocket2.emit('getFiles', { files: apiAnswer })     
    })

    serverSocket2.on('moveFile', async data => {
        console.log(`=> MOVING FILE ${backConfig.dataFolder}${data.initPath} -> ${data.endPath}`);
        // upsert folders if not exists and move file
        console.log(`===> 1/4 creating folders ${data.endPath}`);
        await upsertRecursivelyFolders(data.endPath)
        
        console.log(`===> 2/4 moveNoteResourcesAndUpdateContent`);
        await moveNoteResourcesAndUpdateContent(data.initPath, data.endPath)
        
        console.log(`===> 3/4 moveFile`);
        await moveFile(`${backConfig.dataFolder}${data.initPath}`, `${backConfig.dataFolder}${data.endPath}`)
        
        // rescan the current dir
        console.log(`===> 4/4 debouncedScanAfterMove`);
        await debouncedFolderScan(serverSocket2, data.initPath)
        // await debouncedHierarchyScan(socket)
    })

    serverSocket2.on('moveFolder', async data => {
        console.log(`=> MOVING FOLDER ${data.initPath} -> ${data.endPath}`);
        await upsertRecursivelyFolders(data.endPath)
        await moveFile(data.initPath, data.endPath)
    })

    serverSocket2.on('createHistoryFile', async data => {
        let historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.history`
        upsertRecursivelyFolders(`${historyFolder}/`) 

        let fileName = fileNameFromFilePath(data.filePath)
        fileName = `${formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`
        await saveFile(`${historyFolder}/${fileName}`, data.content)
    })

    serverSocket2.on('onFileDelete', async data => {
        console.log(`DELETING ${backConfig.dataFolder}${data.filepath}`);

        let trashFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/.trash`
        if (!fileExists(trashFolder)) await createDir(trashFolder)

        let fileName = fileNameFromFilePath(data.filepath)
        await moveFile(`${backConfig.dataFolder}${data.filepath}`, `${trashFolder}/${fileName}`)
    })

    serverSocket2.on('askForExplorer', async data => {
        let fullPath = `${data.folderpath}`
        console.log(`ASK FOR EXPLORER ${fullPath}`);
        fullPath = fullPath.split('/').join('\\')
        exec3(`%windir%\\explorer.exe \"${fullPath}\"`)
        setTimeout(() => { focusOnWinApp('explorer') }, 500)
    })

    serverSocket2.on('uploadResourcesInfos', async data => {
        folderToUpload.value = data.folderpath
    })

    serverSocket2.on('disconnect', async data => {
        
    })

    serverSocket2.on('askFilesPreview', async data => {
        let res = await getFilesPreviewLogic(data)
        serverSocket2.emit('getFilesPreview', {filesPreview: res})
    })

    serverSocket2.on('askFolderCreate', async data => {
        createFolder(`${backConfig.dataFolder}${data.parent.path}/${data.newFolderName}`)
    })

    serverSocket2.on('sendSetupInfos', async data => {
        const answer = await processClientSetup(data)
        serverSocket2.emit(socketEvents.getSetupInfos, answer)

        // if setup success, restart server
        // NOT WORKING ON DEV NODEMON
        if (answer.code === 'SUCCESS_CONFIG_CREATION') restartTiroServer()
    }, {duringSetup: true})


    serverSocket2.on('sendLoginInfos', async data => {
        const areClientInfosCorrect = await checkUserPassword(data.user, data.password)
        if (!areClientInfosCorrect) {
            serverSocket2.emit('getLoginInfos',{code:'WRONG_USER_PASSWORD'})
        } else {
            serverSocket2.emit('getLoginInfos',{code:'SUCCESS', token: getLoginToken()})
        }
    }, {bypassLoginTokenCheck: true})
}

