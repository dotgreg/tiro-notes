//@flow
// 10.10.2023 v1.1
/*::
declare var dfd: any;
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective/graph_perspective.component"
import type {iCommonLib} from "../_common/common.lib"
// shortcut for :tabclose in vim => 
*/
const h = "[DATATABLE CTAG]"



const datatableCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        let api = window.api

        // let dfd = window.dfd

        let dataFileUrl/*:string|void*/ = undefined
        let rawCsvString/*:string|void*/ = undefined

        // IF ONE LINE ONLY, IT IS A FILE URL
        if (innerTagStr.trim().split("\n").length === 1 && innerTagStr.trim().length > 5) {
                const infos = api.utils.getInfos();
                let dataFileUrl = innerTagStr.trim()
                let dataFileName = dataFileUrl.split("/").slice(-1)[0].split("?")[0]
                const isAbs = dataFileUrl.startsWith("http")
                if (isAbs === false) {
                        dataFileUrl = infos.backendUrl + "/static/" + infos.file.folder + "/" + dataFileUrl + `?token=${infos.loginToken}`
                }
        }
        // IF HAS , or ;, on several lines IT IS A CSV STRING
        else if (innerTagStr.trim().split("\n").length > 1 && (innerTagStr.includes(",") || innerTagStr.includes(";"))) {
                rawCsvString = innerTagStr.trim()
        }

        

        const  fromRawCsvStringToArrObj = (csvString/*:string|void*/) => {
                if (!csvString) return []
                const separator = csvString.includes(",") ? "," : ";"
                const lines = csvString.split("\n")
                const headers = lines[0].split(separator).map((h) => h.trim())
                const arrObj = []
                for (let i = 1; i < lines.length; i++) {
                        const line = lines[i]
                        if (line.trim() === "") continue
                        const obj = {}
                        const values = line.split(separator).map((h) => h.replaceAll("__COMMA_CHAR__",",").trim())
                        for (let j = 0; j < headers.length; j++) {
                                obj[headers[j]] = values[j]
                        }
                        arrObj.push(obj)
                }
                return arrObj
        }


        const initDatatableAppCode = () => {
                const api = window.api;
                const commonLib/*:iCommonLib*/ = window._tiroPluginsCommon.commonLib
                const reloadGraph = (items/*:any[]*/, cb/*:Function*/) => {
                        let int = setInterval(() => {
                                console.log("waiting for graph...")
                                if(!graph.curr) return
                                clearInterval(int)
                                graph.curr?.loadItems(items, cb)
                        }, 200)
                }
                const genGraph = (paramsGraph/*:iGraphPerspectiveParams*/) => {
                        const wrapperPlotEl/*:any*/ = document.getElementById("plot_div")
                        wrapperPlotEl.innerHTML = window._tiroPluginsCommon.genGraphPerspectiveComponent(paramsGraph) 
                }

                const graph/*:{curr:iGraphPerspectiveViewerWrapper|void}*/ = {curr:undefined}
                if (opts.viewConfig) console.log(h, "opts.viewConfig detected!", opts.viewConfig)
                // const defaultViewConfig = viewConfigs.heatmapMonth() // const defaultViewConfig = '{}'
                
                const initializeUi = () => {
                        const params/*:iGraphPerspectiveParams*/ = {
                                parentVars: {opts},
                                cb: (viewer) => {
                                        graph.curr = viewer
                                }
                        }
                        if(dataFileUrl) params.fileUrl = dataFileUrl
                        if (rawCsvString) params.items = fromRawCsvStringToArrObj(rawCsvString)
                        genGraph(params)
                }

                
                initializeUi()
                // updateAppWithTimerData(() => { 
                //         graph.curr?.reloadViewsSelect()
                // })
        
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
                        `${opts.plugins_root_url}/_common/components/table.component.js`,
                    ],
                    () => {
                        initDatatableAppCode()
                    }
                );
            }, 100)
        })

        const css = {
                heightForm: "60px",
                heightGraph: "calc(100%)"
        }

        // if we are in mobile, height of form is 100px
        // if (window.innerWidth < 600) css.heightGraph = "calc(100% - 150px)"
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="datatable-ctag"> 
                
                <div id="datatable-ctag-graph"> 
                        <div id="plot_div"></div>
                </div>
                
        </div>

        <style>
        #datatable-ctag {
                height: calc(100vh - 32px);
                background: white;
        } 
        #datatable-ctag #datatable-ctag-form { 
                min-height: ${css.heightForm};
        }
                #datatable-ctag #datatable-ctag-form .autoComplete_wrapper {
                        z-index: 100;
                }
                #datatable-ctag #datatable-ctag-form .autoComplete_wrapper>input {
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
                #datatable-ctag #datatable-ctag-form .autoComplete_wrapper>input::placeholder {
                        color: rgba(0, 0, 0, 0.3);
                        font-weight: normal;
                }
                #datatable-ctag ::placeholder {
                        color: rgba(0, 0, 0, 0.3)!important;
                        font-weight: normal;
                        font-size: 12px;
                }


        #datatable-ctag #datatable-ctag-graph {
                height: ${css.heightGraph};
        }
                #datatable-ctag #datatable-ctag-graph #plot_div {
                        width: 100%;
                        height: 100%;
                }
                      
        </style> `
}
// 

window.initCustomTag = datatableCtag

