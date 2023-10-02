import { cloneDeep } from 'lodash';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Icon2 } from './Icon.component';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { useBackendState } from '../hooks/useBackendState.hook';
import { iFile } from '../../../shared/types.shared';
import { generateEmptyiFile } from '../hooks/app/useLightbox.hook';
import { iFloatingPanel } from '../hooks/api/floatingPanel.api.hook';
import { getApi } from '../hooks/api/api.hook';
import { NotePreview } from './NotePreview.component';

// react windows that is resizable
// on close button click, remove the div from the dom
// on minimize button click, minimize the div
// on maximize button click, maximize the div
// on drag, drag the div using react draggable

export const FloatingPanel = (p:{
    panel:iFloatingPanel
    onPanelUpdate?: (panel:iFloatingPanel) => void  
}) => {

    const updatePanel = (panel:iFloatingPanel) => {
        if (!p.onPanelUpdate) return
        p.onPanelUpdate(panel)
    }

    const handleStart = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
    }
    const handleDrag = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
        updatePanel({...p.panel, position: {x: data.x, y: data.y}})
    }
    const handleStop = (e: any, data: any) => {
        // setPosition({x: data.x, y: data.y})
    }
    const handleResize = (e: any, direction: any, ref: any, d: any) => {
        // setSize({width: ref.offsetWidth, height: ref.offsetHeight})
        updatePanel({...p.panel, size: {width: ref.offsetWidth, height: ref.offsetHeight}})
    }

    const handleClosePanel = () => {
       getApi(api => {
              api.ui.floatingPanel.delete(p.panel.id)
         })
    }
        


    const handleMinimize = () => {
        updatePanel({...p.panel, hidden:true})
    }

    // const [fileView, setFileView] = useState<"editor"|"preview">("editor")

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
                        
                        {/* <div className="floating-panel__content">{p.panel.file.name}</div>
                         */}
                         <div className="floating-panel__actions">
                            <button onClick={handleMinimize}>{ "-"}</button>
                            {/* <button onClick={() => setIsClosed(true)}>Close</button> */}
                            <button className='handle'>D</button>
                            <button onClick={handleClosePanel}>X</button>   
                            { p.panel.type && <button>{p.panel.type}</button> }
                        </div>
                        <div className='floating-panel__content' style={{height:  p.panel.size.height - 30}}>
                         {
                            p.panel.type === "file" && p.panel.file &&
                            <div className='floating-panel__inner-content'>
                                {p.panel.fileDisplay === "editor" && <div className="floating-panel__title">{p.panel.file.name}</div>}
                                {p.panel.fileDisplay === "preview" && <div className="floating-panel__title">{p.panel.file.name}</div>}
                                <NotePreview
                                    file={p.panel.file}
                                    // searchedString={activeLine}
                                    // height={p.panel.size.height}
                                    type={p.panel.fileDisplay || "editor"}
                                    // linkPreview={false}
                                />
                            </div>
                         }
                        </div>
                        
                    </div>
                </Resizable>
            </Draggable>
        </div>
    )
}

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
            background: #fff;
            border: 1px solid #000;
            border-radius: 4px;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            z-index: 1000;
            pointer-events: all;
            .floating-panel__content {
                overflow-y: auto;
                position: absolute;
                top: 30px;
                left: 0px;
                width: 100%;
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
    height: 30px;
    cursor: pointer;
    bottom: 0px;
    pointer-events: all;

    &:hover {
        .panels-minimized-bottom-bar {
            bottom: 0px;
        }
    }

    .panels-minimized-bottom-bar{
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
        // transi : all 0.5s ease-in-out;
        transition: all 0.3s ease-in-out;
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
    transition: all 0.3s ease-in-out;
    :hover {
        background: #f0f0f0;
    }
}

.floating-panel__wrapper .note-preview-wrapper .cm-mdpreview-wrapper .cm-mdpreview-image img {
	max-height: none;
}

`


export const FloatingPanelsWrapper = (p:{
    panels: iFloatingPanel[], 
    forceUpdate:number,
    onPinBar?: (pinned:boolean) => void
}) => {
    
    let panels = p.panels
    
    const panelsRef = useRef<iFloatingPanel[]>([])
    useEffect(() => {
        panelsRef.current = panels
    },[panels, p.forceUpdate])

    // useEffect(() => {
    //     refreshPanels()

    //     setTimeout(() => {
    //         if (panelsRef.current.length === 0)    {
    //             let testPanel1:iFloatingPanel = {
    //                 id: "panel1",
    //                 position: {x: 100, y: 100},
    //                 size: {width: 320, height: 200},
    //                 hidden: false,
    //                 file: generateEmptyiFile("name1", "path1"),
    //                 type: "ctag",
    //             }
    //             let testPanel2:iFloatingPanel = {
    //                 id: "panel2",
    //                 position: {x: 120, y: 120},
    //                 size: {width: 320, height: 200},
    //                 hidden: false,
    //                 file: generateEmptyiFile("name2", "path2"),
    //                 type: "ctag",
    //             }
    //             setPanels([testPanel1, testPanel2])
    //         }
    //     }, 1000);
    // },[])
    

    const handleUpdatePanels = (panel:iFloatingPanel) => {
        // let newPanels = cloneDeep(panels)
        // let panelIndex = newPanels.findIndex(p => p.id === panel.id)
        // if (panelIndex === -1) return
        // newPanels[panelIndex] = panel
        // setPanels(newPanels)
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
        // panel.hidden = "normal"
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

    // const [barDisplay, setBarDisplay] = <useState("normal")
    // const pinBar = ()

    // bar can be pinned or unpinned
    const [barPinned, setBarPinned, refreshPinBarStatus] = useBackendState("floating-panels-barpinned",false)
    useEffect(() => {
        refreshPinBarStatus()
    },[])


    return (
        <div className="floating-panels-wrapper">
            {/* <FloatingPanel title="Floating Panel 1" content="Content 1" id="panel1" /> */}
            {panels.map( panel =>
                !panel.hidden &&
                    <FloatingPanel panel={panel} onPanelUpdate={handleUpdatePanels}/>
            )}
            <div className='panels-minimized-bottom-bar-wrapper'>
                <div className={`panels-minimized-bottom-bar ${barPinned ? "pinned" : ""}`}>
                    <div className='floating-panels-bottom-toolbar'>
                        <button className='reinit-position-and-size' onClick={handleReinitPosAndSize}>stack</button>
                        <button className='toggle-all' onClick={toggleAll}>toggle</button>
                        <button className='pin-bar' onClick={() => setBarPinned(!barPinned)}>{barPinned ? "unpin" : "pin"}</button>
                    </div>
                    {panels.map( panel =>
                        panel.hidden &&
                            <div className='panel-minimized' onClick={(e) => { 
                                handleDeminimize(panel)
                            }}>
                                {panel.file.name}
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