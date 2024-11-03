import { cloneDeep, each, isArray, isBoolean, random, uniq } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { areSamePaths, cleanPath } from '../../../../shared/helpers/filename.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile, iFolder, iFolderDeleteType } from '../../../../shared/types.shared';
import { devCliAddFn, notifLog } from '../../managers/devCli.manager';
import { deviceType } from '../../managers/device.manager';
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
import { get } from 'http';

//
// INTERFACES
//

export interface iBrowserApi {
	goTo: (
		folderPath: string,
		fileTitle?: string | null,
		options?: {
			openIn?: string | 'activeWindow' | 'active',
			// @TODO searchedString here too
			searchedString?: string
			// if ramcache, will not ask backend for files
			ramCache?: boolean 
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
		get: (
			cb?:(f:iFolder) => void
		) => iFolder
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
			get: ( ) => string,
			getSync: string,
		}
	}
}

export const useBrowserApi = (p: {
	// searchUiApi: iClientApi['ui']['search']
	// statusApi: iStatusApi
	// filesApi: iFilesApi
	// foldersApi: iFoldersApi
	// userSettingsApi: iUserSettingsApi
	// tabsApi: iTabsApi
	// windowApi: iWindowsApi
}): iBrowserApi => {

	const [files, setFiles] = useState<iFile[]>([])
	const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)

	const [selectedFolder, setSelectedFolder] = useLocalStorage<string>('selected-folder', '')
	const selectedFolderRef = useRef<string>('')
	useEffect(() => {
		selectedFolderRef.current = selectedFolder
	}, [selectedFolder])	
	const getSelectedFolder = () => {
		return selectedFolderRef.current
	}	

	//
	// EFFECTs
	//
	//
	// Goto
	//
	const RamCacheFilesListRef = useRef<{[filePath:string]:iFile[]}>({})
	const goTo: iBrowserApi['goTo'] =
		(folderPath, fileTitle, opts) => {

			const onFilesFetched = (nfiles:iFile[]) => {
				getApi(api => {
					// when receiving results
					api.status.searching.set(false)
		
					// sort them
					const sortMode = api.userSettings.get('ui_filesList_sortMode')
					const nfilesSorted = sortFiles(nfiles, sortMode)
					let activeIndex = -1

					// if search for a file title 
					if (fileTitle) {
						each(nfilesSorted, (file, i) => {
							if (file.name === fileTitle) {
								activeIndex = i
							}
						})
					}
					setActiveFileIndex(activeIndex);
					setFiles(nfilesSorted)

					// if asked to open it in window
					if (opts && opts.openIn) {
						const fileToOpen = nfilesSorted[activeIndex]
						if (opts.openIn === 'active' || opts.openIn === 'activeWindow') {
							let activeTab = api.tabs.active.get()
							let wid = activeTab?.grid.content[0].i

							// notifLog(`${JSON.stringify({opts, activeTab, wid, device: deviceType()})}`)
							// console.log(22222222,api.tabs.active.get(), api.tabs.get(), opts, deviceType() )
							// if no tab, open in new tab
							if (!activeTab) {
								api.tabs.openInNewTab(fileToOpen)
							} else {
								// if mobile, first window of active tab
								// if (deviceType() === "mobile") {
									
								// 	if (!wid) return
								// 	// console.log("if mobile, first window of active tab", wid)
								// 	api.ui.windows.updateWindows([wid], fileToOpen)
								// }
								// open in active window
								// else api.ui.windows.active.setContent(fileToOpen)
								api.ui.windows.active.setContent(fileToOpen)
							}
						} else {
							api.ui.windows.updateWindows([opts.openIn], fileToOpen)
						}
					}
				})
			}

			// console.trace("woop")
			// RAM CACHE 
			const startSearch = () => {
				getApi(api => {
					folderPath = cleanPath(`${folderPath}/`)
					const h = `[BROWSER GO TO] `
					const log = sharedConfig.client.log.verbose
					log && console.log(`${h} ${folderPath} ${fileTitle}  ${JSON.stringify(opts)}`);
					// p.searchUiApi.term.set('')
					api.ui.search.term.set('')
					// p.statusApi.searching.set(true)
					api.status.searching.set(true)
					setSelectedFolder(folderPath)
				})
			}
			if (opts && opts.ramCache && RamCacheFilesListRef.current[folderPath]) {
				startSearch()
				// console.log("RAM CACHE", folderPath, RamCacheFilesListRef.current[folderPath].length)
				onFilesFetched(RamCacheFilesListRef.current[folderPath])
			}  else {
				// DIRECT FETCH
				// console.log("DIRECT FETCH", folderPath)
				if (folderPath === "") return
				getApi(api => {
					startSearch()
					// p.filesApi.get(folderPath, nfiles => {
					api.files.get(folderPath, nfiles => {
						onFilesFetched(nfiles)
						RamCacheFilesListRef.current[folderPath] = nfiles
					});
				})
			}
		}








	//
	// FOLDERS LOGIC
	//

	// STORAGES
	const [folderHierarchy, setFolderHierarchy] = useState<iFolder>(defaultFolderVal)
	const [folderBasePath, setFolderBasePath] = useState('')

	const refreshBackendFolders = () => {
		getOpenFoldersFromBack(v => {
			openFoldersRef.current = v
		})
	}

	const getFolderHierarchy = (cb) => {
		if (cb) cb(folderHierarchy)
		return folderHierarchy
	}

	// OPEN TREE FOLDER MANAGEMENT
	const [openFolders, setOpenFoldersInt, getOpenFoldersFromBack] = useBackendState<string[]>('folders-open', ['/'])
	const openFoldersRef = useRef<string[]>([])

	const getOpenFolders = () => {
		return openFoldersRef.current
	}

	const setOpenFolders = (folders: string[]) => {
		folders = uniq(folders)
		setOpenFoldersInt(folders)
	}

	const addToOpenedFolders = (folderPath: string) => {
		console.log("ADD",folderPath)
		openFoldersRef.current = [...openFoldersRef.current, folderPath]
		openFoldersRef.current = uniq(openFoldersRef.current)
		setOpenFolders(openFoldersRef.current)
	}

	const cleanOpenedFolders = (scannedPath: string, nfolder: iFolder) => {
		console.log("CLEAN")
		const nOpenFolders:string[] = []
		const arrRef:string[] = []
		each(nfolder.children, ch => {
			arrRef.push(ch.title)
		})
		each(openFoldersRef.current, oPath => {
			// take all opened folders that starts with scannedPath
			// if /, it will take them all
			console.log("CLEAN1", oPath, scannedPath)
			if (oPath.startsWith(scannedPath)) {
				// remove first part so we have f1/blab/blab/bla
				let reloPath = oPath.replace(scannedPath, "")
				// take f1
				let reloPathArr = reloPath.split("/")
				let childTitleToCheck = reloPathArr[0] === "" ? reloPathArr[1] : reloPathArr[0]
				console.log("CLEAN2",scannedPath, arrRef, childTitleToCheck, reloPathArr, reloPath, oPath)
				if (arrRef.indexOf(childTitleToCheck) !== -1) nOpenFolders.push(oPath)
				else if (oPath === "/") nOpenFolders.push(oPath)
				else if (oPath === scannedPath) nOpenFolders.push(oPath)
			} else {
				nOpenFolders.push(oPath)
			}
		})
		console.log("CLEAN RES", nOpenFolders, scannedPath)
		openFoldersRef.current = nOpenFolders
		setOpenFolders(openFoldersRef.current)
	}

	const removeToOpenedFolders = (folderPaths: string[]) => {
		console.log("REMOVE",folderPaths)
		// let nOpenFolders = openFoldersRef.current

		// if closing a folder, close its childrens to clean opened folder but not good UX
		// each(folderPaths, path => {
		// 	openFoldersRef.current = openFoldersRef.current.filter(openFolder => !openFolder.startsWith(path));
		// })
		each(folderPaths, path => {
			openFoldersRef.current = openFoldersRef.current.filter(openFolder => openFolder !== path);
		})
		

		setOpenFolders(openFoldersRef.current)
	}

	//
	// if open folders change, scan them
	//
	// useEffect(() => {
	// 	console.log("openFolders > scanFolders")
	// 	scanFolders(openFolders)
	// }, [openFolders])

	const isInitialScanDone = useRef<boolean>(false)
	useEffect(() => {
		if (isInitialScanDone.current) return
		// console.log("openFolders > scanFolders", openFolders.length)
		scanFolders(openFolders)
		if (openFolders.length > 1) isInitialScanDone.current = true
	}, [openFolders])

	const cleanFolderHierarchy = () => {
		setFolderHierarchy(defaultFolderVal)
	}

	const scanFolders: iBrowserApi['folders']['scan'] = (foldersPaths, opts) => {
		
		// clean foldersPath requested
		each(foldersPaths, (fp, i) => {
			if (foldersPaths[i] === "") foldersPaths[i] = "/"
		})
		foldersPaths = uniq(foldersPaths)

		if (!opts) opts = {}
		if (!isBoolean(opts.cache)) opts.cache = true
		let bg = !isBoolean(opts.background) ? false : opts.background

		let counterCb = 0

		getApi(api => {
			each(foldersPaths, folderPath => {
				// const cacheId = `folder-scan-${folderPath}`

				const askForScanApi = () => {
					api.folders.get([folderPath], data => {
						!bg && processScannedFolders(data.pathBase, data.folders)
						// api.cache.set(cacheId, data, -1)
						// cleanOpenedFolders(folderPath, data.folders[0])
						counterCb++
						if (counterCb >= foldersPaths.length) {
							opts?.cb && opts.cb()
						}
					})
				}

				// IF cached, first get initial, cached result
				// if (opts && opts.cache) {
				// 	api.cache.get(cacheId, cachedData => {
				// 		//console.log("[FOLDER SCAN] getting cached results =>", folderPath, cachedData);
				// 		if (!cachedData) {
				// 			askForScanApi()
				// 		} else {
				// 			if (!bg) {
				// 				processScannedFolders(cachedData.pathBase, cachedData.folders)
				// 				counterCb++
				// 				if (counterCb >= foldersPaths.length) {
				// 					opts?.cb && opts.cb()
				// 				}
				// 			}
				// 			// setTimeout(() => { askForScanApi() }, random(5000, 10000))
				// 		}
				// 	})
				// } else {
					askForScanApi()
				// }
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

		//console.log("FOLDER SCAN] 555", folders[0]?.path, { folders, newflatStruct, newTreeStruct, openFolders })
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
				get: getSelectedFolder,
				set: setSelectedFolder,
				getSync: selectedFolder
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













export type iFolderDeleteFn = (typeFolder: iFolderDeleteType, cacheFolderName?: string) => void

export const askFolderDelete: iFolderDeleteFn = (typeFolder, cacheFolderName) => {
	console.log(`[askFolderDelete]`, typeFolder, cacheFolderName);
	clientSocket2.emit('askFolderDelete', {
		typeFolder,
		cacheFolderName,
		token: getLoginToken()
	})
}

devCliAddFn("cache", "clean_cache", () => {
	notifLog("Cache clean started...", "clean_cache")
	getApi(api => {
		api.folders.delete("cache", "ctag-ressources")
		api.ressource.cleanCache()
		api.cache.cleanRamCache()
		notifLog("Cache cleaned successfully", "clean_cache")
	})
})
