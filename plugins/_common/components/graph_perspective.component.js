//@flow
// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


/*::
export type iGraphPerspectiveParams = {
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
</p>
`

let genGraphPerspectiveComponent = (p/*:iGraphPerspective*/) => {
    let hl = "[GRAPH PERSPECTIVE LIB]"
    const api = window.api;
    const startMainLogic = () => {
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
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective@2.7.1/dist/cdn/perspective.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.7.1/dist/cdn/perspective-viewer.js');
        // loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@2.7.1/dist/cdn/perspective-viewer-datagrid.js');
        // loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@2.7.1/dist/cdn/perspective-viewer-d3fc.js');
        
        // Load stylesheets
        // loadStylesheet('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css');

        // const WORKER = worker({
        //     types: {
        //         float: {
        //             format: {
        //                 style: "decimal",
        //                 minimumFractionDigits: 6,
        //                 maximumFractionDigits: 6
        //             }
        //         }
        //     }
        // });

        var script = document.createElement('script');
        script.type = 'module';
  
        script.textContent = `
            import { worker } from "https://cdn.jsdelivr.net/npm/@finos/perspective@2.7.1/dist/cdn/perspective.js";
            const WORKER = worker();
            
            async function initPerspective(cb) {
                const viewer = document.getElementsByTagName("perspective-viewer")[0];
                console.log("${hl} loading viewer for :", window._graph_perspective_props)
                cb(viewer, WORKER)
            }
            window._initPerspective = initPerspective
        `;

        // Append the script element to the head or body of the document
        setTimeout(() => {
            document.head.appendChild(script);
            
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
            window._initPerspective((viewer/*:iGraphPerspectiveViewerWrapper*/, WORKER/*:any*/) => {
                let initLoaded = false;
                //
                // VIEWER OBJ EXTENSION
                //
                viewer.loadItems = (items, cb) => {
                    let int = setInterval(() => {
                        console.log(hl,"waiting for viewer and worker...")
                        if (!viewer) return
                        if (!WORKER) return
                        clearInterval(int)
                        startLoading()
                    }, 200)
                    const tableAndViewerExists = () => viewer && WORKER
                    const startLoading = async () => {
                        const table = WORKER.table(items);

                        try {
                            if (!initLoaded) {
                                initLoaded = true;
                                viewer.load(table);
                                viewer.toggleConfig();
                                if (cb) cb()
                            } else {
                                    
                                    viewer.flush().then(() => {
                                        viewer.removeAttribute('view');
                                        viewer.removeAttribute('columns');
                                        viewer.removeAttribute('row-pivots');
                                        viewer.removeAttribute('column-pivots');
                                        viewer.removeAttribute('aggregates');
                                        viewer.removeAttribute('sort');
                                        viewer.removeAttribute('filters');
            
                                        viewer.load(table);
                                        viewer.toggleConfig();
                                        if (cb) cb()
                                    })
                            }
                        } catch (error) {
                            // alert("Error setting config", JSON.stringify(error))
                            console.log(hl, "Error loading 1", error)
                        }
                        
                    }
                }
                viewer.loadFileUrl = (fileUrl/*:string*/, cb) => {
                }
                viewer.updateTitle = (newTitle/*:string*/) => {
                }



                function weekOfYear(day, month, year) {
                    let date = new Date(year, month - 1, day);
                    let startDate = new Date(date.getFullYear(), 0, 1);
                    let days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000)) + ((startDate.getDay() + 6) % 7);
                    return Math.ceil(days / 7) + 1;
                }
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
                viewer.setConfig = (configString) => {
                    if (!initLoaded) return
                try {
                        configString = enrichViewConfigStr(configString)
                        const configObj = JSON.parse(configString);
                        viewer.restore(configObj).then(
                            (res) => { 
                            },(res) => { 
                                api.call("ui.notification.emit",[{id:"notif-id-graph-perspective",content:`<h3>Error setting config</h3>  answer: "${JSON.stringify(res)}" for config: <br><br><code>${configString}</code>`, options:{hideAfter: 120}}])    
                            }
                        );
                    } catch (error) {
                        // alert("Error setting config", JSON.stringify(error))
                        // ddd
                        
                        console.warn(hl, "Error setting config", error)
                    }
                }
                viewer.getConfig = (cb) => {
                    viewer.save().then((config) => {cb(JSON.stringify(config))})
                }
                viewer.loadItems(window._graph_perspective_props.items);















                // get all the buttons
                const configSelect = document.getElementById("perspective-config-select");
                const configSave = document.getElementById("perspective-config-save");
                const configHelp = document.getElementById("perspective-config-help");
                const configDelete = document.getElementById("perspective-config-delete");
                const fileUpload = document.getElementById("perspective-config-file-upload");

                // add event listeners
                configSelect.addEventListener("change", (e) => {
                    viewer.restore(e.target.value);
                });
                
                ////////////////////////////////////////////////////////////////////////////////////
				// CACHING SETTINGS & CONTENT SYSTEM
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
					api.call("cache.set", [id, views, -1], () => {if(cb) cb()}) 
				}
				const cacheViewsId = `lib-graph-perspective-${api.utils.getInfos().file.path}`

                // window._graph_perspective_props
				const getViewsCache = getCache(cacheViewsId)
				const setViewsCache = setCache(cacheViewsId)
                
                ////////////////
                // CONFIG 
                //
                const saveNewView = (view/*:iView*/, cb/*:Function*/) => {
                    getViewsCache(
                        views => {
                            // if name already exists, overwrite it
                            const foundIdx = views.findIndex(v => v.name === view.name)
                            if (foundIdx !== -1) views[foundIdx] = view
                            else views.push(view)
                            
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
                                viewer.setConfig(viewsSync.selectedName)
                            }
                            if (cb) cb(views)
                        },
                        () => {
                            configSelect.innerHTML = ""
                            if (cb) cb([])
                        }
                    )   
                }
                viewer.reloadViewsSelect = reloadViewsSelect
                viewer.saveNewView = saveNewView
                viewer.deleteView = deleteView


                // if config save, prompt for a name and save it
                configSave.addEventListener("click", () => {
                    viewer.getConfig((config) => {
                        let name = prompt("Enter a name for the config", viewsSync.selectedName);
                        if (name) {
                            console.log(hl,"saving config", name, config)
                            viewsSync.selectedName = name
                            saveNewView({name, config}, () => {
                                reloadViewsSelect()
                            })
                        }
                    });
                });
                
                // HELP
                configHelp.addEventListener("click", () => {
                    console.log(hl,"help")
                    api.call("popup.show", [helpStr, "Graph Perspective Help"])
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


                window.updateConfigViewFromName = (viewName/*:string*/) => {
                    viewsSync.selectedName = viewName
                    console.log(hl,"updateConfigViewFromName", viewsSync.selectedName, viewsSync)
                    updateSelectActiveOption(viewName)
                    getViewsCache(
                        views => {
                            const finalExpressionObj = {}
                            const views2 = [...defaultViews, ...views]
                            views2.forEach(v => {
                                v.config = enrichViewConfigStr(v.config)
                                v.obj = JSON.parse(v.config)
                                // for each v.obj.expressions method, add it to finalExpressionObj
                                if (v.obj.expressions) {
                                    Object.keys(v.obj.expressions).forEach(k => {
                                        finalExpressionObj[k] = v.obj.expressions[k]
                                    })
                                }
                            })
                            // replace each views2.obj.expressions with finalExpressionObj
                            // views2.forEach(v => {
                            //     v.obj.expressions = finalExpressionObj
                            //     v.config = JSON.stringify(v.obj)
                            // })
                            // views2
                            // console.log("ALL VIEWS", views, views2)
                            const view = views2.find(v => v.name === viewName)
                            if (view) {
                                // if view exists, parse it
                                view.obj = JSON.parse(view.config)

                                // if view starts with something_ take that 
                                const hasViewCat = viewName.split("-").length > 1
                                const viewCatName = viewName.split("-")[0]
                                if (hasViewCat) {
                                    // loop inside finalExpressionObj for keys starting with viewCatName
                                    const keys = Object.keys(finalExpressionObj).filter(k => k.startsWith(viewCatName + "-"))
                                    // for each key, add it to view.obj.expressions
                                    keys.forEach(k => {
                                        view.obj.expressions[k] = finalExpressionObj[k]
                                    })
                                }

                                // stringify it
                                view.config = JSON.stringify(view.obj)
                            }
                            if (view) viewer.setConfig(view.config)
                        }
                    )
                }
                // on select change, restore the view
                configSelect.addEventListener("change", (e) => {
                    const viewName = e.target.value
                    window.updateConfigViewFromName(viewName)
                })
                const genViewsButtons = (views/*:iView[]*/) => {
                    // add buttons for each view in #views-buttons-wrapper
                    const viewsButtonsWrapper = document.getElementById("views-buttons-wrapper")
                    viewsButtonsWrapper.innerHTML = views.map(v => `<button class="btn" onclick="window.updateConfigViewFromName('${v.name}')">${v.name}</button>`).join("")
                }


                ////////////////
                // FILE UPLOAD
                //
                const uploadFileName = {current: null}
                // detect file upload
                fileUpload.addEventListener("change", (e) => {
                    // console.log(123,e.target.files)
                    uploadFileName.current = e.target.files[0].name
                    uploadFileDiv = document.getElementById("upload-file-name")
                    uploadFileDiv.innerHTML = `Source file: ${uploadFileName.current}`

                    uploadFile(e.target.files[0]);
                })
                
                // upload file
                function uploadFile(file) {
                    let reader = new FileReader();
                    reader.onload = function (fileLoadedEvent) {
                        let data = fileLoadedEvent.target.result;
                        viewer.load(WORKER.table(data));
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

                window._graph_perspective_props.cb(viewer)
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
        
        
        // <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
        wrapperEl.innerHTML = `
            
            <div class="settings-wrapper">
                <div class="config-wrapper">
                    📊 View: <select id="perspective-config-select"> </select> 
                    <div id="views-buttons-wrapper"> </div>
                    <button id="perspective-config-save"> 💾 </button>
                    <button id="perspective-config-delete"> ❌ </button>
                    <button id="perspective-config-help"> ? </button>
                    <div class="upload-wrapper">
                        <label for="perspective-config-file-upload" class="btn">📁 Data: select file</label>
                        <input id="perspective-config-file-upload" style="visibility:hidden;" type="file">
                    </div>
                    <div id="upload-file-name"></div>	
                </div>
            </div>
            <perspective-viewer editable style="width: calc(100%);height: 100%;"> </perspective-viewer>
                <style>
                #ctag-component-advanced-table-wrapper {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

               
               


                .settings-wrapper {
                    // display: flex;
                    padding: 0px 20px;
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
                    display: inline-block;
                    margin-left: 20px;
                }


                .config-wrapper #upload-file-name {
                    background: white;
                    position: absolute;
                    bottom:-39px;
                    left: 0px;
                    z-index: 1000;
                    margin-left: 8px;
                    padding: 5px;
                    font-size: 11px;
                    color: grey;
                    border-radius: 4px;
                }
                #upload-file-name:hover {
                    opacity:0.00001;
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
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective@2.7.1/dist/cdn/perspective.js`, type:"module", fileName:"perspective.worker.js"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@2.7.1/dist/cdn/perspective-viewer.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@2.7.1/dist/cdn/perspective-viewer-datagrid.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@2.7.1/dist/cdn/perspective-viewer-d3fc.js`, type:"module"},

            `https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css`,
            
            // `https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm`,
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective_viewer_bg.wasm`, fileName:"perspective_bg.wasm"},

            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.worker.js`, type:"module"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/editor.worker.js`, type:"module"},
        ],
        () => {
            startMainLogic()
        }
    );
    
    return `<div id="ctag-component-advanced-table-wrapper"> loading...  </div>` 
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.genGraphPerspectiveComponent = genGraphPerspectiveComponent
