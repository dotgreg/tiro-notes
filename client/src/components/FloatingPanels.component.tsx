import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { useBackendState } from '../hooks/useBackendState.hook';
import { iFloatingPanel } from '../hooks/api/floatingPanel.api.hook';
import { getApi } from '../hooks/api/api.hook';
import { NotePreview } from './NotePreview.component';
import { generateCtag } from '../managers/ssr/ctag.ssr';
import { genUrlPreviewStr } from '../managers/url.manager';
import { cloneDeep, isArray, set, sortBy, update, zip } from 'lodash';
import { useDebounce } from '../hooks/lodash.hooks';
import {  getScrollbarWidth } from '../managers/scrollbar.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { iFile, iViewType } from '../../../shared/types.shared';
import { iLayoutUpdateFn } from './dualView/EditorArea.component';
import { Icon2 } from './Icon.component';
import { ButtonsToolbar } from './ButtonsToolbar.component';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { deviceType } from '../managers/device.manager';

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
        return panel.file.name
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
        setShowDragOverlay(true)
        p.onPanelDragStart()
    }
    const onDragEnd = () => {
        setShowDragOverlay(false)
        p.onPanelDragEnd()
    }

    const handleStart = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        pushToTop()
        onDragStart()
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleDrag = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleStop = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        onDragEnd()
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleResize = (e: any, direction: any, ref: any, d: any) => {
        // setSize({width: ref.offsetWidth, height: ref.offsetHeight})
        updatePanel({...p.panel, size: {width: ref.offsetWidth, height: ref.offsetHeight}})
        onDragStart()
        endResizeDebounce()
    }

    const onLayoutUpdate:iLayoutUpdateFn = (action,data) => {
        if (action !== "windowViewChange" || !data?.view) return
        updatePanel({...panelRef.current, view: data.view})
    }

    const [panelPrevConfig, setPanelPrevConfig] = useState<iFloatingPanel>(p.panel)
    const handleToggleMaximize = () => {
        let pa = p.panel
        if (pa.size.width === window.innerWidth && pa.size.height === window.innerHeight && pa.position.x === 0 && pa.position.y === 0) {
            updatePanel(panelPrevConfig)
        } else {
            setPanelPrevConfig(pa)
            updatePanel({...pa, size: {width: window.innerWidth, height: window.innerHeight}, position: {x: 0, y: 0}})
        }
        // setSize({width: window.innerWidth, height: window.innerHeight})
        // updatePanel({...p.panel, size: {width: window.innerWidth, height: window.innerHeight}})
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

    // const innerHeight = p.panel.size.height - 45
    const innerHeight = p.panel.size.height

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

    const shouldShowHoverOverlay = showHoverOverlay && p.panelsVisibleNumber > 1 && p.highestVisibleZIndex !== p.panel.zIndex
    // console.log("shouldShowHoverOverlay", shouldShowHoverOverlay, showHoverOverlay, p.panelsVisibleNumber, p.highestVisibleZIndex, p.panel.zIndex)

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

    return (
        <div className={`floating-panel-wrapper ${p.panel.status}`} 
            style={{zIndex:p.panel.zIndex}}
            key={p.panel.id}
            onMouseDown={() => {pushToTop()}}
        >
            <Draggable
                // axis="x"
                cancel="body"
                handle=".handle"
                // defaultPosition={position}
                position={p.panel.position}
                // grid={[25, 25]}
                scale={1}
                onStart={handleStart}
                onDrag={handleDrag}
                onStop={handleStop}>
                <Resizable
                    boundsByDirection={true}
                    className='floating-panel'
                    size={p.panel.size}
                    onResize={handleResize}
                >
                    <div className='floating-panel__wrapper'  >
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
                                        <ButtonsToolbar
											class='floating-bar-toolbar'
											size={1}
											buttons={[
												{
													title: 'Move Window',
                                                    customHtml: <div className='handle'><Icon2 name="grip-vertical" /></div>,
													action: () => {  }
												},
												minimizeButton(),
												{
													title: 'Maximize',
													icon: "expand",
													action: handleToggleMaximize
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

                        </div>
                        {/* { p.panel.type !== "file" &&  <div className="floating-panel__title">{getPanelTitle(p.panel)}</div>} */}
                        
                            <div 
                                className={`floating-panel__content content-type-${p.panel.type}`} 
                                style={{height: innerHeight }} 
                                onMouseDown={() => {pushToTop()}}
                                onMouseEnter={() => {setShowHoverOverlay(true)}} 
                                onMouseLeave={() => {setShowHoverOverlay(false)}}  
                            >
                                <div className={`floating-panel__drag-overlay ${showDragOverlay ? "": "hide"} ${shouldShowHoverOverlay ? "hover-mode": ""}`} 
                                    onMouseDown={() => {
                                        pushToTop()
                                        setShowHoverOverlay(false)
                                    }}
                                ></div>
                                {  p.panel.type === "file" && p.panel.file &&
                                    <div className='floating-panel__inner-content'>
                                        
                                        <NotePreview
                                            file={p.panel.file}
                                            height={p.panel.size.height}
                                            view={p.panel.view || "editor"}
                                            titleEditor={"disabled"}
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
            </Draggable>
        </div>
    )
}















//////////////////////////////////////////////////////////////////////////////////////////
// PANELS WRAPPER
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
        })
    }

    // it should reinit pos and size and decal  each panel by 10px
    const handleReinitPosAndSize = () => {
        getApi(api => {
            api.ui.floatingPanel.actionAll("organizeWindows")
        })
    }

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
        setLoaded(true)
        let newPanels = cloneDeep(panelsRef.current)
        if (!isArray(newPanels)) newPanels = []
        newPanels.forEach((panel) => {
            if (panel.status === "minimized") panel.status = "hidden"
        })
        getApi(api => {
            api.ui.floatingPanel.updateAll(newPanels)
        })
    },[loaded])



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

    return (
        <div className="floating-panels-wrapper" style={{pointerEvents: panelDrag ? "all" : "none"}}>


            {isArray(panels) && panels.map( panel =>
                panel.status !== "hidden" &&
                <div key={panel.id}>
                    <FloatingPanel 
                        panel={panel} 
                        onPanelUpdate={handleUpdatePanels}
                        onPanelDragStart={onPanelDrag("start")}
                        onPanelDragEnd={onPanelDrag("end")}

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
                            <div className='btn-action reinit-position-and-size' onClick={handleReinitPosAndSize}><Icon2 name="layer-group" /> </div>
                            <div className='btn-action pin-bar' onClick={() => p.onPinChange(!p.pinStatus)}> <Icon2 name="thumbtack" /> </div>
                            {/* <button className='toggle-all' onClick={toggleAll}>toggle</button> */}
                            {/* <button className='pin-bar' onClick={() => p.onPinChange(!p.pinStatus)}>{p.pinStatus ? "unpin" : "pin"}</button> */}
                        </div>
                        {panelsBar.map( panel =>
                            panel.status !== "visible" &&
                                <div 
                                    key={panel.id}
                                    className='panel-minimized' onClick={(e) => { 
                                    handleDeminimize(panel)
                                }}>
                                    <div className='label'>
                                        {getPanelTitle(panel)}
                                    </div>
                                    {
                                        panel.status === "minimized" &&
                                        <div className='active-icon'>
                                            <Icon2 name="circle" />
                                        </div>
                                    }
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

//
// PANEL
//
// resizing handles
.floating-panel__wrapper + div > div {    z-index: 100000;}

.floating-panels-wrapper {
    
   
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    .floating-panel-wrapper {
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
                top: 4px;
                transition: 0.5s all;
                right: 40px;
                z-index:102;
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
    width: 5vw;
    display: flex;
    font-size:10px;
    overflow: hidden;
    align-content: center;
    justify-content: space-around;
    padding: 0 10px;
    cursor: pointer;
    transition: 0.5s all;
    position: relative;
    :hover {
        background: #f0f0f0;
    }
    .label {
        margin-top: 5px;
        height: 14px;
        overflow: hidden;
    }
    .active-icon {
        color: rgb(121, 121, 121);
        margin: 6px 6px 0px 6px;

    }
    .close-btn {
        paddding: 5px;
        margin-top: 6px;
        cursor: pointer;
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