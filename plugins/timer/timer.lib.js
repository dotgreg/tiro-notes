//@flow

/*::
export type iTimerHistoryItem = {
    name:string, 
    times:{
        [date:string]:number
    }
}
*/
const notifUniqId = "uniq-notif-id-timer"
const cronCacheName = "timer_bg"

const logTimer = (tiroApi/*:any*/, history/*:iTimerHistoryItem[]*/, name/*:string*/, timeMin/*:number*/, barApi/*:?any*/,) => {
    let mins = timeMin
    timerLib.addToHistory(tiroApi, history, name, mins)
    if(barApi) barApi.close()
}
const startTimer = (tiroApi/*:any*/, history/*:iTimerHistoryItem[]*/, name/*:string*/, timeMin/*:number*/, barApi/*:?any*/,) => {
    let mins = timeMin
    timerLib.addToHistory(tiroApi, history, name, mins)
    let timer = parseInt(mins) * 60 * 1000
    let endTimestamp = new Date().getTime() + timer
    let startTimestamp = new Date().getTime()
    tiroApi.plugins.cronCache.set(cronCacheName, {endTimestamp, startTimestamp, isEnabled: true, catName:name})
    tiroApi.ui.notification.emit({id:notifUniqId,content: `Stopping old timers and starting timer for ${mins} minutes for category ${name} `, options:{hideAfter: 65}})
    if(barApi) barApi.close()
}
const stopTimer = (tiroApi/*:any*/, history/*:iTimerHistoryItem[]*/, barApi/*:?any*/) => {
    if(barApi) barApi.close()
    tiroApi.ui.notification.emit({id:notifUniqId, content: `stopping timer`})
    tiroApi.plugins.cronCache.set(cronCacheName, { isEnabled: false})
}

const getDateStr = (date/*:?Date*/) => {
    let currDate = new Date()
    if (date) currDate = date
    let currDateStr = `${currDate.getDate()}-${currDate.getMonth()+1}-${currDate.getFullYear()}`
    // console.log("[TIMERLIB] getDateStr", currDateStr)
    return currDateStr
}
const getDateFromStr = (dateStr/*:string*/) => {    
    let dateParts = dateStr.split("-")
    let currDate = new Date()
    currDate.setDate(parseInt(dateParts[0]))
    currDate.setMonth(parseInt(dateParts[1])-1)
    currDate.setFullYear(parseInt(dateParts[2]))
    return currDate 
}

const addToHistory = (tiroApi/*:any*/, history/*:iTimerHistoryItem[]*/, name/*:string*/, time/*:number*/, rawdate/*:?Date*/) => {
    addToTimelineLogFile(tiroApi, name, time, rawdate)

    time = parseInt(time)
    // does el already exists? if yes put it on first
    const foundIdx = history.findIndex(el => el.name === name)
    let item = history[foundIdx]
    if (foundIdx !== -1) history.splice(foundIdx, 1)

    const currDateStr = getDateStr(rawdate)
    
    if (item) {
        if (item.times[currDateStr]) item.times[currDateStr] = item.times[currDateStr] + time
        else item.times[currDateStr] = time
    } else {
        item = {name, times:{}}
        item.times[currDateStr] = time
    }
    history.unshift(item)
    console.log("[TIMERLIB] add2hist", history.length)
    tiroApi.cache.set("timer_plugin_history", history, -1)
    // add to timeline log file
}

const addToTimelineLogFile = (tiroApi/*:any*/, name/*:string*/, time/*:number*/, rawdate/*:?Date*/) => {
    console.log("[TIMERLIB] addToTimelineLogFile", name, time, rawdate)
    // get the timeline_log_file
    const fileTimelinePath = "/.tiro/timer_timeline_history.md"
    const getFileContent = (id/*:string*/, cb/*:Function*/) => {
        tiroApi.file.getContent(id, content => {cb(content)}, {onError: () => {cb("")}})
    }
    const getCurrTimelineAndPrepend = (content/*:string*/) => {
        const currDateStr = getDateStr(rawdate)
        const currDateTimeStr = new Date().toISOString()
        // from 2pm to 3pm
        const startHourMin = new Date().getHours() + ":" + new Date().getMinutes()
        // endHourMin = new Date().getHours() + ":" + new Date().getMinutes()
        const endTime = new Date() 
        // add + (time * 60 * 1000) ms to the current time
        endTime.setTime(endTime.getTime() + (time * 60 * 1000))
        const endHourMin = endTime.getHours() + ":" + endTime.getMinutes()
        const newContent = `${currDateStr} | ${startHourMin} --> ${endHourMin} | ${name} | ${time} mins (${Math.round(time/6)/10} hours) `

        let finalContent = newContent + "\n" + content
        // for performance reasons, only keep first 500 lines
        const lines = content.split("\n")
        if (lines.length > 500) finalContent = lines.slice(0, 500).join("\n")

        tiroApi.file.saveContent(fileTimelinePath, finalContent, -1)
    }
    getFileContent(fileTimelinePath, (prevcontent/*:string*/) => { getCurrTimelineAndPrepend(prevcontent) }  )
}


const getTimerHistory = (tiroApi/*:any*/, cb/*:(items:iTimerHistoryItem[]) => void*/) => {
    const cacheName = "timer_plugin_history"
    const getCache = (id/*:string*/) => (onSuccess /*:Function*/, onFailure/*:Function*/) => {
        tiroApi.call("cache.get", [id], content => {
            if (content !== undefined && content !== null) onSuccess(content)
            else if (onFailure) onFailure()
        })
    }
    const getTimerDataInt = getCache(cacheName)
    getTimerDataInt(cb, items => {
        cb(items)
    })
}

const timerLib = {addToHistory, startTimer, stopTimer, logTimer, getTimerHistory, getDateFromStr, getDateStr}
// export flow type from timerLib
/*::
export type iTimerLib = typeof timerLib;
*/

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.timerLib = timerLib