import React, { useEffect, useState } from "react"
import { iFile, iNotification, iPlugin, iViewType } from "../../../../shared/types.shared"
import { useBackendState } from "../useBackendState.hook"
import { generateEmptyiFile } from "../app/useLightbox.hook"
import { cloneDeep } from "lodash"
import { iCtagGenConfig } from "../../managers/ssr/ctag.ssr"
import { iNotePreviewType } from "../../components/NotePreview.component"
import { getUrlTokenParam } from "../app/loginToken.hook"
import { deviceType } from "../../managers/device.manager"
import { useDebounce } from "../lodash.hooks"

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
    layout?: "full-center" | "half-right" | "half-left" | "full-bottom" | "full-top"  ,

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

// create a new panel object that is added and take all props from panelParams if they exists, otherwise use the default values
export const useFloatingPanelApi = (p: {}): iFloatingPanelApi => {
    const [panelsDesktop, setPanelsDesktop, refreshFromBackend] = useBackendState<iFloatingPanel[]>('floatingPanelsDesktopConfig',[], {history: true})
    const [panels, setPanelsInt] = useState<iFloatingPanel[]>([])
    const panelsRef = React.useRef<iFloatingPanel[]>([])

    const setPanels = (npans:iFloatingPanel[]) => {
        panelsRef.current = npans
        setPanelsInt(npans)
        if (deviceType() !== 'mobile') setPanelsDesktop(npans)
    }

    const startupIrrigationFromBackend = React.useRef<boolean>(true)
    useEffect(() => {
        refreshFromBackend()
    },[])
    
    useEffect(() => {
        if (!startupIrrigationFromBackend.current) return
        if (panelsDesktop.length > 0) startupIrrigationFromBackend.current = false
        if (deviceType() !== 'mobile') setPanelsInt(panelsDesktop)
        panelsRef.current = panelsDesktop
    },[panelsDesktop])


    const createPanel = (panelParams:iCreateFloatingPanel) => {
        // if layout is full-center, set position to center of the screen and size to 100% of the screen with 20px padding
        let padding = 20
        if (panelParams.layout === "full-center") {
            panelParams.position = {x: padding, y: padding}
            panelParams.size = {width: window.innerWidth - (2*padding), height: window.innerHeight - (2*padding)}
        }
        else if (panelParams.layout === "half-right") {
            panelParams.position = {x: window.innerWidth / 2, y: padding}
            panelParams.size = {width: window.innerWidth / 2 - (2*padding), height: window.innerHeight - (2*padding)}
        }
        else if (panelParams.layout === "half-left") {
            panelParams.position = {x: padding, y: padding}
            panelParams.size = {width: window.innerWidth / 2 - (2*padding), height: window.innerHeight - (2*padding)}
        }
        else if (panelParams.layout === "full-bottom") {
            panelParams.position = {x: padding, y: window.innerHeight / 2}
            panelParams.size = {width: window.innerWidth - (2*padding), height: window.innerHeight / 2 - (2*padding)}
        }
        
        // get all non hidden pannels
        let nonHiddenPanels = panelsRef.current.filter(p => !p.status.includes("hidden"))
        // position is i * nonHiddenPanels.length
        const decal = 100
        const sizeWidth = (window.innerWidth / 2) - decal
        const sizeHeight = (window.innerHeight / 1.2) - decal
        const panel:iFloatingPanel = {
            position: {x: decal + (nonHiddenPanels.length * offset), y: decal + (nonHiddenPanels.length * offset)},
            size: {width: sizeWidth, height: sizeHeight},
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
