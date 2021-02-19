import React, {  useEffect, useRef } from 'react';
import { iSocketEventsParams, socketEvents } from '../../../../shared/sockets/sockets.events';
import { iFolder } from '../../../../shared/types.shared';
import { TreeView } from "../../components/TreeView.Component"
import { socketEventsManager } from '../../managers/sockets/eventsListener.sockets';
import { clientSocket } from '../../managers/sockets/socket.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';

export type onFolderClickedFn = (folderPath:string) => void

export const useAppTreeFolder = (multiSelectMode, multiSelectArray) => {

    const [folderHierarchy, setFolderHierarchy] = useLocalStorage<iFolder>('folderHierarchy',{title: 'loading...', key: '', path: ''})
    // const [folderHierarchy, setFolderHierarchy] = useState<iFolder>({title: 'loading...', key: '', path: ''})
    const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selectedFolder','')
    const [expandedKeys, setExpandedKeys] = useLocalStorage<string[]>('expandedKeys',[])

    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[TREE FOLDER] init socket listener`);
        listenerId.current = socketEventsManager.on(
            socketEvents.getFolderHierarchy, 
            (data:iSocketEventsParams.getFolderHierarchy) => {  
                setFolderHierarchy(data.folder)
            }
        )
        return () => {
            console.log(`[TREE FOLDER] clean socket listener`);
            socketEventsManager.off(listenerId.current)
        }
    }, [])
    
    
    const askForFolderScan = () => {
        console.log(`[TREE FOLDER] askForFolderScan`);
        clientSocket.emit(socketEvents.askFolderHierarchy, {folderPath: ''} as iSocketEventsParams.askFolderHierarchy)  
    }
    
    const FolderTreeComponent = (p:{onFolderClicked}) =>  
        useStatMemo(
            <TreeView
                expandedKeys={expandedKeys}
                onExpandedKeysChange={newKeys => {setExpandedKeys(newKeys)}}

                selected={selectedFolder}
                folder={folderHierarchy}
                onFolderClicked={p.onFolderClicked}
                onFolderRightClicked = {folderPath => {}}
            />
            , [folderHierarchy, expandedKeys,multiSelectMode, multiSelectArray, selectedFolder]
        )
    

    return {
        selectedFolder, setSelectedFolder, 
        askForFolderScan,
        FolderTreeComponent
    }
}
