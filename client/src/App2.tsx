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
    const shouldLoadFirstNote = useRef(false)
    const lastFolderIn = useRef('')
    const lastSearchIn = useRef('')

    const cleanListAndFileContent = () => {
        console.log('cleanListAndFileContent');
        
        setSelectedFolder('')

        setActiveFileIndex(-1)
        setFiles([])
        resetMultiSelect()
        
        setFileContent(null)
        
        setIsSearching(false)
    }

    const onFilesReceivedCallback:onFilesReceivedFn = 
    (files, isTemporaryResult) => {
        setIsSearching(!isTemporaryResult)
        // if activeFileIndex exists + is in length of files, load it
        if (activeFileIndex !== -1 && activeFileIndex < files.length) {
            askForFileContent(files[activeFileIndex])
        }
        if (shouldLoadFirstNote.current) {
            setActiveFileIndex(0)
            files.length >= 1 && askForFileContent(files[0])
            shouldLoadFirstNote.current = false
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

    // Tree Folder
    const {
        selectedFolder, setSelectedFolder, 
        askForFolderScan,
        FolderTreeComponent
    } = useAppTreeFolder(
        // (folderPath) => {
        //     askForFolderFiles(folderPath)
        // }
    )
     
    // Files List
    const {
        activeFileIndex, setActiveFileIndex,
        multiSelectMode, multiSelectArray, 
        files, setFiles,
        askForFolderFiles, resetMultiSelect,
        FilesListComponent
    } = useAppFilesList(onFilesReceivedCallback)

    // File Content
    let activeFile = files[activeFileIndex] 
    const {
        setFileContent,fileContent,
        askForFileContent, 
        DualViewerComponent
    } = useFileContent(activeFile)
    
    // Search 
    const {
        isSearching, setIsSearching,
        searchTerm, setSearchTerm,
        triggerSearch,
        SearchBarComponent, 
    } = useAppSearch(
        shouldLoadFirstNote,
        cleanListAndFileContent,
    )

    // Mobile view
    const {
        mobileView, setMobileView,
        MobileToolbarComponent
    } = useMobileView()

    // fileMove logic
    const emptyFileContent = () => { setActiveFileIndex(-1); setFileContent(null)}
    const {
        moveFile,
        promptAndBatchMoveFiles
    } = useFileMove(
        multiSelectArray,
        files,
        resetMultiSelect,
        emptyFileContent,
    )
    
    // CONNECTION INDICATOR
    const {
        connectionStatusComponent,
        toggleSocketConnection
    } = useConnectionIndicator()
    
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
                                        shouldLoadFirstNote.current = true
                                        setSelectedFolder(folderPath)
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

