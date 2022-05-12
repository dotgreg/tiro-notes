import { css, Global } from '@emotion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deviceType } from './managers/device.manager';
import { clientSocket2, initSocketConnexion } from './managers/sockets/socket.manager';
import { CssApp2 } from './managers/style/css.manager';
import { useMobileView } from './hooks/app/mobileView.hook';
import { debounce, each, isNumber } from 'lodash';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { iFile, iFolder } from '../../shared/types.shared';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
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
import { ClientApiContext, getClientApi2, useClientApi } from './hooks/api/api.hook';
import { useLightbox } from './hooks/app/useLightbox.hook';
import { FilesList } from './components/fileList.component';
import { useNoteHistoryApi } from './hooks/api/history.api.hook';
import { SearchBar2 } from './components/SearchBar.component';
import { useStatusApi } from './hooks/api/status.api.hook';
import { TreeView } from './components/TreeView.Component';
import { askFolderCreate, askFolderDelete, defaultTrashFolder } from './hooks/api/browser.api.hook';



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

	const cleanFileDetails = () => {
		filesUiApi.active.set(-1)
	}

	const cleanFilesList = () => {
		clientApi.ui.browser.files.set([])
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
		//setIsSearching(false)
	}, 100)



	//
	// FOLDERS API
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
			askForFolderScan(['/'])
			refreshTabsFromBackend();
			refreshUserSettingsFromBackend();
			refreshFilesHistoryFromBackend();
		}
	})

	// useEffect(() => {
	// 	//askForFolderScan(['/'])
	// }, [])

	// User settings!
	const {
		userSettingsApi,
		refreshUserSettingsFromBackend
	} = useUserSettings();


	// Toggle sidebar 
	const toggleSidebar = () => {
		userSettingsApi.set('ui_sidebar', !userSettingsApi.get('ui_sidebar'))
	}


	// // KEY ACTIONS
	// useEffect(() => {
	// 	addKeyAction('up', () => {
	// 		let i = filesUiApi.active.get
	// 		if (i > 0) {
	// 			setActiveFileIndex(i - 1)
	// 		}
	// 	})
	// 	addKeyAction('1', () => { if (getKeyModif('ctrl')) toggleSidebar() })
	// 	addKeyAction('down', () => {
	// 		let i = filesUiApi.active.get
	// 		// if (i < files.length - 1) {
	// 		// 	setActiveFileIndex(i + 1)
	// 		// }
	// 	})
	// }, [filesUiApi.active.get, userSettingsApi.get('ui_sidebar')])



	// Tabs system
	const {
		tabs, updateTab,
		refreshTabsFromBackend,
		updateActiveTabGrid,
		refreshWindowGrid,
		tabsApi,
		windowsApi
	} = useTabs();
	const activeTab = getActiveTab(tabs);


	/**
	 * Images List
	 */
	const onImagesReceivedCallback: onImagesReceivedFn = images => {
		console.log(`[IMAGES CALLBACK] images nb: ${images.length}`)
		//setIsSearching(false)
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
			const selectedFolder = clientApi.ui.browser.folders.current.get
			clientApi.ui.browser.goTo(selectedFolder, null, { appView: nView })
		}
	})

	// Tree Folder
	// const {
	// 	openFolders,
	// 	addToOpenedFolders,
	// 	removeToOpenedFolders,

	// 	folderBasePath,
	// 	askForFolderScan,
	// 	FolderTreeComponent,
	// 	cleanFolderHierarchy
	// } = useAppTreeFolder(currentAppView)

	// // on selectedFolder change, trigger update folders/file ui
	// useEffect(() => {
	// 	clientApi.ui.browser.goTo(selectedFolder, null, { appView: currentAppView })
	// }, [selectedFolder])


	// // Search 
	// const {
	// 	setIsSearching,
	// 	setSearchTerm,
	// 	SearchBarComponent,
	// } = useAppSearch(
	// 	shouldLoadNoteIndex,
	// 	cleanListAndFileContent,
	// 	currentAppView
	// )

	// PROMPT AND CONFIRM POPUPAPI
	const { PromptPopupComponent, popupApi } = usePromptPopup({})


	// Search Note from title
	// const { getSearchedTitleFileIndex, searchFileFromTitle } = useSearchFromTitle({ goTo, currentAppView })

	// File Content + Dual Viewer
	// let activeFile = files[activeFileIndex]

	// const {
	// 	fileContent,
	// 	setFileContent,
	// 	setCanEdit,
	// 	askForFileContent,
	// 	DualViewerComponent
	// } = useFileContent(
	// 	activeFile, activeFileIndex, selectedFolder, files, shouldLoadNoteIndex,
	// 	cleanFileDetails, askForMoveFile
	// )


	// CONNECTION INDICATOR
	const {
		isConnected,
		connectionStatusComponent,
		toggleSocketConnection
	} = useConnectionIndicator()



	// make sure the interface doesnt scroll
	useFixScrollTop()

	// DYNAMIC RESPONSIVE RERENDER (ON DEBOUNCEe
	const { forceResponsiveRender, responsiveRefreshCounter, setResponsiveRefresh } = useDynamicResponsive()

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

	// Show settings panel
	const [showSettingsPopup, setShowSettingsPopup] = useState(false)


	// LIGHTBOX SYSTEM
	const { lightboxApi, lightboxImages, lightboxIndex } = useLightbox();

	//
	// CLIENT API 
	//

	// status api
	const statusApi = useStatusApi({
		isConnected,
		refresh: {
			get: responsiveRefreshCounter,
			set: setResponsiveRefresh,
		}
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
		historyApi,
		lightboxApi
	})


	// shortcuts
	const api = clientApi
	const filesUiApi = api.ui.browser.files
	const foldersUiApi = api.ui.browser.folders
	const askForFolderScan = foldersUiApi.scan
	const cleanFolderHierarchy = foldersUiApi.clean
	const folderBasePath = foldersUiApi.base
	const openFolders = foldersUiApi.open.get

	// last Note + files history array
	const { filesHistory, cleanLastFilesHistory, refreshFilesHistoryFromBackend } = useLastFilesHistory(filesUiApi.active.get)

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

	// Mobile view
	const {
		mobileView,
		MobileToolbarComponent
	} = useMobileView()
	// create a refresh on mobile view toggle
	// useEffect(() => {
	// 	api.status.refresh.increment()
	// }, [mobileView])

	//@ts-ignore
	window.api = api

	return (//jsx
		<div className={CssApp2(mobileView, api.userSettings.refresh.css.get)} >
			<div className={` ${deviceType() === 'mobile' ? `mobile-view-${mobileView}` : ''}`}>

				{ /* API : making clientapi available everywhere */}
				<ClientApiContext.Provider value={clientApi} >

					<Global styles={GlobalCssApp} />
					<div role="dialog" className={`
								main-wrapper
								${api.userSettings.get('ui_sidebar') ? "with-sidebar" : "without-sidebar"}
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
													const selectedFolder = clientApi.ui.browser.folders.current.get
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
													clientApi.ui.browser.goTo(
														file.folder,
														file.name,
														{ openIn: 'active' }
													)
												}}
											/>
										}


										<TreeView
											folder={foldersUiApi.get}
											current={foldersUiApi.current.get}
											onFolderClicked={folderPath => {
												clientApi.ui.browser.goTo(folderPath, null, { appView: currentAppView })
											}}
											onFolderMenuAction={(action, folder, newTitle) => {
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
													promptAndMoveFolder({
														folder,
														folderToDropInto: defaultTrashFolder,
														folderBasePath,
														newTitle
													})
												} else if (action === 'delete') {
													askFolderDelete(folder)
													askForFolderScan([folder.path])
												}
											}}
											onFolderOpen={folderPath => {
												askForFolderScan([folderPath])
											}}
											onFolderClose={folderPath => {
											}}
											onFolderDragStart={draggedFolder => {
												console.log(`[DRAG MOVE] onFolderDragStart`, draggedFolder);
												draggedItems.current = [{ type: 'folder', folder: draggedFolder }]
											}}
											onFolderDragEnd={() => {
												console.log(`[DRAG MOVE] onFolderDragEnd`);
												draggedItems.current = []
											}}
											onFolderDrop={folderDroppedInto => {
												processDragDropAction(folderDroppedInto)
											}}

										/>


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
											{deviceType() !== 'mobile' &&
												<div className="toggle-sidebar-btn">
													<ButtonsToolbar
														popup={false}
														buttons={[{
															icon: 'faThumbtack',
															title: 'Toggle Sidebar',
															action: e => { toggleSidebar(); refreshWindowGrid(); },
															active: clientApi.userSettings.get('ui_sidebar') === true
														}]}
														colors={["#d4d1d1", "#615f5f"]}
														size={0.8}
													/>
												</div>
											}

											{/* <h3 className="subtitle">{strings.files}</h3> */}
											<AppViewSwitcherComponent />

										</div>
										<SearchBar2 term={clientApi.ui.search.term.get} />
									</div>
									<div className="files-list-wrapper">

										<FilesList
											files={filesUiApi.get}
											activeFileIndex={filesUiApi.active.getIndex}

											onSortFiles={filesSorted => {
												clientApi.ui.browser.files.set(filesSorted)
											}}
											onFileClicked={fileIndex => {
												filesUiApi.active.set(fileIndex)
												const nFile = filesUiApi.get[fileIndex]
												// if no tab opened, create new tab/window
												const noTab = api.tabs.get().length === 0
												if (noTab) api.tabs.openInNewTab(nFile)
												else windowsApi.updateActive(nFile)
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
								<SearchBar2 term={clientApi.ui.search.term.get} />
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

