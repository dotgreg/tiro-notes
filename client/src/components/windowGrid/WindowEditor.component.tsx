import { cloneDeep, isBoolean } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { iFile, iTitleEditorStatus, iViewType, iWindowContent } from '../../../../shared/types.shared';
import { getApi } from '../../hooks/api/api.hook';
import { useDebounce } from '../../hooks/lodash.hooks';
import { iMobileView, isA } from '../../managers/device.manager';
import { addLocalNoteHistory, iLocalNoteHistory } from '../../managers/localNoteHistory.manager';
import { getNoteView } from '../../managers/windowViewType.manager';
import { DualViewer } from '../dualView/DualViewer.component';
import { cssVars } from '../../managers/style/vars.style.manager';
import { iLayoutUpdateFn } from '../dualView/EditorArea.component';
import { simpleTextDiff } from '../../managers/string.manager';
import { handleImagePaste } from '../../managers/clipboard.manager';
import { handleFileDrop } from '../../managers/dragDrop.manager';
import { iUploadedFileInfos } from '../../hooks/api/upload.api.hook';
import { uploadFileToEditor } from '../../managers/upload.manager';
import { userSettingsSync } from '../../hooks/useUserSettings.hook';
import { addBackMetaToContent, filterMetaFromFileContent } from '../../managers/headerMetas.manager';


export const WindowEditorInt = (p: {
	content: iWindowContent
	onLayoutUpdate:iLayoutUpdateFn

	forceView?: iViewType,
	canEdit?: boolean
	mobileView?: iMobileView
	showToolbar?: boolean
	showViewToggler?: boolean
	titleEditor?: iTitleEditorStatus
}) => {

	const { file, view, active, i } = { ...p.content }

	const [fileContent, setFileContent] = useState('')
	const [intViewType, setIntViewType] = useState<iViewType>("editor")
	const windowId = i

	useEffect(() => {
		console.log("forceview editorwindow?", p)
		if (p.forceView) return setIntViewType(p.forceView)
		setIntViewType(view) // important if not, might not be updated all the time
		// get the backend cached view type
		getNoteView(file?.path as string).then(res => {
			if (res) setIntViewType(res)
			else setIntViewType("editor") // on creation
		})
	}, [view, file?.path, windowId, p.forceView])

	// Reload content funct
	const [showContent, setShowContent] = useState(true)
	const reloadContent = () => {
		setShowContent(false)
		setTimeout(() => {
			setShowContent(true)
		}, 100)
	}
	

	//
	// HEADER META MANAGEMENT
	//
	// 
	const [innerFile, setInnerFile] = useState(file)
	const [innerFileContent, setInnerFileContent] = useState(fileContent)
	// useEffect(() => {
	// 	setInnerFile(file)
	// }, [file])
	useEffect(() => {
		const res = removeContentMeta__updateInnerVars(fileContent)
		if (!res) return
		const {contentWithoutMeta, file} = res
		setInnerFileContent(contentWithoutMeta)
		setInnerFile(file)
	}, [fileContent, file])

	const removeContentMeta__updateInnerVars = (newContent: string) => {
		const contentWithMetas = newContent
		const {metas, content} = filterMetaFromFileContent(contentWithMetas)
		
		const cFile = cloneDeep(file)
		// setFileContent(content)
		if (cFile) {
			if (metas.created) cFile.created = parseInt(metas.created as string)
			if (metas.updated) cFile.modified = parseInt(metas.updated as string)  
			// console.log("removeContentMeta__updateInnerVars", {metas, content, cFile})
			return {contentWithoutMeta: content, file: cFile}
		}

	}
	


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
			if(userSettingsSync.curr.ui_editor_live_watch === true) {
				// console.log(`[FILE CONTENT WATCH] enabled for ${file.path}`)
				api.watch.file(file.path, watchUpdate => {
					// IF WE ARE AFTER RECONNECTION, DISABLE IT FOR 10s
					// if (disableWatchUpdate.current) return console.log("FILE WATCH DISABLED FOR 10s after reconnection")
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
			}
		})
	}, [file?.path, windowId, showContent])

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
	useEffect(() => {
		let offlineCt = contentToUpdateOnceOnline.current
		getApi(api => {
			api.watch.appStatus(status => {
				if (status.isConnected === false) {
					disconnectCounter.current = disconnectCounter.current + 1
					console.log("disabling watch update as disconnected");
					disableWatchUpdate.current = true
				} else if (status.isConnected === true) {
					let isReconnected = disconnectCounter.current >= 1 && status.isConnected
					if (isReconnected) {
						return // disable it as broken for the moment
						disableFor10sWatchFile()
						
						getApi(api => {
							let filepath: any = file?.path
							// offlineCt = contentToUpdateOnceOnline.current
							// console.log("2 RECONNECTION", filepath, ct, contentToUpdateOnceOnline);
							// console.log("RECONNECTION", file?.path, offlineCt, offlineCt.path)
							// if (!filepath || !offlineCt) return
							// if (!offlineCt.path) return
							// if (filepath !== offlineCt.path) return
							// if (!offlineCt.content) return
							// console.log("3 UPDATE OFFLINE CONTENT", { filepath, content });

							// if no offlineCt, discard it to current conten 

							api.file.getContent(filepath, nServerContent => {
								if (nServerContent === fileContentRef.current) return console.log("[BACK FROM OFFLINE]: same content, no need to update", filepath)
								console.log("[BACK FROM OFFLINE]: DIFFERENT CONTENT",filepath,{nServerContent, content:  fileContentRef.current})
								api.popup.prompt({
									text: `<div class="content-different-preview"> Server content is different for <b>"${file?.path}"</b>, do you want to update it ?  
									You can still come back to the current version using file history if needed. <br>
									<br> <div class="content-different-preview-inner"> ${simpleTextDiff(fileContentRef.current, nServerContent).replaceAll("\n","<br>")}</div>
									</div>`,
									acceptLabelButton: "Update to new version",
									refuseLabelButton: "Keep current version",
									onAccept: () => {
										if (!file?.path) return
										setFileContent(nServerContent)
										onFileEditedSaveIt(file?.path, nServerContent);
										// if (!createdFolderName || createdFolderName === '') return
										// p.onFolderMenuAction('create', p.folder, createdFolderName)
									},
									onRefuse: () => { }
								});
							})

						// 	api.popup.prompt({
						// 		text: `<div class="content-different-preview"> Server content is different for <b>"${file?.path}"</b>, do you want to update it ?  
						// 		You can still come back to the current version using file history if needed. <br>
						// 		<h2>New Remote content</h2> <br> ${nServerContent.replaceAll("\n","<br>")} <br>
						// 		<h2>Modified content</h2> <br> ${simpleTextDiff(fileContentRef.current, nServerContent).replaceAll("\n","<br>")}
						// 		</div>`,
						// 		acceptLabelButton: "Update to new version",
						// 		refuseLabelButton: "Keep current version",
						// 		onAccept: () => {
						// 			if (!file?.path) return
						// 			setFileContent(nServerContent)
						// 			onFileEditedSaveIt(file?.path, nServerContent);
						// 			// if (!createdFolderName || createdFolderName === '') return
						// 			// p.onFolderMenuAction('create', p.folder, createdFolderName)
						// 		},
						// 		onRefuse: () => { }
						// 	});
						// })

							// UPDATE SEVERAL TIMES to make sure the content from server do not erase the offline content
							// api.file.saveContent(filepath, content, { history: true })
							// setTimeout(() => {
							// 	api.file.saveContent(filepath, content, { history: true })
							// 	setTimeout(() => {
							// 		api.file.saveContent(filepath, content, { history: true })
							// 		setTimeout(() => {
							// 			api.file.saveContent(filepath, content, { history: true })
							// 		}, 100)
							// 	}, 10)
							// }, 10)

						})
					}
				}
			})
		})
		
	}, [file?.path, fileContent])

	const fileContentRef = useRef<string>(fileContent)
	useEffect(() => {
		fileContentRef.current = fileContent
		// console.log()
	}, [fileContent])




	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		// const contentWithMetas = addBackMetaToContent__updateInnerVars(content)
		// if (!contentWithMetas) return
		getApi(api => {
			api.file.saveContent(filepath, content, { history: true, debounced: 500, withMetas:innerFile}) 
		})
		isBeingEdited.current = true
		isEditedDebounce()
		// OLD MECANISM
		contentToUpdateOnceOnline.current = { content:content, path: file?.path }

		// LOCAL HIST NOTE UPDATE
		addToLocalNoteHistoryDebounced({
			path: filepath,
			content: content,
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
	// when switching tab, ask for folder scan
	useEffect(() => {
		if (!file || !active) return
		getApi(api => {
			api.ui.browser.goTo(file.folder, file.name, {ramCache: true}) // as it is just a switch without manip, should be safe to use ramCache
		})
	}, [active])


	//
	// UPLOAD (COPY/PASTE OR DRAG/DROP)
	//
	//
	// IMAGE INSERTION
	//
	// const insertImage = (name: string, path: string) => {
	// 	stringToInsertUpload.current += `![${name}](${path})\n`
	// 	debouncedUploadInsert()
	// }
	// const stringToInsertUpload = useRef('')
	// const debouncedUploadInsert = useDebounce(() => {
	// 	const f = codeMirrorEditorView.current
	// 	if (!f) return
	// 	const cPos = CodeMirrorUtils.getCurrentLineInfos(f)?.currentPosition
	// 	if (!isNumber(cPos)) return
	// 	insertTextAt(stringToInsertUpload.current, 'currentPos')
	// 	stringToInsertUpload.current = ''
	// 	CodeMirrorUtils.updateCursor(f, cPos, true)
	// }, 500)

	

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		if (!file?.path) return
		handleImagePaste(e, fileToUpload => {uploadFileToEditor({fileToUpload, folder: file.folder, windowId})})
	}
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		console.log("handle dragover" , file?.path)
		setIsDragging(true)
		debouncedLeave()
	}
	const debouncedLeave = useDebounce(() => {
		setIsDragging(false)
	}, 100)
	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		// e.preventDefault()
		// e.stopPropagation()
		// // setIsDragging(false)
		// debouncedLeave()
		// console.log("handle dragleave", file?.path)
	}
	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		console.log("window drop")
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
		console.log("handle drop", file?.path)
		if (!file?.path) return
		handleFileDrop(e, fileToUpload => {uploadFileToEditor({fileToUpload, folder:file.folder, windowId})})	
	}	
	const [isDragging, setIsDragging] = useState(false)


	return (
		<>
			
			{
				showContent && file &&
				<div className={`window-editor-wrapper ${p.content.active ? "active" : ""}`}
					onPaste={handlePaste}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					<DualViewer
						windowId={windowId}
						file={innerFile as iFile || file}
						fileContent={innerFileContent}
						isActive={active}
						// canEdit={canEdit}
						// showViewToggler={true}
						// showToolbar={true}
						// titleEditor={true}

						canEdit={canEdit}
						isDragging={isDragging}
						// uploadPercent={uploadPercent}
						// uploadedFile={uploadedFile}

						showViewToggler={p.showViewToggler}
						showToolbar={p.showToolbar}
						titleEditor={p.titleEditor}

						viewType={intViewType}
						mobileView={p.mobileView}
						
						// onViewChange={p.onViewChange}
						// onEditorDropdownEnter={p.onEditorDropdownEnter}
						onLayoutUpdate={p.onLayoutUpdate}
						onReloadContent={reloadContent}
						
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
	.content-different-preview {
		max-height: 50vh;
		width: 70vw;
		overflow-y: auto;
		text-align: left;
		.content-different-preview-inner {
			background: #e7e7e7;
			padding: 10px;
			border-radius: 10px;
		}
		.diff-sign {
			font-weight: bold;
		}
		.diff-sign.diff-modified {
			color: orange;
		}
		.diff-sign.diff-deleted {
			color: red;
		}
		.diff-sign.diff-added {
			color: green;
		}
	}

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