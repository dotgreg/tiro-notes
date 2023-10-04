import { isBoolean } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { iViewType, iWindowContent } from '../../../../shared/types.shared';
import { getApi } from '../../hooks/api/api.hook';
import { useDebounce } from '../../hooks/lodash.hooks';
import { iMobileView, isA } from '../../managers/device.manager';
import { addLocalNoteHistory, iLocalNoteHistory } from '../../managers/localNoteHistory.manager';
import { getNoteView } from '../../managers/windowViewType.manager';
import { DualViewer } from '../dualView/DualViewer.component';
import { iLayoutUpdateFn } from '../dualView/EditorArea.component';
import { cssVars } from '../../managers/style/vars.style.manager';


export const WindowEditorInt = (p: {
	content: iWindowContent
	// onViewChange: onViewChangeFn
	// onEditorDropdownEnter?: Function
	askForLayoutUpdate:iLayoutUpdateFn
	mobileView?: iMobileView
}) => {

	const { file, view, active, i } = { ...p.content }

	const [fileContent, setFileContent] = useState('')
	const [intViewType, setIntViewType] = useState<iViewType>()

	useEffect(() => {
		setIntViewType(view)
		// get the backend cached view type
		getNoteView(file?.path as string).then(res => {
			if (res) setIntViewType(res)
		})
	}, [view, file?.path])

	//
	// FILE CONTENT FETCH/UPDATE
	//
	let filePathRef = useRef<string>(file?.path || "")

	// CLEAN CONTENT WHEN LOADING
	// useEffect(() => {
	// 	setFileContent("loading...")
	// }, [file?.path])

	useEffect(() => {
		filePathRef.current = file?.path || ""

		setCanEdit(false)

		if (!file) return
		getApi(api => {
			// LOAD CONTENT FIRST
			api.file.getContent(file.path, content => {
				setFileContent(content)
				setCanEdit(true)
			})


			// WATCH LOGIC
			api.watch.file(file.path, watchUpdate => {
				// IF WE ARE AFTER RECONNECTION, DISABLE IT FOR 10s
				if (disableWatchUpdate.current) return console.log("FILE WATCH DISABLED FOR 10s after reconnection")
				// THEN WATCH FOR UPDATE BY OTHER CLIENTS
				if (filePathRef.current !== watchUpdate.filePath) return
				// if (deviceType() !== "desktop") return

				// if watcher gives an update to a file we are currently editing
				// make it inside a debounce, only for desktop
				if (
					isBeingEdited.current === true
				) return waitingContentUpdate.current = watchUpdate.fileContent

				setFileContent(watchUpdate.fileContent)
			})
		})
	}, [file?.path])

	// can edit locally if file loading/not
	const [canEdit, setCanEdit] = useState(false)




	//
	// STATUS UPDATE if disconnected/offline
	//
	const addToLocalNoteHistoryDebounced = useDebounce((p:iLocalNoteHistory) => {
		addLocalNoteHistory(p, 20)
	}, 3000)


	const disableWatchUpdate = useRef<boolean>(false) 
	const disableFor10sWatchFile = useDebounce(() => {disableWatchUpdate.current = false; console.log("reenable watch file")}, 10000)

	const contentToUpdateOnceOnline = useRef<{ path?: string, content?: string }>({})
	const disconnectCounter = useRef<number>(0)
	
	// once online, reupdate content
	// disabled as it is erase new edit made on other computers
	// to make it working, it should keep its edition timestamp and compare it to the server version
	// @to implement later on
	// useEffect(() => {
	// 	let ct = contentToUpdateOnceOnline.current
	// 	getApi(api => {
	// 		api.watch.appStatus(status => {
	// 			if (status.isConnected === false) {
	// 				disconnectCounter.current = disconnectCounter.current + 1
	// 				console.log("disabling watch update as disconnected");
	// 				disableWatchUpdate.current = true
	// 			} else if (status.isConnected === true) {
	// 				let isReconnected = disconnectCounter.current >= 1 && status.isConnected
	// 				if (isReconnected) {
	// 					disableFor10sWatchFile()

	// 					getApi(api => {
	// 						let filepath: any = file?.path
	// 						ct = contentToUpdateOnceOnline.current
	// 						// console.log("2 RECONNECTION", filepath, ct, contentToUpdateOnceOnline);
	// 						if (!filepath || !ct) return
	// 						if (!ct.path) return
	// 						if (filepath !== ct.path) return
	// 						if (!ct.content) return
	// 						let content = ct.content
	// 						console.log("3 UPDATE OFFLINE CONTENT", { filepath, content });
	// 						// UPDATE SEVERAL TIMES to make sure the content from server do not erase the offline content
	// 						api.file.saveContent(filepath, content, { history: true })
	// 						// setTimeout(() => {
	// 						// 	api.file.saveContent(filepath, content, { history: true })
	// 						// 	setTimeout(() => {
	// 						// 		api.file.saveContent(filepath, content, { history: true })
	// 						// 		setTimeout(() => {
	// 						// 			api.file.saveContent(filepath, content, { history: true })
	// 						// 		}, 100)
	// 						// 	}, 10)
	// 						// }, 10)

	// 					})
	// 				}
	// 			}
	// 		})
	// 	})
	// }, [file?.path])



	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		getApi(api => {
			api.file.saveContent(filepath, content, { history: true })
		})
		isBeingEdited.current = true
		isEditedDebounce()
		// OLD MECANISM
		contentToUpdateOnceOnline.current = { content, path: file?.path }

		// LOCAL HIST NOTE UPDATE
		addToLocalNoteHistoryDebounced({
			path: filepath,
			content,
			timestamp: Date.now()
		})
	}

	const waitingContentUpdate = useRef<string | false>(false)
	const isBeingEdited = useRef<boolean>(false)
	const isEditedDebounce = useDebounce(() => {
		isBeingEdited.current = false

		// only if we have some modification to update
		if (isBoolean(waitingContentUpdate.current)) return
		waitingContentUpdate.current = false
	}, 2000)



	// ON ACTIVE, LOAD LIST
	useEffect(() => {
		if (!file || !active) return
		getApi(api => {
			api.ui.browser.goTo(file.folder, file.name)
		})
	}, [active])

	return (
		<>

			{
				file &&
				<div className="window-editor-wrapper">
					<DualViewer
						windowId={i}
						file={file}
						fileContent={fileContent}
						isActive={active}
						canEdit={canEdit}
						showViewToggler={true}

						viewType={intViewType}
						mobileView={p.mobileView}
						
						// onViewChange={p.onViewChange}
						// onEditorDropdownEnter={p.onEditorDropdownEnter}
						askForLayoutUpdate={p.askForLayoutUpdate}
						
						onFileEdited={(path, content) => {
							onFileEditedSaveIt(path, content);
						}}
					/>
				</div>
			}
		</>)

}


export const WindowEditor = React.memo(WindowEditorInt, (np, pp) => {
	return false
	let c1 = JSON.stringify(np)
	let c2 = JSON.stringify(pp)
	let res = true
	if (c1 !== c2) res = false
	return res
})


export const windowEditorCss = () => `
	// height 100% everywhere
	.window-editor-wrapper-wrapper,
	.window-editor-wrapper,
	.dual-view-wrapper,
	.editor-area,
	.preview-area-wrapper,
	.preview-area,
	.main-editor-wrapper{
			height: 100%;
	}

	.window-editor-wrapper {
	
		

		.content-wrapper {
				height:100%;
		}
		.note-active-ribbon {
				height: 2px;
				width: 100%;
		}
		

		.editor-toolbar-dropdown {
			position: absolute;
			top: 10px;
			right: 0px;
		}





		



		// content css modification
		.dual-view-wrapper {
				.file-path-wrapper {
						display:none;
				}
				.editor-area {
						position:initial;
						.infos-editor-wrapper {
								z-index: 1;
								position:absolute;
								top: 0px;
								left: 0px;
								width: 100%;
								border-bottom: 1px solid rgba(0 0 0 / 5%);
								//box-shadow: 0px 0px 5px rgba(0,0,0,.2);
								height: 32px;
								padding: 0px;
						}
						.main-editor-wrapper {
								padding-left: 0px;
								padding-rigth: 10px;
								${isA('desktop') ? 'margin-top: 33px;' : 'margin-top: 0px;'}; 
								width: 100%;
						}
						.infos-editor-wrapper {
								padding-left: 3px;
								padding-rigth: 10px;
								width: calc(100% - 10px);
								.title-input-wrapper {
										padding-left: 10px;
										.press-to-save {
												top: -6px;
												left: 0px;
												right: initial;
												opacity: 0.5;
										}
										.big-title {
												width: calc(100% - 65px);
												font-family: ${cssVars.font.editor};
												color: grey;
												font-size: 15px;
										}
								}
						}
				}

				//
				// ALL
				//
				&.device-desktop {
						.preview-area-wrapper {
								margin-top: 33px;
								//padding: 5px 5px 5px 5px;
								background: ${cssVars.colors.bgPreview};
						}
						.preview-area {
								//padding: 10px 10px 10px 10px;
						}
				}

				//
				// FULL PREVIEW
				//
				&.device-desktop.view-preview {
						.editor-area {
								width: 0%;
						}
						.preview-area-wrapper {
						}
				}

				//
				// FULL EDITOR
				//
				&.device-desktop.view-editor {
						.preview-area-wrapper {
						}
				}

				.scrolling-bar-wrapper {
						top: 33px;
				}
		}
	}
`