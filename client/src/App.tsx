import { css, Global } from '@emotion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deviceType } from './managers/device.manager';
import { clientSocket2, initSocketConnection } from './managers/sockets/socket.manager';
import { CssApp2 } from './managers/style/css.manager';
import { useAppTreeFolder, defaultTrashFolder, askFolderCreate, askFolderDelete } from './hooks/app/treeFolder.hook';
import { onFilesReceivedFn, useAppFilesList } from './hooks/app/filesList.hook';
import { useFileContent } from './hooks/app/fileContent.hook';
import { useAppSearch } from './hooks/app/search.hook';
import { useMobileView } from './hooks/app/mobileView.hook';
import { useUrlLogic } from './hooks/app/urlLogic.hook';
import { debounce, isNumber } from 'lodash';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { addCliCmd } from './managers/cliConsole.manager';
import { configClient } from './config';
import { iAppView, iFile, iFileImage, iFolder } from '../../shared/types.shared';
import { cleanPath } from '../../shared/helpers/filename.helper';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
import { strings } from './managers/strings.manager';
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
import { useClientApi } from './hooks/app/clientApi.hook';
import { log } from 'console';
import { addKeyAction, getKeyModif, startListeningToKeys } from './managers/keys.manager';
import { PopupContext, usePromptPopup } from './hooks/app/usePromptPopup.hook';
import { useTabs } from './hooks/app/tabs.hook';




export const App = () => {

	useEffect(() => {
		// COMPONENT DID MOUNT didmount
		console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

		initSocketConnection().then(() => {
			toggleSocketConnection(true)
			askForFolderScan(openFolders)
		})

		// setInterval(() => {
		//     console.log(1111);

		//     // setActiveFileIndex(activeFileIndex+1)
		// }, 1000)

		setTimeout(() => {
			/* triggerPromptPopup({ text: 'wppp', onAccept: () => { console.log('wpppp'); } }) */
		}, 2000)

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


	const changeToFolder = (folderPath: string, appView: iAppView, loadFirstNote: boolean = true) => {
		if (folderPath === "") return
		folderPath = cleanPath(folderPath)
		console.log(`[FOLDER CHANGED] to ${folderPath} with view ${appView}`);

		// SEND FIRST isLeavingNote signal for leaving logic like encryption
		setIsLeavingNote(true)
		setTimeout(() => {
			// NORMAL CHANGE FOLDER LOGIC
			setSearchTerm('')
			setSelectedFolder(folderPath)
			cleanListAndFileContent()

			if (appView === 'text') {
				if (loadFirstNote) shouldLoadNoteIndex.current = 0
				askForFolderFiles(folderPath)
				setIsLeavingNote(false)
			} else if (appView === 'image') {
				setSelectedFolder(folderPath)
				askForFolderImages(folderPath)
			}
		})
	}


	const debounceStopIsSearching = debounce(() => {
		setIsSearching(false)
	}, 100)

	const onFilesReceivedCallback: onFilesReceivedFn =
		(newFiles, isTemporaryResult, isInitialResults) => {

			if (!isTemporaryResult) {
				debounceStopIsSearching()
			} else {
				setIsSearching(isTemporaryResult)
			}

			// only continue if newFiles > 0 files
			if (newFiles.length === 0) return

			// if activeFileIndex exists + is in length of files, load it
			if (activeFileIndex !== -1 && activeFileIndex < newFiles.length) {
				askForFileContent(newFiles[activeFileIndex])
			}
			if (isNumber(shouldLoadNoteIndex.current)) {
				console.log(`[LOAD] shouldLoadNoteIndex detected, loading note ${shouldLoadNoteIndex.current}`);
				let noteIndex = shouldLoadNoteIndex.current
				if (newFiles.length >= noteIndex + 1) {
					setActiveFileIndex(noteIndex)
					askForFileContent(newFiles[noteIndex])
				}
				shouldLoadNoteIndex.current = null
			}
			// ON LIST ITEMS CHANGES
			if (selectedFolder !== lastFolderIn.current || searchTerm !== lastSearchIn.current) {
				// Load first item list 
				newFiles.length >= 1 && askForFileContent(newFiles[0])
				setActiveFileIndex(0)
				lastFolderIn.current = selectedFolder
				lastSearchIn.current = searchTerm
			}

			// at the end, search for title
			if (!isTemporaryResult && !isInitialResults) {
				const indexSearch = getSearchedTitleFileIndex(newFiles)
				if (indexSearch !== -1) {
					if (newFiles[indexSearch]) {
						setActiveFileIndex(indexSearch)
						askForFileContent(newFiles[indexSearch])
					}
				}
			}
		}


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
			reactToUrl()
		}
	})

	// Toggle sidebar 
	const [showSidebar, setShowSidebar] = useState(true);
	const toggleSidebar = () => { setShowSidebar(!showSidebar) }
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
	}, [activeFileIndex, showSidebar])

	// Files List
	const {
		files, setFiles,
		askForFolderFiles,
		FilesListComponent,
	} = useAppFilesList(
		activeFileIndex, setActiveFileIndex,
		onFilesReceivedCallback
	)

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
			changeToFolder(selectedFolder, nView)
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

	// PROMPT AND CONFIRM POPUPS
	const { PromptPopupComponent, promptPopup, confirmPopup } = usePromptPopup({})

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
		{ confirm: confirmPopup }
	)


	// Search Note from title
	const { getSearchedTitleFileIndex, searchFileFromTitle } = useSearchFromTitle({ changeToFolder, currentAppView })

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
		cleanFileDetails, askForMoveFile, askForFolderFiles
	)

	// last Note + files history array
	const { filesHistory, cleanLastFilesHistory } = useLastFilesHistory(activeFile)


	// CONNECTION INDICATOR
	const {
		connectionStatusComponent,
		toggleSocketConnection
	} = useConnectionIndicator(setCanEdit)

	// make sure the interface doesnt scroll
	useFixScrollTop()

	// url routing/react logic
	const { reactToUrl } = useUrlLogic(
		isSearching, searchTerm,
		selectedFolder, activeFile,
		activeFileIndex,
		currentAppView,
		{
			reactToUrlParams: newUrlParams => {
				// timeout of 1000 as sometimes when loading is too long, not working
				//setTimeout(() => {
				// new way
				console.log(`[URL] REACTING TO <== ${JSON.stringify(newUrlParams)}`);

				if (newUrlParams.folder && newUrlParams.title) {
					searchFileFromTitle(newUrlParams.title, newUrlParams.folder)
				}
				if (newUrlParams.search) {
					console.log('reactToUrlParams -> triggersearch');
					triggerSearch(newUrlParams.search)
				}
				if (newUrlParams.mobileview) {
					setMobileView(newUrlParams.mobileview)
				}
				if (newUrlParams.appview) {
					switchAppView(newUrlParams.appview)
				}
				//}, 1000)
			}
		}
	)

	// DYNAMIC RESPONSIVE RERENDER (ON DEBOUNCE)
	const { forceResponsiveRender } = useDynamicResponsive()

	// DRAG/DROP FOLDER/FILES MOVING LOGIC
	interface iDraggedItem { type: 'file' | 'folder', files?: iFile[], folder?: iFolder }
	// const [draggedItems,setDraggedItems] = useState<iDraggedItem[]>([])
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

	// window variables
	addCliCmd('variables', {
		description: 'variables for script uses',
		func: () => {
			return {
				file: files[activeFileIndex],
				config: configClient
			}
		}
	})

	// Send Note Leaving Signal
	const [isLeavingNote, setIsLeavingNote] = useState(false)

	// Show settings panel
	const [showSettingsPopup, setShowSettingsPopup] = useState(false)


	/**
	 * LIGHTBOX SYSTEM
	 */
	const [lightboxImages, setLightboxImages] = useState<iFileImage[]>([])
	const [ligthboxIndex, setLigthboxIndex] = useState(0)
	const openLightbox = (index: number, images: iFileImage[]) => {
		console.log(`[LIGHTBOX] open ${images.length} images to index ${index}`, { images });
		setLightboxImages(images)
		setLigthboxIndex(index)
	}
	const closeLightbox = (index: number, images: iFileImage[]) => {
		console.log(`[LIGHTBOX] close`);
		setLightboxImages([])
		setLigthboxIndex(0)
	}

	// Client API (functions added to window.tiroCli)
	useClientApi();

	// Tabs system
	const { tabs, setTabs } = useTabs({});



	return (
		<div className={CssApp2(mobileView)} >
			<div className={` ${deviceType() === 'mobile' ? `mobile-view-${mobileView}` : ''}`}>
				<PopupContext.Provider value={{ confirm: confirmPopup, prompt: promptPopup }} >
					<Global styles={GlobalCssApp} />
					<div role="dialog" className={`
								main-wrapper
								${showSidebar ? "with-sidebar" : "without-sidebar"}
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
													clientSocket2.emit('createNote', { folderPath: selectedFolder, token: getLoginToken() })
													shouldLoadNoteIndex.current = 0
												}}
											/>
										}

										{currentAppView === 'text' &&
											<LastNotes
												files={filesHistory}
												onClick={file => {
													searchFileFromTitle(file.name, file.folder)
												}}
											/>
										}


										{
											FolderTreeComponent({
												onFolderClicked: folderPath => {
													setIsSearching(true)
													changeToFolder(folderPath, currentAppView)
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
												confirmPopup,
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
											{/* <h3 className="subtitle">{strings.files}</h3> */}
											<AppViewSwitcherComponent />
										</div>
										{
											SearchBarComponent({ selectedFolder })
										}
									</div>
									<div className="files-list-wrapper">
										{
											FilesListComponent({
												selectedFolder: selectedFolder,
												searchTerm: searchTerm,
												onFileClicked: fileIndex => {
													setActiveFileIndex(fileIndex)
													askForFileContent(files[fileIndex])
													// this.loadFileDetails(fileIndex)
												},
												onFileDragStart: files => {
													console.log(`[DRAG MOVE] onFileDragStart`, files);
													draggedItems.current = [{ type: 'file', files: files }]
												},
												onFileDragEnd: () => {
													console.log(`[DRAG MOVE] onFileDragEnd`);
													draggedItems.current = []
												},
											})
										}
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
								onImageClicked={openLightbox}
								forceRender={forceResponsiveRender} />
						</div>

							{/* DUAL VIEWER */}
						<div className="right-wrapper dual-viewer-view">
							{
								DualViewerComponent({
									isLeavingNote,
									forceRender: forceResponsiveRender,
									onLightboxClick: openLightbox,
									onToggleSidebarButton: () => {
										toggleSidebar()
									},
									onBackButton: () => {
										console.log('woooop', filesHistory, filesHistory[0].name, filesHistory[1].name);
										let fileToGo = filesHistory[1]
										if (!fileToGo) return
										console.log('BACK BUTTON to', fileToGo.name);
										searchFileFromTitle(fileToGo.name, fileToGo.folder)
									}
								})
							}
						</div>
					</div>
				</PopupContext.Provider>
			</div>

			{
				lightboxImages.length > 0 &&
				<Lightbox
					images={lightboxImages}
					startingIndex={ligthboxIndex}
					onClose={closeLightbox}
				/>
			}
		</div>
	)
}

