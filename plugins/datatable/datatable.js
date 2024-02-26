//@flow
// 10.10.2023 v1.1
/*::
declare var dfd: any;
declare var autoComplete: any;
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective.component"
import type {iCommonLib} from "../_common/common.lib"
*/
const h = "[DATATABLE CTAG]"

const datatableCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        let api = window.api
        // let dfd = window.dfd

        const { div, updateContent } = api.utils.createDiv()
        const outputPaths = {  }
        
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const initTimerAppCode = () => {
                const api = window.api;
                const commonLib/*:iCommonLib*/ = window._tiroPluginsCommon.commonLib
                ///////////////////////////////////////////////////////////////////
                // SUPPORT FUNCTIONS
                ///////////////////////////////////////////////////////////////////
                const reloadGraph = (items/*:any[]*/, cb/*:Function*/) => {
                        let int = setInterval(() => {
                                console.log("waiting for graph...")
                                if(!graph.curr) return
                                clearInterval(int)
                                graph.curr?.loadItems(items, cb)
                        }, 200)
                }
                const genGraph = (arrItems/*:iGraphPerspectiveParams["items"]*/, cb/*:iGraphPerspectiveParams["cb"]*/) => {
                        // const wrapperEl/*:any*/ = document.getElementById("datatable-ctag-inner")
                        const wrapperPlotEl/*:any*/ = document.getElementById("plot_div")
                        const paramsGraph/*:iGraphPerspectiveParams*/ = {
                                items:arrItems, 
                                defaultViews: [],
                                cb: cb
                        }
                        wrapperPlotEl.innerHTML = window._tiroPluginsCommon.genGraphPerspectiveComponent(paramsGraph) 
                }


                ///////////////////////////////////////////////////////////////////
                //  
                // START LOGIC
                // 
                ///////////////////////////////////////////////////////////////////      
                const graph/*:{curr:iGraphPerspectiveViewerWrapper|void}*/ = {curr:undefined}
                if (opts.viewConfig) console.log(h, "opts.viewConfig detected!", opts.viewConfig)
                // const defaultViewConfig = viewConfigs.heatmapMonth() // const defaultViewConfig = '{}'
                
                const initializeUi = () => {
                        genGraph([{"graph_status":"please load data from file select"}], (viewer) => {
                                graph.curr = viewer
                                // graph.curr?.reloadViewsSelect()
                        })
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
                console.log(10000000000023333333333333, opts)
                api.utils.loadRessources(
                    [
                        `${opts.plugins_root_url}/_common/common.lib.js`,
                        `${opts.plugins_root_url}/_common/components/graph_perspective.component.js`,
                        `${opts.plugins_root_url}/_common/components/table.component.js`,
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
                heightGraph: "calc(100% - 80px)"
        }

        // if we are in mobile, height of form is 100px
        if (window.innerWidth < 600) css.heightGraph = "calc(100% - 150px)"
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="datatable-ctag"> 
                
                <div id="datatable-ctag-graph"> 
                        <div id="plot_div"></div>
                </div>
                
        </div>

        <style>
        #datatable-ctag {
                height: calc(100vh - 30px);
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

