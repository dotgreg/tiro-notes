import { cloneDeep, each, isArray } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { areSamePaths, cleanPath } from '../../../../shared/helpers/filename.helper';
import { iAppView, iFile, iFolder } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { sortFiles } from '../../managers/sort.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { useLocalStorage } from '../useLocalStorage.hook';
import { iUserSettingsApi } from '../useUserSettings.hook';
import { iClientApi } from './api.hook';
import { iFilesApi } from './files.api.hook';
import { iFoldersApi } from './folders.api.hook';
import { iStatusApi } from './status.api.hook';

//
// INTERFACES
//

export interface iBrowserApi {
	goTo: (
		folderPath: string,
		fileTitle?: string | null,
		options?: {
			appView: 'text' | 'image'
		}
	) => void
	files: {
		set: (nFiles: iFile[]) => void,
		get: iFile[]
		active: {
			set: (index: number) => void
			getIndex: number
			get: iFile
		}
	},
	folders: {
		base: string
		get: iFolder
		clean: Function
		scan: (foldersPath: string[]) => void
		open: {
			get: string[]
			add: (f: string) => void
			remove: (f: string) => void
		}
		current: {
			set: (nFolder: string) => void
			get: string
		}
	}
}

export const useBrowserApi = (p: {
	searchUiApi: iClientApi['ui']['search']
	statusApi: iStatusApi
	filesApi: iFilesApi
	foldersApi: iFoldersApi
	userSettingsApi: iUserSettingsApi
}): iBrowserApi => {

	const [files, setFiles] = useState<iFile[]>([])
	const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)

	const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selected-folder', '')

	//
	// EFFECTs
	//
	// on loading selected folder, load files (usually first time)
	useEffect(() => {
		goTo(selectedFolder)
	}, [selectedFolder])

	//
	// Goto
	//
	const goTo: iBrowserApi['goTo'] =
		(folderPath, fileTitle, opts) => {
			// const appView = (opts && opts.appView) ? opts.appView : currentAppView
			const appView = 'text'
			if (folderPath === "") return
			folderPath = cleanPath(`${folderPath}/`)
			const h = `[BROWSER GO TO] 00722 `
			console.log(`${h} ${folderPath} ${fileTitle} ${appView}`);
			p.searchUiApi.term.set('')
			p.statusApi.searching.set(true)
			setSelectedFolder(folderPath)
			//cleanListAndFileContent()

			if (appView === 'text') {
				p.filesApi.get(folderPath, nfiles => {
					// when receiving results
					p.statusApi.searching.set(false)

					// sort them
					const sortMode = p.userSettingsApi.get('ui_filesList_sortMode')
					const nfilesSorted = sortFiles(nfiles, sortMode)
					let activeIndex = 0

					// if search for a file title 
					if (fileTitle) {
						each(nfilesSorted, (file, i) => {
							if (file.name === fileTitle) {
								activeIndex = i
							}
						})
					setActiveFileIndex(activeIndex);
						console.log(`${h} file search "${fileTitle}" on id : ${activeIndex}`);
					}


					setFiles(nfilesSorted)
				});
			} else if (appView === 'image') {
				setSelectedFolder(folderPath)
				//askForFolderImages(folderPath)
			}
		}








	//
	// FOLDERS LOGIC
	//

	// STORAGES
	const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
	const [foldersFlat, setFoldersFlat] = useLocalStorage<iFolder[]>('foldersFlat', [])
	//const [foldersFlat, setFoldersFlat] = useState<iFolder[]>([])
	const [folderBasePath, setFolderBasePath] = useState('')





	// OPEN TREE FOLDER MANAGEMENT
	const [openFolders, setOpenFolders] = useLocalStorage<string[]>('openFolders', ['/'])
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

	const scanFolders: iBrowserApi['folders']['scan'] = (foldersPaths: string[]) => {
		p.foldersApi.get(foldersPaths, data => {
			let newflatStruct: iFolder[] = foldersFlat
			for (let i = 0; i < data.folders.length; i++) {
				if (data.folders[i]) newflatStruct = upsertFlatStructure(data.folders[i], newflatStruct);
			}
			setFoldersFlat(newflatStruct)
			let newTreeStruct = buildTreeFolder('/', newflatStruct)
			if (newTreeStruct) setFolderHierarchy(newTreeStruct)
			setFolderBasePath(data.pathBase)
		})
	}


	return {
		goTo: goTo,
		files: {
			active: {
				get: files[activeFileIndex],
				getIndex: activeFileIndex,
				set: setActiveFileIndex
			},
			set: setFiles,
			get: files
		},
		folders: {
			base: folderBasePath,
			get: folderHierarchy,
			clean: cleanFolderHierarchy,
			scan: scanFolders,
			open: {
				get: openFolders,
				add: addToOpenedFolders,
				remove: removeToOpenedFolders
			},
			current: {
				get: selectedFolder,
				set: setSelectedFolder
			}
		}
	}

}























//
// FOLDERS SUPPORT FUNCTIONS
//

const defaultFolderVal: iFolder = { title: '', key: '', path: '' }

const buildTreeFolder = (path: string, folders: iFolder[]): iFolder | null => {
	console.log('13131310 ', path, folders);
	let res
	for (let i = 0; i < folders.length; i++) {
		console.log('1313131 ', folders[i]);
		if (areSamePaths(folders[i].path, path)) {
			//console.log('131313 FOUND', path, folders[i]);
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

const upsertFlatStructure = (newFolder: iFolder, flatStructure: iFolder[]): iFolder[] => {
	let updateType = 'add'
	console.log('044-2', flatStructure);
	for (let i = 0; i < flatStructure.length; i++) {
		console.log('044-1', areSamePaths(newFolder.path, flatStructure[i].path), newFolder.path, flatStructure[i].path);
		if (areSamePaths(newFolder.path, flatStructure[i].path)) {
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

