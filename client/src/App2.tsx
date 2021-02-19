import { Global } from '@emotion/react';
import React, { useEffect,  useMemo,  useRef,  useState } from 'react';
import { TreeView } from './components/TreeView.Component';
import { deviceType } from './managers/device.manager';
import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { CssApp, GlobalCssApp } from './managers/style.manager';
import { bindEventManagerToSocketEvents, socketEventsManager } from './managers/sockets/eventsListener.sockets';
import { useAppTreeFolder } from './hooks/app/treeFolder.hook';
import { onFilesReceivedFn, useAppFilesList } from './hooks/app/filesList.hook';
import { useFileContent } from './hooks/app/fileContent.hook';
import { useAppSearch } from './hooks/app/search.hook';
import { DualViewer } from './components/dualView/DualViewer.component';
import { useMobileView } from './hooks/app/mobileView.hook';
import { useUrlLogic } from './hooks/app/urlLogic.hook';
import { isNumber } from 'lodash';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useKeys } from './hooks/app/useKeys.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { consoleCli } from './managers/cliConsole.manager';
import { configClient } from './config';
import { onKey } from './managers/keys.manager';




export const App2 = React.memo(() => {

    useEffect(() => {
        // COMPONENT DID MOUNT didmount
        console.log(`========= [APP] MOUNTED on a ${deviceType()}`);
        
        initSocketConnection().then(() => {
            bindEventManagerToSocketEvents()
            toggleSocketConnection(true)
            askForFolderScan()
        })

        return () => {
            // COMPONENT will unmount
            console.log('app will unmount');
        }
    },[])

    // APP-WIDE MULTI-AREA LOGIC
    const shouldLoadNoteIndex = useRef<null|number>(null)
    const lastFolderIn = useRef('')
    const lastSearchIn = useRef('')

    const cleanFileDetails = () => {
        setActiveFileIndex(-1)
        setFileContent(null)
    }

    const cleanFilesList = () => {
        setFiles([])
        resetMultiSelect()
        setIsSearching(false)
    }

    const cleanListAndFileContent = () => {
        console.log('cleanListAndFileContent');
        cleanFileDetails()
        cleanFilesList()
    } 

    const onFilesReceivedCallback:onFilesReceivedFn = 
    (files, isTemporaryResult) => {
        setIsSearching(!isTemporaryResult)
        // if activeFileIndex exists + is in length of files, load it
        if (activeFileIndex !== -1 && activeFileIndex < files.length) {
            askForFileContent(files[activeFileIndex])
        }
        if (isNumber(shouldLoadNoteIndex.current)) {
            console.log(`[LOAD] shouldLoadNoteIndex detected, loading note ${shouldLoadNoteIndex.current}`);
            
            let noteIndex = shouldLoadNoteIndex.current
            setActiveFileIndex(noteIndex)
            if (files.length >= noteIndex + 1) askForFileContent(files[noteIndex])
            shouldLoadNoteIndex.current = null
        }
        // ON LIST ITEMS CHANGES
        if (selectedFolder !== lastFolderIn.current || searchTerm !== lastSearchIn.current) {
            // Load first item list 
            files.length >= 1 && askForFileContent(files[0])
            lastFolderIn.current = selectedFolder
            lastSearchIn.current = searchTerm
            // clean multiselect
            resetMultiSelect()
        }
    }


    //
    // HOOKS
    //
    // Key press
    const {
        ctrlPressed
    } = useKeys({
        onKeyDown: e => {
            onKey(e, 'up', () => {
                let i = activeFileIndex   
                if (i > 0) {
                    setActiveFileIndex(i-1)
                    askForFileContent(files[i-1])    
                }
            })
            onKey(e, 'down', () => {
                let i = activeFileIndex  
                if (i < files.length - 1) {
                    setActiveFileIndex(i+1)
                    askForFileContent(files[i+1])
                }   
            })
        },
        onKeyUp: e => {}
    })

    // Files List
    const {
        activeFileIndex, setActiveFileIndex,
        multiSelectMode, multiSelectArray, 
        files, setFiles,
        askForFolderFiles, resetMultiSelect,
        FilesListComponent
    } = useAppFilesList(
        ctrlPressed,
        onFilesReceivedCallback
    )

    // Tree Folder
    const {
        selectedFolder, setSelectedFolder, 
        askForFolderScan,
        FolderTreeComponent,
        
    } = useAppTreeFolder(
        multiSelectMode, multiSelectArray
        // (folderPath) => {
        //     askForFolderFiles(folderPath)
        // }
    )

    // Search 
    const {
        isSearching, setIsSearching,
        searchTerm, setSearchTerm,
        triggerSearch,
        SearchBarComponent, 
    } = useAppSearch(
        shouldLoadNoteIndex,
        cleanListAndFileContent,
    )

    // Mobile view
    const {
        mobileView, setMobileView,
        MobileToolbarComponent
    } = useMobileView()

    // fileMove logic
    const {
        askForMoveFile,
        promptAndBatchMoveFiles
    } = useFileMove(
        multiSelectArray,
        files,
        resetMultiSelect,
        cleanFileDetails,
    )

    // File Content + Dual Viewer
    let activeFile = files[activeFileIndex] 
    const {
        setFileContent,
        setCanEdit,
        askForFileContent,  
        DualViewerComponent
    } = useFileContent(
        activeFile, activeFileIndex, selectedFolder, files, shouldLoadNoteIndex,
        cleanFileDetails, askForMoveFile, askForFolderFiles)
    
    
    // CONNECTION INDICATOR
    const {
        connectionStatusComponent,
        toggleSocketConnection
    } = useConnectionIndicator(setCanEdit)

    // make sure the interface doesnt scroll
    useFixScrollTop()

   

    
    
    // url routing/react logic
    useUrlLogic(
        isSearching, searchTerm, 
        selectedFolder, activeFileIndex,
        {
            reactToUrlParams: newUrlParams => {
                if (newUrlParams.folder) {
                    let newFileIndex = -1
                    if (isNumber(newUrlParams.file)) newFileIndex = newUrlParams.file
                    if (newFileIndex === -1 && files.length > 0) newFileIndex = 0
                    
                    setSelectedFolder(newUrlParams.folder)
                    setActiveFileIndex(activeFileIndex)
                    setSearchTerm('')
                    askForFolderFiles(newUrlParams.folder)
                }
                if (newUrlParams.search) {
                    console.log('reactToUrlParams -> triggersearch');
                    triggerSearch(newUrlParams.search)
                }
                if (newUrlParams.mobileview) {
                    setMobileView(newUrlParams.mobileview)
                }
            }
        }
    )
    
    
    // window variables
    consoleCli.variables = {
        description: 'variables for script uses',
        func: () => {
             return {
                file:files[activeFileIndex],
                config: configClient
            }
        }
    }

    return (
        // <CssApp v={this.state.mobileView} >
        <CssApp v={mobileView} >
            <Global styles={GlobalCssApp}  />
            
            <div className="main-wrapper">
                
                {
                    connectionStatusComponent()
                }

                {
                    MobileToolbarComponent()
                }

                <div className="left-wrapper">
                    <div className="left-wrapper-1">
                        {
                            FolderTreeComponent({
                                onFolderClicked: folderPath => {
                                    if (multiSelectMode && multiSelectArray.length > 0) {
                                        // MULTISELECT LOGIC
                                        promptAndBatchMoveFiles(folderPath)
                                    } else {
                                        // NORMAL CHANGE FOLDER LOGIC
                                        setSearchTerm('')
                                        shouldLoadNoteIndex.current = 0
                                        setSelectedFolder(folderPath)
                                        cleanListAndFileContent()
                                        askForFolderFiles(folderPath)
                                    }
                                }
                            })
                        }
                    </div> 
                    <div className="left-wrapper-2">
                        {
                            SearchBarComponent(
                                selectedFolder,
                                files
                            )
                        } 
                        {

                            FilesListComponent({
                                selectedFolder:selectedFolder,
                                searchTerm:searchTerm,
                                onNewFile:() => {
                                    clientSocket.emit(socketEvents.createNote, 
                                        {folderPath: selectedFolder} as iSocketEventsParams.createNote
                                    ) 
                                    shouldLoadNoteIndex.current = 0
                                },
                                onFileClicked:fileIndex => {
                                    setActiveFileIndex(fileIndex)
                                    askForFileContent(files[fileIndex])
                                    // this.loadFileDetails(fileIndex)
                                }
                            })
                        }
                    </div>
                </div>


                <div className="right-wrapper">
                    { 
                        DualViewerComponent({})
                    }
                    {/* <DualViewerComponent /> */}
                </div>
            </div>
        </CssApp>
    )
})

