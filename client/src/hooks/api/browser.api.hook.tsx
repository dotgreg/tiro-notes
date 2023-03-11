import { cloneDeep, each, isArray, isBoolean, random } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { areSamePaths, cleanPath } from '../../../../shared/helpers/filename.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile, iFolder } from '../../../../shared/types.shared';
import { getParentFolder } from '../../managers/folder.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { sortFiles } from '../../managers/sort.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { iTabsApi, iWindowsApi } from '../app/tabs.hook';
import { useBackendState } from '../useBackendState.hook';
import { useLocalStorage } from '../useLocalStorage.hook';
import { iUserSettingsApi } from '../useUserSettings.hook';
import { getApi, iClientApi } from './api.hook';
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
			openIn?: string | 'activeWindow' | 'active'
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
		refreshFromBackend: Function
		base: string
		get: () => iFolder
		clean: Function,
		scan: (
			foldersPath: string[],
			opts?: {
				cache?: boolean,
				background?: boolean
				// closeFolders?: string[]
				cb?: () => void
			}
		) => void
		open: {
			get: () => string[]
			add: (f: string) => void
			remove: (paths: string[]) => void
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
	tabsApi: iTabsApi
	windowApi: iWindowsApi
}): iBrowserApi => {

	const [files, setFiles] = useState<iFile[]>([])
	const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)

	const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selected-folder', '')

	//
	// EFFECTs
	//
	// on loading selected folder, load files (usually first time)
	// useEffect(() => {
	// 	// goTo(selectedFolder)
	// }, [selectedFolder])

	//
	// Goto
	//
	const goTo: iBrowserApi['goTo'] =
		(folderPath, fileTitle, opts) => {
			// const appView = (opts && opts.appView) ? opts.appView : currentAppView
			// console.trace();
			if (folderPath === "") return
			// return false;

			folderPath = cleanPath(`${folderPath}/`)
			const h = `[BROWSER GO TO] `
			const log = sharedConfig.client.log.verbose
			log && console.log(`${h} ${folderPath} ${fileTitle}  ${JSON.stringify(opts)}`);
			p.searchUiApi.term.set('')
			p.statusApi.searching.set(true)
			setSelectedFolder(folderPath)
			//cleanListAndFileContent()



			p.filesApi.get(folderPath, nfiles => {
				// when receiving results
				p.statusApi.searching.set(false)

				// sort them
				const sortMode = p.userSettingsApi.get('ui_filesList_sortMode')
				const nfilesSorted = sortFiles(nfiles, sortMode)
				let activeIndex = -1

				// if search for a file title 
				if (fileTitle) {
					each(nfilesSorted, (file, i) => {
						if (file.name === fileTitle) {
							activeIndex = i
						}
					})
					// console.log(`${h} file search "${fileTitle}" on id : ${activeIndex}`);
				}


				setActiveFileIndex(activeIndex);
				setFiles(nfilesSorted)


				// if asked to open it in window
				if (opts && opts.openIn) {
					const fileToOpen = nfilesSorted[activeIndex]
					if (opts.openIn === 'active' || opts.openIn === 'activeWindow') {
						// if no tab, open in new tab
						if (!p.tabsApi.active.get()) {
							p.tabsApi.openInNewTab(fileToOpen)
						}
						// open in active window
						else p.windowApi.active.setContent(fileToOpen)
					} else {
						p.windowApi.updateWindows([opts.openIn], fileToOpen)
					}
				}
			});
		}








	//
	// FOLDERS LOGIC
	//

	// STORAGES
	const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
	const [folderBasePath, setFolderBasePath] = useState('')

	const refreshBackendFolders = () => {
		console.log(2222222);
		getOpenFoldersFromBack(v => {
			console.log(3333333, v);
			openFoldersRef.current = v
		})
	}

	const getFolderHierarchy = () => {
		return folderHierarchy
	}

	// OPEN TREE FOLDER MANAGEMENT
	const [openFolders, setOpenFolders, getOpenFoldersFromBack] = useBackendState<string[]>('folders-open', ['/'])
	const openFoldersRef = useRef<string[]>([])
	const getOpenFolders = () => {
		return openFoldersRef.current
	}
	const addToOpenedFolders = (folderPath: string) => {
		openFoldersRef.current = [...openFoldersRef.current, folderPath]
		setOpenFolders(openFoldersRef.current)
	}

	const removeToOpenedFolders = (folderPaths: string[]) => {
		// let nOpenFolders = openFoldersRef.current
		each(folderPaths, path => {
			openFoldersRef.current = openFoldersRef.current.filter(openFolder => !openFolder.startsWith(path));
		})
		setOpenFolders(openFoldersRef.current)
	}

	//
	// if open folders change, scan them
	//
	useEffect(() => {
		console.log(455555555, openFolders);
		scanFolders(openFolders)
	}, [openFolders])

	const cleanFolderHierarchy = () => {
		setFolderHierarchy(defaultFolderVal)
	}

	const scanFolders: iBrowserApi['folders']['scan'] = (foldersPaths, opts) => {
		if (!opts) opts = {}
		if (!isBoolean(opts.cache)) opts.cache = true
		let bg = !isBoolean(opts.background) ? false : opts.background

		let counterCb = 0

		getApi(api => {
			each(foldersPaths, folderPath => {
				const cacheId = `folder-scan-${folderPath}`

				const askForScanApi = () => {
					api.folders.get([folderPath], data => {
						!bg && processScannedFolders(data.pathBase, data.folders)
						api.cache.set(cacheId, data, -1)
						counterCb++
						if (counterCb >= foldersPaths.length) {
							opts?.cb && opts.cb()
						}
					})
				}

				// IF cached, first get initial, cached result
				if (opts && opts.cache) {
					api.cache.get(cacheId, cachedData => {
						//console.log("[FOLDER SCAN] getting cached results =>", folderPath, cachedData);
						if (!cachedData) {
							askForScanApi()
						} else {
							if (!bg) {
								processScannedFolders(cachedData.pathBase, cachedData.folders)
								counterCb++
								if (counterCb >= foldersPaths.length) {
									opts?.cb && opts.cb()
								}
							}
							// setTimeout(() => { askForScanApi() }, random(5000, 10000))
						}
					})
				} else {
					askForScanApi()
				}
			})
		})

	}





	const newflatStructRef = useRef<iFolder[]>([])
	const processScannedFolders = (pathBase: string, folders: iFolder[]) => {
		let newflatStruct: iFolder[] = cloneDeep(newflatStructRef.current)

		let nf = { current: newflatStruct }
		each(folders, nfolder => {
			if (!nfolder) return
			nf.current = nf.current.filter(folder => nfolder.path !== folder.path)
		})
		each(folders, nfolder => {
			if (nfolder) nf.current = upsertFlatStructure(nfolder, nf.current);
		})
		newflatStruct = nf.current
		newflatStructRef.current = newflatStruct
		//setFoldersFlat(newflatStructRef.current)

		let newTreeStruct = buildTreeFolder('/', newflatStruct)
		if (newTreeStruct) setFolderHierarchy(newTreeStruct)
		setFolderBasePath(pathBase)

		console.log("FOLDER SCAN] 555", folders[0]?.path, { folders, newflatStruct, newTreeStruct, openFolders })
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
			refreshFromBackend: refreshBackendFolders,
			base: folderBasePath,
			get: getFolderHierarchy,
			clean: cleanFolderHierarchy,
			scan: scanFolders,
			open: {
				get: getOpenFolders,
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
	let res
	for (let i = 0; i < folders.length; i++) {
		if (areSamePaths(folders[i].path, path)) {
			//console.log('FOLDER SCAN] 131313 FOUND', path, folders[i]);
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
	//console.log('FOLDER SCAN] 22', path, res);
	return res
}

const upsertFlatStructure = (newFolder: iFolder, flatStructure: iFolder[]): iFolder[] => {
	let updateType = 'add'
	for (let i = 0; i < flatStructure.length; i++) {
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

