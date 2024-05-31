import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import {DraggableCore} from 'react-draggable';
import { areWindowsOverlapping, iActionAllParams, iActionAllWindows, iFloatingPanel, iPanelLayout, windowHeightPanel, windowWidthPanel } from '../hooks/api/floatingPanel.api.hook';
import { getApi } from '../hooks/api/api.hook';
import { NotePreview } from './NotePreview.component';
import { generateCtag } from '../managers/ssr/ctag.ssr';
import { genUrlPreviewStr } from '../managers/url.manager';
import { cloneDeep, isArray, set, sortBy, update, zip } from 'lodash-es';
import { useDebounce } from '../hooks/lodash.hooks';
import {  getScrollbarWidth } from '../managers/scrollbar.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { iFile, iViewType } from '../../../shared/types.shared';
import { iLayoutUpdateFn } from './dualView/EditorArea.component';
import { Icon, Icon2 } from './Icon.component';
import { ButtonsToolbar } from './ButtonsToolbar.component';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { deviceType } from '../managers/device.manager';
import { DraggableGrid } from './windowGrid/DraggableGrid.component';
import { addKeyShortcut, releaseKeyShortcut } from '../managers/keyboard.manager';
import { get } from 'http';

let startZindex = 1000
// react windows that is resizable
// on close button click, remove the div from the dom
// on minimize button click, minimize the div
// on maximize button click, maximize the div
// on drag, drag the div using react draggable

//////////////////////////////////////////////////////////////////////////////////////////
// ONE FLOATING PANEL WIDGET
//

// export const FloatingPanelWidget = (p:{
//     file:iFile
// }) => {
//     const detachInFloatingPanel = (e) => {
//         getApi(api => { api.ui.floatingPanel.create({type:"file", file:p.file}) })
//     } 

//     return <>
//     { getApi(api => 
//         api.userSettings.get('beta_floating_windows') &&
//         <div className='action detach-in-floating-panel' onClick={detachInFloatingPanel}>
//             <Icon2 name='window-restore' />
//         </div>
//     )}
//     </> 
// }




const getPanelTitle = (panel:iFloatingPanel):string => {
    if (!panel) return ""
    if (panel.type === "file") {
        return panel.file.name.replace(".md","")
    }
    if (panel.type === "ctag") {
        if (panel.ctagConfig?.tagName === "iframe") {
            let fullLink = panel.ctagConfig?.content
            return genUrlPreviewStr(fullLink)
        } else {
            return `${panel.ctagConfig?.tagName} | ${panel.file.name}`
        }
    }
    return ""
}


//////////////////////////////////////////////////////////////////////////////////////////
// ONE FLOATING PANEL
//

export const FloatingPanel = (p:{
    panel:iFloatingPanel
    onPanelUpdate?: (panel:iFloatingPanel) => void  
    onPanelDragStart: () => void
    onPanelDragEnd: () => void

    panelsVisibleNumber: number
    highestVisibleZIndex: number
    areWindowsOverlapping: boolean
}) => {

    const panelRef = useRef<iFloatingPanel>(p.panel)
    useEffect(() => {   
        panelRef.current = p.panel
    },[p.panel])

    const updatePanel = (panel:iFloatingPanel) => {
        if (!p.onPanelUpdate) return
        // p.onPanelUpdate(panel)
        getApi(api => {
            api.ui.floatingPanel.update(panel)
        })
    }

    const [showHoverOverlay, setShowHoverOverlayInt] = useState<boolean>(false)
    const setShowHoverOverlay = (status:boolean) => {
        
        setShowHoverOverlayInt(status)
    }


    const [showDragOverlay, setShowDragOverlay] = useState<boolean>(false)
    const onDragStart = () => {
        pushToTop()
        setIsDragging(true)
        
        setShowDragOverlay(true)
        p.onPanelDragStart()
    }
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const onDragEnd = () => {
        setShowDragOverlay(false)
        setIsDragging(false)
        
        p.onPanelDragEnd()
    }

    const useMousePos = true
    const decalRef = useRef({x:0, y:0})
    const [currPos, setCurrPos] = useState({x:-9999, y:-9999})

    useEffect(() => {
        if (!p.panel.position) return
        setCurrPos({x: p.panel.position.x, y: p.panel.position.y})
    },[p.panel?.position?.x, p.panel?.position?.y])


    const getNPos = (e:any, data:any, init:boolean=false) => {
        // if touch event, get first touch
        if (e.touches) e = e.touches[0]
        let npos = {x: e.clientX, y: e.clientY}

        if (init) decalRef.current = {x: npos.x - currPos.x, y: npos.y - currPos.y}
        npos = {x: npos.x - decalRef.current.x, y: npos.y - decalRef.current.y}
        setCurrPos(npos)
        if(!useMousePos) npos = {x: data.x, y: data.y}
        return npos
    }
    const handleStart = (e: any, data: any) => {
        updatePanel({...p.panel, position: getNPos(e, data, true)})
        // setPosition({x: data.x, y: data.y})
        // pushToTop()
        onDragStart()
        
    }
    const handleDrag = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        // let npos = {x: e.clientX, y: e.clientY}
        // if(!useMousePos) npos = {x: data.x, y: data.y}
        // const npos = {x: e.clientX, y: e.clientY}
        // get handle position
        // const handlePos = e.target.closest(".handle")
        updatePanel({...p.panel, position: getNPos(e, data)})
    }
    const handleStop = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        onDragEnd()
        // const npos = {x: e.clientX, y: e.clientY}
        // let npos = {x: e.clientX, y: e.clientY}
        // if(!useMousePos) npos = {x: data.x, y: data.y}
        updatePanel({...p.panel, position: getNPos(e, data)})
    }
    const lastPosBeforeResize = useRef({x:-1, y:-1})  
    const widthUpdateIfOnlyHeight = useRef<number>(-1)
    const handleResize = (e: any, direction: any, ref: any, d: any) => {
        // setSize({width: ref.offsetWidth, height: ref.offsetHeight})
        if (lastPosBeforeResize.current.x === -1) {
            lastPosBeforeResize.current = {x: currPos.x, y: currPos.y}
        }
        // console.log(direction,  d, ref.offsetWidth, ref.offsetHeight)
        widthUpdateIfOnlyHeight.current = -widthUpdateIfOnlyHeight.current
        if (direction === "top" || direction === "left") {
            updatePanel({...p.panel, position: {x: lastPosBeforeResize.current.x - d.width, y: lastPosBeforeResize.current.y - d.height}, size: {width: ref.offsetWidth + widthUpdateIfOnlyHeight.current, height: ref.offsetHeight}})
        } else {
            
            updatePanel({...p.panel, size: {width: ref.offsetWidth + widthUpdateIfOnlyHeight.current, height: ref.offsetHeight }})
        }
        
        onDragStart()
        endResizeDebounce()
    }
    // listen to mouse down and up
    // on mouse down, set dragging to true
    useEffect(() => {
        const onMouseDown = (e:any) => {
        }
        const onMouseUp = (e:any) => {
            lastPosBeforeResize.current = {x: -1, y: -1}
        }
        document.addEventListener("mouseup", onMouseUp)
        return () => {
            document.removeEventListener("mouseup", onMouseUp)
        }
    }
    ,[])

    const onLayoutUpdate:iLayoutUpdateFn = (action,data) => {
        if (action !== "windowViewChange" || !data?.view) return
        updatePanel({...panelRef.current, view: data.view})
    }

    const [panelPrevConfig, setPanelPrevConfig] = useState<iFloatingPanel>(p.panel)
    const handleToggleMaximize = () => {
        let pa = p.panel
        if (pa.size.width === windowWidthPanel() && pa.size.height === windowHeightPanel() && pa.position.x === 0 && pa.position.y === 0) {
            updatePanel(panelPrevConfig)
        } else {
            setPanelPrevConfig(pa)
            updatePanel({...pa, size: {width: windowWidthPanel(), height: windowHeightPanel()}, position: {x: 0, y: 0}})
        }
        // setSize({width: window.innerWidth, height: window.innerHeight})
        // updatePanel({...p.panel, size: {width: window.innerWidth, height: window.innerHeight}})
    }

    const handleToggleLayout = (layout:iPanelLayout) => () => {
        getApi(api => {
            api.ui.floatingPanel.updatePanelLayout(p.panel.id, layout)
        })
    }

    const endResizeDebounce = useDebounce(() => {
        onDragEnd()
    }, 500)

    const handleClosePanel = () => {
       getApi(api => {
              api.ui.floatingPanel.delete(p.panel.id)
         })
    }
        


    const handleMinimize = () => {
        // updatePanel({...p.panel, status:"minimized", zIndex: startZindex})
        getApi(api => {
            api.ui.floatingPanel.minimizePanel(p.panel.id)
        })

    }

    // const [fileView, setFileView] = useState<"editor"|"preview">("editor")

    const topBarHeight = 30
    const innerHeight = p.panel.size.height
    // const innerHeight = p.panel.size.height

    // const ctagConfig = p.panel.ctagConfig
    if (p.panel.ctagConfig) {
        if (!p.panel.ctagConfig.opts) p.panel.ctagConfig.opts = {}
        p.panel.ctagConfig.opts.wrapperHeight = "100%"
        p.panel.ctagConfig.opts.sandboxed = false
    }

    const [showContent, setShowContent] = useState<boolean>(true)
    const reloadContent = () => {
        setShowContent(false)
        setTimeout(() => {
            setShowContent(true)
        }, 100)
    }

    const pushToTop = () => {
        if (p.highestVisibleZIndex === p.panel.zIndex) return
        getApi(api => {
            api.ui.floatingPanel.pushWindowOnTop(p.panel.id)
        })
    }


    let shouldShowHoverOverlay = p.areWindowsOverlapping === true && showHoverOverlay && p.panelsVisibleNumber > 1 && p.highestVisibleZIndex !== p.panel.zIndex
    // console.log("shouldShowHoverOverlay", p.panel.type, shouldShowHoverOverlay, p.panel.zIndex, p.highestVisibleZIndex, p.panelsVisibleNumber, p.areWindowsOverlapping)
    // if handle_invisible is hovered, show hover overlay
    useEffect(() => {
        const handleInvisible = document.querySelector('.handle_invisible')
        if (!handleInvisible) return
        handleInvisible.addEventListener("mousedown", () => {
            shouldShowHoverOverlay = true
            setShowHoverOverlay(true)
        })
        handleInvisible.addEventListener("mouseup", () => {
            setShowHoverOverlay(false)
        })
        return () => {
            handleInvisible.removeEventListener("mousedown", () => {
                shouldShowHoverOverlay = true
                setShowHoverOverlay(true)
            })
            handleInvisible.removeEventListener("mouseup", () => {
                setShowHoverOverlay(false)
            })
        }
    })

    

    const [windowIdCtag, setWindowIdCtag] = useState<string>(generateUUID())
    if (p.panel.ctagConfig){
        if (!p.panel.ctagConfig.opts) p.panel.ctagConfig.opts = {}
        p.panel.ctagConfig.opts.windowId = windowIdCtag
    }

    const minimizeButton = () => {
        if(deviceType() === "desktop") {
            return {
                title: 'Minimize',
                icon: "window-minimize",
                action: handleMinimize
            }
        } else {
            return {}
        }
    }

    const classes = `type-${p.panel.type} ${p.panel.ctagConfig?.tagName ? `ctag-${p.panel.ctagConfig.tagName}` : ""}`

    // const [position, setPosition] = useState({ x: 0, y: 0 });

    // const handleDrag = (e, data) => {
    //   setPosition({
    //     x: position.x + data.deltaX,
    //     y: position.y + data.deltaY,
    //   });
    // };

    return (
        <div className={`floating-panel-wrapper ${classes} ${p.panel.status}`} 
            style={{zIndex:p.panel.zIndex, position: "absolute", top: currPos.y, left: currPos.x, opacity: p.panel.opacity || 1}}
            // style={{zIndex:p.panel.zIndex}}
            key={p.panel.id}
            onMouseDown={() => {pushToTop()}}
        >
            <DraggableCore
                // axis="x"
                cancel="body"
                // handle=".handle"
                handle=".handle"
                // defaultPosition={position}
                // position={p.panel.position}
                // grid={[25, 25]}
                // scale={1}
                onStart={handleStart}
                onDrag={handleDrag}
                onStop={handleStop}>
            {/* <Draggable
                // axis="x"
                cancel="body"
                handle=".handle"
                // defaultPosition={position}
                position={p.panel.position}
                // grid={[25, 25]}
                // scale={1}
                onStart={handleStart}
                onDrag={handleDrag}
                onStop={handleStop}> */}
                <Resizable
                    boundsByDirection={true}
                    className='floating-panel'
                    size={p.panel.size}
                    onResize={handleResize}
                >
                    <div className='floating-panel__wrapper'  >
                        <div className='handle_invisible handle'  ></div>
                         <div className="floating-panel__actions"
                            // onMouseEnter={() => {setShowHoverOverlay(false)}} 
                            // onMouseLeave={() => {setShowHoverOverlay(true)}}  
                         >
                            {/* <button onClick={handleMinimize}>{ "-"}</button> */}
                            {/* <button onClick={() => setIsClosed(true)}>Close</button> */}
                            {/* <button className='handle'>D</button>
                            <button onClick={handleClosePanel}>X</button>   
                            <button onClick={handleToggleMaximize}>{p.panel.size.width === window.innerWidth && p.panel.size.height === window.innerHeight ? "m" : "M"}</button>
                            <button onClick={reloadContent}>R</button> */}
                                        {p.areWindowsOverlapping}
                                        <ButtonsToolbar
											class='floating-bar-toolbar'
											size={1}
											buttons={[
												// {
												// 	title: 'Move Window',
                                                //     customHtml: <div className='handle'><Icon2 name="grip-vertical" /></div>,
												// 	action: () => {  }
												// },
												minimizeButton(),
												{
													title: 'Maximize',
													icon: "expand",
                                                    customHtml: <div className='list-layout-floating-wrapper'> 
                                                        <div className='icon-wrapper' onClick={handleToggleMaximize}>
                                                            <Icon2 name='expand'  /> 
                                                        </div>
                                                        <ul> 
                                                            <span onClick={handleToggleLayout("top")}> <Icon name={"custom_icons/top.png"}  /> </span>
                                                            <span onClick={handleToggleLayout("bottom")}> <Icon name={"custom_icons/bottom.png"}  /></span>
                                                            <span onClick={handleToggleLayout("left")}> <Icon name={"custom_icons/left.png"}  /></span>
                                                            <span onClick={handleToggleLayout("right")}> <Icon name={"custom_icons/right.png"}  /></span>
                                                            <br/>
                                                            <span onClick={handleToggleLayout("top-right")}> <Icon name={"custom_icons/top-right.png"}  /></span>
                                                            <span onClick={handleToggleLayout("bottom-right")}> <Icon name={"custom_icons/bottom-right.png"}  /></span>
                                                            <span onClick={handleToggleLayout("top-left")}> <Icon name={"custom_icons/top-left.png"}  /></span>
                                                            <span onClick={handleToggleLayout("bottom-left")}> <Icon name={"custom_icons/bottom-left.png"}  /></span>

                                                        </ul>
                                                    </div>,
													action: () => {}
												},
												p.panel.type === "ctag" ? {
													title: 'Reload content',
													icon: "rotate-right",
													action: reloadContent
												} : {},
												{
													title: 'Close window',
													icon: "xmark",
													action: handleClosePanel
												},
											]}
										/>
                                        {/* <ButtonsToolbar
											class='floating-bar-toolbar2'
											size={1}
                                            design="vertical"
											buttons={[
												// {
												// 	title: 'Move Window',
                                                //     customHtml: <div className='handle'><Icon2 name="grip-vertical" /></div>,
												// 	action: () => {  }
												// },
												minimizeButton(),
												{
													title: 'Maximize',
													icon: "expand",
													action: () => {},
                                                    customHtml: <div className='list-layout-floating-wrapper'> 
                                                        <div onClick={handleToggleMaximize}>
                                                            <Icon2 name='expand'  /> 
                                                        </div>
                                                        <ul> 
                                                            <span> onClick={handleToggleLayout("top")}> top</li>
                                                            <span> onClick={handleToggleLayout("bottom")}> bottom</li>
                                                            <span> onClick={handleToggleLayout("left")}> left</li>
                                                            <span> onClick={handleToggleLayout("right")}> right</li>
                                                            <span> onClick={handleToggleLayout("top-right")}> top-right</li>
                                                            <span> onClick={handleToggleLayout("bottom-right")}> bottom-right</li>
                                                            <span> onClick={handleToggleLayout("top-left")}> top-left</li>
                                                            <span> onClick={handleToggleLayout("bottom-left")}> bottom-left</li>

                                                        </ul>
                                                    </div>

												},
                                                
												p.panel.type === "ctag" ? {
													title: 'Reload content',
													icon: "rotate-right",
													action: reloadContent
												} : {},
												{
													title: 'Close window',
													icon: "xmark",
													action: handleClosePanel
												},
											]}
										/> */}

                        </div>
                        {/* { p.panel.type !== "file" &&  <div className="floating-panel__title">{getPanelTitle(p.panel)}</div>} */}
                        
                            <div 
                                className={`floating-panel__content content-type-${p.panel.type}`} 
                                style={{
                                    height: p.panel.type === "ctag" ? innerHeight - topBarHeight : innerHeight,
                                    top: p.panel.type === "ctag" ? topBarHeight : 0
                                }} 
                                onMouseDown={(e) => {
                                    pushToTop()
                                    // e.preventDefault()
                                    // e.stopPropagation()
                                }}
                                onMouseEnter={() => {setShowHoverOverlay(true)}} 
                                onMouseLeave={() => {setShowHoverOverlay(false)}}  
                            >
                                {/* if ctag, add overlay for click */}
                               {  <div className={`floating-panel__drag-overlay ${showDragOverlay ? "": "hide"} ${shouldShowHoverOverlay ? "hover-mode": ""}`} 
                                    onMouseDown={() => {
                                        pushToTop()
                                        setShowHoverOverlay(false)
                                    }}
                                ></div>}
                                {  p.panel.type === "file" && p.panel.file &&
                                    <div className='floating-panel__inner-content'>
                                        <NotePreview
                                            windowId={p.panel.id || generateUUID()}
                                            file={p.panel.file}
                                            height={p.panel.size.height}
                                            view={p.panel.view || "editor"}
                                            searchedString={p.panel.searchedString}
                                            replacementString={p.panel.replacementString}
                                            titleEditor={"disabled"}
                                            isActive={p.panel.isTopWindow}
                                            onLayoutUpdate={onLayoutUpdate}
                                        />
                                    </div>
                                }
                                {
                                    p.panel.type === "ctag" && p.panel.ctagConfig && showContent &&
                                    <div className={`floating-panel__inner-content window-id-sizeref-${windowIdCtag}`} style={{height:  innerHeight}}>
                                        {generateCtag(p.panel.ctagConfig)}
                                    </div>
                                }
                            </div>
                        
                    </div>
                </Resizable>
            </DraggableCore>
            {/* </Draggable> */}
        </div>
    )
}















//////////////////////////////////////////////////////////////////////////////////////////
//
//
//
// BOTTOM BAR + PANELS WRAPPER
//
//
//
export const FloatingPanelsWrapper = (p:{
    panels: iFloatingPanel[], 
    pinStatus: boolean,
    onPinChange: (status:boolean) => void
}) => {
    let panels = p.panels
    const panelsRef = useRef<iFloatingPanel[]>([])
    useEffect(() => {
        panelsRef.current = panels
    },[panels])

    const handleUpdatePanels = (panel:iFloatingPanel) => {
        getApi(api => {
            api.ui.floatingPanel.update(panel)
        })
    }

    const handleRemovePanel = (panel:iFloatingPanel) => {
        getApi(api => {
            api.ui.floatingPanel.delete(panel.id)
        })
    }

    const handleDeminimize = (panel:iFloatingPanel) => {
        panel.status = "visible"
        handleUpdatePanels(panel)
        // console.log("deminimize", panel.id)
        getApi(api => {
            api.ui.floatingPanel.pushWindowOnTop(panel.id)
            api.ui.floatingPanel.updateOrderPosition(panel.id, "first")
            api.ui.floatingPanel.resizeWindowIfOutOfWindow(panel.id)
        })
    }

    // it should reinit pos and size and decal  each panel by 10px
    const action = (action: iActionAllWindows, params?:iActionAllParams) => {
        getApi(api => {
            api.ui.floatingPanel.actionAll(action, params)
        })
    }

    const [hideAll, setHideAllInt] = useState<boolean>(false)
    const hideAllRef = useRef<boolean>(hideAll)
    const setHideAll = (status:boolean) => {
        hideAllRef.current = status
        setHideAllInt(status)
    }
    const handleToggleVisibility = () => {
        // console.log("toggle visibility", hideAllRef.current)
       setHideAll(!hideAllRef.current)
    }

    // if panels nb increase, unhide all
    const oldPanelsCount = useRef<number>(0)
    const oldPanelsVisibleCount = useRef<number>(0)
    useEffect(() => {
        if (hideAll === true && panels.length > oldPanelsCount.current) {
            setHideAll(false)
        }
        if (panels.length === 0) {
            setHideAll(false)
        }
        const visiblePanels = panels.filter(p => p.status === "visible")
        if (visiblePanels.length > oldPanelsVisibleCount.current) {
            setHideAll(false)
        }
        oldPanelsVisibleCount.current = visiblePanels.length
        oldPanelsCount.current = panels.length
    },[panels])

    const updateFloatingLayout = (layout: iPanelLayout) => {
        getApi(api => {
            api.ui.floatingPanel.updatePanelLayout("active", layout)
        })
    }

    const a1 =  () => { handleToggleVisibility() }
    const a2 = () => {  action("toggleWindowsLayout") }
    const a3 = () => {  action("minimizeActive") }
    const a4 = () => {  action("closeActive") }
    const a5 = () => {  action("toggleWindowsLayout", {layout:"current"}) }

    const a6 = () => {  updateFloatingLayout("top") }
    const a7 = () => {  updateFloatingLayout("bottom") }
    const a8 = () => {  updateFloatingLayout("left") }
    const a9 = () => {  updateFloatingLayout("right") }

    const a10 = () => {  updateFloatingLayout("top-right") }
    const a11 = () => {  updateFloatingLayout("bottom-right") }
    const a12 = () => {  updateFloatingLayout("top-left") }
    const a13 = () => {  updateFloatingLayout("bottom-left") }

    const shortcuts = ["alt+q" , "alt+w", "alt+shift > m", "alt+shift > c", "alt+shift > w", 
        "alt + up", "alt + down", "alt + left", "alt + right",
        "shift + alt + up", "shift + alt + right", "shift + alt + left", "shift + alt + down",
    
    ]
    const actions = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13]
    useEffect(() => {
        shortcuts.forEach((shortcut, i) => {
            addKeyShortcut(shortcut, actions[i])
        })
        return () => {
            shortcuts.forEach((shortcut, i) => {
                releaseKeyShortcut(shortcut, actions[i])
            })
        }
    }, [panels])

    // useEffect(() => {
    //     addKeyShortcut("alt+q", () => { handleToggleVisibility() })
    //     addKeyShortcut("alt+w", () => {  action("toggleWindowsLayout") })
    //     addKeyShortcut("alt+shift > m", () => {  action("minimizeActive") })
    //     addKeyShortcut("alt+shift > c", () => {  action("closeActive") })
    //     return () => {
    //         releaseKeyShortcut("alt+q", () => { handleToggleVisibility() })
    //         releaseKeyShortcut("alt+w", () => {  action("toggleWindowsLayout") })
    //         releaseKeyShortcut("alt+shift > m", () => {  action("minimizeActive") })
    //         releaseKeyShortcut("alt+shift > c", () => {  action("closeActive") })
    //     }
    // }, [panels])


    const toggleAll = () => {
        let shouldShow = false
        if (panelsRef.current[0].status === "minimized") {
            shouldShow = true
        }
        getApi(api => {
            api.ui.floatingPanel.actionAll(shouldShow ? "show" : "hide")
        })
    }

    const [panelDrag, setPanelDrag] = useState<boolean>(false)
    const onPanelDrag = (status:"start"|"end") => () => {
        let isDragging = status === "start"
        setPanelDrag(isDragging)
    }

    const handleKillMinimized = (panel:iFloatingPanel) => {
        panel.status = "hidden"
        handleUpdatePanels(panel)
    }

    // on loading, if minimized panels exists, switch them to hidden
    const [loaded, setLoaded] = useState<boolean>(false)
    useEffect(() => {
        if (loaded) return
        if (panelsRef.current.length === 0) return  
        let newPanels = cloneDeep(panelsRef.current)
        if (!isArray(newPanels)) newPanels = []
        setLoaded(true)
        newPanels.forEach((panel) => {
            if (panel.status === "minimized") panel.status = "hidden"
        })
        getApi(api => {
            api.ui.floatingPanel.updateAll(newPanels)
        })
    },[loaded, panels])



    // panelsBar = panels but reorganized
    const [panelsBar, setPanelsBar] = useState<iFloatingPanel[]>([])
    // max zindex of all panels
    const [maxZIndex, setMaxZIndex] = useState<number>(0)
    // panelsVisibleNumber
    const [panelsVisibleNumber, setPanelsVisibleNumber] = useState<number>(0)

    // debounce as expensive operation
    const onPanelsChangeDebounce = useDebounce(() => {
        // console.log("update panels")
        let max = 0
        panels.forEach(panel => {
            if (panel.zIndex === undefined) return
            if (panel.zIndex > max) max = panel.zIndex
        })
        setMaxZIndex(max)
        setPanelsVisibleNumber(panels.filter(p => p.status === "visible").length)

        // console.log("REORG PANELS")
        // setPanelsBar(panelsRef.current.filter(p => p.status !== "visible"))/
        // reorganized panels by status, first minimized, then hidden
        let newPanels = cloneDeep(panelsRef.current)
        let minimizedPanels = newPanels.filter(p => p.status === "minimized")
        let hiddenPanels = newPanels.filter(p => p.status === "hidden")
        let visiblePanels = newPanels.filter(p => p.status === "visible")

        let organizedPanels = minimizedPanels.concat(hiddenPanels).concat(visiblePanels)
        // let organizedPanels = hiddenPanels.concat(minimizedPanels).concat(visiblePanels)
        // console.log({hiddenPanels, minimizedPanels, visiblePanels})

        // sortby panel.orderPosition using lodash sortby
        organizedPanels = sortBy(organizedPanels, p => p.orderPosition)
        
        setPanelsBar(organizedPanels)
    }, 100)
    useEffect(() => {
        onPanelsChangeDebounce()
    },[panels])

    // if windows visible position are not overlapping, return true
    

    const [overlappingWindows, setOverlappingWindows] = useState<boolean>(false)
    const debounceAreWindowsOverlapping = useDebounce((panels) => {
        setOverlappingWindows(areWindowsOverlapping(panels))
    }, 100)
    useEffect(() => {
        debounceAreWindowsOverlapping(panels)
        // console.log("window overlapping", overlappingWindows)
    },[panels])

    return (
        <div className="floating-panels-wrapper" style={{pointerEvents: panelDrag ? "all" : "none"}}>


            {isArray(panels) && panels.map( panel =>
                panel.status !== "hidden" && panel.device === deviceType() &&
                <div key={panel.id} className={`${hideAll ? "forceHide": ""}`}>
                    <FloatingPanel 
                        panel={panel} 
                        onPanelUpdate={handleUpdatePanels}
                        onPanelDragStart={onPanelDrag("start")}
                        onPanelDragEnd={onPanelDrag("end")}

                        areWindowsOverlapping={overlappingWindows}
                        panelsVisibleNumber={panelsVisibleNumber}
                        highestVisibleZIndex={maxZIndex}
                    />
                </div>
            )}



            { deviceType() === "desktop" &&
                <div className='panels-minimized-bottom-bar-wrapper' style={{height:`${35 + getScrollbarWidth()}px`, bottom:`-${getScrollbarWidth()}px`}} >
                    <div className={`panels-minimized-bottom-bar-background ${p.pinStatus ? "pinned" : ""}`} > </div>
                    <div className='bottom-hover-bar' > </div>
                    <div className={`panels-minimized-bottom-bar ${p.pinStatus ? "pinned" : ""}`} style={{width:`${panels.length > 8 ? panels.length* 15 : 100}%`}}>
                        <div className='floating-panels-bottom-toolbar'>
                            <div className='btn-action reinit-position-and-size' onClick={(e)=>{action("toggleWindowsLayout")}}><Icon2 name="layer-group" /> </div>
                            <div className='btn-action toggle-visibility' onClick={handleToggleVisibility}> {hideAll === true ? <Icon2 name="eye-slash" /> : <Icon2 name="eye" />} </div>
                            <div className='btn-action pin-bar' onClick={() => p.onPinChange(!p.pinStatus)}> <Icon2 name="thumbtack" /> </div>
                            {/* <button className='toggle-all' onClick={toggleAll}>toggle</button> */}
                            {/* <button className='pin-bar' onClick={() => p.onPinChange(!p.pinStatus)}>{p.pinStatus ? "unpin" : "pin"}</button> */}
                        </div>
                        {panelsBar.map( panel =>
                            panel.status !== "visible" &&
                                <div 
                                    key={panel.id}
                                    className={`panel-minimized ${panel.status === "minimized" ? "active-tab" : ""}`} onClick={(e) => { 
                                    handleDeminimize(panel)
                                }}>
                                    <div className='label-wrapper'>
                                        <div className='label'>
                                            {getPanelTitle(panel)}
                                        </div>
                                    </div>
                                    {/* {
                                        panel.status === "minimized" &&
                                        <div className='active-icon'>
                                            <Icon2 name="circle" />
                                        </div>
                                    } */}
                                    <div className="close-btn" onClick={(e) => {
                                        e.stopPropagation()
                                        if (panel.status === "minimized") handleKillMinimized(panel)
                                        else handleRemovePanel(panel)
                                    }}><Icon2 name='xmark' /></div>
                                </div>
                        )} 
                    </div>
                </div>
            }
        </div>
    )
}










//////////////////////////////////////////////////////////////////////////////////////////
// CSS
//
// floatingPanel css in a string
export const FloatingPanelCss = () => `


.list-layout-floating-wrapper {
    // padding: 10px;
    position: relative;
    position: relative;
    width: 10px;
    height: 10px;
    .icon-wrapper {
        position: absolute;
        top: -11px;
        left: -4px;
        padding: 5px;
    }
    ul {
        transition: 0.5s all;
        display: none; 
        position: absolute;
        right: -19px;
        top: 20px;
        width: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0px 0px 3px rgba(0,0,0,.3);
        text-align: left;
        list-style: none;
        margin: 0px;
        padding: 15px;
    }
    &:hover {
        ul {
            display: block;
        }
    }
}

//
// PANEL
//
// resizing handles
.floating-panel__wrapper + div > div {    z-index: 100000;}

.floating-panel__wrapper {
    .handle_invisible {
        position: absolute;
        top: 0px;
        left: 0px;
        width: calc(100% - 100px);
        height: 30px;
        z-index: 1000;
        cursor: grab;
    }
}
.forceHide {
    display: none;

}
.device-view-mobile {
    .floating-panel {
        .editor-area {
            .main-editor-wrapper {
                padding-top: 40px;
            }
        }
        .mobile-text-manip-toolbar-wrapper {
            top: 40px!important;
        }
        .title-input-wrapper {
            padding-top: 5px;
        }
    }
}

.floating-panels-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    .floating-panel-wrapper {
        -webkit-font-smoothing: subpixel-antialiased;
        -webkit-transform: translateZ(0) scale(1.0, 1.0);
        font-smoothing: subpixel-antialiased;
        transform: translateZ(0) scale(1.0, 1.0);
        &.ctag-pdf {
            .floating-panel {
                .floating-panel__actions {
                    top: 30px;
                    
                    right: 5px;
                }
            }
        }
        &.minimized {
            display:none;
        }
        position: absolute;
        top: 0px;
        left: 0px;
       
        .floating-panel {
            overflow: hidden;
            background: #fff;
            border: 1px solid #000;
            border-radius: 4px;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            z-index: 1000;
            pointer-events: all;
            .floating-panel__drag-overlay {
                position: absolute;
                top: 0px;
                left: 0px;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.5);
                z-index: 100;
                opacity: 0.5;
                transition: 0.1s opacity;
                &.hide {
                    opacity: 0;
                    pointer-events: none;
                }
                &.hover-mode {
                    opacity: 0.5;
                    pointer-events: all;
                }
            }
            .floating-panel__actions {
                position: absolute;
                background: rgba(255,255,255,0.1);
                top: 4px;
                transition: 0.5s all;
                right: 40px;
                z-index:1000;
                padding: 4px;
                &:hover {
                    background: white;
                    padding: 4px;
                    box-shadow: 0px 0px 4px rgba(0,0,0,0.3);
                    border-radius: 4px;
                }
            }
            .floating-panel__content {
                // overflow-y: auto;
                // overflow: hidden;
                position: absolute;
                top:0px;
                left: 0px;
                width: 100%;
                overflow: hidden;
                &.content-type-file {
                }
            }
        }
    }
    
    
}


//
// BAR
//
.panels-minimized-bottom-bar-wrapper {
    position: absolute;
    left: left: 18px;
    width: 100vw;
    overflow: hidden;
    overflow-x: scroll;
    pointer-events: none;

    .panels-minimized-bottom-bar-background {
        &.pinned {
            bottom: 0px;
        }
        transition: all 0.3s ease-in-out 0.5s;
        position: fixed;
        left: 0px;
        width: 100%;
        height: 30px;
        background: #fff;
        z-index: 11;
        pointer-events: all;
        bottom: -30px;
    }

    .bottom-hover-bar {
        pointer-events: all;
        cursor: pointer;
        position: absolute;
        width: 150vw;
        height: 15px;
        bottom: 0px;
        box-shadow: 0 0 0px rgba(0,0,0,0.3);
        z-index: 10;
        transition: 0.5s all;
        opacity: 0;
    }
    
    &:hover {
        .panels-minimized-bottom-bar-background {
            box-shadow: 0px 0px 5px rgba(0,0,0,.2);
            bottom: 0px;
        }
        .panels-minimized-bottom-bar {
            bottom: 0px;
            
        }
        .bottom-hover-bar {
            box-shadow: 0px 0px 5px rgba(0,0,0,.2);
            background: ${cssVars.colors.main};
            opacity: 0.5;
        }
    }

    .panels-minimized-bottom-bar{
        z-index: 11;
        pointer-events: all;
        left: 18px;

        // transition: all 0.3s ease-in-out 0.5s, box-shadow 0.5s ease-in-out 0s;
        transition: all 0.3s ease-in-out 0.5s;
        
        position: absolute;
        width: 100%;
        bottom: -30px;
        &.pinned {
            bottom: 0px;
        }
        height: 30px;
        background: #fff;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        .floating-panels-bottom-toolbar {
           
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            margin-left: 10px;
            .floating-bar-toolbar {
            }
            .btn-action {
                padding: 5px;
                margin: 0px 5px;
                cursor: pointer;
                transition: 0.3s all;
                &:hover {
                    background: #f0f0f0;
                }
            }
        }
    }
}


.panel-minimized {
    background: #c9c9c9;
    margin: 0px 0px 0px 4px;
    border-radius: 7px;
    height: 24px;
    width: 80px;
    font-size:10px;
    overflow: hidden;
    padding: 0 10px;
    cursor: pointer;
    transition: 0.5s all;
    position: relative;
    :hover {
        background: #f0f0f0;
    }
    .label-wrapper {
        width: calc(100% - 10px);
        overflow: hidden;
        .label {
            margin-top: 5px;
            height: 14px;
        }
    }
    .active-icon {
        color: rgb(121, 121, 121);
        margin: 6px 6px 0px 6px;

    }
    &.active-tab {
        background: #f0f0f0;
    }
    .close-btn {
        &:hover {
            background: ${cssVars.colors.main};
            i {
                color: white!important;
            }
        }
        i {
            line-height: 8px;
        }
        
        // background: rgba(121, 121, 121,0.5);
        position: absolute;
        top: -2px;
        transition: 0.3s all;
        border-radius: 20px;
        padding: 5px;
        margin-top: 6px;
        line-height: 1px;
        cursor: pointer;
        right: 6px;
    }
}

//
// Modifying style of the note preview
//
.floating-panel__wrapper .note-preview-wrapper .cm-mdpreview-wrapper .cm-mdpreview-image img {
	max-height: none;
}
.floating-panel__wrapper .note-preview-wrapper.preview {
    padding: 0px
}


.content-block.block-tag {
    left: 0px;
    width: calc(100%)
}

`