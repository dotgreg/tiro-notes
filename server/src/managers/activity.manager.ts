import { debounce, each, isNumber, throttle } from "lodash"
import { sharedConfig } from "../../../shared/shared.config"
import { iActivityReport, iActivityReportParams } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { getDateTime, iDateTime } from "./date.manager"
import { saveFile, upsertRecursivelyFolders, openFile } from "./fs.manager"
import { perf } from "./performance.manager"
import { getSocketClientInfos, iClientInfosObj } from "./security.manager"

let shouldLog = sharedConfig.client.log.verbose
// shouldLog = true
export type iActivityLog = {
    eventName:string, eventAction:string, ip:string, ua:string, appUrl:string
}
const h = `[ACTIVITY]`
const dbFolderPath = `${backConfig.dataFolder}/${backConfig.configFolder}/activity`
const intervalTime = 5 * 60 * 1000
//
// HIGH LEVEL 
//

// LOGGER
const currentTimeBatch:{value:iActivityLog[]} = {value: []}
export const logActivity = (eventAction: string, eventName:string, socket:any) => {
    shouldLog && console.log(h, "logActivity", eventAction, eventName)
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
export const getActivityReport = async (
    p:iActivityReportParams
):Promise<iActivityReport> => {

    let now = getDateTime()
    let old = getDateTime(`${now.month}/${now.day}/${now.num.year - 1}`)
    if (!p.startDate) p.startDate = old.date
    if (!p.endDate) p.endDate = now.date

    // "10/31/2023" format
    let startDate = getDateTime(p.startDate)
    let endDate = getDateTime(p.endDate)

    if (endDate.num.timestamp < startDate.num.timestamp) console.log(h, "WARNING, enddate and startdate inverted!")
    
    
    let reportPaths = getReportPaths(startDate, endDate)
    
    let dbs:iDbs = {}
    let i = 0;
    for await (const path of reportPaths.paths) {
        let id = reportPaths.ids[i]
        dbs[id] = await getMonthlyDb(path)
        i++;
    }

    let report = generateReportFromDbs(p, dbs)

    return report
}






















//
// LOW LEVEL FUNCS
//

// WHICH REPORTS TO GET
export const getReportPaths = (start:iDateTime, end: iDateTime):{paths:string[], ids:string[]}  => {
    let res = {paths:[], ids:[]}

    if (end.num.year <= start.num.year && end.num.month <= start.num.month) return res

    // how many years to cover
    let yearDiff = end.num.year - start.num.year
    let yearsToCover = []
    let yearsMonths = {}
    for (let i = 0; i < yearDiff + 1; i++) {
        let year = start.num.year + i
        yearsToCover.push(year)
        if (!yearsMonths[year]) yearsMonths[year] = [1,2,3,4,5,6,7,8,9,10,11,12]
        if (i === 0) yearsMonths[year] = yearsMonths[year].splice(start.num.month-1)
        if (i === yearDiff) yearsMonths[year] = yearsMonths[year].splice(0, yearsMonths[year].indexOf(end.num.month)+1)
    }

    each(yearsMonths, (year, yearName) => {
        each(year, month => {
            let smonth = ('0'+(month)).slice(-2)
            let syear = yearName
            res.paths.push(getPathFile(smonth, syear))
            res.ids.push(`${syear}-${smonth}`)
        })
    })

    return res
}

// REPORT GEN
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
            if (fieldToInclude === "weight") {
                occurenceObj[fieldToInclude] = occurrences[fieldToInclude][i]
            } else if (isNumber(occurFieldIndex)) {
                occurenceObj[fieldToInclude] = fields[fieldToInclude][occurFieldIndex]
            }
        })
        return occurenceObj
    }
    const genReportObj = (p2) => {
        const {eventName, dateTimeObj, occurrences, fields, i} = p2
        const d = dateTimeObj

        // FILE TYPE 
        if (p.organizeBy === "file") {
            if (!p.includes) p.includes = ["eventAction", "url", "type", "ip", "ua", "weight"]
            if(!report[eventName]) report[eventName] = {arr:[]}
            report[eventName]['arr'].push(genOccurenceObj({date: d.full}, occurrences, fields, i))
        } else if (p.organizeBy === "time") {
            if (!p.includes) p.includes = ["eventName","eventAction", "url", "type", "ip", "ua", "weight"]
            if(!report[d.year]) report[d.year] = {}
            if(!report[d.year][d.month]) report[d.year][d.month] = {}
            if(!report[d.year][d.month][d.day]) report[d.year][d.month][d.day] = {}
            if(!report[d.year][d.month][d.day][d.hour]) report[d.year][d.month][d.day][d.hour] = []
            let o = report[d.year][d.month][d.day][d.hour]
            o.push(genOccurenceObj({date: d.full}, occurrences, fields, i))
        }
    }

    each(dbs, (monthdb, dbName) => {
        // dbName format = 2023-10
        const yearMonthStr = dbName.replace("-","/")
        if (!monthdb) return
        let fields = monthdb.fields
        // EACH DAY
        each(monthdb.days, (dayLog, day) => {
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
//              weight: [1,10,1000,1,22...]
//           }
//     }
//   }
interface iMonthlyDb {
    fields: {[fieldName:string]: string[]},
    days: {
        [dayDate:string]: {
            [eventNameIndex:number]: {
                time: string[];
                weight: number[];
                [eventPropName: string]: number[]| string[];
            }
        }
    }
}
const monthlyActivityRamCache:{value:iMonthlyDb|null} = {value:null}
const processTimeBatch = async () => {
    shouldLog && console.log(`${h} processTimeBatch`)
    let endPerf = perf('${h} processTimeBatch ')

    // if !monthlyActivityRamCache, load the file in the ram
    if (!monthlyActivityRamCache.value) monthlyActivityRamCache.value = await getMonthlyDbFromDate()
    const monthlyDb = monthlyActivityRamCache.value
    const newTimeBatch = currentTimeBatch.value
    const currentDate = getDateTime()
    
    const newMonthlyDb = processTimeBatchInt({monthlyDb, newTimeBatch,currentDate})
    
    monthlyActivityRamCache.value = newMonthlyDb
    
    // finally, save it to the monthlyActivity JSON
    await setCurrentMonthlyDb(newMonthlyDb)

    // reset timebatch
    currentTimeBatch.value = []

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
    each(newTimeBatch, eventOccurence => {
        each(eventOccurence, (propVal, propName) => {
            if(!m.fields[propName]) m.fields[propName] = []
            if (m.fields[propName].indexOf(propVal) === -1) m.fields[propName].push(propVal)
        })
    })

    const d = currentDate
    // [value.events] second each, 
    each(newTimeBatch, eventOccurence => {
        let eventTime = `${d.hour}:${d.min}`
        let currDateStr = `${d.day}`
        // EVERY DAY OBJ
        if(!m.days[currDateStr]) m.days[currDateStr] = {}
        let eventNameIndex = m.fields["eventName"].indexOf(eventOccurence.eventName)

        // CREATE DAILY EVENT
        if(!m.days[currDateStr][eventNameIndex]) m.days[currDateStr][eventNameIndex] = {time:[], weight:[]}
        let dayEventSumup = m.days[currDateStr][eventNameIndex]

        // IS EVENT ALREADY PRESENT FOR CURRENT TIME BATCH?
        let eventAlreadyPresent = dayEventSumup.time.indexOf(eventTime) !== -1

        // => time: [1:10,12:02,2:45,1:10,12:02,2:451:10,12:02,2:451:10,12:02,2:45]
        if (!eventAlreadyPresent) {
            dayEventSumup['time'].push(eventTime)
            dayEventSumup['weight'].push(1)
        } else {
            // already exists, increase its weight
            let index = dayEventSumup.time.indexOf(eventTime)
            dayEventSumup['weight'][index] += 1
        }

        // => ua: [1,2,1,3,0,0,4,3,1,1,2,3,4,5,6,7,8,2,1,2]
        each(eventOccurence, (propVal, propName) => {
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




const getMonthlyDb = async (path:string):Promise<iMonthlyDb|null> => {
    try {
        let str = await openFile(path)
        let obj = JSON.parse(str) as iMonthlyDb
        return obj
    } catch (error) {
        shouldLog && console.log(`${h} getMonthlyDb error:`, error)
        return null
    }
}
const getMonthlyDbFromDate = async (month?:string, year?:string):Promise<iMonthlyDb|null> => {
    let currDate = getDateTime()
    if (!year) year = currDate.year
    if (!month) month = currDate.month
    return await getMonthlyDb(getPathFile(month, year))
}


const setCurrentMonthlyDb = async (data:iMonthlyDb) => {
    let currDate = getDateTime()
    let str = JSON.stringify(data)
    let pathFile = getPathFile(currDate.month, currDate.year)
    // shouldLog && console.log(44, pathFile, currDate)
    
    await upsertRecursivelyFolders(pathFile)
    await saveFile(pathFile, str)
}
const getPathFile = (month:string, year:string) => `${dbFolderPath}/${year}-${month}.md`


//
// LOW LEVEL FUNCS
//
// export interface iDateTime {year:string, month:string, day:string, hour:string, min:string, full:string, numbers}

// export const getDateTime = () => {return getDateTime()}

