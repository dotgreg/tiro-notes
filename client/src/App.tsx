import { css, Global } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';
import { deviceType } from './managers/device.manager';
import { initSocketConnexion } from './managers/sockets/socket.manager';
import { CssAppDynamic, CssAppStatic } from './managers/style/css.manager';
import { useMobileView } from './hooks/app/mobileView.hook';
import { useFileMove } from './hooks/app/fileMove.hook';
import { useConnectionIndicator } from './hooks/app/connectionIndicator.hook';
import { useFixScrollTop } from './hooks/fixScrollTop.hook';
import { iFile, iFolder, iGrid, iTab } from '../../shared/types.shared';
import { getDateObj } from '../../shared/helpers/date.helper';
import { GlobalCssApp } from './managers/style/global.style.manager';
import { NewFileButton } from './components/NewFileButton.component';
import { LastNotes } from './components/LastNotes.component';
import { useLastFilesHistory } from './hooks/app/lastFilesHistory.hook';
import { useSetupConfig } from './hooks/app/setupConfig.hook';
import { useLoginToken } from './hooks/app/loginToken.hook';
import { useDynamicResponsive } from './hooks/app/dynamicResponsive.hook';
import { Icon, Icon2 } from './components/Icon.component';
import { SettingsPopup } from './components/settingsView/settingsView.component';
import { Lightbox } from './components/Lightbox.component';
import {  startListeningToKeys } from './managers/keys.manager';
import { usePromptPopup } from './hooks/app/usePromptPopup.hook';
import { generateNewTab, useTabs } from './hooks/app/tabs.hook';
import { TabList } from './components/tabs/TabList.component';
import { WindowGrid } from './components/windowGrid/WindowGrid.component';
import { ButtonsToolbar } from './components/ButtonsToolbar.component';
import { ClientApiContext, getApi, useClientApi } from './hooks/api/api.hook';
import { useLightbox } from './hooks/app/useLightbox.hook';
import { FilesList } from './components/fileList.component';
import { useNoteHistoryApi } from './hooks/api/history.api.hook';
import { SearchBar2 } from './components/SearchBar.component';
import { useStatusApi } from './hooks/api/status.api.hook';
import { FoldersTreeView } from './components/TreeView.Component';
import {  askFolderDelete, defaultTrashFolder } from './hooks/api/browser.api.hook';
import { getMostRecentFile } from './managers/sort.manager';
import { initPWA } from './managers/pwa.manager';

import { OmniBar } from './components/OmniBar.component';
import { Shortcuts } from './components/Shortcuts.component';
import { TtsPopup } from './components/TtsPopup.component';
import { useTtsPopup } from './hooks/app/useTtsPopup.hook';
import { getParentFolder } from './managers/folder.manager';
import './managers/localNoteHistory.manager';
import { cloneDeep, each, random, set, update } from 'lodash-es';
import { devCliAddFn, notifLog } from './managers/devCli.manager';
import { NotificationsCenter } from './components/NotificationsCenter.component';
import { startFrontendBackgroundPluginsCron } from './managers/plugin.manager';
import { addKeyShortcut,  loadUserKeyboardShortcuts,  releaseKeyShortcut, releaseKeyShortcuts } from './managers/keyboard.manager';
import { useNotePreviewPopupApi } from './hooks/api/notePreviewPopup.api.hook';
import { NotePreviewPopup } from './components/NotePreviewPopup.component';
import { onStartupReactToUrlParams, updateAppUrlFromActiveWindow } from './managers/url.manager';
import { PluginsMarketplacePopup } from './components/settingsView/pluginsMarketplacePopup.component';
import { FloatingPanel, FloatingPanelsWrapper } from './components/FloatingPanels.component';
import { usePinStatus } from './hooks/app/usePinnedInterface.hook';
import { userSettingsSync } from './hooks/useUserSettings.hook';
import { webIconUpdate } from './managers/iconWeb.manager';
import { initLatex, isLatexInit } from './managers/latex.manager';
import { BackgroundVideo } from './components/BackgroundVideo.component';
import { triggerTiroHelpPopup } from './managers/help.manager';
import { createNewNote } from './managers/newNote.manager';
import { release } from 'os';
import { textToId } from './managers/string.manager';
import { codeMirrorGlobalVars } from './components/dualView/CodeMirrorEditor.component';
import { TtsCustomPopup } from './components/TtsCustomPopup.component';

export const App = () => {

	//
	// STARTUP PHASE, code should be added after login phase, not here
	//
	useEffect(() => {
		

		// starting BG cron with some time offset to not have synchronous bg runs from different client windows
		setTimeout(() => {
			startFrontendBackgroundPluginsCron()
		}, random(1000, 10000))
		// PWA
		initPWA()
		// COMPONENT DID MOUNT didmount
		console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

		initSocketConnexion().then(serverSocketConfig => {
			toggleSocketConnection(true)
			api && api.status.ipsServer.set(serverSocketConfig.ipsServer)
			

			getApi(api => { 
				api.ui.browser.folders.refreshFromBackend() 
			})
		})

		// Temporary => after tabs and other backend states are loaded
		onStartupAfterDataBootstrap()
		console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

		startListeningToKeys();
		devCliAddFn("init", "init", () => { })
		// TESTS
		// getApi(api => {
		// 	// console.log()
		// 	let cid = "dsafdsa"
		// 	api.cache.get(cid, res => {
		// 		console.log("1 cache get",cid, res)
		// 		api.cache.set(cid, {here: "wego"}, -1, (res) => {
		// 			console.log("2 cache set done", res)
		// 			api.cache.get(cid, res => {
		// 				console.log("3 cache get",cid, res)
		// 			})
		// 		})
		// 	})
		// })

		return () => {
			// COMPONENT will unmount
			console.log('app will unmount');
		}
	}, [])

	//
	// TEMPORARY : find better way to detect end data bootstrap
	// STARTUP CODE (after data hydration done)
	//
	const onStartupAfterDataBootstrap = () => {
		setTimeout(() => {
			onStartupReactToUrlParams(setMobileView)
		}, 300)
	}

	// APP-WIDE MULTI-AREA LOGIC
	const cleanFileDetails = () => {
		filesUiApi.active.set(-1)
	}

	const cleanFilesList = () => {
		clientApi.ui.browser.files.set([])
		// api.popup.confirm()
	}


	const cleanListAndFileContent = () => {
		// console.log('[cleanListAndFileContent]');
		cleanFileDetails()
		cleanFilesList()
	}

	const cleanAllApp = () => {
		console.log('[cleanAllApp]');
		cleanLastFilesHistory()
		cleanFolderHierarchy()
		cleanFileDetails()
		cleanFilesList()
	}


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
			refreshTabsFromBackend();
			refreshPinStatus();
			refreshFilesHistoryFromBackend();
			getApi(api => {
				api.userSettings.refreshUserSettingsFromBackend()
				api.ui.floatingPanel.refreshFromBackend()
			})
			

			getApi(api => {
				api.ui.browser.folders.refreshFromBackend()
			})

			// seems blocking the initial loading of a few seconds, so starts it 10s after
			askForFolderScan(['/'])

			// Temporary => after tabs and other backend states are loaded
			onStartupAfterDataBootstrap()
		}
	})

	


	// Toggle sidebar 
	const toggleSidebar = () => {
		getApi(api => {
			api.userSettings.set('ui_sidebar', !api.userSettings.get('ui_sidebar'))
		})
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

	const [forceRefresh, setForceRefresh] = useState(0)
	const updateActiveTabGridWrapper = (grid: iGrid) => {
		// if (deviceType() === "mobile") return
		updateActiveTabGrid(grid)
		setForceRefresh(forceRefresh + 1)
	}
	
	// const [currentTab, setCurrentTab] = useState<iTab | null>(null)
	// useEffect(() => {
	// 	if (deviceType() === "mobile") {
	// 		let mobileTab = cloneDeep(tabsApi.active.get())
	// 		if (!mobileTab) return 
	// 		mobileTab.id = "mobile-tab-id"
	// 		// only keep one content and one layout
	// 		mobileTab.grid.content = [mobileTab.grid.content[0]]
	// 		mobileTab.grid.layout = [mobileTab.grid.layout[0]]
	// 		mobileTab.grid.layout[0].i = "mobile-tab-id-layout"
	// 		mobileTab.grid.content[0].i = "mobile-tab-id-content"

	// 		console.log(`[MOBILE TAB]`, mobileTab);
	// 		setCurrentTab(mobileTab) 
	// 	} else {
	// 		setCurrentTab(tabsApi.active.get())
	// 	}
	// }, [tabs])
	// console.log(activeTab);
	const currentTab = tabsApi.active.get()


	// PROMPT AND CONFIRM POPUPAPI
	const { PromptPopupComponent, popupApi } = usePromptPopup({})



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
			promptAndBatchMoveFiles({
				files: item.files,
				folderToDropInto
			})
		} else if (item.type === 'folder' && item.folder) {
			promptAndMoveFolder({
				folder: item.folder, folderToDropInto, folderBasePath,
				disablePrompt: true,
				onMoveFn: () => {
					if (!item.folder) return
					let folderpath = item.folder.path
					let folderpath2 = folderToDropInto.path
					askForFolderScan([getParentFolder(folderpath), getParentFolder(folderpath2), folderpath2, folderpath], {
						cache: false,
						cb: () => { 
							foldersUiApi.open.add(folderpath) 
							foldersUiApi.open.add(folderpath2) 
							foldersUiApi.open.add(getParentFolder(folderpath)) 
							foldersUiApi.open.add(getParentFolder(folderpath2)) 
							
						}
					})
				}
			})
		}
	}

	
	
	// let debugConfig = null
	const [configPopup, setConfigPopup] = useState<"settings"|"plugins-marketplace"|null>(null)

	// Show settings panel
	useEffect(() => {
		setTimeout(() => {
			// setConfigPopup("plugins-marketplace")
		},2000)
	}, [])


	// LIGHTBOX SYSTEM
	const { lightboxApi, lightboxImages, lightboxIndex } = useLightbox();

	// TTS SYSTEM
	const { ttsApi, ttsPos, ttsPopup, setTtsPopup, ttsPopupContent, ttsPopupId, syncTtsStatus } = useTtsPopup();

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
	// NOTE PREVIEW POPUP SYSTEM
	//
	const {
		notePreviewPopupApi, notePreviewPopup
	} = useNotePreviewPopupApi()

	//
	// CLIENT API
	//
	const clientApi = useClientApi({
		popupApi,
		tabsApi,
		windowsApi,
		statusApi,
		historyApi,
		notePreviewPopupApi,
		lightboxApi,
		ttsApi
	})


	// shortcuts
	const api = clientApi
	const filesUiApi = api.ui.browser.files
	const foldersUiApi = api.ui.browser.folders
	const askForFolderScan = foldersUiApi.scan
	const cleanFolderHierarchy = foldersUiApi.clean
	const folderBasePath = foldersUiApi.base

	// last Note + files history array
	const {
		filesHistory,
		filesHistoryRef,
		cleanLastFilesHistory,
		refreshFilesHistoryFromBackend,
		lastFilesHistoryApi
	} = useLastFilesHistory(filesUiApi.active.get)
	api.lastNotesApi = lastFilesHistoryApi



	// fileMove logic
	const {
		askForMoveFile,
		promptAndMoveFolder,
		promptAndBatchMoveFiles
	} = useFileMove(
		cleanFileDetails,
		cleanFilesList,
		cleanFolderHierarchy,
		askForFolderScan
	)

	// Mobile view
	const {
		mobileView,
		setMobileView,
		MobileToolbarComponent
	} = useMobileView()



	//@ts-ignore
	window.api = api


	//
	// OMNI SUGGEST BAR 
	//
	const [suggestOpen, setSuggestOpen] = useState(false)
	const [suggestShow, setSuggestShow] = useState(false)
	useEffect(() => {
		const openOmni = () => { setSuggestOpen(true); setSuggestShow(true) }
		const closeOmni = () => { setSuggestOpen(false); }
		// k.bind('alt + spacebar', openOmni);
		addKeyShortcut('alt + spacebar', openOmni);
		addKeyShortcut('alt + p', openOmni);
		addKeyShortcut('alt + ,', () => {setConfigPopup("settings")});
		// encryption
		addKeyShortcut('alt + e', () => { api.note.ui.editorAction.dispatch({ type: "toggleEncryption", noteParentType: "grid" }) });
		addKeyShortcut('alt + shift + e', () => { api.note.ui.editorAction.dispatch({ type: "toggleEncryption", noteParentType: "floating" }) });
		addKeyShortcut('alt + shift + u', () => { api.note.ui.editorAction.dispatch({ type: "triggerUpload", noteParentType: "floating" }) });
		addKeyShortcut('alt + e', () => { api.note.ui.editorAction.dispatch({ type: "toggleEncryption", noteParentType: "grid" }) });
		addKeyShortcut('alt + u', () => { api.note.ui.editorAction.dispatch({ type: "triggerUpload", noteParentType: "grid" }) });
		
		// k.bind('esc', closeOmni);
		addKeyShortcut('esc', () => {
			closeOmni()
			setConfigPopup(null)
		});
		return () => { 
			releaseKeyShortcuts() 
		}
	}, [filesHistory])
	



	//
	//
	// GLOBAL KEY SHORTCUTS MANAGEMENT
	//
	//
	const createNoteFloatingFn = () => { createNewNote({ openIn: "floatingWindow" }) }
	const createNoteFn = () => { createNewNote({ openIn: "activeWindow" }) }
	const toggleActiveWindowView = () => {
		getApi(api => {
			api.ui.windows.active.toggleView()
		})
	}
	const detachActiveNoteInFloating = () => {
		getApi(api => {
			let activeNote = api.ui.browser.files.active.get
			if (!activeNote) return
			api.ui.floatingPanel.create({
				type: "file",
				file: activeNote,
			})
		})
	}
	useEffect(() => {
		addKeyShortcut('alt  > n', createNoteFn);
		// addKeyShortcut('alt + shift > f', createNoteFloatingFn);
		addKeyShortcut('alt > v', toggleActiveWindowView);
		addKeyShortcut('alt > d', detachActiveNoteInFloating);
		return () => { 
			releaseKeyShortcut('alt  > n', createNoteFn) 
			// releaseKeyShortcut('alt + shift > f', createNoteFloatingFn) 
			releaseKeyShortcut('alt > v', toggleActiveWindowView);
			releaseKeyShortcut('alt > d', detachActiveNoteInFloating);
		}
	})




	//
	// URL/ICON SYSTEM (MOBILE ONLY)
	//
	useEffect(() => {
		// URL system once the window update has spread
		if (deviceType() !== "mobile") return webIconUpdate("/favicon.png")
		updateAppUrlFromActiveWindow(tabs, mobileView)
		// update 
	}, [tabs, mobileView])

	let rcnt = forceResponsiveRender ? 0 : 1
	let cnt = api.userSettings.refresh.css.get + rcnt
	let usettings = api.userSettings

	//
	// Global Pinned status system
	//
	const {pinStatus, updatePinStatus, togglePinStatus, refreshPinStatus} = usePinStatus()

	//
	// BG video
	//
	const [bgVideo, setBgVideo] = useState<string|undefined>(undefined)
	const imageWidth = userSettingsSync.curr.ui_layout_background_video_width
	const imageHeight = userSettingsSync.curr.ui_layout_background_video_height
	useEffect(() => {
		let backgroundVideoEnable = userSettingsSync.curr.ui_layout_background_video_enable
		let backgroundVideo = userSettingsSync.curr.ui_layout_background_image
		if (backgroundVideoEnable && backgroundVideo) setBgVideo(backgroundVideo)
	}, [cnt, usettings])


	//
	// USER CUSTOM SHORTCUTS
	//

	useEffect(() => {
		// console.log(`[SHORTCUTS]`, cnt, usettings, userSettingsSync.curr.keyboard_shortcuts_textarea)
		let shortcutsRawConfig = userSettingsSync.curr.keyboard_shortcuts_textarea
		if (!shortcutsRawConfig) return
		let shortcutsFns = loadUserKeyboardShortcuts(shortcutsRawConfig)

		each(shortcutsFns, sc => {
			addKeyShortcut(sc.shortcut, sc.func)
		})
		return () => {
			each(shortcutsFns, sc => {
				releaseKeyShortcut(sc.shortcut, sc.func)
			})
		}

	}, [cnt, usettings])



	

	return (
		<div className={CssAppStatic( usettings)} >
			<div className={CssAppDynamic(mobileView, cnt, usettings, pinStatus)} >
				{bgVideo && <BackgroundVideo url={bgVideo} width={imageWidth} height={imageHeight} /> }
				<div className={` ${deviceType() === 'mobile' ? `mobile-view-container mobile-view-${mobileView}` : ''}`}>

					{ /* API : making clientapi available everywhere */}
					<ClientApiContext.Provider value={clientApi} >


						<div className='config-buttons-bar'>
							<div className="config-button infos-button" onClick={() => { triggerTiroHelpPopup() }}>
									<Icon2 name="question" />
							</div>
							{ api.userSettings.get('beta_plugins_marketplace') &&
								<div className="config-button plugins-marketplace-button" onClick={() => { setConfigPopup("plugins-marketplace") }}>
									<Icon2 name="puzzle-piece" />
								</div>
							}
							{
								deviceType() !== 'mobile' &&
								<div className="config-button search-button" onClick={() => { setSuggestShow(true); setSuggestOpen(true) }}>
									<Icon2 name="search" />
								</div>
							}
							<div className="config-button settings-button" onClick={() => { setConfigPopup("settings") }}>
								<Icon2 name="cog" />
							</div>
						</div>
						{
							notePreviewPopup?.isOpen && <NotePreviewPopup notePreview={notePreviewPopup} />
						}
						{suggestOpen &&
							<OmniBar
								show={suggestShow}
								lastNotes={filesHistory}
								onClose={e => { setSuggestOpen(false) }}
								onHide={e => { setSuggestShow(false) }}
								onNoteCreate={folderPath => {createNewNote({folderPath, openIn: "activeWindow"}) } }
							/>
						}
						

						<Global styles={GlobalCssApp()} />
						<div role="dialog" className={`main-wrapper ${api.userSettings.get('ui_sidebar') ? "with-sidebar" : "without-sidebar"} device-view-${deviceType()}`}>
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
								MobileToolbarComponent({
									forceRerender: forceResponsiveRender,
									onButtons: [
										() => {
											// let nState = suggestOpen ? false : true
											setSuggestShow(true)
											setSuggestOpen(true)
										}
									]
								})
							}

							<div className="left-sidebar-indicator">
								<div className="left-wrapper">
									<div className="left-wrapper-1">
										<div className="invisible-scrollbars">
											<NewFileButton
												onNewFile={() => {
													createNewNote({
														openIn: "activeWindow"
													})
												}}
											/>

											{api.userSettings.get('ui_layout_shortcuts_panel') &&

												<Shortcuts
													filePath={`.tiro/shortcuts.md`}
													onClick={() => {

													}}
												/>
											}

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


											<FoldersTreeView
												openFolders={foldersUiApi.open.get()}
												folder={foldersUiApi.get()}
												current={foldersUiApi.current.get()}
												onFolderClicked={folderPath => {
													clientApi.ui.browser.goTo(folderPath, null)
												}}
												onFolderMenuAction={(action, folder, newTitle) => {
													if (action === 'rename' && newTitle) {
														promptAndMoveFolder({
															folder,
															folderToDropInto: folder,
															folderBasePath,
															newTitle,
															renameOnly: true,
															disablePrompt: true,
															onMoveFn: () => {
																askForFolderScan([getParentFolder(folder.path)], {
																	cache: false,
																	cb: () => {
																		// folder sometimes closing itself
																		// foldersUiApi.open.remove([getParentFolder(folder.path)])
																		// foldersUiApi.open.add(getParentFolder(folder.path))
																		// foldersUiApi.open.add(folder.path)
																	}
																})
															}
														})
													} else if (action === 'create' && newTitle) {
														getApi(api => {
															api.folders.create(`${folder.path}/${newTitle}`, status => {
																askForFolderScan([folder.path], { cache: false })
															})
														})
													} else if (action === 'moveToTrash') {
														promptAndMoveFolder({
															folder,
															folderToDropInto: defaultTrashFolder,
															folderBasePath,
															newTitle: `${folder.title}_${getDateObj().full_file}`,
															onMoveFn: () => {
																askForFolderScan([getParentFolder(folder.path),folder.path], {
																	cache: false,
																	// closeFolders: [folder.path],
																	cb: () => { 
																		foldersUiApi.open.add(folder.path) 
																	}
																})
															}
														})
													} else if (action === 'delete') {
														askFolderDelete("trash")
														setTimeout(() => {
															askForFolderScan([folder.path], { cache: false })
														})
													}
													// in any cases, ask for whole rescan in background
													// askForFolderScan(foldersUiApi.open.get, {cache: false, background: true })
												}}
												onFolderOpen={folderPath => {
													askForFolderScan([folderPath], { cache: false })
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

										
									</div>
									<div className="left-wrapper-2">
										<div className="top-files-list-wrapper">
											<div className="subtitle-wrapper">

												<div className="folder-wrapper">
													{api && api.ui.browser.folders.current.get()}
													{!api.ui.browser.folders.current.get() && "/"}
												</div>


												{/* SIDEBAR TOGGLER */}
												{deviceType() !== 'mobile' &&
													<div className="toggle-sidebar-btn">
														<ButtonsToolbar
															popup={false}
															buttons={[{
																title: 'Toggle Sidebar',
																icon: 'faThumbtack',
																action: e => { toggleSidebar(); refreshWindowGrid(); },
																active: clientApi.userSettings.get('ui_sidebar') === true
															}]}
															size={0.8}
														/>
													</div>
												}

												{/* <h3 className="subtitle">{strings.files}</h3> */}
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

													// if no active tab opened, create new tab/window
													if (!api.tabs.active.get()) api.tabs.openInNewTab(nFile)

													else {
														windowsApi.active.setContent(nFile)
													}
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




							<div className="right-wrapper draggable-grid-editors-view">


								{/* TABS SYSTEM*/}
								{deviceType() !== "mobile" && <TabList
									tabs={tabs}
									onUpdate={updateTab}
									onPinToggle={togglePinStatus("topTab")}
									pinStatus={pinStatus.topTab}
								/>}

								{currentTab &&
									<WindowGrid
										tab={currentTab}
										forceRefresh={forceRefresh}
										onGridUpdate={updateActiveTabGridWrapper}
										mobileView={mobileView}
										pinStatus={pinStatus}
									/>
								}


							</div>
							{/* { deviceType() !== "mobile" && userSettingsSync.curr.beta_floating_windows && */}
							{ 
								<FloatingPanelsWrapper 
									panels={api.ui.floatingPanel.panels} 
									pinStatus={pinStatus.bottomBar}
									onPinChange={updatePinStatus("bottomBar")}
								/>
							}

							{
								configPopup === "plugins-marketplace" &&
								<PluginsMarketplacePopup onClose={() => {
									setConfigPopup(null)
								}} />
							}
							{
								configPopup === "settings" &&
								<SettingsPopup onClose={() => {
									setConfigPopup(null)
								}} />
							}
						</div>
					</ClientApiContext.Provider>
				</div >

				
				
				<NotificationsCenter />

				{
					lightboxImages.length > 0 &&
					<Lightbox
						images={lightboxImages}
						startingIndex={lightboxIndex}
						onClose={clientApi.ui.lightbox.close}
					/>
				}

				{ttsPopup &&
					!userSettingsSync.curr.tts_custom_engine_enabled &&
					<TtsPopup
						id={ttsPopupId}
						fileContent={ttsPopupContent}
						startString={ttsPos}
						onUpdate={s => { syncTtsStatus(s) }}
						onClose={() => { setTtsPopup(false) }} />
				}
				{ttsPopup &&
					userSettingsSync.curr.tts_custom_engine_enabled &&
						<TtsCustomPopup
							id={ttsPopupId}
							fileContent={ttsPopupContent}
							startString={ttsPos}
							onUpdate={s => { syncTtsStatus(s) }}
							onClose={() => { setTtsPopup(false) }} />
				}

			</div >
		</div >
	)
}
