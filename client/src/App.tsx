
import { css, Global } from '@emotion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deviceType } from './managers/device.manager';
import { initSocketConnexion } from './managers/sockets/socket.manager';
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
import { useLoginToken } from './hooks/app/loginToken.hook';
import { useDynamicResponsive } from './hooks/app/dynamicResponsive.hook';
import { Icon } from './components/Icon.component';
import { SettingsPopup } from './components/settingsView/settingsView.component';
import { Lightbox } from './components/Lightbox.component';
import { addKeyAction, getKeyModif, startListeningToKeys } from './managers/keys.manager';
import { usePromptPopup } from './hooks/app/usePromptPopup.hook';
import { useTabs } from './hooks/app/tabs.hook';
import { TabList } from './components/tabs/TabList.component';
import { WindowGrid } from './components/windowGrid/WindowGrid.component';
import { ButtonsToolbar } from './components/ButtonsToolbar.component';
import { useUserSettings } from './hooks/useUserSettings.hook';
import { ClientApiContext, getApi, getClientApi2, useClientApi } from './hooks/api/api.hook';
import { useLightbox } from './hooks/app/useLightbox.hook';
import { FilesList } from './components/fileList.component';
import { useNoteHistoryApi } from './hooks/api/history.api.hook';
import { SearchBar2 } from './components/SearchBar.component';
import { useStatusApi } from './hooks/api/status.api.hook';
import { FoldersTreeView } from './components/TreeView.Component';
import { askFolderCreate, askFolderDelete, defaultTrashFolder } from './hooks/api/browser.api.hook';
import { getMostRecentFile } from './managers/sort.manager';
import { initPWA } from './managers/pwa.manager';
import * as k from 'keyboardjs';
// import
import { SuggestPopup } from './components/SuggestPopup.component';
import { Shortcuts } from './components/Shortcuts.component';
import { TtsPopup } from './components/TtsPopup.component';
import { useTtsPopup } from './hooks/app/useTtsPopup.hook';

export const App = () => {

	useEffect(() => {

		// PWA
		initPWA()

		// COMPONENT DID MOUNT didmount
		console.log(`========= [APP] MOUNTED on a ${deviceType()}`);

		initSocketConnexion().then(serverSocketConfig => {
			toggleSocketConnection(true)
			api && api.status.ipsServer.set(serverSocketConfig.ipsServer)
		})

		startListeningToKeys();

		getApi(api => {
			// api.c
			// let cmd = "ls -lsia"
			// ERROR
			// let cmd = "ssh ubuntu@raw2.websocial.cc -tt \"ls -lsia\""
			// let cmd = "ssh ubuntu@raw2.websocial.cc -t \'ls -lsia\'"
			// let cmd = "ssh ubuntu@raw2.websocial.cc -t 'ls -lsia'"
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls -lsia"`

			// UNDEFINED result
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls"`
			// let cmd = `ls`

			// OK CT INHERIT QUI FAISAIT FOIRER
			// let cmd = "ls"

			// Pseudo-terminal will not be allocated because stdin is not a terminal
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls -lsia"`

			// WORKING
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls"`

			// WORKING w shell: true
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls"`

			// FREEAAAAAAAAAKING WOOOOOOOOOOOORKING
			// let cmd = `ssh ubuntu@raw2.websocial.cc -t "ls -lsia"`

			// api.command.exec(cmd, res => {
			// 	console.log(111222, `${cmd} => `, res);
			// })

		})


		// 		let content = `
		// const test = (input, api, cb) => {
		// console.log(44444444, input, api, cb);
		// cb("result PASSSSSSSSSED")
		// }
		// `
		//@ts-ignore
		// new Function(content)("woopy", window.api, (res) => {
		// 	console.log(2223, res);
		// })

		// V2 WORKING LOCAL
		// 		let inpt = "woooooopu"
		// 		let content2 = `
		// cb({v1: "resuuuuuuuuuult" + input, api, input})
		// `
		// 		//@ts-ignore
		// 		new Function('input', 'api', 'cb', content2)(inpt, window.api, res => {
		// 			console.log("CAME BACK FROM CB!!!!", res);
		// 		})

		// V3 REMOTE CODE EXEC
		// 		let inpt = "woooooopu"
		// 		let url = "https://gist.githubusercontent.com/dotgreg/e56ce9547cd74128b3d15125870bea89/raw/c17a65aa971b9f2eecdc35f1c6e6f6cf56c8c40b/gistfile1.txt"
		// 		let content3 = `
		// api.ressource.fetch("${url}", txt => {
		// 		new Function('input', 'api', 'cb', txt)(input, api, res => {
		// 			cb(res);
		// 		})
		// })
		// `
		// 		//@ts-ignore
		// 		new Function('input', 'api', 'cb', content3)(inpt, window.api, res => {
		// 			console.log("CAME BACK FROM CB 3!!!!", res);
		// 		})


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
		// api.popup.confirm()
	}


	const cleanListAndFileContent = () => {
		console.log('[cleanListAndFileContent]');
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
			refreshTabsFromBackend();
			refreshUserSettingsFromBackend();
			refreshFilesHistoryFromBackend();

			getApi(api => {
				api.ui.browser.folders.refreshFromBackend()
			})

			// seems blocking the initial loading of a few seconds, so starts it 10s after
			askForFolderScan(['/'])

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
	const activeTab = tabsApi.active.get();



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
			promptAndBatchMoveFiles(item.files, folderToDropInto)
		} else if (item.type === 'folder' && item.folder) {
			promptAndMoveFolder({ folder: item.folder, folderToDropInto, folderBasePath })
		}
	}

	// Show settings panel
	const [showSettingsPopup, setShowSettingsPopup] = useState(false)


	// LIGHTBOX SYSTEM
	const { lightboxApi, lightboxImages, lightboxIndex } = useLightbox();

	// TTS SYSTEM
	const { ttsApi, ttsPos, ttsPopup, setTtsPopup, ttsPopupContent, ttsPopupFile, syncTtsStatus } = useTtsPopup();

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
		askForFolderScan
	)

	// Mobile view
	const {
		mobileView,
		MobileToolbarComponent
	} = useMobileView()

	//@ts-ignore
	window.api = api


	//
	// OMNI SUGGEST BAR 
	//
	const [suggestOpen, setSuggestOpen] = useState(false)
	useEffect(() => {
		const openOmni = () => { setSuggestOpen(true) }
		const closeOmni = () => { setSuggestOpen(false) }
		k.bind('alt + spacebar', openOmni);
		k.bind('esc', closeOmni);
		return () => { k.releaseAllKeys(); }
	}, [filesHistory])




	return (
		<div className={CssApp2(mobileView, api.userSettings.refresh.css.get)} >
			<div className={` ${deviceType() === 'mobile' ? `mobile-view-${mobileView}` : ''}`}>

				{ /* API : making clientapi available everywhere */}
				<ClientApiContext.Provider value={clientApi} >


					{suggestOpen &&
						<SuggestPopup
							lastNotes={filesHistory}
							onClose={e => { setSuggestOpen(false) }}
						/>
					}

					<Global styles={GlobalCssApp()} />
					<div role="dialog" className={`
								main-wrapper
								${api.userSettings.get('ui_sidebar') ? "with-sidebar" : "without-sidebar"}
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
							MobileToolbarComponent({
								forceRerender: forceResponsiveRender,
								onButtons: [
									() => {
										let nState = suggestOpen ? false : true
										setSuggestOpen(nState)
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
												getApi(api => {
													const selectedFolder = api.ui.browser.folders.current.get
													api.file.create(selectedFolder, files => {
														const nFile = getMostRecentFile(files)
														nFile && api.ui.browser.goTo(selectedFolder, nFile.name, { openIn: 'activeWindow' })
													})
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
											openFolders={foldersUiApi.open.get}
											folder={foldersUiApi.get}
											current={foldersUiApi.current.get}
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
														renameOnly: true
													})
													askForFolderScan([folder.path], { cache: false })
												} else if (action === 'create' && newTitle) {
													askFolderCreate(newTitle, folder)
													askForFolderScan([folder.path], { cache: false })
												} else if (action === 'moveToTrash') {
													promptAndMoveFolder({
														folder,
														folderToDropInto: defaultTrashFolder,
														folderBasePath,
														newTitle
													})
													askForFolderScan([folder.path], { cache: false })
												} else if (action === 'delete') {
													askFolderDelete(folder)
													askForFolderScan([folder.path], { cache: false })
												}
												// in any cases, ask for whole rescan in background
												askForFolderScan(foldersUiApi.open.get, { cache: false, background: true })
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

											<div className="folder-wrapper">
												{api && api.ui.browser.folders.current.get}
												{!api.ui.browser.folders.current.get && "/"}
											</div>


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

												else windowsApi.active.setContent(nFile)
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

			{ttsPopup &&
				<TtsPopup
					file={ttsPopupFile as iFile}
					fileContent={ttsPopupContent}
					startString={ttsPos}
					onUpdate={s => { syncTtsStatus(s) }}
					onClose={() => { setTtsPopup(false) }} />
			}

		</div >
	)
}

