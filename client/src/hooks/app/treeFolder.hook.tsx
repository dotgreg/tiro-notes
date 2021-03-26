import React, {  useEffect, useRef } from 'react';
import { iSocketEventsParams, socketEvents } from '../../../../shared/sockets/sockets.events';
import { iFolder } from '../../../../shared/types.shared';
import { onFolderDragStartFn, onFolderDropFn, TreeView } from "../../components/TreeView.Component"
import { socketEventsManager } from '../../managers/sockets/eventsListener.sockets';
import { clientSocket } from '../../managers/sockets/socket.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';

export type onFolderClickedFn = (folderPath:string) => void

export const useAppTreeFolder = () => {

    const defaultFolderVal:iFolder = {title: 'loading...', key: '', path: ''}
    
    
    const [folderHierarchy, setFolderHierarchy] = useLocalStorage<iFolder>('folderHierarchy',defaultFolderVal)
    const [folderBasePath, setFolderBasePath] = useLocalStorage('folderBasePath','')
    const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selectedFolder','')
    const [expandedKeys, setExpandedKeys] = useLocalStorage<string[]>('expandedKeys',[])

    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[TREE FOLDER] init socket listener`);
        listenerId.current = socketEventsManager.on(
            socketEvents.getFolderHierarchy, 
            (data:iSocketEventsParams.getFolderHierarchy) => {  
                setFolderHierarchy(data.folder)
                setFolderBasePath(data.pathBase)
            }
        )
        return () => {
            console.log(`[TREE FOLDER] clean socket listener`);
            socketEventsManager.off(listenerId.current)
        }
    }, [])
    

    const cleanFolderHierarchy = () => {
        setFolderHierarchy(defaultFolderVal)
    }
    
    const askForFolderScan = () => {
        console.log(`[TREE FOLDER] askForFolderScan`);
        clientSocket.emit(socketEvents.askFolderHierarchy, {folderPath: ''} as iSocketEventsParams.askFolderHierarchy)  
    }
    
    const FolderTreeComponent = (p:{
        onFolderClicked,
        onFolderDragStart: onFolderDragStartFn,
        onFolderDragEnd,
        onFolderDrop: onFolderDropFn
    }) =>  
        useStatMemo(
            <TreeView
                current={selectedFolder}
                folder={folderHierarchy}
                onFolderClicked={p.onFolderClicked}
                onFolderDragStart={p.onFolderDragStart}
                onFolderDragEnd={p.onFolderDragEnd}
                onFolderDrop={p.onFolderDrop}
            />
            , [folderHierarchy, expandedKeys,selectedFolder]
        )
    

    return {
        folderBasePath,
        selectedFolder, setSelectedFolder, 
        cleanFolderHierarchy,
        askForFolderScan,
        FolderTreeComponent
    }
}
