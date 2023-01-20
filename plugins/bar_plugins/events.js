// refresh datas everytime
barApi.disableCache()

// which note
let notePath = "/_new/_main/EVENTS.md"

api.file.getContent(notePath, noteContent => {
		let lines = noteContent.split("\n")
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
                'Link': function (e) {
                    e.preventDefault();
                    api.call("popup.show", [urlify(body), "Event Details"])
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
		events = events.filter(el => new Date(el.date) > new Date()).reverse().splice( 0, 10);
		window.eeev = events

		let dLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
		
		
		let res = []
		for (var i = 0; i < events.length; i++) {
				let e = events[i]
				let daysFromNow = Math.round((new Date(e.date).getTime() - new Date().getTime()) / (60 * 60 * 24 * 1000))
				let dLabel = `${dLabels[e.date.getDay()]}`
				let sDate = new Date(e.date).toLocaleString().split(" ")[0]
				let r = `[IN ${daysFromNow} DAY > ${dLabel} ${sDate}] ${e.title.toUpperCase()} | ${e.body} `
				res.push({label:r,value:""})
		}
		
		barApi.setOptions(res)
})
