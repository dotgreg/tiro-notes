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
    let timer = parseInt(mins) * 60 * 1000
    let endTimestamp = new Date().getTime() + timer
    let startTimestamp = new Date().getTime()
    tiroApi.plugins.cronCache.set(cronCacheName, {endTimestamp, startTimestamp, isEnabled: true, catName:name})
    tiroApi.ui.notification.emit({id:notifUniqId,content: `Stopping old timers and starting timer for ${mins} minutes for category ${name} `, options:{hideAfter: 65}})
    timerLib.addToHistory(tiroApi, history, name, mins)
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
    let currDateStr = `${currDate.getDate()}-${currDate.getMonth()}-${currDate.getFullYear()}`
    return currDateStr
}

const addToHistory = (tiroApi/*:any*/, history/*:iTimerHistoryItem[]*/, name/*:string*/, time/*:number*/, rawdate/*:?Date*/) => {
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
    console.log("[TIMERLIB] add2hist", history)
    tiroApi.cache.set("timer_plugin_history", history, -1)
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

const timerLib = {addToHistory, startTimer, stopTimer, logTimer, getTimerHistory, getDateStr}
// export flow type from timerLib
/*::
export type iTimerLib = typeof timerLib;
*/

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.timerLib = timerLib