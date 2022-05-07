import { cloneDeep, isArray } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { iAppView, iFolder } from '../../../../shared/types.shared';
import { onFolderDragStartFn, onFolderDropFn, onFolderMenuActionFn, TreeView } from "../../components/TreeView.Component"
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { ClientApiContext, getClientApi2 } from '../api/api.hook';
import { useLocalStorage } from '../useLocalStorage.hook';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';

export type onFolderClickedFn = (folderPath: string) => void
export const defaultFolderVal: iFolder = { title: '', key: '', path: '' }


export const useAppTreeFolder = (currentAppView: iAppView) => {




	// STORAGE
	const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
	const [foldersFlat, setFoldersFlat] = useLocalStorage<iFolder[]>('foldersFlat', [])
	const [openFolders, setOpenFolders] = useLocalStorage<string[]>('openFolders', ['/'])


	// CURRENT POSITION
	const [folderBasePath, setFolderBasePath] = useState('')









	// OPEN TREE FOLDER MANAGEMENT
	const addToOpenedFolders = (folderPath: string) => {
		setOpenFolders([...openFolders, folderPath])
	}
	const removeToOpenedFolders = (folderPath: string) => {
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
		getClientApi2().then(api => {
			api.folders.get(foldersPaths, (folders, pathBase) => {
				let newflatStruct: iFolder[] = foldersFlat
				for (let i = 0; i < folders.length; i++) {
					if (folders[i]) newflatStruct = upsertFlatStructure(folders[i], newflatStruct);
				}
				setFoldersFlat(newflatStruct)

				let newTreeStruct = buildTreeFolder('/', newflatStruct)
				if (newTreeStruct) setFolderHierarchy(newTreeStruct)
				setFolderBasePath(pathBase)
			})
		})
	}

	const api = useContext(ClientApiContext);
	const currentFolder = api?.ui.browser.folders.current.get || ''
	console.log('00345', currentFolder);

	// COMPONENTS
	const FolderTreeComponent = (p: {
		onFolderClicked,
		onFolderMenuAction: onFolderMenuActionFn,
		onFolderOpen,
		onFolderClose,
		onFolderDragStart: onFolderDragStartFn,
		onFolderDragEnd,
		onFolderDrop: onFolderDropFn
	}) =>
		useStatMemo(
			<>
				{currentFolder}
				{api && api.ui.browser.folders.current.get}
				< TreeView
					current={currentFolder}
					folder={folderHierarchy}
					onFolderClicked={p.onFolderClicked}
					onFolderMenuAction={p.onFolderMenuAction}
					onFolderOpen={p.onFolderOpen}
					onFolderClose={p.onFolderClose}
					onFolderDragStart={p.onFolderDragStart}
					onFolderDragEnd={p.onFolderDragEnd}
					onFolderDrop={p.onFolderDrop}
				/>
			</>
			, [folderHierarchy, currentFolder, openFolders, currentAppView]
		)


	return {
		openFolders,
		addToOpenedFolders,
		removeToOpenedFolders,

		folderBasePath,
		cleanFolderHierarchy,
		askForFolderScan,
		FolderTreeComponent
	}
}



export const buildTreeFolder = (path: string, folders: iFolder[]): iFolder | null => {
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

export const upsertFlatStructure = (newFolder: iFolder, flatStructure: iFolder[]): iFolder[] => {
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

export const defaultTrashFolder: iFolder = { title: '.trash', key: '/.tiro/.trash', path: '/.tiro/.trash' }

export const askFolderCreate = (newFolderName: string, parent: iFolder) => {
	console.log(`[askFolderCreate]`, newFolderName, parent);
	clientSocket2.emit('askFolderCreate', { newFolderName, parent, token: getLoginToken() })
}

export const askFolderDelete = (folderToDelete: iFolder) => {
	console.log(`[askFolderDelete]`, folderToDelete);
	clientSocket2.emit('askFolderDelete', { folderToDelete, token: getLoginToken() })
}
