//@flow
// 10.10.2023 v1.1
/*::
import type {iAdvancedTableParams} from "../_common/components/advancedTable.component"
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
                        el.addEventListener("click", e => { action(e) }, false);
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

                        // const arrItemsJson = JSON.parse(strJson)

                        // dfItems2 = dfItems2.groupby(['category', 'name', 'year', 'month', 'day']).sum()
                        genGraph(enrichedItems, (viewer) => {
                                console.log(5555, viewer)
                        })
                })





                const genGraph = (arrItems/*:any*/, cb/*:(viewer:any)=>void*/) => {
                        // const wrapperEl/*:any*/ = document.getElementById("smart-list-ctag-inner")
                        const wrapperPlotEl/*:any*/ = document.getElementById("plot_div")
                        const paramsAdvancedTable/*:iAdvancedTableParams*/ = {
                                items:arrItems, 
                                cb: cb
                        }
                        wrapperPlotEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent(paramsAdvancedTable) 
                }





             







                
                // let s = new dfd.Series([1,2,3,4,5]) 

                // console.log(222, s, dfd)
                
                // window._tiroPluginsCommon.genAdvancedTableComponent
               


                // const config = {
                //         cols: [
                //                 {colId: "line", headerLabel: "Line"},
                //                 {colId: "tag1", headerLabel: "Tag1", classes:"td-tag"},
                               
                //         ]
                // };
                
                // if (hasTag2) config.cols.push({colId: "tag2", headerLabel: "Tag2", classes:"td-tag"})
                // if (hasTag3) config.cols.push({colId: "tag3", headerLabel: "Tag3", classes:"td-tag"})
                // // {colId: "filename", headerLabel: "Filename"},
                // // {colId: "folder", headerLabel: "Folder"},
                // config.cols.push({colId: "filename", headerLabel: "Filename"})
                // config.cols.push({colId: "folder", headerLabel: "Folder"})
                // config.cols.push({colId: "actions", type: "buttons", buttons:[
                //         {
                //           label: "", 
                //           icon: "eye", 
                //           onClick: (items,e) => {
                //                 console.log('onClick:', items,e)
                //                 if (items.length !== 1) return console.warn("no item selected")
                //                 let item = items[0]
                //                 console.log('onClick:', item,e);
                //                 let pos = ["50%" ,"50%"]
                //                 filePath = item.folder + item.filename
                //                 api.call("ui.notePreviewPopup.open", [filePath, ["50%" ,"50%"], { searchedString:item.line, replacementString:`wooop`}])
                        
                //           },
                //           onMouseEnter: (item,e) => {
                //                 // console.log('onMouseEnter:', item,e);
                //           },
                //           onMouseLeave: (item,e) => {
                //                 // console.log('onMouseLeave:', item,e);
                //           }
                //         },
                // ]})

                // wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({items, config, id:`smartlist-table-${api.utils.getInfos().file.path}`})


        }
    
        setTimeout(() => {
            setTimeout(() => {
                    api.utils.resizeIframe("100%");
            }, 100)
            setTimeout(() => {
                api.utils.loadRessources(
                    [
                        `${opts.plugins_root_url}/_common/components/advancedTable.component.js`,
                        `${opts.plugins_root_url}/_common/components/table.component.js`,
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
                </div>
                <div id="plot_div"></div>
                
        </div>

        <style>
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

