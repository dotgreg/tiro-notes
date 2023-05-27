import { debounce, each, throttle } from "lodash"
import { backConfig } from "../config.back"
import { saveFile, upsertRecursivelyFolders, openFile } from "./fs.manager"
import { perf } from "./performance.manager"
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


//
// DATA STRUCTURE REF
//
//     fields: {ip:[], eventName:[], ua:[], urlPath:[], type:[]}
//     events: {
//       "30": {
//           4: {
//             ip: [1,2,1,3,0,0,4,3,1,1,2,3,4,5,6,7,8,2,1,2],
//             uas: [1,2,1,3,0,-1,-1,3,1,1,2,3,4,5,6,7,8,2,1,2],
//             url: [1,2,1,3,0,0,4,3,1,1,2,3,4,5,6,7,8,2,1,2],
//              type: [1,2,1,3,0,0,4,3,1,1,2,3,4,5,6,7,8,2,1,2]
//              time: [1:10,12:02,2:45,1:10,12:02,2:451:10,12:02,2:451:10,12:02,2:45]
//           }
//     }
//   }
const monthlyActivityRamCache:{value:iMonthlyDb|null} = {value:null}
const processTimeBatch = async () => {
    console.log(`${h} processTimeBatch`)
    let endPerf = perf('${h} processTimeBatch ')

    // if !monthlyActivityRamCache, load the file in the ram
    if (!monthlyActivityRamCache.value) monthlyActivityRamCache.value = await getMonthlyDb()
    const m = monthlyActivityRamCache
    
    const newMonthlyDb = processTimeBatchInt(m.value)

    // finally, save it to the monthlyActivity JSON
    await setCurrentMonthlyDb(newMonthlyDb)

    endPerf()
}

export const processTimeBatchInt = (monthlyDb:iMonthlyDb|null):iMonthlyDb => {
    let m = monthlyDb
    if (!m) m = {fields:{}, events:{}} 

    // [value.fields] first each, if prop not present in array, push it
    each(currentTimeBatch.value, event => {
        each(event, (propVal, propName) => {
            if(!m.fields[propName]) m.fields[propName] = []
            if (m.fields[propName].indexOf(propVal) === -1) m.fields[propName].push(propVal)
        })
    })

    // [value.events] second each, 
    let d = getCurrDateTime()
    each(currentTimeBatch.value, currEvent => {
        let eventTime = `${d.hour}:${d.min}`
        let currDateStr = `${d.day}`
        // EVERY DAY OBJ
        if(!m.events[currDateStr]) m.events[currDateStr] = {}
        let eventNameIndex = m.fields["eventName"].indexOf(currEvent.eventName)

        // CREATE DAILY EVENT
        if(!m.events[currDateStr][eventNameIndex]) m.events[currDateStr][eventNameIndex] = {time:[]}
        let dayEventSumup = m.events[currDateStr][eventNameIndex]

        // IS EVENT ALREADY PRESENT FOR CURRENT TIME BATCH?
        let eventAlreadyPresent = dayEventSumup.time.indexOf(eventTime) !== -1

        // => time: [1:10,12:02,2:45,1:10,12:02,2:451:10,12:02,2:451:10,12:02,2:45]
        if (!eventAlreadyPresent) {
            dayEventSumup['time'].push(eventTime)
        }

        // => ua: [1,2,1,3,0,0,4,3,1,1,2,3,4,5,6,7,8,2,1,2]
        each(currEvent, (propVal, propName) => {
            let propIndex = m.fields[propName].indexOf(propVal)
            // CREATE EVENT PROPS TABLE
            if (!dayEventSumup[propName]) dayEventSumup[propName] = []
            
            if (!eventAlreadyPresent) {
                (dayEventSumup[propName] as number[]).push(propIndex)
            }
        })  
    })
    return m
}



// 
// SAVE/LOAD JSON MONTHLY FILE
//
interface iMonthlyDb {
    fields: {[fieldName:string]: string[]},
    events: {
        [dayDate:string]: {
            [eventNameIndex:number]: {
                time: string[];
                [eventPropName: string]: number[]| string[];
            }
        }
    }
}

const dbFolderPath = `${backConfig.dataFolder}/${backConfig.configFolder}/activity`

const getMonthlyDb = async (month?:string, year?:string):Promise<iMonthlyDb|null> => {
    let currDate = getCurrDateTime()
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
    let currDate = getCurrDateTime()
    let str = JSON.stringify(data)
    let pathFile = getPathFile(currDate.month, currDate.year)
    
    await upsertRecursivelyFolders(dbFolderPath)
    await saveFile(pathFile, str)
}

//
// LOW LEVEL FUNCS
//
const getCurrDateTime = ():{year:string, month:string, day:string, hour:string, min:string} => {
    let d = new Date()
    let year = d.getFullYear().toString()
    let month = ('0'+(d.getMonth()+1)).slice(-2);
    let day = ('0'+d.getDate()).slice(-2);
    let hour = ('0'+d.getHours()).slice(-2);
    let min = ('0'+d.getMinutes()).slice(-2);
    return {year, month, day, hour, min}
}
const getPathFile = (month:string, year:string) => `${dbFolderPath}/${year}-${month}.md`
