import { filter, sortBy } from 'lodash';
import React, {  useEffect, useRef, useState } from 'react';
import { iSocketEventsParams, socketEvents } from '../../../../shared/sockets/sockets.events';
import { iFile } from '../../../../shared/types.shared';
import { Icon } from '../../components/Icon.component';
import { List, SortModes, SortModesLabels } from '../../components/List.component';
import { socketEventsManager } from '../../managers/sockets/eventsListener.sockets';
import { clientSocket } from '../../managers/sockets/socket.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';

export type onFilesReceivedFn = (files:iFile[], temporaryResults: boolean) => void

export const useAppFilesList = (
    onFilesReceivedCallback: onFilesReceivedFn
) => {
    
    // STATE
    const [activeFileIndex, setActiveFileIndex] = useLocalStorage<number>('activeFileIndex',-1)
    const [multiSelectMode, setMultiSelectMode] = useState(false)
    const [multiSelectArray, setMultiSelectArray] = useState<number[]>([])
    
    const [sortMode, setSortMode] = useLocalStorage<number>('sortMode',3)
    const [files, setFiles] = useLocalStorage<iFile[]>('files',[])
    
    const [ctrlPressed, setCtrlPressed] = useState(false)

    // SOCKET INTERACTIONS
    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[FILES LIST] init socket listener`);
        listenerId.current = socketEventsManager.on(
            socketEvents.getFiles, 
            (data:iSocketEventsParams.getFiles) => {  
              onFolderFilesReceived(data)
            }
        )
        return () => {
            console.log(`[FILES LIST] clean socket listener`);
            socketEventsManager.off(listenerId.current)
        }
    }, [])
    const askForFolderFiles = (folderPath:string) => {
        clientSocket.emit(socketEvents.askForFiles, {folderPath: folderPath} as iSocketEventsParams.askForFiles)
    }





    // DATA PROCESSING FUNCTIONS
    const onFolderFilesReceived = (data:iSocketEventsParams.getFiles) => {
        // only keep md files in file list
        let files = filter(data.files, {extension: 'md'})

        // sort them
        files = sortFiles(files, sortMode)

        setFiles(files)
        // isSearching: data.temporaryResults ? true : false

        onFilesReceivedCallback(files, data.temporaryResults || false)
    }



    // OTHER FUNCTIONS
    const resetMultiSelect = () => {
        setMultiSelectMode(false)
        setMultiSelectArray([])
    }






    // RENDERING FUNCTIONS & COMPONENT
    const sortFiles = (files:iFile[], sortMode:any):iFile[] => {
        let sortedFiles
        switch (SortModes[sortMode]) {
          case 'none':
            sortedFiles = sortBy(files, ['index'])
            break;
          case 'alphabetical':
            sortedFiles = sortBy(files, [file => file.realname.toLocaleLowerCase()])
            break;
          case 'created':
            sortedFiles = sortBy(files, ['created']).reverse()
            break;
          case 'modified':
            sortedFiles = sortBy(files, ['modified']).reverse()
            break;
        
          default:
            sortedFiles = sortBy(files, ['index'])
            break;
        }
    
        return sortedFiles
      }





    const FilesListComponent = (p:{
        searchTerm: string,
        selectedFolder: string,
        onFileClicked: (fileIndex:number)=>void
    }) => useStatMemo(
        <div>
            <div className='list-toolbar'>
                { p.searchTerm === '' &&
                    <button 
                        onClick={(e) => {
                            clientSocket.emit(socketEvents.createNote, 
                                {folderPath: p.selectedFolder} as iSocketEventsParams.createNote
                            ) 
                            setActiveFileIndex(0)
                        }}
                    >
                        <Icon name="faStickyNote" />
                    </button>
                }

                <button 
                    type="button" 
                    title={multiSelectMode ? 'Select:On' : 'Select:Off'}
                    onClick={e => {
                        setMultiSelectMode(!multiSelectMode)
                        setMultiSelectArray([])
                    }}
                > 
                    <Icon name="faCheckDouble" /> 
                </button>

                <button 
                    type="button" 
                    title='sort'
                    onClick={e => {
                        let newMode = sortMode + 1 >= SortModes.length ? 0 : sortMode + 1
                        setSortMode(newMode)
                        setFiles(sortFiles(files, newMode))
                    }}
                > 
                    <Icon name="faSort" /> { sortMode !== 0 && SortModesLabels[sortMode] } 
                </button>

                { files.length > 0 &&
                    <span className='items-list-count'>{files.length} els</span>
                }

            </div>



            {
            /////////////////////////////
            // LIST
            /////////////////////////////
            }
            <div className="list-wrapper">
                <List
                    files={files} 
                    hoverMode={false}
                    activeFileIndex={activeFileIndex}
                    ctrlPressed={ctrlPressed}

                    sortMode={sortMode}

                    multiSelectArray={multiSelectArray}
                    multiSelectMode={multiSelectMode}
                    onMultiSelectChange={arr => setMultiSelectArray(arr)}

                    onFileClicked={(fileIndex) => {
                        setActiveFileIndex(fileIndex)
                        p.onFileClicked(fileIndex)
                    }}
                    />
                </div>
            </div>
    , [files, activeFileIndex, multiSelectArray, multiSelectMode, sortMode])

    return {
        activeFileIndex, setActiveFileIndex,
        files, setFiles,
        multiSelectMode, multiSelectArray,
        askForFolderFiles, resetMultiSelect,
        FilesListComponent
    }
} 