import { cloneDeep, isArray } from 'lodash';
import React, {  useEffect, useRef, useState } from 'react';
import { iAppView, iFolder } from '../../../../shared/types.shared';
import { onFolderDragStartFn, onFolderDropFn, onFolderMenuActionFn, TreeView } from "../../components/TreeView.Component"
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';

export type onFolderClickedFn = (folderPath:string) => void
export const defaultFolderVal:iFolder = {title: '', key: '', path: ''}



export const useAppTreeFolder = (currentAppView: iAppView) => {
    const [foldersFlat, setFoldersFlat] = useLocalStorage<iFolder[]>('foldersFlat',[])
    const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
    
    const [folderBasePath, setFolderBasePath] = useLocalStorage('folderBasePath','')
    const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selectedFolder','')
    const [openFolders, setOpenFolders] = useLocalStorage<string[]>('openFolders',['/'])

    const listenerId = useRef<number>(0)
    useEffect(() => {
        console.log(`[TREE FOLDER] init socket listener`);
        listenerId.current = clientSocket2.on('getFoldersScan', data => {
            let newflatStruct:iFolder[] = foldersFlat
            for (let i = 0; i < data.folders.length; i++) {
                if (data.folders[i]) newflatStruct = upsertFlatStructure(data.folders[i], newflatStruct);
            }
            setFoldersFlat(newflatStruct)

            let newTreeStruct = buildTreeFolder('/',newflatStruct)
            if (newTreeStruct) setFolderHierarchy(newTreeStruct)
            setFolderBasePath(data.pathBase)
        })
        return () => {
            console.log(`[TREE FOLDER] clean socket listener`);
            clientSocket2.off(listenerId.current)
        }
    }, [])

    // FOLDERS MANIPULATION

    // const renameFolder = (folder:iFolder, newName:string) => {
    //     let initPath = `${folderPathBase}/${rels[0]}`
    //     let endPath = `${folderPathBase}/${rels[1]}`
    //     askForMoveFolder(initPath, endPath)
    //     emptyFileDetails()
    //     cleanFilesList()
    //     cleanFolderHierarchy()
    //     updateUrl({})
    //     askForFolderScan([getFolderParentPath(folder), folderToDropInto.path])
    // }
    

    // OPEN TREE FOLDER MANAGEMENT
    const addToOpenedFolders = (folderPath:string) => {
        setOpenFolders([...openFolders, folderPath])
    }
    const removeToOpenedFolders = (folderPath:string) => {
        const newopenFolders = openFolders
        const index = newopenFolders.indexOf(folderPath);
        if (index > -1) {
            newopenFolders.splice(index, 1);
        }
        setOpenFolders(newopenFolders)
    }

    const cleanFolderHierarchy = () => {
        setFolderHierarchy(defaultFolderVal)
    }
    
    // FOLDER SCAN
    const askForFolderScan = (foldersPaths: string[]) => {
        console.log(`[TREE FOLDER] askForFolderScan with foldersPaths:`,{foldersPaths});
        clientSocket2.emit('askFoldersScan', {foldersPaths, token: getLoginToken()})  
    }
    
    // COMPONENTS
    const FolderTreeComponent = (p:{
        onFolderClicked,
        onFolderMenuAction: onFolderMenuActionFn,
        onFolderOpen,
        onFolderClose,
        onFolderDragStart: onFolderDragStartFn,
        onFolderDragEnd,
        onFolderDrop: onFolderDropFn
    }) =>  
        useStatMemo(
            <TreeView
                current={selectedFolder}
                folder={folderHierarchy}
                onFolderClicked={p.onFolderClicked}
                onFolderMenuAction={p.onFolderMenuAction}
                onFolderOpen={p.onFolderOpen}
                onFolderClose={p.onFolderClose}
                onFolderDragStart={p.onFolderDragStart}
                onFolderDragEnd={p.onFolderDragEnd}
                onFolderDrop={p.onFolderDrop}
            />
            , [folderHierarchy, openFolders, selectedFolder, currentAppView]
        )
    

    return {
        openFolders,
        addToOpenedFolders,
        removeToOpenedFolders,

        folderBasePath,
        selectedFolder, setSelectedFolder, 
        cleanFolderHierarchy,
        askForFolderScan,
        FolderTreeComponent
    }
}



export const buildTreeFolder = (path:string, folders:iFolder[]):iFolder|null => {
    let res
    for (let i = 0; i < folders.length; i++) {
        if (folders[i].path === path) {
            // console.log('131313 FOUND', path, folders[i]);
            res = cloneDeep(folders[i])

            const children = folders[i].children
            if (isArray(children)) {
                for (let y = 0; y < children.length; y++) {
                    let childSearch = buildTreeFolder(children[y].path, folders)
                    if (childSearch) res.children[y] = childSearch
                }
            }
        } 
    }
    return res
}

export const upsertFlatStructure = (newFolder:iFolder, flatStructure: iFolder[]):iFolder[] => {
    let updateType = 'add'
    for (let i = 0; i < flatStructure.length; i++) {
        if (newFolder.path === flatStructure[i].path) {
            flatStructure[i] = newFolder
            updateType = 'update'
        }
    }

    if (updateType === 'add') {
        flatStructure.push(newFolder)
    }

    return flatStructure
}

export const defaultTrashFolder:iFolder = {title: '.trash', key:'/.tiro/.trash', path:'/.tiro/.trash'}

export const askFolderCreate = (newFolderName:string, parent:iFolder) => {
    console.log(`[askFolderCreate]`,newFolderName,parent);
    clientSocket2.emit('askFolderCreate', {newFolderName, parent, token: getLoginToken()})  
}

export const askFolderDelete = (folderToDelete:iFolder) => {
    console.log(`[askFolderDelete]`,folderToDelete);
    clientSocket2.emit('askFolderDelete', {folderToDelete, token: getLoginToken()})  
}