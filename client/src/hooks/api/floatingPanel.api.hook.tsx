import React, { useEffect, useState } from "react"
import { iFile, iNotification, iPlugin, iViewType } from "../../../../shared/types.shared"
import { useBackendState } from "../useBackendState.hook"
import { generateEmptyiFile } from "../app/useLightbox.hook"
import { clone, cloneDeep, isObject, isString } from "lodash-es"
import { iCtagGenConfig } from "../../managers/ssr/ctag.ssr"
import { iNotePreviewType } from "../../components/NotePreview.component"
import { getUrlTokenParam } from "../app/loginToken.hook"
import { deviceType, iDeviceType, isMobile } from "../../managers/device.manager"
import { useDebounce } from "../lodash.hooks"
import { pathToIfile } from "../../../../shared/helpers/filename.helper"
import { addKeyShortcut, releaseKeyShortcut } from "../../managers/keyboard.manager"
import { getNoteView, setNoteView, toggleViewType } from "../../managers/windowViewType.manager"
import path from "path"

const h = `[FLOATING PANELS]`

export const windowWidthPanel = () => window.innerWidth
export const windowHeightPanel = () => window.innerHeight - 35

export interface iFloatingPanel {
    position: { x: number, y: number },
    size: { width: number, height: number },
    status: "hidden" | "visible" | "minimized",
    file: iFile,
    searchedString?: string,
    opacity?: number,
    replacementString?: string,
    type: "ctag" | "file",
    view?: iViewType,
    orderPosition?: number,
    ctagConfig?: iCtagGenConfig,
    id: string,
    zIndex?: number,
    device: iDeviceType,
    isTopWindow?: boolean
}
export type iActionAllWindows = "hide" | "show" | "organizeWindows" | "toggleWindowsLayout" | "toggleActiveVisibility" | "minimizeActive" | "closeActive" | "deminimizeFirst"
type iWindowsLayout = "grid" | "horizontal" | "vertical" | "tiled" | "current"
export type iActionAllParams = { layout?: iWindowsLayout }
// create new interface iCreateFloatingPanel that extends iFloatingPanel with everything optional except type 
export type iPanelLayout = "full-center" | "full" | "half-right" | "half-left" | "bottom" | "full-bottom" | "full-top" | "top" | "left" | "right" | "bottom-left" | "bottom-right" | "top-left" | "top-right"
export interface iCreateFloatingPanel extends Partial<iFloatingPanel> {
    type: "ctag" | "file",
    layout?: iPanelLayout
}

type iOpenFileFloatingFn  = (filepath: string, opts?: { 
        idpanel?: string, 
        layout?: iPanelLayout, 
        searchedString?: string, 
        replacementString?: string 
        noteView?: iViewType
        view?: iViewType
    }) => void
export interface iFloatingPanelApi {
    create: (panel: iCreateFloatingPanel) => void,
    delete: (panelId: string) => void,
    // getPanels: iFloatingPanel[],
    panels: iFloatingPanel[],

    update: (panel: iFloatingPanel) => void,
    movePanel: (panelId: string, position: { x: number, y: number }) => void,
    resizePanel: (panelId: string, size: { width: number, height: number }) => void,
    deminimizePanel: (panelId?:string) => void,
    minimizePanel: (panelId: string) => void,
    updatePanelLayout: (panelId: string, layout: iPanelLayout) => void,

    openFile: iOpenFileFloatingFn,
    toggleFile: iOpenFileFloatingFn,

    // toggleFileView: (panelId: string) => void,

    updateAll: (panels: iFloatingPanel[]) => void,
    actionAll: (action: iActionAllWindows, params?: iActionAllParams) => void,

    refreshFromBackend: Function,
    pushWindowOnTop: (panelId: string) => void,

    movePositioninArray: (panelId: string, direction: "up" | "down" | "first" | "last") => void,
    updateOrderPosition: (panelId: string, orderPosition: number | "last" | "first") => void,

    resizeWindowIfOutOfWindow: (panelId: string) => void,

}

let startingZindex = 1000
let offset = 20

// create a new panel object that is added and take all props from panelParams if they exists, otherwise use the default values
export const useFloatingPanelApi = (p: {}): iFloatingPanelApi => {
    const onPanelsFirstLoad = (initVal: any) => {
        // if (initVal.length === 0) return
        // if we are mobile, delete all panels that are mobile
        panelsRef.current = initVal
        // let nPanels = cloneDeep(initVal)
        if (deviceType() === "mobile") panelsRef.current = panelsRef.current.filter(p => p.device !== "mobile")
        // save 
        setPanels(panelsRef.current)
    }


    const [panels, setPanelsInt, refreshFromBackend] = useBackendState<iFloatingPanel[]>('floatingPanelsConfig3', [], { history: false, onInitialRefresh: onPanelsFirstLoad, debouncedSave: 5000 }) // save every 10s in backend to avoid overload
    const panelsRef = React.useRef<iFloatingPanel[]>([])
    const setPanels = (npans: iFloatingPanel[]) => {
        panelsRef.current = npans
        setPanelsInt(npans)
    }
    useEffect(() => {
        panelsRef.current = panels
    }, [panels])


    // const [panelsDesktop, setPanelsDesktop, refreshFromBackend] = useBackendState<iFloatingPanel[]>('floatingPanelsDesktopConfig',[], {history: true})
    // const [panels, setPanelsInt] = useState<iFloatingPanel[]>([])
    // const panelsRef = React.useRef<iFloatingPanel[]>([])

    // const setPanels = (npans:iFloatingPanel[]) => {
    //     panelsRef.current = npans
    //     setPanelsInt(npans)
    //     if (deviceType() !== 'mobile') setPanelsDesktop(npans)
    // }

    // const startupIrrigationFromBackend = React.useRef<boolean>(true)
    // useEffect(() => {
    //     refreshFromBackend()
    // },[])

    // useEffect(() => {
    //     if (!startupIrrigationFromBackend.current) return
    //     if (panelsDesktop.length > 0) startupIrrigationFromBackend.current = false
    //     if (deviceType() !== 'mobile') setPanelsInt(panelsDesktop)
    //     panelsRef.current = panelsDesktop
    // },[panelsDesktop])

    const updatePanelLayoutApiFn = (panelId: string | "active", layout?: iPanelLayout) => {
        // if no panelId, take active one
        if (panelId === "active") {
            let visiblePanels = panels.filter(p => p.status === "visible" && p.device !== "mobile")
            let topWindow = visiblePanels.find(p => p.isTopWindow)
            if (!topWindow) return
            panelId = topWindow.id
        }
        // if no layout, full
        if (!layout) layout = "full"

        let panel = cloneDeep(panelsRef.current.find(p => p.id === panelId))
        if (!panel) return
        panel = updatePanelLayoutInt(panel, layout)
        updatePanel(panel)
    }

    const updatePanelLayoutInt = (panel: iFloatingPanel, layout: iPanelLayout) => {
        let padding = 2;
        let paddingBottom = isMobile() ? 2 : 30;
        let paddingLeft = isMobile() ? 2 : 15;
        let width = window.innerWidth - paddingLeft - (2 * padding);
        let height = window.innerHeight - (2 * padding) - paddingBottom;
        let x, y;

        switch (layout) {
            case "full-center":
            case "full":
            x = paddingLeft;
            y = padding;
            break;
            case "half-right":
            x = window.innerWidth / 2 + paddingLeft / 2;
            y = padding;
            width /= 2;
            break;
            case "half-left":
            x = paddingLeft;
            y = padding;
            width /= 2;
            break;
            case "full-bottom":
            case "bottom":
            x = paddingLeft;
            y = window.innerHeight / 2 - paddingBottom / 2;
            height /= 2;
            break;
            case "full-top":
            case "top":
            x = paddingLeft;
            y = padding;
            height /= 2;
            break;
            case "left":
            x = paddingLeft;
            y = padding;
            width /= 2;
            break;
            case "right":
            x = window.innerWidth / 2 + paddingLeft / 2;
            y = padding;
            width /= 2;
            break;
            case "bottom-left":
            x = paddingLeft;
            y = window.innerHeight / 2 - paddingBottom / 2 ;
            width /= 2;
            height /= 2;
            break;
            case "bottom-right":
            x = window.innerWidth / 2 + paddingLeft / 2;
            y = window.innerHeight / 2 - paddingBottom / 2  ;
            width /= 2;
            height /= 2;
            break;
            case "top-left":
            x = paddingLeft;
            y = padding;
            width /= 2;
            height /= 2;
            break;
            case "top-right":
            x = window.innerWidth / 2 + paddingLeft / 2;
            y = padding;
            width /= 2;
            height /= 2;
            break;
        }

        panel.position = { x, y };
        panel.size = { width, height };

        return panel;
    }


    const createPanel = (panelParams: iCreateFloatingPanel) => {
        // if panel is file and a panel with that file already exists and is visible, just push it on top
        // let alreadyExistingVisiblePanel = panelsRef.current.find(p => p.file.path === panelParams.file.path && p.status === "visible")
        let alreadyExistingMinimizedPanel = panelsRef.current.find(p => p.file.path === panelParams?.file?.path && p.status !== "visible")
        // console.log(`${h} createPanel`, alreadyExistingVisiblePanel, alreadyExistingMinimizedPanel, panelParams.file.path, panelsRef)
        if (alreadyExistingMinimizedPanel) {
            deminimizePanel(alreadyExistingMinimizedPanel.id)
        } else {

            // get all non hidden pannels
            let nonHiddenPanels = panelsRef.current.filter(p => !p.status.includes("hidden"))
            // position is i * nonHiddenPanels.length
            const decal = deviceType() === "mobile" ? 5 : 100
            let sizeWidth = (window.innerWidth / 2) - decal
            if (deviceType() === "mobile") sizeWidth = (window.innerWidth) - decal * 2
            const sizeHeight = (window.innerHeight / 1.2) - decal
            
            // if id exists, prepend device type
            if (panelParams.id) panelParams.id = deviceType() + "-" + panelParams.id

            const panel: iFloatingPanel = {
                position: { x: decal + (nonHiddenPanels.length * offset), y: decal + (nonHiddenPanels.length * offset) },
                size: { width: sizeWidth, height: sizeHeight },
                status: "visible",
                file: generateEmptyiFile(),
                view: "editor",
                id: Math.random().toString(36).substring(7),
                zIndex: startingZindex,
                device: deviceType(),
                orderPosition: nonHiddenPanels.length,
                ...panelParams,
            }

            // if layout is full-center, set position to center of the screen and size to 100% of the screen with 20px padding
            if (panelParams.layout) {
                let layoutPanel = updatePanelLayoutInt(panel, panelParams.layout)
                panel.position = layoutPanel.position
                panel.size = layoutPanel.size
            }


            const openFloating = (panel) => {
                console.log(`${h} createPanel`, panel)
                // if panel with same id exists, get its position and size, then delete it
                let oldPanelPosition = panelsRef.current.find(p => p.id === panel.id)
                if (oldPanelPosition) {
                    panel.position = oldPanelPosition.position
                    panel.size = oldPanelPosition.size
                    deletePanel(panel.id)
                }
                let nPanels = panelsRef.current.filter(p => p.id !== panel.id)
                nPanels.push(panel)
                setPanels(nPanels)
                updateOrderPosition(panel.id, "first")
                pushWindowOnTop(panel.id)
            }

            // if panelsParams is file, get its view && panelParams.view is not defined
            if (panelParams.file && !panelParams.view) {
                // console.log(`${h} getNoteView`, panelParams.file.path, panelParams)
                getNoteView(panelParams.file.path).then(view => {
                    // console.log(`${h} getNoteView`, view)
                    if (view) panel.view = view
                    openFloating(panel)
                })
            } else {
                openFloating(panel)
            }

        }
    }

    const updatePanel = (panel: iFloatingPanel) => {
        const nPanels = panelsRef.current.map(p => p.id === panel.id ? panel : p)
        setPanels(nPanels)
    }

    const deletePanel = (panelId: string) => {
        // console.log(`${h} deletePanel`, panelId)
        let nPanels = panelsRef.current.filter(p => p.id !== panelId)
        nPanels = updateTopWindow(nPanels)
        setPanels(nPanels)
    }

    const updateTopWindow = (newPanels: iFloatingPanel[]): iFloatingPanel[] => {

        // let newPanels = cloneDeep(panelsRef.current)
        let visiblePanels = newPanels.filter(p => p.status === "visible")
        // get the top window from zIndex
        const highestZIndex = Math.max(...visiblePanels.map(p => p.zIndex || 0))
        const highestZIndexPanel = visiblePanels.find(p => p.zIndex === highestZIndex)
        if (!highestZIndexPanel) return newPanels
        // remove isTopWindow from all panels
        newPanels.forEach((p) => { p.isTopWindow = false })
        newPanels[newPanels.findIndex(p => p.id === highestZIndexPanel.id)].isTopWindow = true
        const highest = newPanels[newPanels.findIndex(p => p.id === highestZIndexPanel.id)]
        // console.log(`updateTopWindow to `, highest.file.name )
        // setPanels(newPanels)
        return newPanels
    }

    const pushWindowOnTop = (panelId: string) => {
        // get higher zIndex of all panels
        const highestZIndex = Math.max(...panelsRef.current.map(p => p.zIndex || 0))
        let panelIndex = panelsRef.current.findIndex(p => p.id === panelId)
        if (panelIndex === -1) return
        let npanel = cloneDeep(panelsRef.current)[panelIndex]
        npanel.zIndex = highestZIndex + 1
        // remove isTopWindow from all panels 
        let newPanels = cloneDeep(panelsRef.current)
        newPanels.forEach((p) => { p.isTopWindow = false })
        npanel.zIndex = highestZIndex + 1
        npanel.isTopWindow = true
        newPanels[panelIndex] = npanel

        // newPanels = updateTopWindow(panelsRef.current)
        setPanels(newPanels)
        // updateTopWindow()
        // updatePanel({...panelsRef.current[panelIndex]!, zIndex: highestZIndex + 1})
        // if highestZIndex > startingZindex + 2x length of panels, remove to all panels zIndex 1x length of panels
        if (highestZIndex > startingZindex + (panelsRef.current.length * 2)) {
            let newPanels = cloneDeep(panelsRef.current)
            newPanels.forEach((p) => {
                p.zIndex = p.zIndex! - panelsRef.current.length
            })
            setPanels(newPanels)
        }
    }


    const updateAll = (panels: iFloatingPanel[]) => {
        setPanels(cloneDeep(panels))
    }

    const movePanel = (panelId: string, position: { x: number, y: number }) => {
        updatePanel({ ...panelsRef.current.find(p => p.id === panelId)!, position })
    }

    const resizePanel = (panelId: string, size: { width: number, height: number }) => {
        updatePanel({ ...panelsRef.current.find(p => p.id === panelId)!, size })
    }

    const deminimizePanel = (panelId?:string) => {
        // find the panel, if no panelId provided, take the first minimized panel
        if (!panelId) {
            // take all panels not visible
            let invisiblePanels = panelsRef.current.filter(p => p.status !== "visible")
            // take the one with the lowest orderPosition
            let firstPanel = invisiblePanels.find(p => p.orderPosition === Math.min(...invisiblePanels.map(p => p.orderPosition || 0)))
            let panel = firstPanel
            if (!panel) return
            panelId = panel.id
        }
        let panel = panelsRef.current.find(p => p.id === panelId)
        // push that panel on top, make it visible, make its order position first
        if (!panel) return
        panel.status = "visible"
        updatePanel(panel)
        pushWindowOnTop(panel.id)
        updateOrderPosition(panel.id, "first")
        resizeWindowIfOutOfWindow(panel.id)
    }

    const minimizePanel = (panelId: string) => {
        // const nPanel = panelsRef.current.find(p => p.id === panelId)
        // if panel is file 
        let nPanels = cloneDeep(panelsRef.current)
        nPanels.find(p => p.id === panelId)!.status = "minimized"
        const p = nPanels.find(p => p.id === panelId)
        // console.log(` minimizePanel`, p?.file.name)
        nPanels = updateTopWindow(nPanels)
        setPanels(nPanels)
    }

    const reorganizeAll = () => {
        // console.log(`${h} reorganizeAll`)
        let newPanels = cloneDeep(panelsRef.current)

        let j = 0
        newPanels.forEach((panel) => {
            if (panel.status !== "visible") return
            panel.zIndex = startingZindex + j
            panel.position = { x: 100 + (j * offset), y: 100 + (j * offset) }
            panel.size = { width: 320, height: 200 }
            // if i > 0, position should offset half of the previous panel size
            // if (j > 0) {
            //     panel.position = {x: 100 + (j * offset) , y: 100 + (j * offset) - (newPanels[j].size.height )}
            // }   
            j++


        })
        updateAll(newPanels)
    }

    const layoutWindows = React.useRef<iWindowsLayout>("grid")
    const toggleWindowsLayout = (nLayout?: iWindowsLayout) => {
        let newPanels = cloneDeep(panelsRef.current)
        let visiblePanels = newPanels.filter(p => p.status === "visible" && p.device !== "mobile")

        // only trigger if 
        // if (visiblePanels.length <= 1) return reorganizeAll()
        if (nLayout === "current") nLayout = layoutWindows.current


        const allLayouts: iWindowsLayout[] = ["grid", "horizontal", "vertical", "tiled"]
        // console.log(`${h} toggleWindowsLayout`, layoutWindows.current)
        if (!nLayout) {
            // if no nLayout, toggle between grid, horizontal, vertical
            layoutWindows.current = allLayouts[(allLayouts.indexOf(layoutWindows.current) + 1) % allLayouts.length]
        } else {
            layoutWindows.current = nLayout
        }


        // if grid, reorganize each panels according to their number, if 2 side by side, if 4 2x2, if 9, 3x3
        if (layoutWindows.current === "grid") {
            const cols = Math.ceil(Math.sqrt(visiblePanels.length))
            const rows = Math.ceil(visiblePanels.length / cols)
            const positionsForEachPanel: { x: number, y: number }[] = []
            let paddingLeft = isMobile() ? 2 : 15
            let padding = 2
            let widthPerCol = (windowWidthPanel() - paddingLeft -padding) / cols
            let heightPerRow = windowHeightPanel() / rows

            // console.log(`${h} toggleWindowsLayout grid`, cols, rows, widthPerCol, heightPerRow)
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    //positionsForEachPanel.push({ x: j * widthPerCol, y: i * heightPerRow })
                    positionsForEachPanel.push({ x: j * widthPerCol + paddingLeft, y: i * heightPerRow + padding })
                }
            }
            let count = 0
            newPanels.forEach((panel, i) => {
                if (panel.status !== "visible") return
                if (panel.device === "mobile") return
                panel.position = positionsForEachPanel[count]
                panel.size = { width: widthPerCol, height: heightPerRow }
                count++
            })
            updateAll(newPanels)
        } else if (layoutWindows.current === "horizontal") {
            let widthPerCol = windowWidthPanel() / visiblePanels.length
            // console.log(`${h} toggleWindowsLayout horizontal`, widthPerCol, widthPerCol, visiblePanels.length)
            let count = 0
            newPanels.forEach((panel, i) => {
                if (panel.status !== "visible") return
                if (panel.device === "mobile") return
                // console.log(`${h} 222toggleWindowsLayout horizontal`, count, widthPerCol, count * widthPerCol, panel.id, panel)
                panel.position = { x: count * widthPerCol, y: 0 }
                panel.size = { width: widthPerCol, height: windowHeightPanel() }
                count++
            })
            updateAll(newPanels)
        } else if (layoutWindows.current === "vertical") {
            let heightPerRow = windowHeightPanel() / visiblePanels.length
            // console.log(`${h} toggleWindowsLayout vertical`, heightPerRow)
            let count = 0
            newPanels.forEach((panel, i) => {
                if (panel.status !== "visible") return
                if (panel.device === "mobile") return
                panel.position = { x: 0, y: count * heightPerRow }
                panel.size = { width: windowWidthPanel(), height: heightPerRow }
                count++
            })
            updateAll(newPanels)
        } else if (layoutWindows.current === "tiled") {
            reorganizeAll()
        }


    }

    // function updateOrderPosition that just update the prop.orderPosition of the panel, first should be the first position of all panels, last should be the last position of all panels
    const updateOrderPosition = (panelId: String, orderPosition: number | "last" | "first") => {
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

    const movePanelPositioninArray = (panelId: string, direction: "up" | "down" | "first" | "last") => {
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

    const minimizeActive = () => {
        // let newPanels = cloneDeep(panelsRef.current)
        let topWindow = getTopVisibleWindow()
        // console.log("topWindow", topWindow?.file.name)
        if (!topWindow) return
        minimizePanel(topWindow.id)
    }
    const closeActive = () => {
        let topWindow = getTopVisibleWindow()
        if (!topWindow) return
        deletePanel(topWindow.id)
    }


    const actionAll: iFloatingPanelApi["actionAll"] = (action, params) => {
        // reorg
        if (action === "organizeWindows") return reorganizeAll()
        if (action === "toggleWindowsLayout") return toggleWindowsLayout(params?.layout)
        if (action === "minimizeActive") return minimizeActive()
        if (action === "closeActive") return closeActive()
        if (action === "deminimizeFirst") return deminimizePanel()

        // hide/show
        let newPanels = cloneDeep(panelsRef.current)
        newPanels.forEach((panel) => {
            panel.status = action === "hide" ? "visible" : "minimized"
        })
        updateAll(newPanels)
    }

    const openFile: iFloatingPanelApi["openFile"] = (filepath, opts) => {
        let { idpanel, layout, searchedString, replacementString } = opts || {}
        if (!idpanel) idpanel = Math.random().toString(36).substring(7)
        // if id exists, prepend device type
        if (idpanel) idpanel = deviceType() + "-" + idpanel
        let panel = cloneDeep(panelsRef.current.find(p => p.id === idpanel))

        if (!panel) {
            // create panel 
            const panel: iCreateFloatingPanel = {
                id: idpanel,
                type: "file",
                file: pathToIfile(filepath),
            }
            if (layout) panel.layout = layout
            if (searchedString) panel.searchedString = searchedString
            if (replacementString) panel.replacementString = replacementString
            // forcing note view
            if (opts?.noteView) panel.view = opts.noteView
            if (opts?.view) panel.view = opts.view
            createPanel(panel)
        } else {
            // forcing note view
            if (opts?.noteView) panel.view = opts.noteView
            if (opts?.view) panel.view = opts.view
            // console.log(`${h} minimized`, panel.file.name, panel)
            // if panel is minimized, set it to visible
            if (panel.status === "minimized") panel.status = "visible"
            if (panel.status === "hidden") panel.status = "visible"
            // place panel on top

            panel.file = pathToIfile(filepath)
            if (searchedString) panel.searchedString = searchedString
            if (replacementString) panel.replacementString = replacementString
            updatePanel(panel)
            pushWindowOnTop(panel?.id)
            // setTimeout(() => {

            // }, 100)
        }
    }

    const toggleFile: iFloatingPanelApi["toggleFile"] = (filepath, opts) => {
        let panel = panelsRef.current.find(p => p.file.path === filepath )
        if (!panel) return openFile(filepath, opts)
        else {
            // if panel exists and is visible, minimize it
            if (panel.status === "visible") minimizePanel(panel.id)
            else deminimizePanel(panel.id)
        }
    }


    const resizeWindowIfOutOfWindow = (panelId: string) => {
        let panel = cloneDeep(panelsRef.current.find(p => p.id === panelId))
        if (!panel) return
        if (panel.position.x + panel.size.width > window.innerWidth) {
            // panel.size.width = window.innerWidth - panel.position.x
            panel.position.x = 0
            if (panel.size.width > window.innerWidth) panel.size.width = window.innerWidth - 0
        }
        if (panel.position.y + panel.size.height > window.innerHeight) {
            // panel.size.height = window.innerHeight - panel.position.y
            panel.position.y = 0
            if (panel.size.height > window.innerHeight) panel.size.height = window.innerHeight - 0
        }
        updatePanel(panel)
    }

    const getTopVisibleWindow = () => {
        // let newPanels = cloneDeep(panelsRef.current)
        let visiblePanels = panelsRef.current.filter(p => p.status === "visible")
        // get the top window
        let topWindow = visiblePanels.find(p => p.zIndex === Math.max(...visiblePanels.map(p => p.zIndex || 0)))

        return topWindow
    }
    const updateTopWindowOpacity = (opacityRelative: number) => {
        const topWindow = getTopVisibleWindow()
        if (!topWindow) return
        const currOpacity = topWindow.opacity || 1
        topWindow.opacity = currOpacity + opacityRelative
        // console.log(`${h} updateTopWindowOpacity`, topWindow.opacity, currOpacity, opacityRelative)
        if (topWindow.opacity > 1) topWindow.opacity = 1
        if (topWindow.opacity < 0) topWindow.opacity = 0
        updatePanel(topWindow)
    }

    const updateTopWindowView = (view?: iViewType) => {
        const topWindow = getTopVisibleWindow()
        if (!topWindow) return
        if (isString(view)) topWindow.view = view
        // toggle between editor, preview, both
        else {
            topWindow.view = toggleViewType(topWindow.view as iViewType)
            const cFile = topWindow.file
            setNoteView(cFile?.path, topWindow.view)
            // console.log(`${h} updateTopWindowView`, topWindow.view)
        }
        updatePanel(topWindow)
    }

    const incrementOpacity = () => {
        updateTopWindowOpacity(+0.1)
    }
    const decrementOpacity = () => {
        updateTopWindowOpacity(-0.1)
    }
    const reloadTopWindow = () => {
        const topWindow = getTopVisibleWindow()
        if (!topWindow) return
        const cFile = cloneDeep(topWindow.file)
        const cCtag = cloneDeep(topWindow.ctagConfig)
        topWindow.file = pathToIfile("")
        topWindow.ctagConfig = undefined
        updatePanel(topWindow)
        setTimeout(() => {
            topWindow.file = cFile
            topWindow.ctagConfig = cCtag
            updatePanel(topWindow)
        }, 100)
    }

    useEffect(() => {
        let shcts = ["alt + o", "alt + shift + o", "alt + shift > v", "alt + shift > r"]
        addKeyShortcut(shcts[0], incrementOpacity)
        addKeyShortcut(shcts[1], decrementOpacity)
        addKeyShortcut(shcts[2], updateTopWindowView)
        addKeyShortcut(shcts[3], reloadTopWindow)
        return () => {
            releaseKeyShortcut(shcts[0], incrementOpacity)
            releaseKeyShortcut(shcts[1], decrementOpacity)
            releaseKeyShortcut(shcts[2], updateTopWindowView)
            releaseKeyShortcut(shcts[3], reloadTopWindow)
        }
    })

    const api: iFloatingPanelApi = {
        create: createPanel,
        openFile: openFile,
        update: updatePanel,
        toggleFile: toggleFile,
        updateAll,
        delete: deletePanel,
        movePanel,
        resizePanel,
        updatePanelLayout: updatePanelLayoutApiFn,
        minimizePanel,
        deminimizePanel,
        actionAll,
        panels,
        refreshFromBackend,
        pushWindowOnTop,
        movePositioninArray: movePanelPositioninArray,
        updateOrderPosition,
        resizeWindowIfOutOfWindow
    }

    return api
}


export const areWindowsOverlapping = (panels: iFloatingPanel[]): boolean => {
    let overlapping = false
    const visiblePanels = panels.filter(p => p.status === "visible" && p.device !== "mobile")
    visiblePanels.forEach((panel, index) => {
        if (overlapping) return
        visiblePanels.forEach((panel2, index2) => {
            if (overlapping) return
            if (index === index2) return
            // calc overlap based on x, y, widht and height
            let x1 = panel.position.x
            let y1 = panel.position.y
            let x2 = panel2.position.x
            let y2 = panel2.position.y
            let w1 = panel.size.width
            let h1 = panel.size.height
            let w2 = panel2.size.width
            let h2 = panel2.size.height
            const sensib = 20
            let overlapX = x1 + sensib < x2 + w2 && x1 + w1 > x2 + sensib
            let overlapY = y1 + sensib < y2 + h2 && y1 + h1 > y2 + sensib
            if (overlapX && overlapY) {
                overlapping = true
            }
        })
    })
    return overlapping
}