//@flow
// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


/*::
export type iGraphPerspectiveParams = {
    items: Array<any>,
    cb: (viewer: iGraphPerspectiveViewerWrapper) => void
}
export type iGraphPerspectiveViewerWrapper = {
    loadItems: (items: any[]) => void,
    setConfig: (config: string) => void,
    getConfig: (cb:(config:string)=>void) => void,


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
*/


let genGraphPerspectiveComponent = (p/*:iGraphPerspective*/) => {
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

        window._graph_perspective = p
        
        // Load module scripts
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@latest/dist/cdn/perspective-viewer.js');
        // loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@latest/dist/cdn/perspective-viewer-datagrid.js');
        // loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@latest/dist/cdn/perspective-viewer-d3fc.js');
        
        // Load stylesheets
        // loadStylesheet('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css');

        var script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { worker } from "https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js";
            const WORKER = worker();
            async function load() {
                const viewer = document.getElementsByTagName("perspective-viewer")[0];
                console.log("[ADVANCED TABLE] loading viewer for :", window.window._graph_perspective)
                // const table = WORKER.table(window.window._graph_perspective.items);
                // viewer.load(table);
                // viewer.toggleConfig();

                viewer.loadItems = (items) => {
                    const table = WORKER.table(items);
                    viewer.load(table);
                    viewer.toggleConfig();
                }
                viewer.setConfig = (configString) => {
                    const configObj = JSON.parse(configString);
                    viewer.restore(configObj);
                }
                viewer.getConfig = (cb) => {
                    viewer.save().then((config) => {cb(JSON.stringify(config))})
                }
                viewer.loadItems(window.window._graph_perspective.items);
                window.window._graph_perspective.cb(viewer)
            }
            load();
        `;

        // Append the script element to the head or body of the document
        setTimeout(() => {
            document.head.appendChild(script);
        },1000)

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
            <perspective-viewer editable style="width: calc(100vw - 30px);height: 100vh;"> </perspective-viewer>
                <style>
                perspective-viewer {
                    width: 100vw;
                    height: 100vh;
                } 
                </style>
        `
    } 
    api.utils.loadRessources(
        [
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js`, type:"module", fileName:"perspective.worker.js"},
            // {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@latest/dist/cdn/perspective-viewer.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@latest/dist/cdn/perspective-viewer-datagrid.js`, type:"module"},
            {url:`https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@latest/dist/cdn/perspective-viewer-d3fc.js`, type:"module"},

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
