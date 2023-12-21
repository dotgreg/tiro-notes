const config = {
    showNotifOnceEvery: 8*60
}

const notifUniqId = "uniq-notif-id-calendar"
const h = `[CALENDAR LIB] `

const getSourcesConfig = (sourcesRawStr) => {
    let innerTarArr = sourcesRawStr.split("\n")
    let configArr = []
    for (let i = 0; i < innerTarArr.length; i++) {
        const line = innerTarArr[i];
        if (line.indexOf("|") > -1) {
            wordToSearch = line.split("|")[0].trim()
            pathToSearch = line.split("|")[1].trim()
            configArr.push({wordToSearch, pathToSearch})
        }
    }
    return configArr
}
const dateStrToObj = (dateStr) => {
    // split all parts of a datetime with following format 31/12/23 12:00
    let totParts = dateStr.split(' ')
    let date = totParts[0]
    let time = totParts[1]


    let dateParts = date.split('/')
    let day = dateParts[0]
    let month = dateParts[1]
    let year = dateParts[2]

    if (time) {
        let timeParts = time.split(':')
        let hour = timeParts[0]
        let minute = timeParts[1]
        return new Date(`${month}/${day}/${year} ${hour}:${minute}`)
    } else {
        return new Date(`${month}/${day}/${year}`)
    }

}
const genSameDayEvents = (eventDate1, events, title, body)  => {
    const targetWeekday = eventDate1.getDay();
    // start from yesterday
    const futureDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    let count = 0;
    // stop if NaN
    if (isNaN(targetWeekday)) return false
    while (count < 5) {
        // add 1 day till finding the right weekday
        futureDate.setDate(futureDate.getDate() + 1);
        if (futureDate.getDay() === targetWeekday) {
            futureDate.setHours(eventDate1.getHours());
            futureDate.setMinutes(eventDate1.getMinutes());
            futureDate.setSeconds(eventDate1.getSeconds());
            count++;
            events.push({
                'date': new Date(futureDate),
                'title': title,
                'body': body,
            })
        }
    }
}

const processEvent = (lineRes) => {
    const l = lineRes.trim()
    const p = l.split("|")
    let title = p[1] ? p[1].trim() : ""
    let body = p[3] ? p[3].trim().replace("]","") : ""
    let evDateRaw = p[2] ? p[2].trim() : false
    if (!evDateRaw) return false
    let evDate = dateStrToObj(evDateRaw)

    let events = []
    // if evDate is a date
    if (evDate.toString() === "Invalid Date") return false
    if (!title || !evDate) return false
    events.push({
        'date': evDate,
        'title': title,
        'body': body,
    })

    const curr = new Date()
    const eventDay = evDate.getDate()
    const eventMonth = evDate.getMonth() + 1
    const eventTime = evDate.toLocaleString().split(" ")[1]

    // if every_month / every_year present body
    if (body.includes("every_month")){
        // generate 5 events in future monthes
        for (let i = 1; i < 6; i++) {
            const recEvMonth = (curr.getMonth() + i)%12
            const isNewYear = (curr.getMonth() + i) > 12
            let recEvYear = curr.getFullYear() 
            if (isNewYear) recEvYear++
            const recDate = new Date(`${recEvMonth}/${eventDay}/${recEvYear} ${eventTime}`)
            events.push({
                'date': recDate,
                'title': title,
                'body': body,
            })
        }
    }
    if (body.includes("every_year")){
        // generate 5 events in future
        for (let i = 1; i < 6; i++) {
            const recEvYear = curr.getFullYear()  + i
            const recDate = new Date(`${eventMonth}/${eventDay}/${recEvYear} ${eventTime}`)
            events.push({
                'date': recDate,
                'title': title,
                'body': body,
            })
        }
    }
    if (body.includes("every_week")){
        genSameDayEvents(evDate, events, title, body)
    }
    // END EVENT PROCESS to duplicate
    return events
}

const searchWord = (env, word, path, cb) => {
    if (env === "bg") {
        tiroApi.search.word(word, path, content => {
            cb(content)
        })
    } else if (env === "ctag") {
        api.call("search.word", [word, path], content => {
            // return false
            cb(content)
        })
    }
}

const getEventsList = (env, sourcesRawStr, cb) => {
    const configArr = getSourcesConfig(sourcesRawStr)
    let configCount = 0
    const events = []
    configArr.forEach(config => {
        searchWord(env, config.wordToSearch, config.pathToSearch, searchRes => {
            // res is an object
            for (const [filePath, file] of Object.entries(searchRes)) {
                file.results.forEach(l => {
                    const eventsLine = processEvent(l)
                    if (eventsLine) {
                        eventsLine.forEach(ev => {
                            events.push(ev)
                        })
                    }
                })
            }
            configCount++
            if (configCount === configArr.length) {
                cb(events)
            }
        })
    })
}

const sendNotif = (event, title, cb) => {
    const notifId = `${event.title}${event.body}${event.date}`
    // tiroApi.cache.get(notifId, cacheInfo => {
        // if (cacheInfo && cacheInfo.alreadyShown === true) return console.log(h, "sendNotif already shown, dont reshow it", event)
        
        // tiroApi.cache.set(notifId, {alreadyShown: true},  4*60) // 4h cache, so should show reminder 1-2 times then
    // })

    let body = event.body.trim().startsWith("http") ? `<a href="${event.body}" target="_blank">${event.body}</a>` : event.body
    notifHtml = `
        [CALENDAR] <br>
        ${title}  <br> <br>
        <b>${event.title}</b><br> 
        <div style="color:#acacac; font-size:10px;">${body}</div>
    `
    tiroApi.ui.notification.emit({id:notifId, content: notifHtml, options:{hideAfter: -1, showOnceEvery: config.showNotifOnceEvery}}, () => {
        cb()
    })
    
}

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.calendarLib = {getEventsList, sendNotif, config}

// return {...window.calendarLib}