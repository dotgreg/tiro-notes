const curr = new Date()
const h = `[CALENDAR BAR] `

const fetchLibs = (cb) => {
    tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: true}, calendarLib => {
        cb(calendarLib)
    })
}
fetchLibs(calendarLib => {
    main(calendarLib)
})

const main = (calLib) => {
    calLib.getEventsList(config.calNotePath, events => {
        console.log(h, "calendar note fetch:", {events})
        
        // SORT
        // 1 future first
        const sortByDate = (arr) => arr.sort((a,b) => {
            return new Date(b.date) - new Date(a.date);
        });

        let sortedEvents = sortByDate(events)
        events = sortedEvents

        // delete all lower than today + limit to 10 + reverse
        events = events.filter(el => new Date(el.date) > new Date() - (60*60*24*1000)).reverse().splice( 0, 10);
        let dLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
        
        let res = []
        
        for (var i = 0; i < events.length; i++) {
            let e = events[i]
            let daysFromNow = Math.round((new Date(e.date).getTime() - new Date().getTime()) / (60 * 60 * 24 * 1000))
            let labelFrom = `in ${daysFromNow} days`
            if (daysFromNow <= 0) labelFrom = ` ** TODAY ** `
            if (daysFromNow === 1) labelFrom = ` * TOMORROW * `

            let dLabel = `${dLabels[e.date.getDay()]}`
            let sDate = new Date(e.date).toLocaleString().split(" ")[0]
            // let body = e.body.trim().startsWith("http") ? `<a href="${e.body}" target="_blank">${e.body}</a>` : e.body
            // let r = `[${labelFrom} > ${dLabel} ${sDate}] <br/><b>${e.title.toUpperCase()}</b><div style="color:#acacac;">${body}</div> ` 
            let r = `[${labelFrom} > ${dLabel} ${sDate}] ${e.title.toUpperCase()} | ${e.body.trim()}` 
            res.push({label:r,value:""})
        }
        
        barApi.setOptions(res)
    })
}