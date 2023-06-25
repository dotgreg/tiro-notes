const notifUniqId = "uniq-notif-id-calendar"
const curr = new Date()
const h = `[CALENDAR BG | ${curr.getHours()}h${curr.getMinutes()}] `
let s = bgState.vars
// console.log(h, "1 calendar plugin", {s})

// all that system suppose we trigger the cron every 11min
tiroApi.file.getContent(config.calNotePath, noteContent => {
    let lines = noteContent.split("\n")
    console.log(h, "calendar note fetch:",{lines})
    let events = []
    // for each line, create a new event
    for (var i = 0; i < lines.length; i++) {
            const l = lines[i]
            const p = l.split("|")
            let title = p[0] ? p[0] : ""
            let start = p[1] ? new Date(p[1]) : false
            let body = p[2] ? p[2] : ""

            if (title && start) {
                events.push({
                    'date': start,
                    'title': title,
                    'body': body,
                })
            }
    }
    
    const sendNotif = (event, title) => {
        notifHtml = `
            [CALENDAR] <br>
            ${title}  <br> 
            <b>${events[i].title}</b><br> 
            ${events[i].body}
        `
        tiroApi.ui.notification.emit({id:notifUniqId, content: notifHtml, options:{hideAfter: -1}})
    }
    
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
            sendNotif(e, title)
        }
        if (!isDayEvent && isIn10m) {
            console.log(h, "isIn10m", e)
            sendNotif(e, `In 10 minutes,${atStr}` )
            tiroApi.audio.play("https://assets.mixkit.co/active_storage/sfx/2870/2870.wav")
        }
        if (!isDayEvent && isIn1h) {
            console.log(h, "isIn1h", e)
            sendNotif(e, `In 1 hour,${atStr}`)
        }
    }
    
})

