//@flow
// 10.10.2023 v1.1
/*::
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective.component"
*/

const timerCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        let api = window.api
        // let dfd = window.dfd

        const { div, updateContent } = api.utils.createDiv()
        const outputPaths = {  }
        ///////////////////////////////////////////////////
        // SUPPORT
        //
        // equivalent /*:Object|Array*/ in flow comment
        
        const each = (itera/*: Array<any> | { [key: string]: any } */, cb/*:Function*/) => {
                if (itera.constructor === Array) {
                        for (let i = 0; i < itera.length; ++i) {
                                cb(itera[i])
                        }
                } else {
                        for (const property in itera) {
                                cb(itera[property], property)
                        }
                }
        }

        const onClick = (elIds/*:string[]*/, action/*:Function*/) => {
                for (var i = 0; i < elIds.length; ++i) {
                        let el = document.getElementById(elIds[i]);
                        if (!el) return console.warn(`onclick: ${elIds[i]} does not exists`)
                        el.addEventListener("click", e => { action(e, el) }, false);
                }
        }
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const startMainLogic = () => {
                const api = window.api;

                
                const items/*:any[]*/ = []

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //
                // Data fetching
                //
                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                const cacheName = "timer_plugin_history"
               
                const getCache = (id/*:string*/) => (onSuccess /*:Function*/, onFailure/*:Function*/) => {
					api.call("cache.get", [id], content => {
						if (content !== undefined && content !== null) onSuccess(content)
						else if (onFailure) onFailure()
					})
				}
				const setCache = (id/*:string*/, mins/*:?number*/) => (content/*:string*/) => {
					if (!mins) mins = -1
					api.call("cache.set", [id, content, mins]) 
				}

                
                
                const getTimerData = getCache(cacheName)
                const setTimerData = setCache(cacheName)
                
                console.log("TIMER CTAG START")
                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //
                // Data processing
                //
                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                /*::
                type iTimerItem = {
                    name:string,
                    times:{[date:string]:number}
                }
                */
                
                // create a danfo dataframe with cols : name, date, time, year, month, day, category, item
                // const dfd = window.danfojs
                
                const processTimerItem = (timerItem/*:iTimerItem*/, arrItems/*:Array<any>*/) => {
                        const name = timerItem.name.toLocaleLowerCase()
                        const nameArr = name.split("-")
                        const category = nameArr[0]
                        each(timerItem.times, (time/*:number*/, date/*:string*/) => {
                                // date is {day}-{month}-{year}
                                const dateArr = date.split("-")
                                const day = parseInt(dateArr[0]) + 1
                                const month = parseInt(dateArr[1]) + 1
                                const year = parseInt(dateArr[2])
                                // create a date object
                                const dateObj = new Date(year, month, day)
                                const row = {category, name, date:dateObj, time, year, month, day}
                                arrItems.push(row)
                        })
                }    
                
                // get relative Date from dateExpression (startWeek, startMonth, startYear, today), output {year, month, day, datetime}
                

                const getDateDf = (dateExpression/*:string*/, df/*:any*/, opts/*:?{aggregate?:Array<string>}*/) => {
                        if (!opts) opts = {}
                        // if aggregate not array 
                        // const shouldAggregate = (opts.aggregate && opts.aggregate.constructor === Array)
                        // if (opts.aggregate && opts.aggregate.constructor !== Array) opts.aggregate = [opts.aggregate]
                        // if (opst. ) opts.aggregate = ["category", "name"]

                        const getRelativeDate = (dateExpression/*:string*/) => {
                                const dateObj = new Date()
                                const genObjDate = (dateObj/*:any*/) => ({year:dateObj.getFullYear(), month:dateObj.getMonth(), day:dateObj.getDate(), datetime:dateObj.getTime(), obj: dateObj})
                                const d = genObjDate(dateObj)
                                switch (dateExpression) {
                                        case "week":
                                                const nd = new Date(d.year, d.month, d.day - d.obj.getDay() + 1)
                                               return genObjDate(nd)
                                        case "month":
                                                const nd2 = new Date(d.year, d.month, 1)
                                                return genObjDate(nd2)
                                        case "year":
                                                const nd3 = new Date(d.year, 0, 1)
                                                return genObjDate(nd3)
                                        case "lastYear":
                                                const nd5 = new Date(d.year-1, 0, 1)
                                                return genObjDate(nd5)
                                        case "all":
                                                const nd4 = new Date(1970, 0, 1)
                                                return genObjDate(nd4)
                                        case "today":
                                                return d
                                        default:
                                                return d
                                }
                        }
                        const d = getRelativeDate(dateExpression); 
                        const df2 = df.query( df["year"].ge(d.year).and(df["month"].ge(d.month).and(df["day"].ge(d.day)))); 
                        // if df2 not empty, sort it
                        if (df2.count() > 0) df2.sortValues("hours", { inplace: true, ascending: false })
                        
                        const df3 = opts.aggregate ? df2.groupby(opts.aggregate).agg({hours:"sum"}) : df2
                        if(opts.aggregate && df3.count() > 0) df3.sortValues("hours_sum", { inplace: true, ascending: false })
                        return df3
                }
                const view = (df/*:any*/) => {
                        return dfd.toJSON(df)
                }


                //const d = getRelativeDate("lastWeek")
// dfd.toJSON(df.query( df["year"].eq(d.year).and(df["day"].eq(d.day).and(df["month"].eq(d.month)))).groupby(['category']).agg({hours:"sum"}))

                const arrItems/*:any[]*/ = []
                getTimerData( (timerItems/*:iTimerItem[]*/) => {

                        //
                        // DANFOJS
                        //
                        each(timerItems, timerItem => {
                                processTimerItem(timerItem,arrItems)
                        })
                        // arrItems is goody
                        console.log(111, arrItems, dfd)
                        const dfItems = new dfd.DataFrame(arrItems)
                        // console.log(dfItems)
                        // console.log(json);
                        const json = dfd.toJSON(dfItems);
                        const strJson = JSON.stringify(json);
                        console.log(strJson);
                        const enrichedItems = JSON.parse(strJson)
                        let dfItems2 = new dfd.DataFrame(enrichedItems)
                        dfItems2.print()

                        // dfItems3 is unique names
                        // const dfItems3 = dfItems2["name"]
                        // dfItems3 is dfItems2 cols name and category
                        // let dfItems3 = dfItems2.loc({columns:["name"]})
                        let dfItems3 = dfItems2['name'].unique();
                        let uniqueNamesArray = dfItems3.values;
                        console.log(123, uniqueNamesArray)
                        // keep unique names
                        // dfItems3.print()
                        
                        // output it in a simple array
                        // const uniqueNames = dfItems3["name"].toJSON(dfItems3)
                        // console.log(123,uniqueNames)

                        //
                        // AUTOCOMPLETE
                        //
                        genTimerForm(uniqueNamesArray)
                        
                        //
                        // GRAPH
                        //
                        // dfItems2 = dfItems2.groupby(['category', 'name', 'year', 'month', 'day']).sum()
                        genGraph(enrichedItems, (viewer) => {
                                graph.curr = viewer
                                // graph.curr.getConfig(c => {console.log(123, c)})
                                setTimeout(() => {
                                        reloadGraphTest()
                                }, 4000)
                                setTimeout(() => {
                                        let configGraph = JSON.parse(`{"version":"2.7.1","plugin":"X/Y Scatter","plugin_config":{},"settings":true,"theme":"Pro Light","title":null,"group_by":[],"split_by":[],"columns":["time","year",null,null,null,null,null],"filter":[],"sort":[],"expressions":{},"aggregates":{}}`)
                                        viewer.restore(configGraph);
                                }, 0)
                        })
                })

                const graph/*:{curr:iGraphPerspectiveViewerWrapper|void}*/ = {curr:undefined}
                const reloadGraph = (items/*:any[]*/) => {
                        if (!graph.curr) return
                        graph.curr.loadItems(items)
                }
                const reloadGraphTest = () => {
                        // gen items with random data with colrs "name", "surname", "age", "height", "weight"
                        const items = []
                        for (let i = 0; i < 100; ++i) {
                                items.push({name:"name" + i, surname:"surname" + i, age:Math.random() * 100, height:Math.random() * 100, weight:Math.random() * 100})
                        }
                        reloadGraph(items)
                }

                const genGraph = (arrItems/*:iGraphPerspectiveParams["items"]*/, cb/*:iGraphPerspectiveParams["cb"]*/) => {
                        // const wrapperEl/*:any*/ = document.getElementById("smart-list-ctag-inner")
                        const wrapperPlotEl/*:any*/ = document.getElementById("plot_div")
                        const paramsGraph/*:iGraphPerspectiveParams*/ = {
                                items:arrItems, 
                                cb: cb
                        }
                        wrapperPlotEl.innerHTML = window._tiroPluginsCommon.genGraphPerspectiveComponent(paramsGraph) 
                }

                // autocomplete 
                const genTimerForm = (arrItems/*:any[]*/) => {
                        // get all elements form infos values from // get all id els => // autoComplete, timeSelect, dateInput
                        const getForm = () => {
                                const autoComplete = document.getElementById("autoComplete").value
                                const timeSelect = document.getElementById("timeSelect").value
                                const dateInput = document.getElementById("dateInput").value
                                return {autoComplete, timeSelect, dateInput}
                        }
                        // on click of each of these els => // addTime, removeTime, startTimer
                        onClick(["addTime", "removeTime", "startTimer"], (e, el) => {
                                const action = el.id

                                console.log(action, getForm())
                        })
                        
                        // autocomplete
                        const autocompleteInput = document.getElementById("autoComplete")
                        const autoCompleteJS = new autoComplete({
                                placeHolder: "Select task...",
                                data: {
                                        src: arrItems,
                                        cache: true,
                                        noResults: true,
                                },
                                resultItem: {
                                        highlight: true,
                                },
                                resultsList: {
                                        maxResults: 200,
                                },
                                searchEngine: "loose",
                                events: {
                                        input: {
                                                selection: (event) => {
                                                const selection = event.detail.selection.value;
                                                autoCompleteJS.input.value = selection;
                                                }
                                        }
                                }
                        });
                        autoCompleteJS.input.addEventListener("focus", () => {
                                autocompleteInput.value = ""
                                console.log("dddd"); autoCompleteJS.start(" ")
                        });
                }
        
    
        } // end start main logic
    
        setTimeout(() => {
            setTimeout(() => {
                    api.utils.resizeIframe("100%");
            }, 100)
            setTimeout(() => {
                api.utils.loadRessources(
                    [
                        `${opts.plugins_root_url}/_common/components/graph_perspective.component.js`,
                        `${opts.plugins_root_url}/_common/components/table.component.js`,
                        `${opts.plugins_root_url}/timer/timer.lib.js`,
                        `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js`,
                        `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/css/autoComplete.min.css`,
                        `https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.min.js`
                    ],
                    () => {
                        startMainLogic()
                    }
                );
            }, 100)
        })

        
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="smart-list-ctag"> 
                <div id="smart-list-ctag-inner"> 
                        <input id="autoComplete" autocomplete="off">
                        <select id="timeSelect">
                                <option value="5">5m</option>
                                <option value="10">10m</option>
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="60" selected>1h</option>
                                <option value="120">2h</option>
                                <option value="180">3h</option>
                                <option value="240">4h</option>
                        </select>
                        <input type="date" id="dateInput" value="${new Date().toISOString().split('T')[0]}">
                        <button id="addTime">+</button>
                        <button id="removeTime">-</button>
                        <button id="startTimer">⏱️</button>
                </div>
                <div id="plot_div"></div>
                
        </div>

        <style>

        #smart-list-ctag .autoComplete_wrapper {
                z-index: 100;
        }
        #smart-list-ctag .autoComplete_wrapper>input {
                height: 20px;
                border-radius: 0px;
                margin: 20px 0px 20px 20px;
                width: auto;
                padding: 2px;
                border-color: #000;
                color: rgba(0, 0, 0, 0.3);
                font-weight: normal;
        }
        // placeholder
        #smart-list-ctag .autoComplete_wrapper>input::placeholder {
                color: rgba(0, 0, 0, 0.3);
                font-weight: normal;
        }


                #smart-list-ctag { }
                #smart-list-ctag table { 
                        min-width: 660px;
                }
                #smart-list-ctag .td-tag { 
                }
                #smart-list-ctag .td-tag .cell-content {  
                        max-width: 50px;
                        overflow: hidden;
                        // word-break: break-all;
                }
                #plot_div {
                        width: 500px;
                        height: 300px;
                }
                      
        </style> `
}
// 

window.initCustomTag = timerCtag

