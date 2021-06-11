import {cleanPath} from '../../../shared/helpers/filename.helper'
import { backConfig } from '../config.back'

export const isEnvDev = ():boolean => process.env.NODE_ENV.trim() === 'development' ? true : false
export const getAppPathBase2 = () => isEnvDev() ? '../../..' : '..'
export const getAppPathBase = () => isEnvDev() ? '..' : '..'


const path = require('path')

// export const

export const relativeToAbsolutePath = (pathFile:string, insideSnapshot: boolean = false):string => {
    
    // if (pathFile) {
    //     if (pathFile[0] === '/' || pathFile[0] === '\\') pathFile = pathFile.substr(1)
    // } else {
    //     pathFile = ''
    // }
    if (!pathFile) {
        pathFile = ''
    }

    // remove first all occurences of rootFolderPath
    if (backConfig && backConfig.dataFolder) {
        pathFile = pathFile.split(backConfig.dataFolder).join('')
        pathFile = `${backConfig.dataFolder}${pathFile}`
    }

    let res = pathFile
    let isAbsolute = path.isAbsolute(pathFile)
    let rootFolder
    let basePath
    if (!isAbsolute) {
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
    
    res = cleanPath(res)

    if (insideSnapshot) console.log('relative2abs insideSnapshot', isAbsolute, pathFile, res);
    return res
}

export const p = relativeToAbsolutePath