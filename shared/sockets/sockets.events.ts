import { iFile } from "../types.shared";

export enum socketEvents {
    connection = 'connection',
    disconnect = 'disconnect',
    connectionSuccess = 'connectionSuccess',

    askForFolder = 'askForFolder',
    getFolderFiles = 'getFolderFiles'
}

export namespace iSocketEventsParams {

    export interface askForFolder {
        // path: string
    }
    export interface getFolderFiles {
        files: iFile[]
    }
   
}