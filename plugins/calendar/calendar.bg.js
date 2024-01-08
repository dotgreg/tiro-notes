
const curr = new Date()
const h = `[CALENDAR BG | ${curr.getHours()}h${curr.getMinutes()}] `
let s = bgState.vars
let disableCache = (config.disableCache === "true" || config.disableCache === true) ? true : false
const fetchLibs = (cb) => {
    tiroApi.ressource.fetchEval(config.libUrl, {tiroApi}, {disableCache: disableCache}, () => {
        cb()
    })
}

const main = () => {
    const calendarLib = window._tiroPluginsCommon.calendarLib
    let source_events = config.sourcesStr ? config.sourcesStr : ''
    // all that system suppose we trigger the cron every 11min
    calendarLib.getEventsList("bg", source_events, events => {
        console.log(h, "calendar note fetch:", {events})
        for (var i = 0; i < events.length; i++) {
            let e = events[i]

            // for each, check if 
            // it is tomorrow, if yes, send a reminder at 2pm
            let evdate = new Date(e.date)
            let curr = new Date()
            let daysFromNow = Math.round((evdate.getTime() - new Date().getTime()) / (60 * 60 * 24 * 1000)) 
            let minsFromNow = Math.round((evdate.getTime() - new Date().getTime()) / (60 * 1000))
            const isForTomorrow = daysFromNow === 1
            const isWorkingHours = curr.getHours() > 9 && curr.getHours() <= 20

            // if date time is not 00:00
            const isDayEvent = evdate.getHours() === 0 && evdate.getMinutes() === 0
            // it is within 15min-5min
            const isIn10m = minsFromNow > 5 && minsFromNow < 25
            // it is within 1h10-1h
            const isIn1h = minsFromNow > 60 && minsFromNow < 90
            const atStr = ` at ${evdate.getHours()}h${evdate.getMinutes()}`

            if (isForTomorrow && isWorkingHours) {
                console.log(h, "isForTomorrow + is2pm", e)
                let title = `Tomorrow :`
                if (!isDayEvent) title += atStr
                calendarLib.sendNotif(e, title)
            }
            if (!isDayEvent && isIn10m) {
                console.log(h, "isIn10m", e)
                calendarLib.sendNotif(e, `In 10 minutes,${atStr}`, () => {
                    tiroApi.audio.play("https://assets.mixkit.co/active_storage/sfx/2870/2870.wav")
                })
            }
            if (!isDayEvent && isIn1h) {
                console.log(h, "isIn1h", e)
                calendarLib.sendNotif(e, `In 1 hour,${atStr} :`)
            }
        }
        
    })
}

fetchLibs(() => {
    main()
})
