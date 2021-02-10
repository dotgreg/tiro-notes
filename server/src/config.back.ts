var path = require('path')

export const isEnvDev = ():boolean => process.env.NODE_ENV.trim() === 'development' ? true : false

let pathbase = isEnvDev() ? '../' : ''

// let pathbase = ''

export const backConfig = {
    dataFolder: path.join(__dirname, `${pathbase}../../data`),
    frontendBuildFolder: path.join(__dirname, `${pathbase}../client`),
    
    configFolder: '.extrawurst',
    uploadFolder: '.resources',
    relativeUploadFolderName: '.resources',
}