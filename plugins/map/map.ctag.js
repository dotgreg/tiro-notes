//@flow
/*::
declare var api: any;
declare var autoComplete: any;
import type {iGraphPerspectiveParams, iGraphPerspectiveViewerWrapper} from "../_common/components/graph_perspective.component"
import type {iCommonLib} from "../_common/common.lib"
*/

const h = "[MAP CTAG]"

const mapCtag = (innerTagStr/*:string*/, opts/*:Object*/) => {
        // let api = window.api
        const { div, updateContent } = api.utils.createDiv()
        
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const initMapAppCode = () => {
                const commonLib/*:iCommonLib*/ = window._tiroPluginsCommon.commonLib
                const {getOperatingSystem, each, onClick} = commonLib
                
        } // end start main logic
    
        setTimeout(() => {
            setTimeout(() => {
                    api.utils.resizeIframe("100%");
            }, 100)
            setTimeout(() => {
                api.utils.loadRessources(
                    [
                        `${opts.plugins_root_url}/_common/common.lib.js`,
                    ],
                    () => {
                        initMapAppCode()
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
        <div id="map-ctag"> 
                hello world map
        </div>

        <style>
        #map-ctag {
                height: calc(100vh - 30px);
                background: white;
        } 
        </style> `
}
// 

window.initCustomTag = mapCtag

