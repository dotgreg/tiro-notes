
const curr = new Date()
const h = `[CALENDAR BG | ${curr.getHours()}h${curr.getMinutes()}] `
let s = bgState.vars

const fetchLibs = (cb) => {
    tiroApi.ressource.fetchEval(config.libUrl, {tiroApi}, {disableCache: true}, calendarLib => {
        cb(calendarLib)
    })
}
fetchLibs(calendarLib => {
    main(calendarLib)
})

const main = (calendarLib) => {
    // all that system suppose we trigger the cron every 11min
    calendarLib.getEventsList(config.calNotePath, events => {
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
            const is2pm = curr.getHours() === 14 && curr.getMinutes() >= 0 && curr.getMinutes() < 11 
            const is8pm = curr.getHours() === 20 && curr.getMinutes() >= 0 && curr.getMinutes() < 11 
            // if date time is not 00:00
            const isDayEvent = evdate.getHours() === 0 && evdate.getMinutes() === 0
            // it is within 15min-5min
            const isIn10m = minsFromNow > 5 && minsFromNow < 15
            // it is within 1h10-1h
            const isIn1h = minsFromNow > 60 && minsFromNow < 70
            const atStr = ` at ${evdate.getHours()}h${evdate.getMinutes()}`
            if (isForTomorrow && (is2pm || is8pm)) {
                console.log(h, "isForTomorrow + is2pm", e)
                let title = `Tomorrow`
                if (!isDayEvent) title += atStr
                calendarLib.sendNotif(e, title)
            }
            if (!isDayEvent && isIn10m) {
                console.log(h, "isIn10m", e)
                tiroApi.audio.play("https://assets.mixkit.co/active_storage/sfx/2870/2870.wav")
                calendarLib.sendNotif(e, `In 10 minutes,${atStr}` )
            }
            if (!isDayEvent && isIn1h) {
                console.log(h, "isIn1h", e)
                calendarLib.sendNotif(e, `In 1 hour,${atStr}`)
            }
        }
        
    })
}
