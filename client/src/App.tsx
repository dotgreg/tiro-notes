import { css, Global } from '@emotion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deviceType } from './managers/device.manager';
import { clientSocket2, initSocketConnexion } from './managers/sockets/socket.manager';
import { CssApp2 } from './managers/style/css.manager';
import { useAppTreeFolder, defaultTrashFolder, askFolderCreate, askFolderDelete } from './hooks/app/treeFolder.hook';
import { useFileContent } from './hooks/app/fileContent.hook';
import { useAppSearch } from './hooks/app/search.hook';
import { useMobileView } from './hooks/app/mobileView.hook';
import { debounce, each, isNumber } from 'lodash';
import { useFileMove } from './hooks/app/fileMove.hook';
import { iStatusApi, useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { iFile, iFolder } from '../../shared/types.shared';
import { cleanPath } from '../../shared/helpers/filename.helper';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
import { useSearchFromTitle } from './hooks/app/searchFromTitle.hook';
import { LastNotes } from './components/LastNotes.component';
import { useLastFilesHistory } from './hooks/app/lastFilesHistory.hook';
import { useSetupConfig } from './hooks/app/setupConfig.hook';
import { getLoginToken, useLoginToken } from './hooks/app/loginToken.hook';
import { useDynamicResponsive } from './hooks/app/dynamicResponsive.hook';
import { Icon } from './components/Icon.component';
import { SettingsPopup } from './components/settingsView/settingsView.component';
import { useAppViewType } from './hooks/app/appView.hook';
import { ImageGallery } from './components/ImageGallery.component';
import { onImagesReceivedFn, useImagesList } from './hooks/app/imagesList.hook';
import { Lightbox } from './components/Lightbox.component';
import { addKeyAction, getKeyModif, startListeningToKeys } from './managers/keys.manager';
import { PopupContext, usePromptPopup } from './hooks/app/usePromptPopup.hook';
import { getActiveTab, useTabs } from './hooks/app/tabs.hook';
import { TabList } from './components/tabs/TabList.component';
import { WindowGrid } from './components/windowGrid/WindowGrid.component';
import { ButtonsToolbar } from './components/ButtonsToolbar.component';
import { useUserSettings } from './hooks/useUserSettings.hook';
import { ClientApiContext, useClientApi } from './hooks/api/api.hook';
import { useLightbox } from './hooks/app/useLightbox.hook';
import { sortFiles } from './managers/sort.manager';
import { FilesList } from './components/fileList.component';
import { iBrowserApi, useBrowserApi } from './hooks/api/browser.api.hook';
import { useNoteHistoryApi } from './hooks/api/history.api.hook';




export const App = () => {


	useEffect(() => {
		// COMPONENT DID MOUNT didmount
		console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

		initSocketConnexion().then(() => {
			toggleSocketConnection(true)
			askForFolderScan(openFolders)
		})



		startListeningToKeys();

		return () => {
			// COMPONENT will unmount
			console.log('app will unmount');
		}
	}, [])

	// APP-WIDE MULTI-AREA LOGIC
	const shouldLoadNoteIndex = useRef<null | number>(null)
	const lastFolderIn = useRef('')
	const lastSearchIn = useRef('')

	const cleanFileDetails = () => {
		setActiveFileIndex(-1)
		setFileContent(null)
	}

	const cleanFilesList = () => {
		setFiles([])
	}

	const cleanImagesList = () => {
		setImages([])
	}

	const cleanListAndFileContent = () => {
		console.log('[cleanListAndFileContent]');
		cleanFileDetails()
		cleanFilesList()
		cleanImagesList()
	}

	const cleanAllApp = () => {
		console.log('[cleanAllApp]');
		cleanLastFilesHistory()
		cleanFolderHierarchy()
		cleanFileDetails()
		cleanFilesList()
		cleanImagesList()
	}


	const debounceStopIsSearching = debounce(() => {
		setIsSearching(false)
	}, 100)



	//
	// FOLDERS API
	//

	// const debounceStopIsSearching = debounce(() => {
	// 	setIsSearching(false)
	// }, 100)
	// const onFilesReceivedCallback: onFilesReceivedFn =
	// 	(newFiles, isTemporaryResult, isInitialResults) => {
	// 		if (!isTemporaryResult) {
	// 			debounceStopIsSearching()
	// 		} else {
	// 			setIsSearching(isTemporaryResult)
	// 		}
	// 		// only continue if newFiles > 0 files
	// 		if (newFiles.length === 0) return
	// 		// if activeFileIndex exists + is in length of files, load it
	// 		if (activeFileIndex !== -1 && activeFileIndex < newFiles.length) {
	// 			askForFileContent(newFiles[activeFileIndex])
	// 		}
	// 		if (isNumber(shouldLoadNoteIndex.current)) {
	// 			console.log(`[LOAD] shouldLoadNoteIndex detected, loading note ${shouldLoadNoteIndex.current}`);
	// 			let noteIndex = shouldLoadNoteIndex.current
	// 			if (newFiles.length >= noteIndex + 1) {
	// 				setActiveFileIndex(noteIndex)
	// 				windowsApi.updateActive(newFiles[noteIndex])
	// 				askForFileContent(newFiles[noteIndex])
	// 			}
	// 			shouldLoadNoteIndex.current = null
	// 		}
	// 		// ON LIST ITEMS CHANGES
	// 		if (selectedFolder !== lastFolderIn.current || searchTerm !== lastSearchIn.current) {
	// 			// Load first item list 
	// 			newFiles.length >= 1 && askForFileContent(newFiles[0])
	// 			setActiveFileIndex(0)
	// 			//updateActiveWindowContent(files[0])
	// 			lastFolderIn.current = selectedFolder
	// 			lastSearchIn.current = searchTerm
	// 		}
	// 		// at the end, search for title
	// 		if (!isTemporaryResult && !isInitialResults) {
	// 			const indexSearch = getSearchedTitleFileIndex(newFiles)
	// 			if (indexSearch !== -1) {
	// 				if (newFiles[indexSearch]) {
	// 					setActiveFileIndex(indexSearch)
	// 					windowsApi.updateActive(files[indexSearch])
	// 					askForFileContent(newFiles[indexSearch])
	// 				}
	// 			}
	// 		}
	// 	}


	//
	// HOOKS
	//

	// Setup config file and welcoming screen logic
	const { SetupPopupComponent } = useSetupConfig({ cleanAllApp })

	// Setup config file and welcoming screen logic
	const { LoginPopupComponent } = useLoginToken({
		onLoginAsked: () => {
			cleanListAndFileContent()
		},
		onLoginSuccess: () => {
			refreshTabsFromBackend();
			refreshUserSettingsFromBackend();
			refreshFilesHistoryFromBackend();
		}
	})

	// User settings!
	const {
		userSettingsApi,
		refreshUserSettingsFromBackend
	} = useUserSettings();


	// Toggle sidebar 
	const toggleSidebar = () => {
		userSettingsApi.set('ui_sidebar', !userSettingsApi.get('ui_sidebar'))
	}



	const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)

	// KEY ACTIONS
	useEffect(() => {
		addKeyAction('up', () => {
			let i = activeFileIndex
			if (i > 0) {
				setActiveFileIndex(i - 1)
				askForFileContent(files[i - 1])
			}
		})
		addKeyAction('1', () => { if (getKeyModif('ctrl')) toggleSidebar() })
		addKeyAction('down', () => {
			let i = activeFileIndex
			if (i < files.length - 1) {
				setActiveFileIndex(i + 1)
				askForFileContent(files[i + 1])
			}
		})
	}, [activeFileIndex, userSettingsApi.get('ui_sidebar')])

	const [files, setFiles] = useState<iFile[]>([])



	// Tabs system
	const {
		tabs, updateTab,
		refreshTabsFromBackend,
		updateActiveTabGrid,
		refreshWindowGrid,
		tabsApi,
		windowsApi
	} = useTabs({ activeFile: files[activeFileIndex] });
	const activeTab = getActiveTab(tabs);


	/**
	 * Images List
	 */
	const onImagesReceivedCallback: onImagesReceivedFn = images => {
		console.log(`[IMAGES CALLBACK] images nb: ${images.length}`)
		setIsSearching(false)
	}

	const {
		images, setImages,
		askForFolderImages
	} = useImagesList(onImagesReceivedCallback)



	/**
	 *  APP VIEW SWITCHER SYSTEM (image/text)
	 */
	const { currentAppView, switchAppView,
		AppViewSwitcherComponent
	} = useAppViewType({
		onViewSwitched: nView => {
			clientApi.ui.browser.goTo(selectedFolder, null, { appView: nView })
		}
	})

	// Tree Folder
	const {
		openFolders,
		addToOpenedFolders,
		removeToOpenedFolders,

		folderBasePath,
		selectedFolder, setSelectedFolder,
		askForFolderScan,
		FolderTreeComponent,
		cleanFolderHierarchy
	} = useAppTreeFolder(currentAppView)

	// on selectedFolder change, trigger update folders/file ui
	useEffect(() => {
		clientApi.ui.browser.goTo(selectedFolder, null, { appView: currentAppView })
	}, [selectedFolder])


	// Search 
	const {
		isSearching, setIsSearching,
		searchTerm, setSearchTerm,
		triggerSearch,
		SearchBarComponent,
	} = useAppSearch(
		shouldLoadNoteIndex,
		cleanListAndFileContent,
		currentAppView
	)

	// Mobile view
	const {
		mobileView, setMobileView,
		MobileToolbarComponent
	} = useMobileView()

	// PROMPT AND CONFIRM POPUPAPI
	const { PromptPopupComponent, popupApi } = usePromptPopup({})

	// fileMove logic
	const {
		askForMoveFile,
		promptAndMoveFolder,
		promptAndBatchMoveFiles
	} = useFileMove(
		cleanFileDetails,
		cleanFilesList,
		cleanFolderHierarchy,
		askForFolderScan,
		popupApi
	)


	// Search Note from title
	// const { getSearchedTitleFileIndex, searchFileFromTitle } = useSearchFromTitle({ goTo, currentAppView })

	// File Content + Dual Viewer
	let activeFile = files[activeFileIndex]
	const {
		fileContent,
		setFileContent,
		setCanEdit,
		askForFileContent,
		DualViewerComponent
	} = useFileContent(
		activeFile, activeFileIndex, selectedFolder, files, shouldLoadNoteIndex,
		cleanFileDetails, askForMoveFile
	)

	// last Note + files history array
	const { filesHistory, cleanLastFilesHistory, refreshFilesHistoryFromBackend } = useLastFilesHistory(activeFile)


	// CONNECTION INDICATOR
	const {
		isConnected,
		connectionStatusComponent,
		toggleSocketConnection
	} = useConnectionIndicator(setCanEdit)

	const statusApi: iStatusApi = {
		isConnected
	}


	// make sure the interface doesnt scroll
	useFixScrollTop()

	// // url routing/react logic
	// const { reactToUrl } = useUrlLogic(
	// 	isSearching, searchTerm,
	// 	selectedFolder, activeFile,
	// 	activeFileIndex,
	// 	currentAppView,
	// 	{
	// 		reactToUrlParams: newUrlParams => {
	// 			// timeout of 1000 as sometimes when loading is too long, not working
	// 			//setTimeout(() => {
	// 			// new way
	// 			console.log(`[URL] REACTING TO <== ${JSON.stringify(newUrlParams)}`);

	// 			if (newUrlParams.folder && newUrlParams.title) {
	// 				searchFileFromTitle(newUrlParams.title, newUrlParams.folder)
	// 			}
	// 			if (newUrlParams.search) {
	// 				console.log('reactToUrlParams -> triggersearch');
	// 				triggerSearch(newUrlParams.search)
	// 			}
	// 			if (newUrlParams.mobileview) {
	// 				setMobileView(newUrlParams.mobileview)
	// 			}
	// 			if (newUrlParams.appview) {
	// 				switchAppView(newUrlParams.appview)
	// 			}
	// 			//}, 1000)
	// 		}
	// 	}
	// )

	// DYNAMIC RESPONSIVE RERENDER (ON DEBOUNCE)
	const { forceResponsiveRender } = useDynamicResponsive()

	// DRAG/DROP FOLDER/FILES MOVING LOGIC
	interface iDraggedItem { type: 'file' | 'folder', files?: iFile[], folder?: iFolder }
	const draggedItems = useRef<iDraggedItem[]>([])

	const processDragDropAction = (folderToDropInto: iFolder) => {
		console.log(`[DRAG MOVE] processDragDropAction ->`, draggedItems.current, folderToDropInto);
		let item = draggedItems.current[0]
		if (item.type === 'file' && item.files) {
			promptAndBatchMoveFiles(item.files, folderToDropInto)
		} else if (item.type === 'folder' && item.folder) {
			promptAndMoveFolder({ folder: item.folder, folderToDropInto, folderBasePath })
		}
	}

	// Send Note Leaving Signal
	const [isLeavingNote, setIsLeavingNote] = useState(false)

	// Show settings panel
	const [showSettingsPopup, setShowSettingsPopup] = useState(false)


	// LIGHTBOX SYSTEM
	const { lightboxApi, lightboxImages, lightboxIndex } = useLightbox();

	//
	// BROWSER API
	//
	const goTo: iBrowserApi['goTo'] =
		(folderPath, fileTitle, opts) => {
			const appView = (opts && opts.appView) ? opts.appView : currentAppView
			if (folderPath === "") return
			folderPath = cleanPath(`${folderPath}/`)
			const h = `[BROWSER GO TO] 00722 `
			console.log(`${h} ${folderPath} ${fileTitle} ${appView}`);
			// NORMAL CHANGE FOLDER LOGIC
			setSearchTerm('')
			setSelectedFolder(folderPath)
			cleanListAndFileContent()

			if (appView === 'text') {
				clientApi.files.get(folderPath, nfiles => {
					// when receiving results
					debounceStopIsSearching()

					// sort them
					const sortMode = clientApi.userSettings.get('ui_filesList_sortMode')
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

					setActiveFileIndex(activeIndex);
					windowsApi.updateActive(nfilesSorted[activeIndex])
					setFiles(nfilesSorted)
				})
			} else if (appView === 'image') {
				setSelectedFolder(folderPath)
				askForFolderImages(folderPath)
			}
		}

	const browserApi: iBrowserApi = useBrowserApi({
		goTo,
		selectedFolder
	})


	// NOTE HISTORY HOOK
	const historyApi = useNoteHistoryApi()

	//
	// CLIENT API
	//
	const clientApi = useClientApi({
		popupApi,
		tabsApi,
		userSettingsApi,
		windowsApi,
		statusApi,
		browserApi,
		historyApi,
		lightboxApi
	})

	return (//jsx
		<div className={CssApp2(mobileView)} >
			<div className={` ${deviceType() === 'mobile' ? `mobile-view-${mobileView}` : ''}`}>

				{ /* API : making clientapi available everywhere */}
				<ClientApiContext.Provider value={clientApi} >

					<Global styles={GlobalCssApp} />
					<div role="dialog" className={`
								main-wrapper
								${clientApi.userSettings.get('ui_sidebar') ? "with-sidebar" : "without-sidebar"}
								view-${currentAppView}
								device-view-${deviceType()}`}>
						{
							PromptPopupComponent()
						}

						{
							LoginPopupComponent({})
						}

						{
							SetupPopupComponent({})
						}

						{
							connectionStatusComponent()
						}

						{
							MobileToolbarComponent(forceResponsiveRender)
						}

						<div className="left-sidebar-indicator">
							<div className="left-wrapper">
								<div className="left-wrapper-1">
									<div className="invisible-scrollbars">
										{currentAppView === 'text' &&
											<NewFileButton
												onNewFile={() => {
													clientApi.file.create(selectedFolder, files => {
														// reload list
														clientApi.ui.browser.goTo(selectedFolder)
													})
												}}
											/>
										}

										{currentAppView === 'text' &&
											<LastNotes
												files={filesHistory}
												onClick={file => {
													//searchFileFromTitle(file.name, file.folder)
													clientApi.ui.browser.goTo(file.folder, file.name)
												}}
											/>
										}


										{
											FolderTreeComponent({
												onFolderClicked: folderPath => {
													setIsSearching(true)
													clientApi.ui.browser.goTo(folderPath, null, { appView: currentAppView })
												},
												onFolderMenuAction: (action, folder, newTitle) => {
													if (action === 'rename' && newTitle) {
														promptAndMoveFolder({
															folder,
															folderToDropInto: folder,
															folderBasePath,
															newTitle,
															renameOnly: true
														})
													} else if (action === 'create' && newTitle) {
														askFolderCreate(newTitle, folder)
														askForFolderScan([folder.path])
													} else if (action === 'moveToTrash') {
														promptAndMoveFolder({ folder, folderToDropInto: defaultTrashFolder, folderBasePath, newTitle })
													} else if (action === 'delete') {
														askFolderDelete(folder)
														askForFolderScan([folder.path])
													}
												},
												onFolderOpen: folderPath => {
													addToOpenedFolders(folderPath)
													askForFolderScan([folderPath])
												},
												onFolderClose: folderPath => {
													removeToOpenedFolders(folderPath)
												},
												onFolderDragStart: draggedFolder => {
													console.log(`[DRAG MOVE] onFolderDragStart`, draggedFolder);
													draggedItems.current = [{ type: 'folder', folder: draggedFolder }]
												},
												onFolderDragEnd: () => {
													console.log(`[DRAG MOVE] onFolderDragEnd`);
													draggedItems.current = []
												},
												onFolderDrop: folderDroppedInto => {
													processDragDropAction(folderDroppedInto)
												},
											})
										}
									</div>

									<div className="settings-button" onClick={() => {
										setShowSettingsPopup(!showSettingsPopup)
									}}>
										<Icon name="faCog" color='grey' />
									</div>

									{
										showSettingsPopup &&
										<SettingsPopup onClose={() => {
											setShowSettingsPopup(false)
										}} />
									}

								</div>
								<div className="left-wrapper-2">
									<div className="top-files-list-wrapper">
										<div className="subtitle-wrapper">

											{/* SIDEBAR TOGGLER */}
											<div className="toggle-sidebar-btn">
												<ButtonsToolbar buttons={[{
													icon: 'faThumbtack',
													title: 'Toggle Sidebar',
													action: e => { toggleSidebar(); refreshWindowGrid(); },
													active: clientApi.userSettings.get('ui_sidebar') === true
												}]} colors={["#d4d1d1", "#615f5f"]} size={0.8} />
											</div>

											{/* <h3 className="subtitle">{strings.files}</h3> */}
											<AppViewSwitcherComponent />

										</div>
										{
											SearchBarComponent({ selectedFolder })
										}
									</div>
									<div className="files-list-wrapper">

										<FilesList
											files={files}
											activeFileIndex={activeFileIndex}

											onSortFiles={filesSorted => {
												setFiles(filesSorted)
											}}
											onFileClicked={fileIndex => {
												setActiveFileIndex(fileIndex)
												windowsApi.updateActive(files[fileIndex])
											}}
											onFileDragStart={files => {
												console.log(`[DRAG MOVE] onFileDragStart`, files);
												draggedItems.current = [{ type: 'file', files: files }]
											}}
											onFileDragEnd={() => {
												console.log(`[DRAG MOVE] onFileDragEnd`);
												draggedItems.current = []
											}}
										/>
									</div>
								</div>
							</div>
							{/* end left sidebar indic */}
						</div>



						<div className="right-wrapper image-gallery-view">

							{/* IMAGE GALLERY */}
							<div className="image-gallery-header">
								<div className="subtitle-wrapper">
									<AppViewSwitcherComponent />
								</div>
								{
									SearchBarComponent({ selectedFolder })
								}
							</div>
							<ImageGallery
								images={images}
								onImageClicked={clientApi.ui.lightbox.open}
								forceRender={forceResponsiveRender} />
						</div>

						<div className="right-wrapper dual-viewer-view">


							{/* TABS SYSTEM*/}
							<TabList
								tabs={tabs}
								onUpdate={updateTab}
							/>

							{activeTab &&
								<WindowGrid
									tab={activeTab}
									onGridUpdate={updateActiveTabGrid}
								/>
							}


						</div>
					</div>
				</ClientApiContext.Provider>
			</div >

			{
				lightboxImages.length > 0 &&
				<Lightbox
					images={lightboxImages}
					startingIndex={lightboxIndex}
					onClose={clientApi.ui.lightbox.close}
				/>
			}
		</div >
	)//jsx
}

