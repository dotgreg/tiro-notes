import { iFile, iFilePreview, iFolder, iSetupCode, iSetupForm } from "./types.shared";

export enum socketEvents {
    connection = 'connection',
    disconnect = 'disconnect',
    connect = 'connect',
    reconnect = 'reconnect',
    connectionSuccess = 'connectionSuccess',

    askForFiles = 'askForFiles',
    getFiles = 'getFiles',

    askForFileContent = 'askForFileContent',
    getFileContent = 'getFileContent',

    saveFileContent = 'saveFileContent',
    
    getUploadedFile = 'getUploadedFile',

    moveFile = 'moveFile',
    moveFolder = 'moveFolder',
    
    searchFor = 'searchFor',
    
    askFolderHierarchy = 'askFolderHierarchy',
    getFolderHierarchy = 'getFolderHierarchy',

    createNote = 'createNote',
    createHistoryFile = 'createHistoryFile',

    onFileDelete = 'onFileDelete',
    askForExplorer = 'askForExplorer',
    uploadResourcesInfos = 'uploadResourcesInfos',

    askFilesPreview = 'askFilesPreview',
    getFilesPreview = 'getFilesPreview',

    askFoldersScan = 'askFoldersScan',
    getFoldersScan = 'getFoldersScan',

    askFolderDelete = 'askFolderDelete',
    askFolderCreate = 'askFolderCreate',

    sendSetupInfos = 'sendSetupInfos',
    getSetupInfos = 'getSetupInfos',
}

export declare namespace iSocketEventsParams {
    export interface askForFiles { folderPath: string }
    export interface getFiles { files: iFile[], temporaryResults?:boolean}

    export interface askForFileContent {filePath:string}
    export interface getFileContent {fileContent: string, filePath:string}

    export interface saveFileContent {filepath: string, newFileContent:string}

    export interface moveFile {initPath: string, endPath:string}
    export interface moveFolder {initPath: string, endPath:string}
    
    export interface searchFor {term:string}
    export interface getUploadedFile {name:string, path:string}

    export interface askFolderHierarchy {folderPath:string}
    export interface getFolderHierarchy {folder: iFolder, pathBase:string}

    export interface createNote {folderPath: string}

    export interface createHistoryFile {filePath: string, content: string, historyFileType: string}

    export interface onFileDelete {filepath: string}
    export interface askForExplorer {folderpath: string}

    export interface uploadResourcesInfos {folderpath: string}

    export interface askFilesPreview {filesPath: string[]}
    export interface getFilesPreview {filesPreview: iFilePreview[]}

    export interface askFoldersScan {foldersPaths:string[]}
    export interface getFoldersScan {folders: iFolder[], pathBase:string}

    export interface askFolderCreate {newFolderName: string, parent:iFolder}
    export interface askFolderDelete {folderToDelete: iFolder}
    
    export interface askFolderDelete {folderToDelete: iFolder}

    export interface sendSetupInfos {form: iSetupForm}
    export interface getSetupInfos {code: iSetupCode, message?: string}
}

export interface iApiDictionary {
    connection : {}
    disconnect : {}
    connect : {}
    reconnect : {}
    connectionSuccess : {}

    askForFiles: { folderPath: string, token: string }
    getFiles: { files: iFile[], temporaryResults?:boolean}

    askForFileContent: {filePath:string}
    getFileContent: {fileContent: string, filePath:string}

    saveFileContent: {filepath: string, newFileContent:string}

    moveFile: {initPath: string, endPath:string}
    moveFolder: {initPath: string, endPath:string}
    
    searchFor: {term:string}
    getUploadedFile: {name:string, path:string}

    askFolderHierarchy: {folderPath:string}
    getFolderHierarchy: {folder: iFolder, pathBase:string}

    createNote: {folderPath: string}

    createHistoryFile: {filePath: string, content: string, historyFileType: string}

    onFileDelete: {filepath: string}
    askForExplorer: {folderpath: string}

    uploadResourcesInfos: {folderpath: string}

    askFilesPreview: {filesPath: string[]}
    getFilesPreview: {filesPreview: iFilePreview[]}

    askFoldersScan: {foldersPaths:string[]}
    getFoldersScan: {folders: iFolder[], pathBase:string}

    askFolderCreate: {newFolderName: string, parent:iFolder}
    askFolderDelete: {folderToDelete: iFolder}
    
    sendSetupInfos: {form: iSetupForm}
    getSetupInfos: {code: iSetupCode, message?: string}

    sendLoginInfos: {user:string, password:string}
    getLoginInfos: {code: 'WRONG_TOKEN'|'WRONG_USER_PASSWORD'|'SUCCESS', token?: string}    
}