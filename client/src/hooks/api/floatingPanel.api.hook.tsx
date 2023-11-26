import React, { useEffect } from "react"
import { iFile, iNotification, iPlugin, iViewType } from "../../../../shared/types.shared"
import { useBackendState } from "../useBackendState.hook"
import { generateEmptyiFile } from "../app/useLightbox.hook"
import { cloneDeep } from "lodash"
import { iCtagGenConfig } from "../../managers/ssr/ctag.ssr"
import { iNotePreviewType } from "../../components/NotePreview.component"
import { getUrlTokenParam } from "../app/loginToken.hook"
import { deviceType } from "../../managers/device.manager"

const h = `[FLOATING PANELS]`

export interface iFloatingPanel {
    position: {x: number, y: number},
    size: {width: number, height: number},
    status: "hidden" | "visible" | "minimized",
    file: iFile,
    type: "ctag" | "file",	
    view?: iViewType,
    orderPosition?: number,
    ctagConfig?: iCtagGenConfig,
    id: string,
    zIndex?: number,
}

// create new interface iCreateFloatingPanel that extends iFloatingPanel with everything optional except type 
export interface iCreateFloatingPanel extends Partial<iFloatingPanel> {
    type: "ctag" | "file",
    layout?: "full-center" ,

}

export interface iFloatingPanelApi {
	create: (panel:iCreateFloatingPanel) => void,
    delete: (panelId:string) => void,
    // getPanels: iFloatingPanel[],
    panels: iFloatingPanel[],

    update: (panel:iFloatingPanel) => void,
    movePanel: (panelId:string, position:{x:number, y:number}) => void,
    resizePanel: (panelId:string, size:{width:number, height:number}) => void,
    
    
    updateAll: (panels:iFloatingPanel[]) => void,
    actionAll: (action:"hide"|"show"|"organizeWindows") => void,

    refreshFromBackend: Function,
    pushWindowOnTop: (panelId:string) => void,

    movePositioninArray: (panelId:string, direction:"up"|"down"|"first"|"last") => void,
    updateOrderPosition: (panelId:string, orderPosition:number|"last"|"first") => void,

}

let startingZindex = 1000
let offset = 20
const initialLoad = {value: true}

// create a new panel object that is added and take all props from panelParams if they exists, otherwise use the default values
export const useFloatingPanelApi = (p: {}): iFloatingPanelApi => {
    const [panels, setPanelsInt, refreshFromBackend] = useBackendState<iFloatingPanel[]>('floatingPanelsConfig',[])

    // const [panelsMobile, setPanelsMobileInt, refreshFromBackend2] = useBackendState<iFloatingPanel[]>('floatingPanelsMobileConfig',[])
    const [panelsDesktop, setPanelsDesktopInt, refreshFromBackend3] = useBackendState<iFloatingPanel[]>('floatingPanelsDesktopConfig',[])

    const panelsRef = React.useRef<iFloatingPanel[]>([])
    // const [forceFloatingPanelsUpdate, setForceFloatingPanelsUpdate] = React.useState(0) 

    // update the ref when the panels change only the first time panels loaded
    useEffect(() => {
        if (panelsRef.current.length > 0) return
        panelsRef.current = panels
    },[panels])

    const setPanels = (npans:iFloatingPanel[]) => {
        panelsRef.current = npans
        setPanelsInt(npans)
        if (deviceType() !== 'mobile')  {setPanelsDesktopInt(panels)} //setPanelsMobileInt(panels)
    }
    
    useEffect(() => {
        refreshFromBackend()
        refreshFromBackend3()
    },[])

    useEffect(() => {
        if (!initialLoad.value) return
        if (deviceType() === 'mobile' )  {
            setPanels([])
            initialLoad.value = false
        } else if (deviceType() !== 'mobile' && panelsDesktop.length > 0) { 
            setPanels(cloneDeep(panelsDesktop))    
            initialLoad.value = false
        }
    },[panels, panelsDesktop])


    const createPanel = (panelParams:iCreateFloatingPanel) => {
        // if layout is full-center, set position to center of the screen and size to 100% of the screen with 20px padding
        if (panelParams.layout === "full-center") {
            let padding = 20
            panelParams.position = {x: padding, y: padding}
            panelParams.size = {width: window.innerWidth - (2*padding), height: window.innerHeight - (2*padding)}
        }
       
        
        // get all non hidden pannels
        let nonHiddenPanels = panelsRef.current.filter(p => !p.status.includes("hidden"))
        // position is i * nonHiddenPanels.length
        const panel:iFloatingPanel = {
            position: {x: 100 + (nonHiddenPanels.length * offset), y: 100 + (nonHiddenPanels.length * offset)},
            size: {width: 300, height: 300},
            status: "visible",
            file: generateEmptyiFile(),
            view: "editor",
            id: Math.random().toString(36).substring(7),
            zIndex: startingZindex,
            orderPosition: nonHiddenPanels.length,
            ...panelParams,
        }
        setPanels([panel,...panelsRef.current])
        updateOrderPosition(panel.id, "first")
        pushWindowOnTop(panel.id)
    }

    const updatePanel = (panel:iFloatingPanel) => { 
        const nPanels = panelsRef.current.map(p => p.id === panel.id ? panel : p)
        setPanels(nPanels)
    }

    const deletePanel = (panelId:string) => {
        console.log(`${h} deletePanel`, panelId)
        let nPanels = panelsRef.current.filter(p => p.id !== panelId)
        setPanels(nPanels)
    }

    const pushWindowOnTop = (panelId:string) => {
        // get higher zIndex of all panels
        const highestZIndex = Math.max(...panelsRef.current.map(p => p.zIndex || 0))
        let panelIndex = panelsRef.current.findIndex(p => p.id === panelId)
        if (panelIndex === -1) return
        let npanel = cloneDeep(panelsRef.current)[panelIndex]
        npanel.zIndex = highestZIndex + 1
        updatePanel({...panelsRef.current[panelIndex]!, zIndex: highestZIndex + 1})
    }

    
    const updateAll = (panels:iFloatingPanel[]) => {
        setPanels(cloneDeep(panels))
    }

    const movePanel = (panelId:string, position:{x:number, y:number}) => {
        updatePanel({...panelsRef.current.find(p => p.id === panelId)!, position})
    }

    const resizePanel = (panelId:string, size:{width:number, height:number}) => {
        updatePanel({...panelsRef.current.find(p => p.id === panelId)!, size})
    }

    const reorganizeAll = () => {
        console.log(`${h} reorganizeAll`)
        let newPanels = cloneDeep(panelsRef.current)
        
        let j = 0
        newPanels.forEach((panel) => {
            if (panel.status !== "visible") return
            panel.zIndex = startingZindex + j
            panel.position = {x: 100 + (j * offset), y: 100 + (j * offset)}
            panel.size = {width: 320, height: 200}
            // if i > 0, position should offset half of the previous panel size
            // if (j > 0) {
            //     panel.position = {x: 100 + (j * offset) , y: 100 + (j * offset) - (newPanels[j].size.height )}
            // }   
            j++


        })
        updateAll(newPanels)
    }

    // function updateOrderPosition that just update the prop.orderPosition of the panel, first should be the first position of all panels, last should be the last position of all panels
    const updateOrderPosition = (panelId:String, orderPosition:number|"last"|"first") => {
        let panel = cloneDeep(panelsRef.current.find(p => p.id === panelId))
        if (!panel) return
        if (orderPosition === "last") {
            // find the highest orderPosition
            let highestOrderPosition = Math.max(...panelsRef.current.map(p => p.orderPosition || 0))
            orderPosition = highestOrderPosition + 1
        }
        if (orderPosition === "first") {
            // find the lowest orderPosition
            let lowestOrderPosition = Math.min(...panelsRef.current.map(p => p.orderPosition || 0))
            orderPosition = lowestOrderPosition - 1
        }
        panel.orderPosition = orderPosition
        updatePanel(panel)
    }

    const movePanelPositioninArray = (panelId:string, direction:"up"|"down"|"first"|"last") => {
        let newPanels = cloneDeep(panelsRef.current)
        let panelIndex = newPanels.findIndex(p => p.id === panelId)
        if (panelIndex === -1) return
        let panel = newPanels.splice(panelIndex, 1)[0]
        if (direction === "up") newPanels.splice(panelIndex - 1, 0, panel)
        else if (direction === "down") newPanels.splice(panelIndex + 1, 0, panel)
        else if (direction === "first") newPanels.splice(0, 0, panel)
        else if (direction === "last") newPanels.push(panel)
        updateAll(newPanels)
    }


    // const displayAll = (action:"hide"|"show") => {
    //     let newPanels = cloneDeep(panelsRef.current)
    //     newPanels.forEach((panel) => {
    //         panel.hidden = action === "hide" ? true : false
    //     })
    //     updateAll(newPanels)
    // }

    const actionAll = (action:"hide"|"show"|"organizeWindows") => {
        // reorg
        if (action === "organizeWindows") return reorganizeAll()

        // hide/show
        let newPanels = cloneDeep(panelsRef.current)
        newPanels.forEach((panel) => {
            panel.status = action === "hide" ? "visible" : "minimized"
        })
        updateAll(newPanels)
    }

    const api: iFloatingPanelApi = {
        create: createPanel,
        update: updatePanel,
        updateAll,
        delete: deletePanel,
        movePanel,
        resizePanel,
        actionAll,
        panels, 
        refreshFromBackend,
        pushWindowOnTop,
        movePositioninArray: movePanelPositioninArray,
        updateOrderPosition
    }
    
    return api
}
