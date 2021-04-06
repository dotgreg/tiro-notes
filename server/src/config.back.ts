var path = require('path')
var fs = require('fs')
import {fileExists} from './managers/fs.manager'

// VARY PATH BASE DEV/PROD
export const isEnvDev = ():boolean => process.env.NODE_ENV.trim() === 'development' ? true : false
let pathbase = isEnvDev() ? '../..' : '..'

// LOADING CONFIG FILE
interface TiroConfig {
    dataFolder: string
}
// let jsonConfig:TiroConfig = require(path.join(__dirname, `${pathbase}/tiro-config.json`)) 
let jsonConfig:TiroConfig = JSON.parse(fs.readFileSync(path.join(__dirname, `${pathbase}/tiro-config.json`), 'utf8'))


// LOADING CONFIG FILE
export const backConfig = {
    dataFolder: path.join(__dirname, `${pathbase}/${jsonConfig.dataFolder}`),
    frontendBuildFolder: path.join(__dirname, `${pathbase}/client`),
    
    configFolder: '.tiro',
    uploadFolder: '.resources',
    relativeUploadFolderName: '.resources',
}


if (fileExists(backConfig.dataFolder)) {
    console.log(`[TIRO CONFIG] json successfully loaded, ${backConfig.dataFolder} exists`, {jsonConfig, backConfig});
} else {
    throw console.error(`[TIRO CONFIG] json successfully loaded but ${jsonConfig.dataFolder} NOT FOUND, stopping app`); 
} 