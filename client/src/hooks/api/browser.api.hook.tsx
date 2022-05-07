import { cloneDeep, each, isArray } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { cleanPath } from '../../../../shared/helpers/filename.helper';
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
						console.log(`${h} file search "${fileTitle}" on id : ${activeIndex}`);
					}

					//setActiveFileIndex(activeIndex);

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
	// CURRENT POSITION
	const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
	const [foldersFlat, setFoldersFlat] = useLocalStorage<iFolder[]>('foldersFlat', [])




	// const [openFolders, setOpenFolders] = useLocalStorage<string[]>('openFolders', ['/'])
	// // OPEN TREE FOLDER MANAGEMENT
	// const addToOpenedFolders = (folderPath: string) => {
	// 	setOpenFolders([...openFolders, folderPath])
	// }
	// const removeToOpenedFolders = (folderPath: string) => {
	// 	const newopenFolders = openFolders
	// 	const index = newopenFolders.indexOf(folderPath);
	// 	if (index > -1) {
	// 		newopenFolders.splice(index, 1);
	// 	}
	// 	setOpenFolders(newopenFolders)
	// }








	const cleanFolderHierarchy = () => {
		setFolderHierarchy(defaultFolderVal)
	}
	// CURRENT POSITION
	const [folderBasePath, setFolderBasePath] = useState('')

	const scanFolders: iBrowserApi['folders']['scan'] = (foldersPaths: string[]) => {
		p.foldersApi.get(foldersPaths, (folders, pathBase) => {
			let newflatStruct: iFolder[] = foldersFlat
			for (let i = 0; i < folders.length; i++) {
				if (folders[i]) newflatStruct = upsertFlatStructure(folders[i], newflatStruct);
			}
			setFoldersFlat(newflatStruct)

			let newTreeStruct = buildTreeFolder('/', newflatStruct)
			if (newTreeStruct) setFolderHierarchy(newTreeStruct)
			setFolderBasePath(pathBase)
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

type onFolderClickedFn = (folderPath: string) => void
const defaultFolderVal: iFolder = { title: '', key: '', path: '' }
const buildTreeFolder = (path: string, folders: iFolder[]): iFolder | null => {
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

const upsertFlatStructure = (newFolder: iFolder, flatStructure: iFolder[]): iFolder[] => {
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

const defaultTrashFolder: iFolder = { title: '.trash', key: '/.tiro/.trash', path: '/.tiro/.trash' }

const askFolderCreate = (newFolderName: string, parent: iFolder) => {
	console.log(`[askFolderCreate]`, newFolderName, parent);
	clientSocket2.emit('askFolderCreate', { newFolderName, parent, token: getLoginToken() })
}

const askFolderDelete = (folderToDelete: iFolder) => {
	console.log(`[askFolderDelete]`, folderToDelete);
	clientSocket2.emit('askFolderDelete', { folderToDelete, token: getLoginToken() })
}

