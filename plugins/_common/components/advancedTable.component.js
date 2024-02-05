//@flow
// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html


/*::
export type iAdvancedTableParams = {
    items: Array<any>,
    cb: (viewer: any) => void
}
*/


let genAdvancedTableComponent = (p/*:iAdvancedTableParams*/) => {
    const api = window.api;
    const startMainLogic = () => {
        console.log("hello world advanced table")
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

        window._advancedTableParams = p
        
        // Load module scripts
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@latest/dist/cdn/perspective-viewer.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@latest/dist/cdn/perspective-viewer-datagrid.js');
        loadModuleScript('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@latest/dist/cdn/perspective-viewer-d3fc.js');
        
        // Load stylesheets
        loadStylesheet('https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css');

        var script = document.createElement('script');

        // Set the type to 'module'
        script.type = 'module';

        // Use innerText or textContent property to insert your module script
        // script.textContent = `
        //     import { worker } from "https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js";
        //     const WORKER = worker();
        //     // const REQ = fetch("https://cdn.jsdelivr.net/npm/superstore-arrow/superstore.arrow");

        //     async function load() {
        //         // const resp = await REQ;
        //         // const arrow = await resp.arrayBuffer();
        //         const viewer = document.getElementsByTagName("perspective-viewer")[0];
        //         // console.log(222222222221,viewer)
        //         const table = WORKER.table(arrow);
        //         // console.log(22222222222, table)
        //         viewer.load(table);
        //         viewer.toggleConfig();
        //         window.window._advancedTableParams.cb(viewer)
        //     }

        //     load();
        // `;
        script.textContent = `
            import { worker } from "https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js";
            const WORKER = worker();
            async function load() {
                const viewer = document.getElementsByTagName("perspective-viewer")[0];
                console.log("[ADVANCED TABLE] loading viewer for :", window.window._advancedTableParams)
                const table = WORKER.table(window.window._advancedTableParams.items);
                viewer.load(table);
                viewer.toggleConfig();
                window.window._advancedTableParams.cb(viewer)
            }

            load();
        `;

        // Append the script element to the head or body of the document
        setTimeout(() => {
            document.head.appendChild(script);
        },1000)

        // <script type="module" src="https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js"></script>
        // <script type="module" src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@latest/dist/cdn/perspective-viewer.js"></script>
        // <script type="module" src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@latest/dist/cdn/perspective-viewer-datagrid.js"></script>
        // <script type="module" src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@latest/dist/cdn/perspective-viewer-d3fc.js"></script>
        // <div id="ctag-table-inner"> [...] </div>
        wrapperEl.innerHTML = `
            <link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.cpp.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective_viewer_bg.wasm" as="fetch" type="application/wasm" crossorigin="anonymous" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/superstore-arrow/superstore.arrow" as="fetch" type="arraybuffer" crossorigin="anonymous" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/editor.worker.js" as="fetch" type="application/javascript" crossorigin="anonymous" />
            
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
            `https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css`,
        ],
        () => {
            startMainLogic()
        }
    );
    
    return `<div id="ctag-component-advanced-table-wrapper"> loading...  </div>` 
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.genAdvancedTableComponent = genAdvancedTableComponent
