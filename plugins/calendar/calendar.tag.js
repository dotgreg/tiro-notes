const calendarApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG CALENDAR APP] v1.0.3`
    const api = window.api;
    const infos = api.utils.getInfos();
    let source_events = opts.sourcesStr ? opts.sourcesStr : ''
    console.log(h, `init with source ${source_events}`);

    const initCalendar = () => {

        const calendarLib = window._tiroPluginsCommon.calendarLib

        calendarLib.getEventsList("ctag", source_events, events => {
            console.log(h, "events", events.length)
            bootstrapCalendarFrontLogic(events)
        })


        function urlify(text) {
            if(!text) text = ""
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, function (url) {
                    return '<a href="' + url + '" target="_blank">' + url + '</a>';
            })
        }

        const onEventClick = (ev) => (e) => {
                e.preventDefault();
                console.log("onEventClick", e, ev)
                // let titleAndBody = `
                //     <div class='event-wrapper'>
                //     <div class='title'>${evCal.title}</div>
                //     <div class='body'>${evCal.body}</div>
                // </div>`
                const popupBody = `<h3 style="margin-bottom: 2px;"> ${ev.title}</h3>
                    <div style="color:#acacac; font-size:10px;"> ${ev.date.toLocaleString()}</div><br/>
                ${urlify(ev.body)}`

                // api.call("popup.show", [popupBody, "Event Details"])
                // api.call("popup.show", ["woop", "Event Details"])
                // api.call("ui.floatingPanel.openFile", [ev.filePath, { searchedString:ev.lineRaw, idpanel: "id-panel-calendar-preview", layout: "bottom-right"}])
                api.call("ui.notePreviewPopup.open", [ev.filePath, ["50%" ,"50%"], { searchedString:ev.lineRaw}])
        }

        const bootstrapCalendarFrontLogic = (events) => {
                // console.log(h, "bootstrapCalendarFrontLogic", events)
            // for each line, create a new event
            const calEvents = []
            for (var i = 0; i < events.length; i++) {
                const evCal = events[i] 
                let titleAndBody = `
                <div class='event-wrapper'>
                        <div class='title'>${evCal.title}</div>
                        <div class='body'>${evCal.body}</div>
                </div>`

                    
                    calEvents.push({
                        'Date': new Date(`${evCal.date.toLocaleString("en").split(" ")[0]} 00:00`),
                        'Title': titleAndBody,
                        'Link': onEventClick(evCal)
                })
            }



            var settings = {};
            var element = document.getElementById('caleandar');
            window.caleandar(element, calEvents, settings);
            setTimeout(() => {
                    api.utils.resizeIframe("500px");
            }, 500)
        }




        // api.call("file.getContent", [source_events], noteContent => {
        //     function urlify(text) {
        //         if(!text) text = ""
        //         var urlRegex = /(https?:\/\/[^\s]+)/g;
        //         return text.replace(urlRegex, function (url) {
        //                 return '<a href="' + url + '" target="_blank">' + url + '</a>';
        //         })
        //     }
            
        //     let lines = noteContent.split("\n")
        //     let events = []




        //     // for loop TO DUPLICATE w LIB/TAG ONE
        //     // START EVENT PROCESS
        //     for (var i = 0; i < lines.length; i++) {
        //         const l = lines[i]
        //         const p = l.split("|")
        //         let title = p[0] ? p[0] : ""
        //         let evDate = p[1] ? new Date(p[1]) : false
        //         let body = p[2] ? p[2] : ""
    
        //         if (title && evDate) {
        //             events.push({
        //                 'date': evDate,
        //                 'title': title,
        //                 'body': body,
        //             })
    
        //             const curr = new Date()
        //             const eventDay = evDate.getDate()
        //             const eventMonth = evDate.getMonth() + 1
        //             const eventTime = evDate.toLocaleString().split(" ")[1]
                    
    
        //             // if every_month / every_year present body
        //             if (body.includes("every_month")){
        //                 // generate 5 events in future monthes
        //                 for (let i = 1; i < 6; i++) {
        //                     const recEvMonth = (curr.getMonth() + i)%12
        //                     const isNewYear = (curr.getMonth() + i) > 12
        //                     let recEvYear = curr.getFullYear() 
        //                     if (isNewYear) recEvYear++
        //                     const recDate = new Date(`${recEvMonth}/${eventDay}/${recEvYear} ${eventTime}`)
        //                     events.push({
        //                         'date': recDate,
        //                         'title': title,
        //                         'body': body,
        //                     })
        //                 }
        //             }
        //             if (body.includes("every_year")){
        //                 // generate 5 events in future
        //                 for (let i = 1; i < 6; i++) {
        //                     const recEvYear = curr.getFullYear()  + i
        //                     const recDate = new Date(`${eventMonth}/${eventDay}/${recEvYear} ${eventTime}`)
        //                     events.push({
        //                         'date': recDate,
        //                         'title': title,
        //                         'body': body,
        //                     })
        //                 }
        //             }
        //             if (body.includes("every_week")){
        //                 function getNextSameWeekdayDates(eventDate1) {
        //                     const targetWeekday = eventDate1.getDay();
        //                     const futureDate = new Date();
        //                     let count = 0;
                          
        //                     while (count < 5) {
        //                       futureDate.setDate(futureDate.getDate() + 1);
        //                       if (futureDate.getDay() === targetWeekday) {
        //                         count++;
        //                         events.push({
        //                             'date': new Date(futureDate),
        //                             'title': title,
        //                             'body': body,
        //                         })
        //                       }
        //                     }
        //                 }
        //                 getNextSameWeekdayDates(evDate)
        //             }
        //         }
        //     }
        //     // END EVENT PROCESS to duplicate

                
            
            
        // })
    }

    api.utils.loadRessources(
            [
                'https://raw.githubusercontent.com/jackducasse/caleandar/master/js/caleandar.js',
                'https://raw.githubusercontent.com/jackducasse/caleandar/master/css/theme3.css',
                `${opts.plugins_root_url}/calendar/calendar.lib.js`

            ], () => {
                    initCalendar()
            }
    )

    const styleHtml = `<style>
    #caleandar {
            padding: 5px 5px 5px 5px;
            padding-top: 0px;
    }

    #caleandar .cld-main {
            width:calc(100% - 20px);
    }
    #caleandar .cld-day {
        transition: all 0.2s;
        background: #e4e4e4!important;
        border: 1px solid rgba(0,0,0,0);
        padding: 2px;
    }
    #caleandar .cld-day.today {
        border: 1px solid #7311ee!important;
    }
    #caleandar .cld-day:hover {
        border: 1px solid rgba(0,0,0,0.2);
    }
    #caleandar li:before {
            content: none;
    }

    #caleandar .cld-main .cld-title {
            font-size: 8px;
            height: 10px;
            overflow: hidden;
            line-height: 9px;
    }
   
    #caleandar .event-wrapper:hover {
        position: fixed;
        background: white;
        padding: 5px;
        box-shadow: 0px 0px 3px 3px rgba(0,0,0,0.1);
        z-index: 5;
        border-radius: 5px;
    }
    #caleandar .event-wrapper .title {
        width: 150%;
    }
    #caleandar .event-wrapper .body {
        font-size:7px;
        text-decoration: none;
        color: #acacac;
    }


    </style>`
    return `${styleHtml}<div id="caleandar" class="no-css"></div>`
}

window.initCustomTag = calendarApp
