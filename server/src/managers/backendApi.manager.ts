
import { sharedFunctionsApi } from "../../../shared/api/functions.shared.api";
import { scanDirForFiles, scanDirForFoldersRecursive } from "./dir.manager";
import { evalBackendCode } from "./eval.manager";
import { execString, execStringStream } from "./exec.manager";
import { downloadFile, fetchEval, fetchFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager";
import { debouncedFolderScan, moveFileLogic } from "./move.manager";
import { listBackendPluginsFunctions, scanPlugins, triggerBackendFunction } from "./plugins.manager";

export const getBackendApi = () => {
    return {
        folders: {
            scanDirForFoldersRecursive,
            scanDirForFiles,
            debouncedFolderScan,
            upsertRecursivelyFolders

        },
        file: {
            moveFileLogic,
            openFile,
            saveFile,
        },
        ressource: {
            // downloadFile,
            fetchFile,
            fetchEval
        },
        eval: {
            evalBackendCode
        },
        command: {
            execString,
            execStringStream
        },
        plugins: {
            scanPlugins,
            getBackendFunctions: listBackendPluginsFunctions,
            triggerBackendFunction: triggerBackendFunction

        },
        shared: {
            functions: sharedFunctionsApi
        },
        test: {
            fntest: () => { return "hello world backend api" }
        }
    }
}
