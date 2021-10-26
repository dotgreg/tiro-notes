import { sharedConfig } from '../../shared/shared.config';
import { getDataFolder, shouldAskForSetup, tryLoadJsonConfig } from "./managers/configSetup.manager"
import { fileExists } from './managers/fs.manager';
import { relativeToAbsolutePath } from './managers/path.manager';

// LOADING CONFIG FILE
const dataFolder = getDataFolder()
export const backConfig = {
    dataFolder,
    frontendBuildFolder: relativeToAbsolutePath('./client', true),
    
    dataFolderExists: fileExists(dataFolder),
    askForSetup: shouldAskForSetup(),
    jsonConfig:tryLoadJsonConfig(),
    sharedConfig,
    
    configFolder: '.tiro',
    historyFolder: '.history',
    uploadFolder: '.resources',
    relativeUploadFolderName: '.resources',

    dev: {
        disableLogin: false
    },

}

