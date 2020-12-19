import { iFile, iFolder } from "../types.shared";

export enum socketEvents {
    connection = 'connection',
    disconnect = 'disconnect',
    connectionSuccess = 'connectionSuccess',

    askForFiles = 'askForFiles',
    getFiles = 'getFiles',

    askForFileContent = 'askForFileContent',
    getFileContent = 'getFileContent',

    saveFileContent = 'saveFileContent',
    
    getUploadedFile = 'getUploadedFile',

    moveFile = 'moveFile',
    
    searchFor = 'searchFor',
    
    askFolderHierarchy = 'askFolderHierarchy',
    getFolderHierarchy = 'getFolderHierarchy',

    createNote = 'createNote',
    createHistoryFile = 'createHistoryFile',

    onFileDelete = 'onFileDelete',
    askForExplorer = 'askForExplorer',
    askForNotepad = 'askForNotepad',
    uploadResourcesInfos = 'uploadResourcesInfos',

}

export namespace iSocketEventsParams {
    export interface askForFiles { folderPath: string }
    export interface getFiles { files: iFile[], temporaryResults?:boolean}

    export interface askForFileContent {filePath:string}
    export interface getFileContent {fileContent: string}

    export interface saveFileContent {filepath: string, newFileContent:string}

    export interface moveFile {initPath: string, endPath:string}
    
    export interface searchFor {term:string}
    export interface getUploadedFile {name:string, path:string}

    export interface askFolderHierarchy {folderPath:string}
    export interface getFolderHierarchy {folder: iFolder}

    export interface createNote {folderPath: string}

    export interface createHistoryFile {filePath: string, content: string}

    export interface onFileDelete {filepath: string}
    export interface askForExplorer {folderpath: string}
    export interface askForNotepad {filepath: string}

    export interface uploadResourcesInfos {folderpath: string}
}