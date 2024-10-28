//@flow
// 10.10.2023 v1.1
/*::
declare var dfd: any;
declare var autoComplete: any;
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective/graph_perspective.component"
import type {iTimerLib, iTimerHistoryItem} from "./timer.lib"
import type {iCommonLib} from "../_common/common.lib"
*/
const h = "[TIMER CTAG]"

const timerCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        let api = window.api
        // let dfd = window.dfd

        const { div, updateContent } = api.utils.createDiv()
        const outputPaths = {}

        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const initTimerAppCode = () => {
                const api = window.api;
                const timerLib/*:iTimerLib*/ = window._tiroPluginsCommon.timerLib
                // console.log(22222222222, window._tiroPluginsCommon)
                const commonLib/*:iCommonLib*/ = window._tiroPluginsCommon.commonLib
                const { getOperatingSystem, each, onClick } = commonLib


                const items/*:any[]*/ = []
                ///////////////////////////////////////////////////////////////////
                // SUPPORT FUNCTIONS
                ///////////////////////////////////////////////////////////////////
                const reloadGraph = (items/*:any[]*/, cb/*:Function*/) => {
                        genGraph(items, (viewer) => {
                                graph.curr = viewer
                        })
                        // let int = setInterval(() => {
                        //         console.log("waiting for graph...")
                        //         if (!graph.curr) return
                        //         clearInterval(int)
                        //         // graph.curr?.loadItems(items, cb)
                        //         graph.curr?.ctag.addTable("timer-items",items, true)
                        // }, 200)
                        // if (!graph.curr) return
                        // graph.curr.loadItems(items)
                }
                // const currView = {curr:"heatmapMonth"}
                // const changeViewGraph = (view/*:"heatmapMonth"|"heatmapWeek"|"barsToday"|"datagrid"*/) => {
                //         currView.curr = view
                //         setTimeout(() => {
                //                 const viewConfig = viewConfigs[currView.curr]()
                //                 if (viewConfig) graph.curr?.setConfig(viewConfig)
                //         , 1000})
                // }
                const reloadGraphTest = () => {
                        // gen items with random data with colrs "name", "surname", "age", "height", "weight"
                        const items = []
                        for (let i = 0; i < 100; ++i) {
                                items.push({ name: "name" + i, surname: "surname" + i, age: Math.random() * 100, height: Math.random() * 100, weight: Math.random() * 100 })
                        }
                        reloadGraph(items)
                }

                const defaultViewConfigs = {
                        // "📊 month": `{"version":"3.1.0","plugin":"Heatmap","plugin_config":{},"settings":true,"theme":null,"title":null,"group_by":["name"],"split_by":["day"],"columns":["hours"],"filter":[["month","==",{{month}}],["year","==",{{year}}]],"sort":[["time","asc"]],"expressions":{},"aggregates":{}}`,
                        // "📊 month2": `{"version":"3.1.0","plugin":"Y Bar","plugin_config":{"hideKeys":[]},"settings":true,"theme":"Pro Light","title":null,"group_by":["name"],"split_by":["day"],"columns":["hours"],"filter":[["month","==",{{month}}],["year","==",{{year}}],["category","!=","total"]],"sort":[["time","asc"]],"expressions":{},"aggregates":{}}`,
                        // "📊 week": `{"version":"3.1.0","plugin":"Heatmap","plugin_config":{},"settings":true,"theme":null,"title":null,"group_by":["name"],"split_by":["day"],"columns":["hours"],"filter":[["week","==",{{week}}],["year","==",{{year}}]],"sort":[["time","asc"]],"expressions":{},"aggregates":{}}`,
                        // "📊 today": `{"version":"3.1.0","plugin":"Y Bar","plugin_config":{"hideKeys":[]},"settings":true,"theme":"Pro Light","title":null,"group_by":["name"],"split_by":["day"],"columns":["hours"],"filter":[["month","==",{{month}}],["year","==",{{year}}],["day","==",{{day}}]],"sort":[["time","asc"]],"expressions":{},"aggregates":{}}`,
                        // "📊 grid": `{"version":"3.1.0","plugin":"Datagrid","plugin_config":{"columns":{},"editable":false,"scroll_lock":false},"settings":true,"theme":"Pro Light","title":null,"group_by":[],"split_by":[],"columns":["day","category","name","hours","date","dateRaw","time","year","month","week"],"filter":[["week","==",{{week}}],["year","==",{{year}}],["category","!=","total"]],"sort":[["day","desc"]],"expressions":{},"aggregates":{}}`,
                }
                // switch from defaultViewConfigs as obj to an array of obj like {name:..., config:...}
                const defaultViewConfigsArr = Object.keys(defaultViewConfigs).map(name => ({ name, config: defaultViewConfigs[name] }))

                const genGraph = (arrItems/*:iGraphPerspectiveParams["items"]*/, cb/*:iGraphPerspectiveParams["cb"]*/) => {
                        // const wrapperEl/*:any*/ = document.getElementById("timer-ctag-inner")
                        const wrapperPlotEl/*:any*/ = document.getElementById("plot_div")
                        const paramsGraph/*:iGraphPerspectiveParams*/ = {
                                items: arrItems,
                                parentVars: { opts },
                                defaultViews: defaultViewConfigsArr,
                                cb: cb
                        }
                        wrapperPlotEl.innerHTML = window._tiroPluginsCommon.genGraphPerspectiveComponent(paramsGraph)
                }

                // autocomplete 
                // const genTimerForm = (arrItems/*:any[]*/) => {
                //         // get all elements form infos values from // get all id els => // autoComplete, timeSelect, dateInput
                //         const getForm = () => {
                //                 const autoComplete = document.getElementById("autoComplete").value
                //                 const timeSelect = document.getElementById("timeSelect").value
                //                 const dateInput = document.getElementById("dateInput").value
                //                 return {autoComplete, timeSelect, dateInput}
                //         }
                //         // on click of each of these els => // addTime, removeTime, startTimer
                //         onClick(["addTime", "removeTime", "startTimer"], (e, el) => {
                //                 const action = el.id

                //                 if (action === "addTime") {

                //                 } else if (action === "removeTime") {

                //                 } else if (action === "startTimer") {
                //                         timerLib.logTimer(api, items, getForm().autoComplete, parseInt(getForm().timeSelect))
                //                 }

                //                 console.log(action, getForm())
                //         })

                //         onClick(["heatmapMonth","heatmapWeek", "datagrid", "barsToday", "barsMonth"], (e, el) => {
                //                 const action = el.id
                //                 console.log(action)
                //                 changeViewGraph(action)
                //         })

                //         onClick(["reloadDatas"], (e, el) => {
                //                 updateAppWithTimerData(() => { 
                //                         // changeViewGraph("heatmapMonth") 
                //                 })
                //         })

                //         // autocomplete
                //         const autocompleteInput = document.getElementById("autoComplete")
                //         const autoCompleteJS = new autoComplete({
                //                 placeHolder: "Select task...",
                //                 data: {
                //                         src: arrItems,
                //                         cache: true,
                //                         noResults: true,
                //                 },
                //                 resultItem: {
                //                         highlight: true,
                //                 },
                //                 resultsList: {
                //                         maxResults: 200,
                //                 },
                //                 searchEngine: "loose",
                //                 events: {
                //                         input: {
                //                                 selection: (event) => {
                //                                 const selection = event.detail.selection.value;
                //                                 autoCompleteJS.input.value = selection;
                //                                 }
                //                         }
                //                 }
                //         });
                //         autoCompleteJS.input.addEventListener("focus", () => {
                //                 autocompleteInput.value = ""
                //                 autoCompleteJS.start(" ")
                //         });
                // }


                ///////////////////////////////////////////////////////////////////
                // Data fetching
                ///////////////////////////////////////////////////////////////////
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

                ///////////////////////////////////////////////////////////////////
                // Data processing
                ///////////////////////////////////////////////////////////////////

                // create a danfo dataframe with cols : name, date, time, year, month, day, category, item
                // const dfd = window.danfojs
                function weekOfYear(day, month, year) {
                        const date = new Date(year, month - 1, day);
                        const firstDayOfYear = new Date(year, 0, 1);
                        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
                        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                }
                const processTimerItemOccurence = (name/*:string*/, category/*:string*/, time/*:number*/, date/*:string*/) => {
                        // date is {day}-{month}-{year}
                        const dateArr = date.split("-")
                        const dateRaw = date
                        const day = parseInt(dateArr[0])
                        const month = parseInt(dateArr[1]) + 1
                        // week of the month (0-4), a week starts a monday
                        // const week = Math.floor(day / 7)
                        // week of the year (0-52), a week starts a monday
                        // const week = Math.floor(day / 7)
                        const year = parseInt(dateArr[2])
                        const week = weekOfYear(day, month, year)
                        // create a date object
                        const dateObj = new Date(year, month, day)
                        // rounded time in hour like 12.2
                        // const hours = Math.round((time / 60)*10)/10
                        // const hours = `${Math.round(time / 6) / 10}`.replace(".", ",")
                        const hours = Math.round(time / 6) / 10
                        const row = { category, name, dateObj ,  time, year, month, day, hours, week }
                        return row
                }
                const preprocessTimerItem = (timerItem/*:iTimerHistoryItem*/, arrItems/*:Array<any>*/) => {
                        const name = timerItem.name.toLocaleLowerCase()
                        const nameArr = name.split("-")
                        const category = nameArr[0]
                        each(timerItem.times, (time/*:number*/, date/*:string*/) => {
                                const row = processTimerItemOccurence(name, category, time, date)
                                arrItems.push(row)
                        })
                }
                const preprocessTimerItems = (timerItems/*:iTimerHistoryItem[]*/) => {
                        let arrItems/*:Array<any>*/ = []
                        each(timerItems, timerItem => {
                                preprocessTimerItem(timerItem, arrItems)
                        })
                        const objTotalPerDay/*:{[date:string]: number}*/ = {}
                        // for each el in arrItems, increment the total per day in objTotalPerDay
                        each(arrItems, (el/*:any*/) => {
                                const dateStr = el.dateRaw
                                if (objTotalPerDay[dateStr]) objTotalPerDay[dateStr] += el.time
                                else objTotalPerDay[dateStr] = el.time
                        })
                        // for each objTotalPerDay, create a new row in arrItems
                        each(objTotalPerDay, (time/*:number*/, date/*:string*/) => {
                                const row = processTimerItemOccurence("total", "total", time, date)
                                arrItems.push(row)
                        })

                        return arrItems

                }






                const processDataSetLogic = (timerItems/*:iTimerHistoryItem[]*/) => {
                        //
                        // DANFOJS
                        //
                        const arrItems = preprocessTimerItems(timerItems)

                        // arrItems is goody
                        const dfItems = new dfd.DataFrame(arrItems)
                        const json = dfd.toJSON(dfItems);
                        const strJson = JSON.stringify(json);
                        const enrichedItems = JSON.parse(strJson)
                        let dfItems2 = new dfd.DataFrame(enrichedItems)
                        // dfItems2.print()

                        const dfItemsOut = dfItems2
                        // const dfItemsOut = dfItems2.groupby(['category', 'name', 'year', 'month', 'day']).sum()
                        const outJsonArr = dfd.toJSON(dfItemsOut);

                        // dfItems3 is unique names
                        // const dfItems3 = dfItems2["name"]
                        // dfItems3 is dfItems2 cols name and category
                        // let dfItems3 = dfItems2.loc({columns:["name"]})
                        let dfItems3 = dfItems2['name'].unique();
                        let uniqueNamesArray = dfItems3.values;
                        // console.log(123, uniqueNamesArray)
                        // keep unique names
                        // dfItems3.print()

                        // output it in a simple array
                        // const uniqueNames = dfItems3["name"].toJSON(dfItems3)
                        // console.log(123,uniqueNames)
                        return { outJsonArr, uniqueNamesArray }
                }



                ///////////////////////////////////////////////////////////////////
                //  
                // START LOGIC
                // 
                ///////////////////////////////////////////////////////////////////      
                const graph/*:{curr:iGraphPerspectiveViewerWrapper|void}*/ = { curr: undefined }
                if (opts.viewConfig) console.log(h, "opts.viewConfig detected!", opts.viewConfig)
                // const defaultViewConfig = viewConfigs.heatmapMonth() // const defaultViewConfig = '{}'

                const initializeUi = () => {
                        // genTimerForm([])

                        genGraph([{ "graph_status": "data loading..." }], (viewer) => {
                                graph.curr = viewer
                        })
                }

                const updateAppWithTimerData = (cb/*:Function*/) => {
                        console.log(h, "updateAppWithTimerData")
                        getTimerData((timerItems/*:iTimerHistoryItem[]*/) => {
                                const { outJsonArr, uniqueNamesArray } = processDataSetLogic(timerItems)
                                // AUTOCOMPLETE update
                                // genTimerForm(uniqueNamesArray)

                                // GRAPH update
                                // console.log(h, "updateAppWithTimerData", outJsonArr)
                                // let subset = outJsonArr.slice(0, 20)
                                // force float on hours by adding a first el with 0.001
                                outJsonArr[0].hours += 0.1

                                reloadGraph(outJsonArr, () => {
                                        cb()
                                })
                        })

                }

                // initializeUi()
                updateAppWithTimerData(() => {
                        // changeViewGraph("heatmapMonth") 
                        graph.curr?.reloadViewsSelect()
                })

        } // end start main logic

        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
                        api.utils.loadRessources(
                                [
                                        `${opts.plugins_root_url}/_common/common.lib.js`,
                                        `${opts.plugins_root_url}/_common/components/graph_perspective/graph_perspective.component.js`,
                                        // `${opts.plugins_root_url}/_common/components/table.component.js`,
                                        `${opts.plugins_root_url}/timer/timer.lib.js`,
                                        // `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js`,
                                        // `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/css/autoComplete.min.css`,
                                        `https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.min.js`
                                ],
                                () => {
                                        initTimerAppCode()
                                }
                        );
                }, 100)
        })

        const css = {
                heightForm: "60px",
                heightGraph: "calc(100% - 10px)"
        }

        // if we are in mobile, height of form is 100px
        if (window.innerWidth < 600) css.heightGraph = "calc(100% - 150px)"
        // <div id="timer-ctag-form"> 
        //         <input id="autoComplete" autocomplete="off">
        //         <select id="timeSelect">
        //                 <option value="5">5m</option>
        //                 <option value="10">10m</option>
        //                 <option value="15">15m</option>
        //                 <option value="30">30m</option>
        //                 <option value="60" selected>1h</option>
        //                 <option value="120">2h</option>
        //                 <option value="180">3h</option>
        //                 <option value="240">4h</option>
        //         </select>
        //         <input type="date" id="dateInput" value="${new Date().toISOString().split('T')[0]}">
        //         <button id="addTime">+</button>
        //         <button id="removeTime">-</button>
        //         <button id="startTimer">⏱️</button>
        //         -
        //         <button id="heatmapMonth">📊 month</button>
        //         <button id="barsMonth">📊 month 2</button>
        //         <button id="heatmapWeek">📊 week</button>
        //         <button id="barsToday">📊 today</button>
        //         <button id="datagrid">grid</button>
        //         <button id="reloadDatas">🔄</button>
        // </div>
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="timer-ctag"> 
                
                <div id="timer-ctag-graph"> 
                        <div id="plot_div"></div>
                </div>
                
        </div>

        <style>
        #timer-ctag {
                height: calc(100vh - 30px);
                background: white;
        } 
        #timer-ctag #timer-ctag-form { 
                min-height: ${css.heightForm};
        }
                #timer-ctag #timer-ctag-form .autoComplete_wrapper {
                        z-index: 100;
                }
                #timer-ctag #timer-ctag-form .autoComplete_wrapper>input {
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
                #timer-ctag #timer-ctag-form .autoComplete_wrapper>input::placeholder {
                        color: rgba(0, 0, 0, 0.3);
                        font-weight: normal;
                }
                #timer-ctag ::placeholder {
                        color: rgba(0, 0, 0, 0.3)!important;
                        font-weight: normal;
                        font-size: 12px;
                }


        #timer-ctag #timer-ctag-graph {
                height: ${css.heightGraph};
        }
                #timer-ctag #timer-ctag-graph #plot_div {
                        width: calc(100% - 20px);
                        height: 100%;
                }
                      
        </style> `
}
// 

window.initCustomTag = timerCtag

