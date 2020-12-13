import { iFile, iFolder } from "../types.shared";

export enum socketEvents {
    connection = 'connection',
    disconnect = 'disconnect',
    connectionSuccess = 'connectionSuccess',

    askForFiles = 'askForFiles',
    getFiles = 'getFiles',

    askForFileContent = 'askForFileContent',
    getFileContent = 'getFileContent',
    
    getUploadedFile = 'getUploadedFile',
    
    searchFor = 'searchFor',
    
    askFolderHierarchy = 'askFolderHierarchy',
    getFolderHierarchy = 'getFolderHierarchy',
}

export namespace iSocketEventsParams {
    export interface askForFiles { folderPath: string }
    export interface getFiles { files: iFile[]}

    export interface askForFileContent {filePath:string}
    export interface getFileContent {fileContent: string}
    
    export interface searchFor {term:string}
    export interface getUploadedFile {name:string, path:string}

    export interface askFolderHierarchy {folderPath:string}
    export interface getFolderHierarchy {folder: iFolder}
}