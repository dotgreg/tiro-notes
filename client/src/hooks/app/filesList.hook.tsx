import { cloneDeep, debounce, filter, sortBy } from 'lodash';
import React, {  useEffect, useLayoutEffect, useRef, useState } from 'react';
import { iApiDictionary } from '../../../../shared/apiDictionary.type';
import { iFile, iFilePreview } from '../../../../shared/types.shared';
import { Icon } from '../../components/Icon.component';
import { List, onFileDragStartFn, SortModes, SortModesLabels } from '../../components/List.component';
import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { useDebounce } from '../lodash.hooks';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';

export type onFilesReceivedFn = (files:iFile[], temporaryResults: boolean) => void
export interface FilesPreviewObject {[path:string]:iFilePreview}

export const useAppFilesList = (
    modifierPressed:boolean,
    onFilesReceivedCallback: onFilesReceivedFn
) => {
    
    // STATE
    const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)
    
    const [sortMode, setSortMode] = useLocalStorage<number>('sortMode',2)
    const [files, setFiles] = useState<iFile[]>([])
    const [forceListUpdate, setForceListUpdate] = useState(0)
    

    const listenerId = useRef<number>(0)
    // SOCKET INTERACTIONS
    useEffect(() => {
        console.log(`[FILES LIST] init socket listener`);
        listenerId.current = clientSocket2.on('getFiles', data => { onFolderFilesReceived(data) })
        return () => {
            console.log(`[FILES LIST] clean socket listener`);
            clientSocket2.off(listenerId.current)
        }
    }, [])
    
    const askForFolderFiles = (folderPath:string) => {
        clientSocket2.emit('askForFiles', {folderPath: folderPath, token: getLoginToken()})
    }










    //
    // FILES PREVIEWS
    //
    const [filesPreviewObj, setFilesPreviewObj] = useState<FilesPreviewObject>({})
    const listenerId2 = useRef<number>(0)

    const askFilesPreview = (filesPath:string[]) => {
        // do not ask again if file already has been fetched
        let newFilesPathArr:string[] = []
        
        for (let i = 0; i < filesPath.length; i++) {
            const path = filesPath[i];
            if(!filesPreviewObj[path]) newFilesPathArr.push(path)
        }
        
        if (newFilesPathArr.length > 1) {
            console.log(`[LIST PREVIEW] askFilesPreview ${filesPath.length} asked but sent request for ${newFilesPathArr.length}`);
            clientSocket2.emit('askFilesPreview', {filesPath: newFilesPathArr, token: getLoginToken()})
        } else {
            console.log(`[LIST PREVIEW] no request sent`);
        }
    }

    useEffect(() => {
        listenerId2.current = clientSocket2.on('getFilesPreview',processFilesPreview)
        return () => {
            clientSocket2.off(listenerId2.current)
        }
    }, [filesPreviewObj])

    useEffect(() => {
        setFilesPreviewObj({})
    }, [files])

    const processFilesPreview = (data:iApiDictionary['getFilesPreview']) => {
        let newFilesPreviewObj:FilesPreviewObject = cloneDeep(filesPreviewObj)
        for (let i = 0; i < data.filesPreview.length; i++) {
            const filePreview = data.filesPreview[i];
            newFilesPreviewObj[filePreview.path] = filePreview
        }
        setFilesPreviewObj(newFilesPreviewObj)
    }

    










    // DATA PROCESSING FUNCTIONS
    const onFolderFilesReceived = (data:iApiDictionary['getFiles']) => {
        // only keep md files in file list
        let files = filter(data.files, {extension: 'md'})

        // sort them
        console.log(`[SORT] sorting received files with sort mode ${sortMode} : ${SortModes[sortMode]}`);
        files = sortFiles(files, sortMode)

        setFiles(files)
        // isSearching: data.temporaryResults ? true : false

        onFilesReceivedCallback(files, data.temporaryResults || false)
    }







    // RENDERING FUNCTIONS & COMPONENT
    const sortFiles = (files:iFile[], sortMode:any):iFile[] => {
        let sortedFiles
        switch (SortModes[sortMode]) {
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
            sortedFiles = sortBy(files, [file => file.realname.toLocaleLowerCase()])
            break;
        }
    
        return sortedFiles
      }





    const FilesListComponent = (p:{
        searchTerm: string,
        selectedFolder: string,
        onFileClicked: (fileIndex:number)=>void
        onFileDragStart: onFileDragStartFn
        onFileDragEnd: ()=>void
    }) => useStatMemo(
        <div className="files-list-component">
            <div className='list-toolbar'>
                <button 
                    type="button" 
                    title='sort'
                    onClick={e => {
                        let newMode = sortMode + 1 >= SortModes.length ? 0 : sortMode + 1
                        setSortMode(newMode)
                        setFiles(sortFiles(files, newMode))
                    }}
                > 
                    <span> { files.length > 0 && <span className='list-count'>({files.length})</span>} { SortModesLabels[sortMode] } </span> 
                    <Icon name="faSort" color={cssVars.colors.l2.text} /> 
                </button>

                {/* { files.length > 0 &&
                    <span className='items-list-count'>{files.length} els</span>
                } */}
                

            </div>



            {
            /////////////////////////////
            // LIST
            /////////////////////////////
            }
            <div 
                className="list-wrapper"
                // onScroll={(e) => {
                //     console.log('scrollOnList', );
                    
                // }}
            >
                <List
                    files={files} 
                    filesPreview={filesPreviewObj}

                    hoverMode={false}
                    activeFileIndex={activeFileIndex}
                    modifierPressed={modifierPressed}

                    sortMode={sortMode}

                    onFileClicked={(fileIndex) => {
                        setActiveFileIndex(fileIndex)
                        p.onFileClicked(fileIndex)
                    }}

                    onFileDragStart={p.onFileDragStart}
                    onFileDragEnd={p.onFileDragEnd}

                    onVisibleItemsChange={visibleFilesPath => {
                        askFilesPreview(visibleFilesPath)
                    }}
                    />
                </div>
            </div>
    , [files, activeFileIndex, sortMode, forceListUpdate, modifierPressed, filesPreviewObj])

    return {
        activeFileIndex, setActiveFileIndex,
        files, setFiles,
        askForFolderFiles,
        FilesListComponent,
    }
} 