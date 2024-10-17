//@flow
// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


/*::
import type {iGraphPerspectiveLib} from "./graph_perspective.lib.js"

export type iGraphPerspectiveParams = {
    items?: any[],
    parentVars: {opts:any},
    defaultViews?: Array<iView[]>,
    cb: (viewer: iGraphPerspectiveViewerWrapper) => void
}
export type iGraphPerspectiveViewerWrapper = {
    loadItems: (items: any[], cb?: Function) => void,
    setConfig: (config: string) => void,
    getConfig: (cb:(config:string)=>void) => void,

    reloadViewsSelect: (cb?:Function) => void,
    saveNewView: (view:iView, cb:Function) => void,
    deleteView: (viewName:string, cb:Function) => void,


    load: (data: any) => void,
    save: () => any, 
    restore: (config:any) => void,

    toggleConfig: () => void,
    delete: () => void,
    reset: () => void,
    copy: () => void,
    paste: () => void,
    replace: () => void,
    clear: () => void,
    download: () => void,
    "delete": () => void,
    "export": () => void,
    "import": () => void,
    "reset": () => void,
}

type iView = {
    name: string,
    config: string
}
*/
const helpStr = `
<h3>Introduction</h3>
<p>This is a Graph Perspective component, allowing you to visualize data in a table, graph, or other formats. 
<br> You can use it as a custom tag using [[datatable]]. You can view data directly from a .csv or an .parquet file.
<br> You can also save and load views configurations to reuse them later.</p>
</p>

<h3>Sharing Custom Columns in several views</h3>
<p>You can share custom columns with other config views if the custom column name starts with "ID-" and the views to share into also starts with "ID-" 
<br>Ex: if you create a custom column "flights-custom-count", it will be shared in all views config starting by "flights-"</p>

<h3>Manual save/modification of views configs</h3>
<p>You can modify/save/backup the views by going to /.tiro/cache/cache-api/cache-api-storage-PATH_TO_FILE_datatable_ctagmd</p>

<h3>{{day}} {{month}}, {{year}}</h3>
<p>You can have up to date views configs by changing parts of the config with tags like {{day}} {{month}}, {{year}} <br>
ex: ' \"filter\":[[\"month\",\"==\",{{month}}],[\"year\",\"==\",{{year}}],[\"day\",\"==\",{{day}}]] ' inside the view config file path described below

<h3>Documentation</h3>
<ul>
    <li><a href="https://perspective.finos.org/docs/expressions/" target="_blank"> Expressions </a></li>
    <li><a href="https://perspective.finos.org/docs/obj/perspective-viewer-exprtk/" target="_blank"> Exprtk </a></li>
</ul>
</p>
`

let genGraphPerspectiveComponent = (p/*:iGraphPerspectiveParams*/) => {
    let hl = "[GRAPH PERSPECTIVE LIB]"
    const api = window.api;
    const startMainLogic = () => {
        const graphPerspectiveLib/*:iGraphPerspectiveLib*/ = window._tiroPluginsCommon.graphPerspectiveLib 
        const wrapperEl = document.getElementById("ctag-component-advanced-table-wrapper")

        // Create a new script element
        function loadModuleScript(src) {
            var script = document.createElement('script');
            script.type = 'module';
            script.src = src;
            document.head.appendChild(script);
        }
        
        function loadStylesheet(href) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.crossOrigin = 'anonymous';
            link.href = href;
            document.head.appendChild(link);
        }

        window._graph_perspective_props = p
        
        // Load module scripts
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective@3.1.0/dist/cdn/perspective.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.1.0/dist/cdn/perspective-viewer.js');


        var script = document.createElement('script');
        script.type = 'module';
  
        script.textContent = `
            import { worker } from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.1.0/dist/cdn/perspective.js";
            const WORKER = await worker();
            
            async function initPerspective(cb) {
                const viewer = document.getElementsByTagName("perspective-viewer")[0];
                console.log("${hl} loading viewer for :", window._graph_perspective_props)
                
                cb(window.workspace, WORKER)
            }
            window._initPerspective = initPerspective
        `;

        // Append the script element to the head or body of the document
        setTimeout(() => {
            document.head.appendChild(script);
            // type module
            const int = setInterval(() => {
                if (window._initPerspective) {
                    clearInterval(int)
                    afterInitPerspective()
                }
            }, 500)
        } ,1000)

        //
        // AFTER INIT PERSPECTIVE (required by async/module code)
        //
        const afterInitPerspective = () => {
            window._initPerspective((workspace/*:iGraphPerspectiveViewerWrapper*/, WORKER/*:any*/) => {
                let initLoaded = false;
                //
                // workspace OBJ EXTENSION
                //
                // if workspace does not exists, create empty obj
                // if (!workspace) workspace = {}
                workspace.ctag = {}
                workspace.ctag.addTable = async (filename, data, withView=true) => {
                    console.log(hl,"addTableView", filename, {data})
                    if (!data) data = [{"_":""}]
                    let tablesArr = workspace.ctag.getTables()
                    let newTableId = `table${tablesArr.length + 1}`
                    workspace.addTable(
                        newTableId,
                        WORKER.table(data)
                    );
                    workspace.ctag.getViews((views, expectedTables) => {
                        // only add new view if 1) no view exists
                        let viewExists = views.length > 0
                        // if there is at least one table
                        let tableExists = tablesArr.length > 0
                        let expectedTablesReached = tablesArr.length >= expectedTables.length 
                        // no view no table > add view
                        // no view one table > add view
                        // view no table > no view
                        // view table > view
                        console.log(hl,{views, tablesArr, expectedTables, expectedTablesReached, viewExists, tableExists, withView, viewExists, tableExists})
                        if (!withView) return
                        // if (viewExists && !tableExists) return
                        if (!expectedTablesReached) return
                        const viewerConfig = {table:newTableId, title:filename}
                        workspace.addViewer(viewerConfig)
                    })
                }

                workspace.ctag.getViews = (cb) => {
                    workspace.save().then((config) => {
                        let views = []
                        console.log(hl,"getViews", config)
                        let expectedTables = []
                        for (let view in config?.viewers) {
                            views.push(view)
                            expectedTables.push(config.viewers[view].table)
                        }
                        // make expectedTables unique
                        expectedTables = [...new Set(expectedTables)]
                        cb(views, expectedTables)
                    })
                }
                workspace.ctag.getTables = () => {
                    let arr = []
                    workspace.workspace.tables.forEach((v, k) => {
                        arr.push(k)
                    })
                    return arr
                }

                workspace.loadFileUrl = (fileUrl/*:string*/, cb) => {
                    // @TODO
                }

                // @BROKEN export current view to csv string
                workspace.exportToCsvString = (cb) => {
                    console.log(hl,"exportToCsvString")
                    try {
                        workspace.getView().then((view) => {
                            view.to_csv().then((csvString) => {
                                cb(csvString)
                            });
                        }).catch((e) => {
                            console.warn(hl,"Error exporting to csv", e)
                            cb(``)
                        });
                    } catch (error) {
                        console.warn(hl,"Error exporting to csv", error)
                        cb(``)
                    }
                }

                function weekOfYear(day, month, year) {
                    const date = new Date(year, month - 1, day);
                    const firstDayOfYear = new Date(year, 0, 1);
                    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
                    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                }

                //////////////////////////////////
                //
                //
                //   {{month}}, {{year}}, {{day}}, {{week}} in configStr
                //
                //
                //
                const enrichViewConfigStr = (configStr/*:string*/) => {
                    let curr = new Date()
                    let month = curr.getMonth() + 1
                    let year = curr.getFullYear()
                    let day = curr.getDate()
                    let week = weekOfYear(day, month, year)
                    // make all these vars strings
                    // replace {{month}}, {{year}}, {{day}}, {{week}} in configStr
                    configStr = configStr.replace("{{month}}", month).replace("{{year}}", year).replace("{{day}}", day).replace("{{week}}", week)
                    return configStr
                }

                workspace.ctag.setConfig =  (config, cb) => {
                    console.log(hl,"setConfig", {config} )
                    try {
                        workspace.restore(config).then(() => {
                            if (cb) cb()
                        },(res) => { 
                            api.call("ui.notification.emit",[{id:"notif-id-graph-perspective",content:`<h3>Error setting config</h3>  answer: "${JSON.stringify(res)}" for config: <br><br><code>${configString}</code>`, options:{hideAfter: 120}}])    
                        })
                    } catch (error) {
                        console.warn(hl, "Error setting config", error)
                    }
                }
                workspace.ctag.getConfig = (cb) => {
                    // workspace.save().then((config) => {cb(JSON.stringify(config, null, 4))})
                    workspace.save().then((config) => {cb(config)})
                }
                // workspace.ctag.loadItems(window._graph_perspective_props.items);
                // workspace.ctag.addTable("init_table",window._graph_perspective_props.items, true);















                // get all the buttons
                const configSelect = document.getElementById("perspective-config-select");
                const configSave = document.getElementById("perspective-config-save");
                const configDelete = document.getElementById("perspective-config-delete");
                const configSourceTitle = document.getElementById("perspective-config-source-title");
                const configRefresh = document.getElementById("perspective-config-refresh");
                const configOpenPlotly = document.getElementById("perspective-send-to-plotly");
                const configtogglePanel = document.getElementById("perspective-config-toggle");
                const configHelp = document.getElementById("perspective-config-help");
                const editConfig = document.getElementById("perspective-config-edit");
                const fileUpload = document.getElementById("perspective-config-file-upload");

                
                




                ////////////////////////////////////////////////////////////////////////////////////
				// VIEWS CACHING SETTINGS & CONTENT SYSTEM
				//
                const defaultViews = window._graph_perspective_props.defaultViews ? [...window._graph_perspective_props.defaultViews] : []
				const getCache = (id/*:string*/) => (onSuccess/*:(views:iView[]) => void*/, onFailure/*:([]) => void*/) => {
                    let nviews = []
                    if (defaultViews) nviews = [...defaultViews]
					api.call("cache.get", [id], content => {
                        // console.log("cache content", content, content.length)
                        let viewsFinal = []
						if (content !== undefined && content !== null && content.length !== 0) viewsFinal = [...nviews, ...content]
						else viewsFinal = nviews

                        viewsSync.curr = [...viewsFinal]
                        if (viewsFinal.length > 0 && viewsSync === "") viewsSync.selectedName = viewsFinal[0].name

                        onSuccess(viewsFinal)
					})
				}
                viewsSync = {curr: [], selectedName: ""}
				const setCache = (id/*:string*/) => (views/*:iView[]*/, cb/*:Function*/) => {
                    viewsIdToRemove = []
                    if (defaultViews) viewsIdToRemove = defaultViews.map(v => v.name)
                    // console.log("setting cache1", id, views, views.length, viewsIdToRemove)
                    views = views.filter(v => !viewsIdToRemove.includes(v.name))
                    // console.log("setting cache2", id, views, views.length)
					api.call("cache.set", [id, views, -1, {uncompressed: true}], () => {if(cb) cb()}) 
				}
				const cacheViewsId = `lib-graph-perspective-${api.utils.getInfos().file.path}`

                // window._graph_perspective_props
				const getViewsCache = getCache(cacheViewsId)
				const setViewsCache = setCache(cacheViewsId)
				const openCacheFileEditor = (searchedString/*:string*/) => {
					api.call("cache.getCachePath", [cacheViewsId], (path) => {
                        console.log(hl,"openCacheFileEditor", path)
                        let layout = "right"
                        api.call("ui.floatingPanel.openFile", [path, { 
                                searchedString:searchedString, 
                                idpanel: "id-panel-graph-config-editor", 
                                view: "editor",
                                layout
                        }])

                    }) 
                }
                








                ////////////////
                // VIEW CACHING SAVE/GET/DELETE 
                //
                // add event listeners
                configSelect.addEventListener("change", (e) => {
                    workspace.restore(e.target.value);
                });
                saveNewView = (view/*:iView*/, cb/*:Function*/) => {
                    getViewsCache(
                        views => {
                            // if name already exists, overwrite it
                            const foundIdx = views.findIndex(v => v.name === view.name)
                            if (foundIdx !== -1) views[foundIdx] = view
                            else views.push(view)

                            // reorder views by name 
                            views = views.sort((a, b) => a.name.localeCompare(b.name))
                            
                            console.log(hl,"saving view", view, views)
                            setViewsCache(views, cb)
                        },
                        () => {
                            setViewsCache([view], cb)
                        }
                    )
                }
                const deleteView = (viewName/*:string*/, cb/*:Function*/) => {
                    // prompt sure? 
                    if (confirm(`Are you sure you want to delete the view ${viewName}?`)) {
                        getViewsCache(
                            views => {
                                setViewsCache(views.filter(v => v.name !== viewName), cb)
                            },
                            () => {cb()}
                        )
                    }
                }
                const reloadViewsSelect = (cb/*:Function*/) => {
                    getViewsCache(
                        views => {
                            genViewsButtons(views)
                            configSelect.innerHTML = views.map(v => `<option value="${v.name}">${v.name}</option>`).join("")
                            if (views.length > 0) {
                                updateSelectActiveOption(viewsSync.selectedName)
                                workspace.setConfig(viewsSync.selectedName)
                            }
                            if (cb) cb(views)
                        },
                        () => {
                            configSelect.innerHTML = ""
                            if (cb) cb([])
                        }
                    )   
                }
                workspace.reloadViewsSelect = reloadViewsSelect
                workspace.deleteView = deleteView

                // if config save, prompt for a name and save it
                configSave.addEventListener("click", () => {
                    workspace.ctag.getConfig((config) => {
                        let name = prompt("Enter a name for the config - 📉📊🆂🧮⏳🕯️🥢🔥", viewsSync.selectedName);
                        if (name) {
                            console.log(hl,"saving config", name, config)
                            viewsSync.selectedName = name
                            saveNewView({name, config}, () => {
                                reloadViewsSelect()
                            })
                        }
                    });
                });
                configDelete.addEventListener("click", () => {
                    let name = configSelect.value
                    if (name) {
                        deleteView(name, () => {
                            reloadViewsSelect()
                        })
                    }
                })
                reloadViewsSelect(views => {
                    
                })

                // update the select option to active
                const updateSelectActiveOption = (viewName/*:string*/) => {
                    const options = configSelect.options
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === viewName) {
                            configSelect.selectedIndex = i
                            break
                        }
                    }
                }
                // on select change, restore the view
                configSelect.addEventListener("change", (e) => {
                    const viewName = e.target.value
                    window.updateEnrichConfigViewWithExpressionsAndDates(viewName)
                })
                const genViewsButtons = (views/*:iView[]*/) => {
                    // add buttons for each view in #views-buttons-wrapper
                    const viewsButtonsWrapper = document.getElementById("views-buttons-wrapper")
                    viewsButtonsWrapper.innerHTML = views.map(v => `<button class="btn" onclick="window.updateEnrichConfigViewWithExpressionsAndDates('${v.name}')">${v.name}</button>`).join("")
                }


                
                




















                //
                // DISABLED
                //
                // if config  refresh, reload the views
                //
                // configRefresh.addEventListener("click", () => {
                //     reloadViewsSelect()
                   
                // });

                // AUTOMATICALLY REFRESH CONFIG
                const configRefreshInSecond = 7
                setInterval(() => {
                    reloadViewsSelect()
                }, configRefreshInSecond * 1000)











                ////////////////////////////////////////////////////////
                //
                // VARS SHARING ACROSS VIEWS
                //
                //
                window.updateEnrichConfigViewWithExpressionsAndDates = (viewName/*:string*/) => {
                    viewsSync.selectedName = viewName
                    console.log(hl,"updateEnrichConfigViewWithExpressionsAndDates", viewsSync.selectedName, viewsSync)
                    updateSelectActiveOption(viewName)
                    getViewsCache(
                        views => {
                            const finalExpressionObj = {}
                            const views2 = [...defaultViews, ...views]
                            const view = views2.find(v => v.name === viewName)
                            if (view) {
                                workspace.ctag.setConfig(view.config)
                                workspace.ctag.lastConfigName = view.name
                            }
                        }
                    )
                }
                













                ////////////////////////////////////////////////////////
                //
                // PLOTLY PANEL EXTERNAL
                //
                //

                configOpenPlotly.addEventListener("click", () => {
                    // const testData = "city,name, age, profession\n london, john, 23, engineer\nparis, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78, teacher\nparis, julie, 89, engineer\nlondon, jules, 90, doctor\nberlin, jill, 12, teacher\nparis, john, 23, engineer\nlondon, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78, teacher\nparis, julie, 89, engineer\nlondon, jules, 90, doctor\nberlin, jill, 12, teacher\nparis, john, 23, engineer\nlondon, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78, teacher\nparis, julie, 89, engineer\nlondon, jules, 90, doctor\nberlin, jill, 12, teacher\nparis, john, 23, engineer\nlondon, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78, teacher\nparis, julie, 89, engineer\nlondon, jules, 90, doctor\nberlin, jill, 12, teacher\nparis, john, 23, engineer\nlondon, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78, teacher\nparis, julie, 89, engineer\nlondon, jules, 90, doctor\nberlin, jill, 12, teacher\nparis, john, 23, engineer\nlondon, jane, 34, doctor\nberlin, jack, 45, teacher\n paris, jacques, 56, engineer\nlondon, jill, 67, doctor\nberlin, jules, 78,"
                    // graphPerspectiveLib.openPlotlyWindow(api, )

                    workspace.exportToCsvString((csvStr) => {
                        console.log(hl,"csvStr", csvStr)
                        // api.call("popup.show", [csvStr, "CSV Data"])
                        const idWindow = `plotly-window-graph-perspective-${api.utils.getInfos().file.path}`
                        graphPerspectiveLib.openPlotlyWindow(api, csvStr, idWindow)
                    })
                });

















                // if toggle panel, toggle the config panel
                configtogglePanel.addEventListener("click", () => {
                    
                    // config-wrapper hide/show
                    const configWrapper = document.querySelector(".config-wrapper")
                    if (configWrapper.style.display === "none") {
                        workspace.toggleConfig(true)
                        configWrapper.style.display = "block"
                        // hide #upload-file-name2
                        document.getElementById("upload-file-name2").style.display = "none"
                    }
                    else { 
                        configWrapper.style.display = "none"
                        workspace.toggleConfig(false)
                        // show #upload-file-name2
                        document.getElementById("upload-file-name2").style.display = "block"
                    }
                });
                

                // HELP
                editConfig.addEventListener("click", () => {
                    openCacheFileEditor(workspace.ctag.lastConfigName)
                })
                configHelp.addEventListener("click", () => {
                    console.log(hl,"help")
                    api.call("popup.show", [helpStr, "Graph Perspective Help"])
                });
                
                











                

                ////////////////
                // FILE UPLOAD
                //
                const uploadFileName = {current: null}
                // detect file upload
                fileUpload.addEventListener("change", (e) => {
                    // console.log(123,e.target.files)
                    uploadFileName.current = e.target.files[0].name
                    // uploadFileDiv = document.getElementById("upload-file-name1")
                    // uploadFileDiv.innerHTML = `Source file: ${uploadFileName.current}`
                    // uploadFileDiv2 = document.getElementById("upload-file-name2")
                    // uploadFileDiv2.innerHTML = `Source file: ${uploadFileName.current}`
                    uploadFile(e.target.files[0]);
                    console.log("FILE UPLOADED >> ",e.target.files.length, api.utils.getInfos(), api)
                    // remove file
                    e.target.value = ""
                })
                
                // upload file
                function uploadFile(file) {
                    let reader = new FileReader();
                    reader.onload =  async (fileLoadedEvent) => {
                        console.log(hl,"file loaded", fileLoadedEvent)
                        let data = fileLoadedEvent.target.result;
                        // console.log(123333, data)
                        // count the number of ; and ,
                        let countSemiCols = (data.match(/;/g) || []).length
                        let countCommas = (data.match(/,/g) || []).length
                        // if more ; than , replace ; by ,
                        if (countSemiCols > countCommas) {
                            console.log(hl,"DETECTED SEMICOL CSV => replacing ; by ,")
                            // replace first , by .
                            data = data.replace(/,/g, ".")
                            data = data.replace(/;/g, ",")
                        }

                        workspace.ctag.addTable(file.name, data, true)

                    };
                    // Read the contents of the file - triggering the onload when finished.
                    if (file.name.endsWith(".feather") || file.name.endsWith(".arrow")) {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                }

                ////////////////
                // CALLBACK TO MAIN

                window._graph_perspective_props.cb(workspace)
            });
        }

        // <link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective_viewer_bg.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/superstore-arrow/superstore.arrow" as="fetch" type="arraybuffer" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/editor.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/editor.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective_viewer_bg.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
        
        // // <button id="perspective-config-refresh"> 🔄 </button>
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
        wrapperEl.innerHTML = `
            <link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@finos/perspective-workspace/dist/css/pro.css" /> 
            <div class="settings-wrapper">
                <button id="perspective-config-toggle"> ⚙️ </button>
               
                <div class="config-wrapper">
                    📊 View: <select id="perspective-config-select"> </select> 
                    <div id="views-buttons-wrapper"> </div>
                    <button id="perspective-config-save"> 💾 </button>
                    <button id="perspective-config-delete"> ❌ </button>
                    <button id="perspective-config-edit"> 📝 </button>
                    
                    <button id="perspective-send-to-plotly"> 📊 more </button>
                    <button id="perspective-config-help"> ? </button>
                    <div class="upload-wrapper">
                        <label for="perspective-config-file-upload" class="btn">📁 Data: select file</label>
                        <input id="perspective-config-file-upload" style="visibility:hidden;" multiple type="file">
                    </div>
                </div>
            </div>
            <perspective-workspace id='workspace' ></perspective-workspace>
                <style>
                .p-Menu {
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                #ctag-component-advanced-table-wrapper {
                    width: calc(100% - 15px);

                    height: calc(100% - 1px);
                    display: flex;
                    flex-direction: column;
                }

                .settingsss-wrapper:hover #perspective-config-toggle {
                    opacity: 0.1
                }
                #perspective-config-toggle:hover {
                    opacity: 1;
                }
                #perspective-config-toggle {
                    position: absolute;
                    opacity: 0.1;
                    top: 7px;
                    left: 8px;
                    cursor: pointer;
                    z-index: 10;
                }

            
                .settings-wrapper {
                    // display: flex;
                    margin-left: 30px;
                    padding: 5px 20px;
                    font-size: 10px;
                }
                

                .settings-wrapper select, .settings-wrapper button {
                    font-size: 10px;
                }
                .settings-wrapper .config-wrapper {
                    position:relative;
                }
                .settings-wrapper #views-buttons-wrapper {
                    display: inline-block;
                }
                .settings-wrapper .config-wrapper .upload-wrapper {
                    // margin-top: 5px;
                    cursor: pointer;
                    display: inline;
                    margin-left: 20px;
                }

                .upload-file-name {
                    font-size: 11px;
                    color: grey;
                    border-radius: 4px;
                    background: white;
                    padding: 5px;
                    margin-left: 8px;
                }
                #upload-file-name2 {
                    display: none;
                }
                .config-wrapper #upload-file-name1 {
                    position: absolute;
                    bottom:-39px;
                    left: -30px;
                    z-index: 1000;
                }
                #upload-file-name1:hover {
                    // opacity:0.00001;
                }

                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 200px;
                    text-align: center;
                    width: 100%;

                }

                perspective-viewer {
                    width: 100%;
                    // height: 100%;
                } 
                </style>
        `
    } 
    api.utils.loadRessources(
        [
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective@3.1.0/dist/cdn/perspective.js`, type:"module", fileName:"perspective.worker.js"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.1.0/dist/cdn/perspective-viewer.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.1.0/dist/cdn/perspective-viewer-datagrid.js`, type:"module"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.1.0/dist/cdn/perspective-viewer-datagrid.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.1.0/dist/cdn/perspective-viewer-d3fc.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.1.0/dist/cdn/perspective-viewer-d3fc.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-openlayers/dist/cdn/perspective-viewer-openlayers.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-workspace@3.0.0/dist/cdn/perspective-workspace.js`, type:"module"},

            `https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css`,
            `${p.parentVars.opts.plugins_root_url}/_common/components/graph_perspective/graph_perspective.lib.js`,
            
            // `https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm`,
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective_viewer_bg.wasm`, fileName:"perspective_bg.wasm"},

            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.worker.js`, type:"module"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/editor.worker.js`, type:"module"},
        ],
        () => {
            startMainLogic()
        }
    );
    
    return `<div id="ctag-component-advanced-table-wrapper"> <div class="loading">loading...</div>  </div>` 
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.genGraphPerspectiveComponent = genGraphPerspectiveComponent
