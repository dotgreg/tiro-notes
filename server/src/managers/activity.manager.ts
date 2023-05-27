import { debounce, each, isNumber, throttle } from "lodash"
import { backConfig } from "../config.back"
import { saveFile, upsertRecursivelyFolders, openFile } from "./fs.manager"
import { perf } from "./performance.manager"
import { getSocketClientInfos, iClientInfosObj } from "./security.manager"

export type iActivityLog = {
    eventName:string, eventAction:string, ip:string, ua:string, appUrl:string
}
const h = `[ACTIVITY]`

//
// HIGH LEVEL 
//

// LOGGER
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



// REPORT CREATOR
export type iActivityField = "eventAction"|"eventName"| "url"| "type"| "ip"| "ua"
export type iActivityFilter= "file"| "time"|  "ip"
export interface iActivityReportParams {
    startDate: string
    endDate: string
    organizeBy?: iActivityFilter
    includes?: iActivityField[]
}

export interface iActivityReport {
    [referenceField:string]: {}
}
export const getActivityReport = async (
    p:iActivityReportParams
):Promise<iActivityReport> => {
    let report:iActivityReport = {}

    // "10/31/2023" format
    let startDate = getDateTime(p.startDate)
    let endDate = getDateTime(p.endDate)
    // let yearsToFetch
    // let yearsToFetch
    // let reportsToFetch

    

    return report
}

interface iDbs {[month:string]:iMonthlyDb}
export const generateReportFromDbs = (
    p:iActivityReportParams, 
    dbs:iDbs
):iActivityReport => {
    let report:iActivityReport = {}

    const genOccurenceObj = (occurenceObj, occurrences, fields, i) => {
        // for each declared field to add
        each(p.includes, fieldToInclude => {
            let occurFieldIndex = occurrences[fieldToInclude] ? occurrences[fieldToInclude][i] : null
            if (isNumber(occurFieldIndex)) {
                occurenceObj[fieldToInclude] = fields[fieldToInclude][occurFieldIndex]
            }
        })
        return occurenceObj
    }
    const genReportObj = (p2) => {
        const {eventName, dateTimeObj, occurrences, fields, i} = p2
        const d = dateTimeObj
        // const time = `${occurrences.time[i]}`
        // const hour = time.split(":")[0]
        // const mins = time.split(":")[1]
        // const datetimeStr = `${date} ${time}`

        // FILE TYPE 
        if (p.organizeBy === "file") {
            if (!p.includes) p.includes = ["eventAction", "url", "type", "ip", "ua"]
            if(!report[eventName]) report[eventName] = {arr:[]}
            report[eventName]['arr'].push(genOccurenceObj({date: d.full}, occurrences, fields, i))
        } else if (p.organizeBy === "time") {
            if (!p.includes) p.includes = ["eventName","eventAction", "url", "type", "ip", "ua"]
            if(!report[d.year]) report[d.year] = {}
            if(!report[d.year][d.month]) report[d.year][d.month] = {}
            if(!report[d.year][d.month][d.day]) report[d.year][d.month][d.day] = {}
            if(!report[d.year][d.month][d.day][d.hour]) report[d.year][d.month][d.day][d.hour] = []
            let o = report[d.year][d.month][d.day][d.hour]
            // if(!report[date][hour]) report[date][hour] = []
            o.push(genOccurenceObj({date: d.full}, occurrences, fields, i))
            // if(!report[date]) report[date] = []
            // if(!report[date][time]) report[date][time] = []
            // report[date][time].push(genOccurenceObj({}, occurrences, fields, i))
        }
    }

    each(dbs, (monthdb, dbName) => {
        // dbName format = 2023-10
        const yearMonthStr = dbName.replace("-","/")
        // const dbDate = getDateTime(`${dbName}-01`)
        // const month = dbDate.month
        // const year = dbDate.year
        let fields = monthdb.fields
        // EACH DAY
        each(monthdb.days, (dayLog, day) => {
            // const date = `${year}/${month}/${day}`
            // EACH DAY EVENT
            each(dayLog, (occurrences, eventNameIndex) => {
                const eventName = fields["eventName"][eventNameIndex]
                // EACH DAY EVENT OCCURENCE 
                each(occurrences.time, (_,i) => {
                    const time = occurrences.time[i]
                    const dateTimeObj = getDateTime(`${yearMonthStr}/${day} ${time}`)
                    genReportObj({ eventName, dateTimeObj, occurrences, fields, i })
                })
            })
        })
    })
    
    return report
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
//     days: {
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
    const monthlyDb = monthlyActivityRamCache.value
    const newTimeBatch = currentTimeBatch.value
    const currentDate = getCurrDateTime()
    
    const newMonthlyDb = processTimeBatchInt({monthlyDb, newTimeBatch,currentDate})

    monthlyActivityRamCache.value = newMonthlyDb

    // finally, save it to the monthlyActivity JSON
    await setCurrentMonthlyDb(newMonthlyDb)

    endPerf()
}


export const processTimeBatchInt = (p:{
    monthlyDb:iMonthlyDb|null,
    newTimeBatch: iActivityLog[],
    currentDate: iDateTime,
}):iMonthlyDb => {
    const {monthlyDb, newTimeBatch, currentDate} = {...p}
    let m = monthlyDb
    if (!m) m = {fields:{}, days:{}} 

    // [value.fields] first each, if prop not present in array, push it
    each(newTimeBatch, event => {
        each(event, (propVal, propName) => {
            if(!m.fields[propName]) m.fields[propName] = []
            if (m.fields[propName].indexOf(propVal) === -1) m.fields[propName].push(propVal)
        })
    })

    const d = currentDate
    // [value.events] second each, 
    each(newTimeBatch, currEvent => {
        let eventTime = `${d.hour}:${d.min}`
        let currDateStr = `${d.day}`
        // EVERY DAY OBJ
        if(!m.days[currDateStr]) m.days[currDateStr] = {}
        let eventNameIndex = m.fields["eventName"].indexOf(currEvent.eventName)

        // CREATE DAILY EVENT
        if(!m.days[currDateStr][eventNameIndex]) m.days[currDateStr][eventNameIndex] = {time:[]}
        let dayEventSumup = m.days[currDateStr][eventNameIndex]

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
    days: {
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
export interface iDateTime {year:string, month:string, day:string, hour:string, min:string, full}
export const getCurrDateTime = ():iDateTime => {
    return getDateTime()
}
export const getDateTime = (dateString?:string):iDateTime => {
    let d = new Date(dateString)
    let year = d.getFullYear()
    let month = d.getMonth()+1
    let day = d.getDate()
    let syear = year.toString()
    let smonth = ('0'+(month)).slice(-2);
    let sday = ('0'+day).slice(-2);
    let hour = ('0'+d.getHours()).slice(-2);
    let min = ('0'+d.getMinutes()).slice(-2);
    let full = `${smonth}/${sday}/${syear} ${hour}:${min}`
    return {year:syear, month:smonth, day:sday, hour, min, full}
}

const getPathFile = (month:string, year:string) => `${dbFolderPath}/${year}-${month}.md`
