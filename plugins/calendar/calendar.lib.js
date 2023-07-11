const config = {
    showNotifOnceEvery: 8*60
}

const notifUniqId = "uniq-notif-id-calendar"
const h = `[CALENDAR LIB] `



const getEventsList = (calNotePath, cb) => {
    tiroApi.file.getContent(calNotePath, noteContent => {
        let lines = noteContent.split("\n")
        let events = []
        
        // for loop TO DUPLICATE w LIB/TAG ONE
        // START EVENT PROCESS
        for (var i = 0; i < lines.length; i++) {
            const l = lines[i]
            const p = l.split("|")
            let title = p[0] ? p[0] : ""
            let evDate = p[1] ? new Date(p[1]) : false
            let body = p[2] ? p[2] : ""

            if (title && evDate) {
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
                    const eventDayOfWeek = evDate.getDay();
                    for (let i = 0; i < 5; i++) {
                        const nextDate = new Date(new Date().getTime());
                        const addedDays = 7 * (eventDayOfWeek - (i + 1))
                        nextDate.setDate(nextDate.getDate() + addedDays); 
                        nextDate.setHours(evDate.getHours())
                        nextDate.setMinutes(evDate.getMinutes())
                        // result.push(nextDate);
                        events.push({
                            'date': nextDate,
                            'title': title,
                            'body': body,
                        })
                    }
                }
            }
        }
        // END EVENT PROCESS to duplicate

        
        console.log(h, {events})
        cb(events)
    })
}

const sendNotif = (event, title) => {
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
    tiroApi.ui.notification.emit({id:notifId, content: notifHtml, options:{hideAfter: -1, showOnceEvery: config.showNotifOnceEvery}})
    
}


return {getEventsList, sendNotif}