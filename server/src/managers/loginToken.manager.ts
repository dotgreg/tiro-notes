import { sharedConfig } from "../../../shared/shared.config"
import { backConfig } from "../config.back"
import { makeRandomString } from "../helpers/string.helper"
import { log } from "./log.manager"
import { verifyPassword } from "./password.manager"


// TOKEN MANAGEMENT SYSTEM

export const getLoginToken = () => memoryToken
export const generateNewToken = () => {
    let newToken = makeRandomString(60)
    log(`[LOGIN TOKEN] generate new token ${newToken}`);
    return newToken
}
export const saveTokenInMemory = (newToken:string) => {
    memoryToken = newToken
}
export const startIntervalTokenResfresh = (hours: number) => {
    log(`[LOGIN TOKEN] startIntervalTokenResfresh every ${hours} hours = ${1000 * 60 * 60 * hours} seconds`);
    
    setInterval(() => {
        saveTokenInMemory(generateNewToken())
    }, 1000 * 60 * 60 * hours)
}

// TOKEN STORING SYSTEM
let memoryToken = ''
// refreshing token every x hours
saveTokenInMemory(generateNewToken())
startIntervalTokenResfresh(sharedConfig.tokenRefreshInHours)

// USER/PASSWORD CHECK SYSTEM
export const checkUserPassword = async (user:string, password:string):Promise<boolean> => {
    const isUserGood = user === backConfig.jsonConfig.user
    const isPasswordGood = await verifyPassword(password, backConfig.jsonConfig.password)
    return isPasswordGood && isUserGood
}

