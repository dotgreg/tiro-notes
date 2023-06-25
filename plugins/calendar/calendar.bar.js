// refresh datas everytime
//  barApi.disableCache()

// console.log(3333333, {tiroApi, barApi, config})

tiroApi.file.getContent(config.calNotePath, noteContent => {
    // console.log("calendar note fetch:",noteContent)
    let lines = noteContent.split("\n")
    console.log("calendar note fetch:",{lines})
    let events = []
    // for each line, create a new event
    for (var i = 0; i < lines.length; i++) {
            const l = lines[i]
            const p = l.split("|")
            let title = p[0] ? p[0] : ""
            let start = p[1] ? new Date(p[1]) : false
            let body = p[2] ? p[2] : ""
            // console.log(11113, l)

            if (title && start) {
                events.push({
                    'date': start,
                    'title': title,
                    'body': body,
                    'Link': function (e) {
                        e.preventDefault();
                        tiroApi.call("popup.show", [urlify(body), "Event Details"])
                    }
                })
            }
    }
    
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
        let daysFromNow = Math.round((new Date(e.date).getTime() - new Date().getTime()) / (60 * 60 * 24 * 1000)) + 1
        let labelFrom = `in ${daysFromNow} days`
        if (daysFromNow <= 0) labelFrom = ` ** TODAY ** `
        if (daysFromNow === 1) labelFrom = ` * TOMORROW * `

        let dLabel = `${dLabels[e.date.getDay()]}`
        let sDate = new Date(e.date).toLocaleString().split(" ")[0]
        let body = e.body.trim().startsWith("http") ? `<a href="${e.body}" target="_blank">${e.body}</a>` : e.body
        let r = `[${labelFrom} > ${dLabel} ${sDate}] <br/><b>${e.title.toUpperCase()}</b><div style="color:#acacac;">${body}</div> ` 
        res.push({label:r,value:""})
    }
    
    barApi.setOptions(res)
})
