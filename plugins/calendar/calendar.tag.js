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
                // api.call("ui.notePreviewPopup.open", [ev.filePath, ["50%" ,"50%"], { searchedString:ev.lineRaw}])
                const isMobile = () => {
                        let check = false;
                        //@ts-ignore
                        (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
                        return check;
                };
                let layout = isMobile() ? "top" : "top-right"
                let filePath = ev.filePath
                api.call("ui.floatingPanel.openFile", [filePath, { 
                        searchedString: ev.lineRaw,
                        idpanel: "id-panel-calendar-preview", 
                        view: "editor",
                        layout
                }])
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
    }

    #caleandar .cld-main {
            width:calc(100% );
    }
    #caleandar .cld-days {
        border-radius: 5px;
        overflow: hidden;
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
