import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { useBackendState } from '../hooks/useBackendState.hook';
import { iFloatingPanel } from '../hooks/api/floatingPanel.api.hook';
import { getApi } from '../hooks/api/api.hook';
import { NotePreview } from './NotePreview.component';
import { generateCtag } from '../managers/ssr/ctag.ssr';
import { genUrlPreviewStr } from '../managers/url.manager';
import { set } from 'lodash';
import { useDebounce } from '../hooks/lodash.hooks';
import {  getScrollbarWidth } from '../managers/scrollbar.manager';
import { cssVars } from '../managers/style/vars.style.manager';

// react windows that is resizable
// on close button click, remove the div from the dom
// on minimize button click, minimize the div
// on maximize button click, maximize the div
// on drag, drag the div using react draggable

const getPanelTitle = (panel:iFloatingPanel):string => {
    if (!panel) return ""
    if (panel.type === "file") {
        return panel.file.name
    }
    if (panel.type === "ctag") {
        if (panel.ctagConfig?.tagName === "iframe") {
            let fullLink = panel.ctagConfig?.content
            return genUrlPreviewStr(fullLink)
        }
        return panel.ctagConfig?.content || ""
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
}) => {

    const updatePanel = (panel:iFloatingPanel) => {
        if (!p.onPanelUpdate) return
        p.onPanelUpdate(panel)
    }

    const handleStart = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        p.onPanelDragStart()
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleDrag = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleStop = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        p.onPanelDragEnd()
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleResize = (e: any, direction: any, ref: any, d: any) => {
        // setSize({width: ref.offsetWidth, height: ref.offsetHeight})
        updatePanel({...p.panel, size: {width: ref.offsetWidth, height: ref.offsetHeight}})
        p.onPanelDragStart()
        endResizeDebounce()

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
        p.onPanelDragEnd()
    }, 500)

    const handleClosePanel = () => {
       getApi(api => {
              api.ui.floatingPanel.delete(p.panel.id)
         })
    }
        


    const handleMinimize = () => {
        updatePanel({...p.panel, hidden:true})
    }

    // const [fileView, setFileView] = useState<"editor"|"preview">("editor")

    // const innerHeight = p.panel.size.height - 45
    const innerHeight = p.panel.size.height

    // const ctagConfig = p.panel.ctagConfig
    if (p.panel.ctagConfig) {
        if (!p.panel.ctagConfig.opts) p.panel.ctagConfig.opts = {}
        p.panel.ctagConfig.opts.wrapperHeight = "100%"
    }

    const [showContent, setShowContent] = useState<boolean>(true)
    const reloadContent = () => {
        setShowContent(false)
        setTimeout(() => {
            setShowContent(true)
        }, 100)
    }


    return (
        <div className='floating-panel-wrapper' 
            style={{zIndex:p.panel.zIndex}}
            onClick={() => {getApi(api => {api.ui.floatingPanel.putOnTop(p.panel.id)})}}
        >
            <Draggable
                // axis="x"
                handle=".handle"
                // defaultPosition={position}
                position={p.panel.position}
                // grid={[25, 25]}
                scale={1}
                onStart={handleStart}
                onDrag={handleDrag}
                onStop={handleStop}>
                <Resizable
                    className='floating-panel'
                    size={p.panel.size}
                    onResize={handleResize}
                >
                    <div className='floating-panel__wrapper'  >
                         <div className="floating-panel__actions">
                            <button onClick={handleMinimize}>{ "-"}</button>
                            {/* <button onClick={() => setIsClosed(true)}>Close</button> */}
                            <button className='handle'>D</button>
                            <button onClick={handleClosePanel}>X</button>   
                            <button onClick={handleToggleMaximize}>{p.panel.size.width === window.innerWidth && p.panel.size.height === window.innerHeight ? "m" : "M"}</button>
                            <button onClick={reloadContent}>R</button>
                        </div>
                        { p.panel.type !== "file" &&  <div className="floating-panel__title">{getPanelTitle(p.panel)}</div>}
                        
                        {showContent && 
                            <div className={`floating-panel__content content-type-${p.panel.type}`} style={{height: innerHeight }}>
                                {  p.panel.type === "file" && p.panel.file &&
                                    <div className='floating-panel__inner-content'>
                                        
                                        <NotePreview
                                            file={p.panel.file}
                                            // searchedString={activeLine}
                                            height={p.panel.size.height - 30}
                                            // type={p.panel.fileDisplay || "editor"}
                                            view='editor'
                                            // linkPreview={false}
                                        />
                                    </div>
                                }
                                {
                                    p.panel.type === "ctag" && p.panel.ctagConfig &&
                                    <div className='floating-panel__inner-content' style={{height:  innerHeight}}>
                                        {generateCtag(p.panel.ctagConfig)}
                                    </div>
                                }
                            </div>
                        }
                        
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

    const handleRemovePanel = (panelId:string) => {
        getApi(api => {
            api.ui.floatingPanel.delete(panelId)
        })
    }

    const handleDeminimize = (panel:iFloatingPanel) => {
        panel.hidden = false
        handleUpdatePanels(panel)
    }

    // it should reinit pos and size and decal  each panel by 10px
    const handleReinitPosAndSize = () => {
        getApi(api => {
            api.ui.floatingPanel.actionAll("organize")
        })
    }

    const toggleAll = () => {
        let shouldShow = false
        if (panelsRef.current[0].hidden) {
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


    return (
        <div className="floating-panels-wrapper" style={{pointerEvents: panelDrag ? "all" : "none"}}>
            {/* <FloatingPanel title="Floating Panel 1" content="Content 1" id="panel1" /> */}
            {panels.map( panel =>
                !panel.hidden &&
                    <FloatingPanel 
                        panel={panel} 
                        onPanelUpdate={handleUpdatePanels}
                        onPanelDragStart={onPanelDrag("start")}
                        onPanelDragEnd={onPanelDrag("end")}
                    />
            )}



            <div className='panels-minimized-bottom-bar-wrapper' style={{height:`${35 + getScrollbarWidth()}px`, bottom:`-${getScrollbarWidth()}px`}} >
                <div className='bottom-hover-bar' > </div>
                <div className={`panels-minimized-bottom-bar ${p.pinStatus ? "pinned" : ""}`} style={{width:`${panels.length > 8 ? panels.length* 15 : 100}%`}}>
                    <div className='floating-panels-bottom-toolbar'>
                        <button className='reinit-position-and-size' onClick={handleReinitPosAndSize}>stack</button>
                        <button className='toggle-all' onClick={toggleAll}>toggle</button>
                        <button className='pin-bar' onClick={() => p.onPinChange(!p.pinStatus)}>{p.pinStatus ? "unpin" : "pin"}</button>
                    </div>
                    {panels.map( panel =>
                        panel.hidden &&
                            <div className='panel-minimized' onClick={(e) => { 
                                handleDeminimize(panel)
                            }}>
                                {getPanelTitle(panel)}
                                <button onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemovePanel(panel.id)
                                }}>X</button>
                            </div>
                    )} 
                </div>
            </div>
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
.floating-panels-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    .floating-panel-wrapper {
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
            .floating-panel__content {
                // overflow-y: auto;
                position: absolute;
                top: 0px;
                left: 0px;
                width: 100%;
                overflow: hidden;
                &.content-type-file {
                    top:20px;
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
    left: 0px;
    width: 100vw;
    overflow: hidden;
    overflow-x: scroll;
    pointer-events: none;

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
        .panels-minimized-bottom-bar {
            bottom: 0px;
            box-shadow: 0px 0px 5px rgba(0,0,0,.2);
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
        border-top: 1px solid #000;
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
        }
    }
}


.panel-minimized {
    height: 100%;
    padding: 0 10px;
    border-right: 1px solid #000;
    cursor: pointer;
    transition: 0.5s all;
    :hover {
        background: #f0f0f0;
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