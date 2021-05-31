import { css, Global } from '@emotion/react';
import React, { useEffect,  useMemo,  useRef,  useState } from 'react';
import { deviceType } from './managers/device.manager';
import {  clientSocket2, initSocketConnection } from './managers/sockets/socket.manager';
import {  CssApp2 } from './managers/style/css.manager';
import { useAppTreeFolder, defaultTrashFolder, askFolderCreate, askFolderDelete } from './hooks/app/treeFolder.hook';
import { onFilesReceivedFn, useAppFilesList } from './hooks/app/filesList.hook';
import { useFileContent } from './hooks/app/fileContent.hook';
import { useAppSearch } from './hooks/app/search.hook';
import { useMobileView } from './hooks/app/mobileView.hook';
import { useUrlLogic } from './hooks/app/urlLogic.hook';
import { cloneDeep, debounce, isArray, isNull, isNumber } from 'lodash';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useKeys } from './hooks/app/useKeys.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { addCliCmd } from './managers/cliConsole.manager';
import { configClient } from './config';
import { onKey } from './managers/keys.manager';
import { iFile, iFolder } from '../../shared/types.shared';
import { cleanPath } from '../../shared/helpers/filename.helper';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
import { strings } from './managers/strings.manager';
import { useSearchFromTitle } from './hooks/app/searchFromTitle.hook';
import { LastNotes } from './components/LastNotes.component';
import { useLastFilesHistory } from './hooks/app/lastFilesHistory.hook';
import { useSetupConfig } from './hooks/app/setupConfig.hook';
import { getLoginToken, useLoginToken } from './hooks/app/loginToken.hook';
import { ViewType } from './components/dualView/DualViewer.component';
import { useDynamicResponsive } from './hooks/app/dynamicResponsive.hook';
import { Icon } from './components/Icon.component';
import { cssVars } from './managers/style/vars.style.manager';
import { SettingsPopup } from './components/settingsView/settingsView.component';




export const App2 = () => {

    useEffect(() => {
        // COMPONENT DID MOUNT didmount
        console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

        initSocketConnection().then(() => {
            toggleSocketConnection(true)
            askForFolderScan(openFolders)
        })

        // setInterval(() => {
        //     console.log(1111);
            
        //     // setActiveFileIndex(activeFileIndex+1)
        // }, 1000)

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
    }

    const cleanListAndFileContent = () => {
        console.log('[cleanListAndFileContent]');
        cleanFileDetails()
        cleanFilesList()
    } 
    
    const cleanAllApp = () => {
        console.log('[cleanAllApp]');
        cleanLastFilesHistory()
        cleanFolderHierarchy() 
        cleanFileDetails()
        cleanFilesList()
    }


    const changeToFolder = (folderPath:string, loadFirstNote:boolean = true) => {
        folderPath = cleanPath(folderPath)
        console.log(`[FOLDER CHANGED] to ${folderPath}`);
        
        // SEND FIRST isLeavingNote signal for leaving logic like encryption
        setIsLeavingNote(true)
        // NORMAL CHANGE FOLDER LOGIC
        setTimeout(() => {
            setSearchTerm('')
            if (loadFirstNote) shouldLoadNoteIndex.current = 0
            setSelectedFolder(folderPath)
            cleanListAndFileContent()
            askForFolderFiles(folderPath)
            setIsLeavingNote(false)
        })
    }


    const onFilesReceivedCallback:onFilesReceivedFn = 
    (files, isTemporaryResult) => {
        setIsSearching(isTemporaryResult)
        
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

    // Setup config file and welcoming screen logic
    const {SetupPopupComponent} = useSetupConfig({cleanAllApp})

    // Setup config file and welcoming screen logic
    const {LoginPopupComponent} = useLoginToken({cleanListAndFileContent})
    
    // Key press
    const {
        shiftPressed,
        ctrlPressed,
        altPressed
    } = useKeys({
        onKeyDown: e => {
            onKey(e, 'up', () => {
                console.log('up!', activeFileIndex);
                
                let i = activeFileIndex   
                if (i > 0) {
                    setActiveFileIndex(i-1)
                    askForFileContent(files[i-1])    
                }
            })
            onKey(e, 'down', () => {
                console.log('up!down', activeFileIndex);
                let i = activeFileIndex  
                if (i < files.length - 1) {
                    setActiveFileIndex(i+1)
                    askForFileContent(files[i+1])
                }   
            })
            onKey(e, '!', () => { if (ctrlPressed.current ) setDualViewType('editor') })
            onKey(e, '@', () => { if (ctrlPressed.current) setDualViewType('both') })
            onKey(e, '#', () => { if (ctrlPressed.current) setDualViewType('preview') })
        },
        onKeyUp: e => {
            // onKey(e, 'v', () => {
            //     if (altPressed.current  && shiftPressed) setDualViewType('editor')
            // })
        }
    })

    // toggle dualviewtype on alt+v
    const [dualViewType, setDualViewType] = useState<ViewType>('both') 

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
        openFolders,
        addToOpenedFolders,
        removeToOpenedFolders,

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
        cleanFolderHierarchy,
        askForFolderScan,
    )


    // Search Note from title
    const {getSearchedTitleFileIndex, searchFileFromTitle} = useSearchFromTitle({changeToFolder})

    // File Content + Dual Viewer
    let activeFile = files[activeFileIndex] 
    const {
        fileContent,
        setFileContent,
        setCanEdit,
        askForFileContent,  
        DualViewerComponent
    } = useFileContent(
        activeFile, activeFileIndex, selectedFolder, files, shouldLoadNoteIndex,
        cleanFileDetails, askForMoveFile, askForFolderFiles
    )

    // last Note + files history array
    const {filesHistory, cleanLastFilesHistory} = useLastFilesHistory(activeFile)
    
    
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
        selectedFolder, activeFile,
        activeFileIndex,
        {
            reactToUrlParams: newUrlParams => {
                // timeout of 1000 as sometimes when loading is too long, not working
                setTimeout(() => {
                    // new way
                    if (newUrlParams.folder && newUrlParams.title) {
                        searchFileFromTitle(newUrlParams.title, newUrlParams.folder)
                    }
                    if (newUrlParams.search) {
                        console.log('reactToUrlParams -> triggersearch');
                        triggerSearch(newUrlParams.search)
                    }
                    if (newUrlParams.mobileview) {
                        setMobileView(newUrlParams.mobileview)
                    }
                }, 1000)
            }
        }
    )
    
    // DYNAMIC RESPONSIVE RERENDER (ON DEBOUNCE)
    const {forceResponsiveRender} = useDynamicResponsive()

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
            promptAndMoveFolder({folder:item.folder, folderToDropInto, folderBasePath})
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

    // Show settings panel
    const [showSettingsPopup, setShowSettingsPopup] = useState(false)
    
    return (
            <div  className={CssApp2(mobileView)} >
                <Global styles={GlobalCssApp}  />
                    <div role="dialog" className="main-wrapper">
                        {
                            LoginPopupComponent({})
                        }
                        
                        {
                            SetupPopupComponent({})
                        }

                        {
                            connectionStatusComponent()
                        }

                        {
                            MobileToolbarComponent(forceResponsiveRender)
                        }

                        <div className="left-wrapper">
                            <div className="left-wrapper-1">
                                <div className="invisible-scrollbars">
                                    <NewFileButton
                                        onNewFile= {() => {
                                            clientSocket2.emit('createNote', {folderPath: selectedFolder, token: getLoginToken()}) 
                                            shouldLoadNoteIndex.current = 0
                                        }}
                                    />
                                    
                                    <LastNotes 
                                        files={filesHistory}
                                        onClick={file => {
                                            searchFileFromTitle(file.name, file.folder)
                                        }}
                                    />

                                    {
                                        FolderTreeComponent({
                                            onFolderClicked: folderPath => {
                                                setIsSearching(true)
                                                changeToFolder(folderPath)
                                            },
                                            onFolderMenuAction: (action, folder, newTitle) => {
                                                if (action === 'rename' && newTitle) {
                                                    promptAndMoveFolder({
                                                        folder, 
                                                        folderToDropInto:folder, 
                                                        folderBasePath, 
                                                        newTitle, 
                                                        renameOnly: true
                                                    })
                                                } else if (action === 'create' && newTitle) {
                                                    askFolderCreate(newTitle, folder)
                                                    askForFolderScan([folder.path])
                                                } else if (action === 'moveToTrash') {
                                                    promptAndMoveFolder({folder, folderToDropInto:defaultTrashFolder, folderBasePath, newTitle})
                                                } else if (action === 'delete') {
                                                    askFolderDelete(folder)
                                                    askForFolderScan([folder.path])
                                                }
                                            },
                                            onFolderOpen: folderPath => {
                                                addToOpenedFolders(folderPath)
                                                askForFolderScan([folderPath])
                                            },
                                            onFolderClose: folderPath => {
                                                removeToOpenedFolders(folderPath)
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

                                <div className="settings-button" onClick={() => {
                                    setShowSettingsPopup(!showSettingsPopup)
                                }}>
                                    <Icon name="faCog" color='grey' /> 
                                </div>
                                
                                {
                                    showSettingsPopup &&
                                        <SettingsPopup onClose={() => {
                                            setShowSettingsPopup(false)
                                        }} />
                                }

                            </div> 
                            <div className="left-wrapper-2">
                                <div className="top-files-list-wrapper">
                                    <div className="subtitle-wrapper">
                                        <h3 className="subtitle">{strings.files}</h3>
                                        {/* <p className="counter">{files.length}</p> */}
                                    </div>
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
                                DualViewerComponent({
                                    isLeavingNote,
                                    viewType: dualViewType,
                                    forceRender: forceResponsiveRender,
                                    onBackButton: () => {
                                        let file = filesHistory[1]
                                        if (!filesHistory[1]) return
                                        searchFileFromTitle(file.name, file.folder)
                                    }
                                })
                            }
                            {/* <DualViewerComponent /> */}
                        </div>
                    </div>
                </div>
    )
}

