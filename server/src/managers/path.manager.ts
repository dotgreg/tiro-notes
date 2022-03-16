import {cleanPath} from '../../../shared/helpers/filename.helper'
import { backConfig } from '../config.back'
import { log } from './log.manager'

const nodeEnv = process.env.NODE_ENV || ''
export const isEnvDev = ():boolean => nodeEnv.trim() === 'development' ? true : false
export const getAppPathBase2 = () => isEnvDev() ? '../../..' : '..'
export const getAppPathBase = () => isEnvDev() ? '..' : '..'


const path = require('path')

// export const

const isAbsolute = (filePath:string) => {
    if (filePath.endsWith('/') || filePath.endsWith('\\'))  filePath = filePath.slice(0, -1) 
    const res = path.resolve(filePath) 
    const norm = path.normalize(filePath)
    return res === norm
}

export const anyToRelPath = (pathFile:string):string => {
    
    if (backConfig && backConfig.dataFolder) {
        pathFile = cleanPath(pathFile)
        // remove dataFolder
        pathFile = pathFile.split(backConfig.dataFolder).join('')
        // pathFile = pathFile.replace(backConfig.dataFolder, '')
    }
    
    return pathFile
}

export const relativeToAbsolutePath = (pathFile:string, insideSnapshot: boolean = false):string => {
    
    // if (pathFile) {
    //     if (pathFile[0] === '/' || pathFile[0] === '\\') pathFile = pathFile.substr(1)
    // } else {
    //     pathFile = ''
    // }
    if (!pathFile) {
        pathFile = ''
    }

    // if (backConfig && backConfig.dataFolder) {
    //     pathFile = pathFile.split(backConfig.dataFolder).join('')
    //     pathFile = `${backConfig.dataFolder}${pathFile}`
    // }

    let res = pathFile
    let rootFolder
    let basePath
    if (!isAbsolute(pathFile)) {
        if (insideSnapshot) {
            basePath = isEnvDev() ? '../../..' : '..'
            rootFolder = __dirname
        } else {
            // will be exec 
            basePath = isEnvDev() ? '..' : ''
            rootFolder = process.cwd()
        }
        res = path.join(rootFolder, `${basePath}/${pathFile}`)
    }

    // remove first all occurences of rootFolderPath
    // if (backConfig && backConfig.dataFolder) {
    //     pathFile = pathFile.split(backConfig.dataFolder).join('')
    //     pathFile = `${backConfig.dataFolder}${pathFile}`
    // }
    
    res = cleanPath(res)

    if (insideSnapshot) log('relative2abs insideSnapshot', isAbsolute, pathFile, res);
    return res
}

export const p = relativeToAbsolutePath
