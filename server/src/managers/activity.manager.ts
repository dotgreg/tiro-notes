import { debounce, throttle } from "lodash"
import { backConfig } from "../config.back"
import { saveFile, upsertRecursivelyFolders, openFile } from "./fs.manager"
import { getSocketClientInfos, iClientInfosObj } from "./security.manager"

type iActivityLog = {
    eventName:string, eventAction:string, ip:string, ua:string, appUrl:string
}
const h = `[ACTIVITY]`

//
// HIGH LEVEL LOGGER
//
const currentTimeBatch:{value:iActivityLog[]} = {value: []}
export const logActivity = (eventAction: string, eventName:string, socket:any) => {
    const clientInfos = getSocketClientInfos(socket, "obj") as iClientInfosObj
    currentTimeBatch.value.push({
        eventName,
        eventAction,
        ip: clientInfos.ip,
        ua: clientInfos.ua + clientInfos.lang,
        appUrl: clientInfos.url,
    })

    askForProcessTimeBatch()
}

//
// process event batch every 5min into the montly log file
//
const intervalTime = 5 * 60 * 1000
const askForProcessTimeBatch = () => {
    throttledProcessTimeBatch()
    debounceProcessTimeBatch()
}
const throttledProcessTimeBatch = throttle(() => { processTimeBatch() }, intervalTime)
const debounceProcessTimeBatch = debounce(() => { processTimeBatch() }, intervalTime)

const monthlyActivityRamCache = {value:null}
const processTimeBatch = () => {
    // if !monthlyActivityRamCache, load the file in the ram

    // if monthlyActivityRamCache[value][month][day], create it w empty array
    // first each, if prop not present in array, push it
    // second each, RAMmonthlylog.events[today][eventName][time] indexof eventTime = -1  PUSH event dans les 5 arrays

    // finally, save it to the monthlyActivity JSON
}





// 
// SAVE/LOAD JSON MONTHLY FILE
//
interface iMonthlyDb {
    fields: {[fieldName:string]: string[]},
    timeline: {
        [dayDate:string]: {
            [eventNameIndex:number]: {
                [eventPropName:string]: number[]
            }
        }
    }
}

const dbFolderPath = `${backConfig.dataFolder}/${backConfig.configFolder}/activity`

const getMonthlyDb = async (month?:string, year?:string):Promise<iMonthlyDb|null> => {
    let currDate = getCurrDate()
    if (!year) year = currDate.year
    if (!month) month = currDate.month
    try {
        let str = await openFile(getPathFile(month, year))
        let obj = JSON.parse(str) as iMonthlyDb
        return obj
    } catch (error) {
        console.log(`${h} getMonthlyDb error:`, error)
        return null
    }
}
const setCurrentMonthlyDb = async (data:iMonthlyDb) => {
    let currDate = getCurrDate()
    let str = JSON.stringify(data)
    let pathFile = getPathFile(currDate.month, currDate.year)
    
    await upsertRecursivelyFolders(dbFolderPath)
    await saveFile(pathFile, str)
}

//
// LOW LEVEL FUNCS
//
const getCurrDate = ():{year:string, month:string} => {
    let d = new Date()
    let year = d.getFullYear().toString()
    let month = ('0'+d.getMonth()).slice(-2);
    return {year, month}
}
const getPathFile = (month:string, year:string) => `${dbFolderPath}/${year}-${month}.md`
const test = {
    1: "lol",
    10: "tt"
}

console.log(test[1], test) 