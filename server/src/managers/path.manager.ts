export const isEnvDev = ():boolean => process.env.NODE_ENV.trim() === 'development' ? true : false
export const getAppPathBase = () => isEnvDev() ? '../../..' : '..'

export const relativeToAbsolutePath = (pathFile:string):string => {
    if (pathFile[0] === '/' || pathFile[0] === '\\') pathFile = pathFile.substr(1)
    return require('path').join(__dirname, `${getAppPathBase()}/${pathFile}`)
}
