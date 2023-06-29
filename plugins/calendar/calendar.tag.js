const calendarApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG CALENDAR APP] v1.0.3`
    const api = window.api;
    const infos = api.utils.getInfos();
    let source_events = opts.source ? opts.source : ''
    console.log(h, `init with source ${source_events}`);

    const initCalendar = () => {
        api.call("file.getContent", [source_events], noteContent => {
            function urlify(text) {
                if(!text) text = ""
                var urlRegex = /(https?:\/\/[^\s]+)/g;
                return text.replace(urlRegex, function (url) {
                        return '<a href="' + url + '" target="_blank">' + url + '</a>';
                })
            }
            
            let lines = noteContent.split("\n")
            let events = []




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
                    const eventMonth = evDate.getMonth()
                    const eventTime = evDate.toLocaleString().split(" ")[1]

                    // if every_month / every_year present body
                    if (body.includes("every_month")){
                        // generate 5 events in future monthes
                        for (let i = 0; i < 5; i++) {
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
                        for (let i = 0; i < 5; i++) {
                            const recEvYear = curr.getFullYear()  + i
                            const recDate = new Date(`${eventMonth}/${eventDay}/${recEvYear} ${eventTime}`)
                            events.push({
                                'date': recDate,
                                'title': title,
                                'body': body,
                            })
                        }
                    }
                }
            }
            // END EVENT PROCESS

                
            // for each line, create a new event
            const calEvents = []
            for (var i = 0; i < events.length; i++) {
                const evCal = events[i] 
                let titleAndBody = `
                    <div class='event-wrapper'>
                    <div class='title'>${evCal.title}</div>
                    <div class='body'>${evCal.body}</div>
                </div>`

                    const popupBody = `title: ${evCal.title}<br/>date: ${evCal.date}<br/>${urlify(evCal.body)}`
                    calEvents.push({
                        'Date': new Date(`${evCal.date.toLocaleString("en").split(" ")[0]} 00:00`),
                        'Title': titleAndBody,
                        'Link': function (e) {
                                e.preventDefault();
                                api.call("popup.show", [popupBody, evCal.title])
                        }
                })
            }



            var settings = {};
            var element = document.getElementById('caleandar');
            window.caleandar(element, calEvents, settings);
            setTimeout(() => {
                    api.utils.resizeIframe("500px");
            }, 500)
            
        })
    }

    api.utils.loadRessources(
            [
                    'https://raw.githubusercontent.com/jackducasse/caleandar/master/js/caleandar.js',
                    'https://raw.githubusercontent.com/jackducasse/caleandar/master/css/theme3.css'
            ], () => {
                    initCalendar()
            }
    )

    const styleHtml = `<style>
    #caleandar {
            padding-top: 0px;
    }

    #caleandar .cld-main {
            width:100%;
    }
    #caleandar li:before {
            content: none;
    }


    /* #caleandar .event-wrapper { */
    /* 		position: relative */
    /* } */
    /* #caleandar .event-wrapper:hover { */
    /* } */
    /* #caleandar .event-wrapper:hover .body { */
    /* 		display: absolute; */
    /* 		top: 0px; */
    /* } */
    /* #caleandar .event-wrapper { */
    /* } */

    #caleandar .cld-main .cld-title {
            font-size: 8px;
            height: 10px;
            overflow: hidden;
            line-height: 9px;
    }
    </style>`
    return `${styleHtml}<div id="caleandar" class="no-css"></div>`
}

window.initCustomTag = calendarApp
