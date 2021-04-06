import { Global } from '@emotion/react';
import React, { useEffect,  useMemo,  useRef,  useState } from 'react';
import { TreeView } from './components/TreeView.Component';
import { deviceType } from './managers/device.manager';
import { iSocketEventsParams, socketEvents } from '../../shared/sockets/sockets.events';
import { clientSocket, initSocketConnection } from './managers/sockets/socket.manager';
import { CssApp } from './managers/style/css.manager';
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
import { addCliCmd, consoleCli } from './managers/cliConsole.manager';
import { configClient } from './config';
import { onKey } from './managers/keys.manager';
import { iFile, iFolder } from '../../shared/types.shared';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
import { strings } from './managers/strings.manager';
import { useSearchFromTitle } from './hooks/app/searchFromTitle.hook';
import { LastNotes } from './components/LastNotes.component';
import { useLastFilesHistory } from './hooks/app/lastFilesHistory.hook';




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
        setIsSearching(false)
    }

    const cleanListAndFileContent = () => {
        console.log('cleanListAndFileContent');
        cleanFileDetails()
        cleanFilesList()
    } 


    const changeToFolder = (folderPath:string) => {
        console.log(`[FOLDER CHANGED] to ${folderPath}`);
        // setTest2(`${test2} ${activeFile?.name}`)
        // setTest2(test2+1)
        
        // SEND FIRST isLeavingNote signal for leaving logic like encryption
        setIsLeavingNote(true)
        // NORMAL CHANGE FOLDER LOGIC
        setTimeout(() => {
            setSearchTerm('')
            shouldLoadNoteIndex.current = 0
            setSelectedFolder(folderPath)
            cleanListAndFileContent()
            askForFolderFiles(folderPath)
            setIsLeavingNote(false)
        })
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
            setActiveFileIndex(0)
            lastFolderIn.current = selectedFolder
            lastSearchIn.current = searchTerm
        }
        
        // IF WE ARE ON SEARCH TITLE LOGIC 
        // find a file whom title is the one we searched, else go to index 0
        const indexSearch = getSearchedTitleFileIndex(files)
        if ( indexSearch !== -1 ) {
            if (files[indexSearch]) {
                setActiveFileIndex(indexSearch)
                askForFileContent(files[indexSearch])
            }
        }
    }


    //
    // HOOKS
    //
    // Key press
    const {
        shiftPressed
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
        files, setFiles,
        askForFolderFiles, 
        FilesListComponent,
    } = useAppFilesList(
        shiftPressed,
        onFilesReceivedCallback
    )

    // Tree Folder
    const {
        folderBasePath,
        selectedFolder, setSelectedFolder, 
        askForFolderScan,
        FolderTreeComponent,
        cleanFolderHierarchy
    } = useAppTreeFolder()

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
        promptAndMoveFolder,
        promptAndBatchMoveFiles
    } = useFileMove(
        cleanFileDetails,
        cleanFilesList,
        cleanFolderHierarchy
    )


    // Search Note from title
    const {getSearchedTitleFileIndex, searchFileFromTitle} = useSearchFromTitle({changeToFolder})

    // File Content + Dual Viewer
    let activeFile = files[activeFileIndex] 
    const {
        setFileContent,
        setCanEdit,
        askForFileContent,  
        DualViewerComponent
    } = useFileContent(
        activeFile, activeFileIndex, selectedFolder, files, shouldLoadNoteIndex,
        cleanFileDetails, askForMoveFile, askForFolderFiles
    )

    // last Note + files history array
    const {filesHistory} = useLastFilesHistory(activeFile)
    
    
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


    // DRAG/DROP FOLDER/FILES MOVING LOGIC
    interface iDraggedItem {type:'file'|'folder', files?:iFile[], folder?:iFolder}
    // const [draggedItems,setDraggedItems] = useState<iDraggedItem[]>([])
    const draggedItems = useRef<iDraggedItem[]>([])

    const processDragDropAction = (folderToDropInto:iFolder) => {
        console.log(`[DRAG MOVE] processDragDropAction ->`,draggedItems.current,folderToDropInto);
        let item = draggedItems.current[0]
        if (item.type === 'file' && item.files) {
            promptAndBatchMoveFiles(item.files, folderToDropInto)
        } else if (item.type === 'folder' && item.folder) {
            promptAndMoveFolder(item.folder, folderToDropInto, folderBasePath)
        }
    }
    
    // ... quand hover 
    // creer menu context
    // quand rename, creer prompt
    // backend rename folder

    
    // window variables
    addCliCmd('variables', {
        description: 'variables for script uses',
        func: () => {
             return {
                file:files[activeFileIndex],
                config: configClient
            }
        }
    })

    // Send Note Leaving Signal
    const [isLeavingNote, setIsLeavingNote] = useState(false)
    
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
                        <div className="invisible-scrollbars">
                            <NewFileButton
                                onNewFile= {() => {
                                    clientSocket.emit(socketEvents.createNote, 
                                        {folderPath: selectedFolder} as iSocketEventsParams.createNote
                                    ) 
                                    shouldLoadNoteIndex.current = 0
                                }}
                            />
                            {/* {test2} */}
                            {/* {filesHistory.length} */}
                            <LastNotes 
                                files={filesHistory}
                                onClick={file => {
                                    searchFileFromTitle(file.name, file.folder)
                                }}
                            />

                            {
                                FolderTreeComponent({
                                    onFolderClicked: folderPath => {
                                        changeToFolder(folderPath)
                                    },
                                    onFolderDragStart:draggedFolder => {
                                        console.log(`[DRAG MOVE] onFolderDragStart`, draggedFolder);
                                        draggedItems.current = [{type:'folder', folder:draggedFolder}]
                                    },
                                    onFolderDragEnd:() => {
                                        console.log(`[DRAG MOVE] onFolderDragEnd`);
                                        draggedItems.current = []

                                    },
                                    onFolderDrop:folderDroppedInto => {
                                        processDragDropAction(folderDroppedInto)
                                    }
                                })
                            }
                        </div>
                    </div> 
                    <div className="left-wrapper-2">
                        <div className="top-files-list-wrapper">
                            <h3 className="subtitle">{strings.files}</h3>
                            {
                                SearchBarComponent(
                                    selectedFolder,
                                    files
                                )
                            } 
                        </div>
                        {

                            FilesListComponent({
                                selectedFolder:selectedFolder,
                                searchTerm:searchTerm,
                                onFileClicked:fileIndex => {
                                    setActiveFileIndex(fileIndex)
                                    askForFileContent(files[fileIndex])
                                    // this.loadFileDetails(fileIndex)
                                },
                                onFileDragStart:files => {
                                    console.log(`[DRAG MOVE] onFileDragStart`, files);
                                    draggedItems.current = [{type:'file', files:files}]
                                },
                                onFileDragEnd:() => {
                                    console.log(`[DRAG MOVE] onFileDragEnd`);
                                    draggedItems.current = []
                                },
                            })
                        }
                    </div>
                </div>


                <div className="right-wrapper">
                    { 
                        DualViewerComponent({isLeavingNote})
                    }
                    {/* <DualViewerComponent /> */}
                </div>
            </div>
        </CssApp>
    )
})

