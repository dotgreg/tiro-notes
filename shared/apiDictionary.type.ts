import { iFile, iFilePreview, iFolder, iSetupCode, iSetupForm } from "./types.shared";


export interface iApiDictionary {
    connection : {}
    disconnect : {}
    connect : {}
    reconnect : {}
    connectionSuccess : {}

    askForFiles: { folderPath: string, token: string }
    getFiles: { files: iFile[], temporaryResults?:boolean, initialResults?:boolean}

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
    getLoginInfos: {code: 'WRONG_TOKEN'|'WRONG_USER_PASSWORD'|'SUCCESS', token?: string},

    askFileHistory: {filepath: string}
    getFileHistory: {files: iFile[]}    
}