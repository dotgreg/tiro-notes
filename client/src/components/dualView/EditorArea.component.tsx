import React, { forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { iFile, iFileImage, iTitleEditorStatus, iViewType } from '../../../../shared/types.shared';
import { deviceType, isA, iMobileView, getBrowserName } from '../../managers/device.manager';
import { NoteTitleInput, PathModifFn } from './TitleEditor.component'
import { iEditorType, useTextManipActions } from '../../hooks/editor/textManipActions.hook';
import { useMobileTextAreaLogic } from '../../hooks/editor/mobileTextAreaLogic.hook';
import { useNoteEditorEvents } from '../../hooks/editor/noteEditorEvents.hook';
import { useNoteEncryption } from '../../hooks/editor/noteEncryption.hook';
import { clientSocket, clientSocket2 } from '../../managers/sockets/socket.manager';
import { formatDateList } from '../../managers/date.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { isTextEncrypted } from '../../managers/encryption.manager';
import { strings } from '../../managers/strings.manager';
import { FileHistoryPopup } from '../FileHistoryPopup.component';
import { ButtonsToolbar } from '../ButtonsToolbar.component';
import { NoteToolsPopup } from './NoteToolbar.component';
import { Dropdown } from '../Dropdown.component';
import { iUploadType, UploadButton, uploadButtonCss } from '../UploadButton.component';
import { UploadProgressBar } from '../UploadProgressBar.component';
import { GridContext } from '../windowGrid/WindowGrid.component';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { copyToClickBoard } from '../../managers/clipboard.manager';
import { CodeMirrorEditor, iCMEvent, iCMPluginConfig, iCursorInfos } from './CodeMirrorEditor.component';
import { useDebounce } from '../../hooks/lodash.hooks';
import { CodeMirrorUtils } from '../../managers/codeMirror/editorUtils.cm';
import { openExportFilePopup } from '../../managers/print-pdf.manager';
import { iEditorAction } from '../../hooks/api/note.api.hook';
import { fileToNoteLink } from '../../managers/noteLink.manager';
import { triggerExportPopup } from '../../managers/export.manager';
import { cloneDeep, each, isBoolean, isNumber, isString, random, set } from 'lodash-es';
import { cleanString, pathToIfile } from '../../../../shared/helpers/filename.helper';
import { notifLog } from '../../managers/devCli.manager';
import { setNoteView } from '../../managers/windowViewType.manager';
import { title } from 'process';
import { AiAnswer, iAiBtnConfig, triggerAiSearch } from '../../managers/ai.manager';
import { triggerCalc } from '../../managers/textEditor.manager';
import { getUserSettingsSync, userSettingsSync } from '../../hooks/useUserSettings.hook';
import { getFontSize } from '../../managers/font.manager';
import { getDateObj } from '../../../../shared/helpers/date.helper';
import { cleanSearchString } from '../../managers/textProcessor.manager';
import { highlightCurrentLine } from '../../managers/codeMirror/highlightLine.cm';
import { addBackMetaToContent, filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { triggerAddTableCol, triggerRemoveTableCol } from '../../managers/table.markdown.manager';
import { syncScroll3 } from '../../hooks/syncScroll.hook';
import { getLineInfosFromMdStructure} from '../../managers/markdown.manager';
import { info } from 'console';

export type onSavingHistoryFileFn = (filepath: string, content: string, historyFileType: string) => void
export type onFileEditedFn = (filepath: string, content: string) => void
export type onTitleClickFn = (newYpercent: number) => void

export type onLightboxClickFn = (index: number, images: iFileImage[]) => void
export type iLayoutUpdateFn = (action: "windowActiveStatus"|"windowViewChange", data?:{view?: iViewType}) => void
export type iReloadContentFn = (counter: number) => void

interface iEditorProps {
	viewType?: iViewType
	mobileView?: iMobileView
	

	editorType: iEditorType
	windowId: string

	file: iFile
	fileContent: string
	isActive: boolean
	canEdit: boolean

	onScroll: Function
	onTitleClick: onTitleClickFn
	onTitleEditedHook?: Function
	

	onUpdateY: onTitleClickFn
	onMaxYUpdate: (maxY: number) => void
	posY: number
	editorAction: iEditorAction | null
	
	onFileEdited: onFileEditedFn
	onScrollModeChange: (v: boolean) => void

	// onDropdownEnter?: Function
	// onViewToggle: (view: iViewType) => void

	onLayoutUpdate: iLayoutUpdateFn
	pluginsConfig?: iCMPluginConfig

	onReloadContent: iReloadContentFn

	showToolbar?: boolean
	showViewToggler?: boolean
	titleEditor?: iTitleEditorStatus
}



//
//
// COMPONENT
//
//
const EditorAreaInt = (
	p: iEditorProps & { isConnected: boolean }
) => {

	const [innerFileContent, setInnerFileContent] = useState('')
	// const [innerFile, setInnerFile] = useState<iFile>(p.file)
	let monacoEditorComp = useRef<any>(null)


	let canEdit = true
	if (p.canEdit === false) canEdit = false
	if (p.isConnected === false) canEdit = false
	let showViewToggler	= true
	if(p.showViewToggler === false) showViewToggler = false
	let showToolbar	= true
	if(p.showToolbar === false) showToolbar = false
	let titleEditor:iTitleEditorStatus	= (isBoolean(p.titleEditor) || isString(p.titleEditor)) ? p.titleEditor : true


	// LIFECYCLE EVENTS MANAGER HOOK
	const pFileRef = useRef<iFile>(p.file)
	useEffect(() => {
		pFileRef.current = p.file
	}, [p.file.path])

	// 
	// const removeContentMetaAndUpdateInnerFileAndContent = (newContent: string) => {
	// 	const contentWithMetas = p.fileContent
	// 	const {metas, content} = filterMetaFromFileContent(contentWithMetas)
	// 	const cFile = cloneDeep(p.file)
	// 	if (metas.created) cFile.created = parseInt(metas.created as string)
	// 	if (metas.updated) cFile.modified = parseInt(metas.updated as string)  
	// 	setInnerFileContent(content)
	// 	setInnerFile(cFile)
	// }
	// const addBackMetaToContentAndUpdateInnerFileAndContent = (newContent: string) => {
	// 	const cFile = cloneDeep(innerFile)
	// 	cFile.modified = Date.now()
	// 	setInnerFile(cFile)
	// 	// if date already exists (real date), take it
	// 	const newContentWithMeta = addBackMetaToContent(newContent, {
	// 		created: cFile.created || Date.now(),
	// 		updated: cFile.modified
	// 	})
	// 	return newContentWithMeta
	// }
	

	const { triggerNoteEdition } = useNoteEditorEvents({
		file: p.file,
		fileContent: p.fileContent,
		canEdit: canEdit,

		onEditorDidMount: () => {
			// devHook("editor_mount")(p.fileContent)
			// removeContentMetaAndUpdateInnerFileAndContent(p.fileContent)
			setInnerFileContent(p.fileContent)
		},
		onEditorWillUnmount: () => {
		},
		onNoteContentDidLoad: () => {
			if (!clientSocket) return
			// removeContentMetaAndUpdateInnerFileAndContent(p.fileContent)
			setInnerFileContent(p.fileContent)
		}
		,
		onNoteEdition: (newContent, isFirstEdition) => {
			let cfile = pFileRef.current 
			// removeContentMetaAndUpdateInnerFileAndContent(p.fileContent)
			// IF FIRST EDITION, backup old file
			if (isFirstEdition) {
				getApi(api => {
					api.history.save(cfile.path, p.fileContent, 'enter')
				})
			}
			
			// const newContentWithMeta = addBackMetaToContentAndUpdateInnerFileAndContent(newContent)
			// p.onFileEdited(cfile.path, newContentWithMeta)
			
			p.onFileEdited(cfile.path, newContent)
			setInnerFileContent(newContent)
		},
		onNoteLeaving: (isEdited, oldPath) => {
			// if (isEdited) p.onFileEdited(oldPath, innerFileContent)
			// if (isA('desktop')) resetMonacoSelectionExt()


			// disable encryption on leave as it causes encryption bleeding on other notes
			// ifEncryptOnLeave((encryptedText) => { p.onFileEdited(oldPath, encryptedText) })
		}
	})

	// useEffect(() => {
	// }, [innerFileContent])

	// MOBILE EDITOR LOGIC HOOK
	let mobileTextarea = useRef<HTMLTextAreaElement>(null)
	const { onTextareaChange, onTextareaScroll } = useMobileTextAreaLogic(innerFileContent, {
		mobileTextarea,
		onMobileNoteEdition: triggerNoteEdition
	})


	// TEXT MANIPULATION HOOK
	let codeMirrorEditorView = useRef<any>(null)

	let editorRef = deviceType() !== 'desktop' ? mobileTextarea : monacoEditorComp
	if (p.editorType === "codemirror") editorRef = codeMirrorEditorView

	const { applyTextModifAction } = useTextManipActions({
		editorType: p.editorType,
		deviceType: deviceType(),
		editorRef
	})

	const insertTextAt = (textToInsert: string, insertPosition: number | 'currentPos' |'currentLineStart', replaceText?:boolean) => {
		let updatedText = applyTextModifAction('insertAt', { textToInsert, insertPosition, replaceText })
		if (updatedText) {
			triggerNoteEdition(updatedText)
			forceCmRender()
		}
	}

	// ECRYPTION FUNCTIONS HOOKS
	const { APasswordPopup, askForPassword,
		decryptButtonConfig, encryptButtonConfig,
		ifEncryptOnLeave, noHistoryBackupWhenDecrypted,
	} = useNoteEncryption({
		fileContent: innerFileContent,
		onTextEncrypted: txt => {
			triggerNoteEdition(txt);
			forceCmRender();
			getApi(api => {
				api.history.save(p.file.path, txt, "int")
			})
		},
		onTextDecrypted: txt => { triggerNoteEdition(txt); forceCmRender(); }
	})

	
	const gridContext = useContext(GridContext)
	const [progressUpload, setProgressUpload] = useState(-1)
	//
	// MANAGE UPLOAD / PROGRESS
	//
	// useEffect(() => {
	// 	if (gridContext.upload.progress && p.file.path === gridContext.upload.markdownFile?.path) {
	// 		setProgressUpload(gridContext.upload.progress)
	// 	}
	// 	if (gridContext.upload.file && p.file.path === gridContext.upload.markdownFile?.path) {
	// 		const { name, path } = { ...gridContext.upload.file }
	// 		gridContext.upload.reinit();
	// 		insertImage(name, path)
	// 	}
	// }, [gridContext.upload])


	// //
	// // IMAGE INSERTION
	// //
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



	//
	// UPLOAD BTN
	//
	const genUploadBtn = (type: iUploadType, label: string) => {
		return {
			title: '',
			class: 'upload-button-wrapper',
			action: () => { },
			customHtml: <UploadButton
				file={p.file}
				windowId={p.windowId}
				type={type}
				label={label}
				// onProgress={p => (
				// 	setProgressUpload(p))
				// }
				// onSuccess={p => {
				// 	insertImage(p.name, p.path)
				// }}
			/>
		}
	}

	const uploadBtns = () => {
		let res: any = [genUploadBtn("all", "Upload files")]
		if (deviceType() !== "desktop") {
			res.push(genUploadBtn("image", "Upload Gallery"))
			res.push(genUploadBtn("camera", "Capture"))
			res.push(genUploadBtn("microphone", "Record"))
		}
		return res
	}

	
	// useEffect(() => {
	// 	triggerExportPopup(p.file)
	// }, [])
	const triggerLegacyExportPopup = () => {
		const currView:iViewType = p.viewType || "editor"
		    // if we are editor, make preview appearing for a moment 
		    if (currView === "editor") {
		        askForViewToggle("both")
		        setTimeout(() => {
		            openExportFilePopup(p.windowId, p.file)
		            setTimeout(() => {
		                askForViewToggle("editor")
		            })
		        }, 100)
		    } else {
		        openExportFilePopup(p.windowId, p.file)
		    }
	}

	const searchButton = () => {
		let res = {}
		// if (deviceType() !== "desktop") {
			res = {
				title: 'Search',
				icon: 'faSearch',
				action: () => {
					getApi(api => {
						api.ui.note.editorAction.dispatch({
							type:"searchWord",
							searchWordString: " "
						})
					})
				}
			}
		// }
		return res
	}

	const detachWindowButton = () => {
		if (userSettingsSync.curr.beta_floating_windows) {
			return {
				icon: 'faWindowRestore',
				title: 'Detach Window',
				// class: 'detach-button',
				action: () => { 
					// if (!content.file) return
					getApi(api => { api.ui.floatingPanel.create({type:"file", file: p.file, view: p.viewType }) })
				}
			}
		} else {
			return {}
		}
	}

	//
	// TOOLBAR ACTIONS
	//
	const editorToolbarActions = [
		{
			title: 'Reload content',
			icon: 'faSync',
			action: () => {
				reloadContentCounterRef.current = reloadContentCounterRef.current + 1
				p.onReloadContent(reloadContentCounterRef.current)
			}
		},
		detachWindowButton(),
		...uploadBtns(),
		searchButton(),
		isTextEncrypted(innerFileContent) ? decryptButtonConfig : encryptButtonConfig,
		
		{
			title: 'Export',
			icon: 'faFileDownload',
			action: () => {
				triggerExportPopup(p.file)
			}
		},
		{
			title: 'Print',
			icon: 'faPrint',
			action: () => {
				triggerLegacyExportPopup()
			}
		},
		
		{
			title: strings.editorBar.explanation.history,
			icon: 'faHistory',
			action: () => {
				setHistoryPopup(!historyPopup)
			}
		},
		{
			title: strings.editorBar.tts,
			icon: 'faCommentDots',
			action: () => {
				getApi(api => {
					api.ui.textToSpeechPopup.open(innerFileContent, { id: p.file.name })
				})
			}
		},
		

		{
			title: 'Delete note',
			class: 'delete',
			icon: 'faTrash',
			action: () => {
				gridContext.file.onFileDelete(p.file)
			}
		},
	]


	// File History
	const [historyPopup, setHistoryPopup] = useState(false)

	const editorWrapperEl = useRef<HTMLDivElement>(null)

	// calc max size for dropdown before scrolling
	const el = editorWrapperEl.current
	let maxDropdownHeight = 700
	if (el) maxDropdownHeight = el.clientHeight / 1.3
	if (deviceType() === 'mobile') maxDropdownHeight = window.innerHeight
	// // Id note ref
	const idInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		forceCmRender()
	}, [p.fileContent, p.file.path, p.windowId])


	// reload func
	// const [reloadContentCounter, setReloadContentCounter] = useState(0)
	const reloadContentCounterRef = useRef(0)

	//
	// new CODEMIRROR code adaptation
	//
	const renderRef = useRef(0)
	const [cmRender, setCmRender] = useState(0)
	const forceCmRender = () => {
		renderRef.current = renderRef.current + 1
		setCmRender(renderRef.current)
	}

	//
	// SIMPLE NOTE FALLBACK IF TOOLONG
	//
	const [simpleFallback, setSimpleFallback] = useState(false)
	const [isPreview, setIsPreview] = useState(false)
	useEffect(() => {
		let nval = innerFileContent.length > 30000000000 && deviceType() !== "desktop"
		// let nval = innerFileContent.length > 3000000 && deviceType() !== "desktop"
		setSimpleFallback(nval)
		// forceCmRender() // cannot force render otherwise get very slow
	}, [innerFileContent, p.viewType])


	useEffect(() => {
		let nval = innerFileContent.length > 3000000000 && deviceType() !== "desktop"
		// let nval = innerFileContent.length > 30000 && deviceType() !== "desktop"
		setSimpleFallback(nval)
		forceCmRender()
		let nisPreview = (deviceType() === "desktop" && p.viewType === "preview") || (deviceType() !== "desktop" && p.mobileView === "preview")
		setIsPreview(nisPreview)
		let histPath = p.file.path
		setTimeout(() => {
		if (histPath !== p.file.path) return
			forceCmRender()
		}, 100)
	},[p.viewType, p.mobileView])
	
	//
	// VIEW TOGGLE
	//
	const askForViewToggle = (nView: iViewType) => {
		// p.onViewToggle(nView)
		// p.onViewToggle(nView)
		p.onLayoutUpdate("windowViewChange", {view:nView})
	}

	//
	// EDITOR ACTIONS 
	// triggered from api like line jump
	//
	//
	const [jumpToLine, setJumpToLine] = useState(-1)
	
	useEffect(() => {
		let a = p.editorAction
		if (!a) return
		console.log(`[EDITOR ACTION] action ${a.type} triggered on ${a.windowId}`)
		if (deviceType() !== "mobile" && a.windowId === "active" && !p.isActive) return
		if (deviceType() !== "mobile" && a.windowId !== "active" && a.windowId !== p.windowId) return

		// console.log("[EDITOR ACTION] =>", {a})
		// lineJump
		if (a.type === "lineJump") {

			let lineJumpType = "both"
			if (a.lineJumpType) lineJumpType = a.lineJumpType
			let shouldJumpEditor = lineJumpType === "editor" || lineJumpType === "both"
			let shouldJumpPreview = lineJumpType === "preview" || lineJumpType === "both"

			let lineToJump = 0
			if(a.lineJumpNb) lineToJump = a.lineJumpNb
			if(a.lineJumpString) {
				const searchee = a?.lineJumpString || ""
				const arrContent = p.fileContent.split("\n")
				each(arrContent, (line,i) => {
					if (line.includes(searchee)) lineToJump = i + 3
				})
			}

			//
			// EDITOR JUMP
			//
			if (shouldJumpEditor) {
				setJumpToLine(lineToJump)
				setTimeout(() => {
					setJumpToLine(-1)
				}, 100)
			}

			//
			// PREVIEW JUMP
			//
			if (shouldJumpPreview) {
				const infosLines = getLineInfosFromMdStructure(lineToJump, innerFileContent)
				if (!infosLines.mdPart) return
				const previewTitleElToJump = infosLines.mdPart?.previewId
				if (!previewTitleElToJump) return
				const elPath = `.dual-view-wrapper.window-id-${p.windowId} .preview-area-wrapper #${previewTitleElToJump}`
				setTimeout(() => {
					const el:any = document.querySelector(elPath)
					// console.log("[EDITOR ACTION] LINEJUMP > jumping to path in preview => ", elPath, el)
					// el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: 'center' })
					const previewWrapperPath = `.dual-view-wrapper.window-id-${p.windowId} .preview-area`
					// 
					const previewWrapper:any = document.querySelector(previewWrapperPath)
					previewWrapper.scrollTop = el.offsetTop - 100
					

					// const el = document.querySelector(elPath)
					if (!el) return
					// console.log("[EDITOR ACTION] LINEJUMP > jumping to path in preview => ", elPath, el, el.parentNode)
					// el.parentNode.parentNode.scrollTop = el.offsetTop;

				}, 10)
			}
		}

		// insert at
		if (a.type === "insertText" && a.insertText && a.insertPos) {
			// console.log("insertText", a)
			insertTextAt(a.insertText, a.insertPos, false)
		}

		if (a.type === "replaceText" && a.replaceText && a.replacePos) {
			

			


			// insert text
			insertTextAt(a.replaceText, a.replacePos, true)

			// Cursor update to the replaced position
			const f = codeMirrorEditorView.current
			if (!f) return
			if (!isNumber(a.replacePos)) return
			CodeMirrorUtils.updateCursor(f, a.replacePos, true)

		}

		// search interface
		if (a.type === "searchWord" && a.searchWordString) {
			const f = codeMirrorEditorView.current
			if (!f) return
			CodeMirrorUtils.searchWord(f,a.searchWordString, a.searchReplacementString, true)
			// const infosLines = getStringInformationFromMdStructure(a.searchWordString, innerFileContent)
			// console.log("searchWord", a.searchWordString, a.searchReplacementString, infosLines)
		}
		
		// selection
		if (a.type === "setSelection" && a.selection) {
			// let shouldOpenInterface = isBoolean(a.searchWordOpenPanel) ? a.searchWordOpenPanel : false
			// insertTextAt(a.insertText, a.insertPos) 
			// if (shouldOpenInterface) openSearchPanel()
			const f = codeMirrorEditorView.current
			if (!f) return
			// CodeMirrorUtils.searchWord(f,a.searchWordString, true)
			CodeMirrorUtils.setSelection(f,a.selection)

		}
		if (a.type === "undo") {
			const f = codeMirrorEditorView.current
			if (!f) return
			// console.log("undo")
			CodeMirrorUtils.undo(f.view)
		}
		if (a.type === "redo") {
			const f = codeMirrorEditorView.current
			console.log(f, f.view)
			if (!f) return
			// console.log("redo")
			CodeMirrorUtils.redo(f.view)
		}
		if (a.type === "uploadProgress") {
			setProgressUpload(a.uploadProgress || -1)
		}

		if (a.type === "highlightLine") {
			const f = codeMirrorEditorView.current
			if (!f) return
			highlightCurrentLine(f.view)
		
		}

	}, [p.editorAction, p.windowId])

	//
	// ON CM EVENTS
	//

	// const [bottomMobileToolbar, setBottomMobileToolbar] = useState(50)
	// on focus/blur, make mobile bar jump on chromium
	const onCMEvent = (event: iCMEvent) => {

	}

	const updateLastNotes = () => {
		getApi(api => {
			api.lastNotesApi?.addToHistory(p.file, false)
		})
	}

	const onScroll = (e: any) => {
		p.onScroll(e)
		setCursorInfos({x:-9999, y:-9999, from:0, to:0, fromPx:-9999, toPx:-9999})
	}
	// hover popup positionning
	const [cursorInfos, setCursorInfos] = useState<iCursorInfos>({x:0, y:0, from:0, to:0, fromPx:0, toPx:0})
	let selectionTxt = innerFileContent.substring(cursorInfos.from, cursorInfos.to)

	const editorWrapperId = `.window-id-${p.windowId}`
	// console.log(editorWrapperId, document.querySelector(editorWrapperId), document.querySelector(editorWrapperId)?.getBoundingClientRect().top )
	const windowIdTop = document.querySelector(editorWrapperId)?.getBoundingClientRect().top || 0
	// const windowIdTop2 = editorWrapperEl.current?.getBoundingClientRect().top || 0
	let posNoteToolPopup = cursorInfos.y - windowIdTop
	// let posNoteToolPopup = cursorInfos.y 
	// posNoteToolPopup = deviceType() === "desktop" ? posNoteToolPopup + 60: posNoteToolPopup - 30
	
	let notePopupX = deviceType() === "desktop" ? 40 : 10
	let notePopupY = deviceType() === "desktop" ? 0 : 10
	// console.log(posNoteToolPopup, windowIdTop)
	// posNoteToolPopup = 40

	// notePopupX = posNoteToolPopup

	return (
		<div
			className={`editor-area ${p.isActive ? "active" : ""} `}
			ref={editorWrapperEl}
			onWheel={e => {
				// syncScroll3.scrollAllPx(p.windowId, e.deltaY)
				syncScroll3.scrollPreviewPx(p.windowId, e.deltaY)
			}}
		>
			{/* { FIRST ZONE INFOS WITH TITLE/TOOLBARS ETC } */}
			<div className={`infos-editor-wrapper ${!titleEditor ? "no-title-editor" : "with-title-editor"} ${p.isActive ? "active" : ""}`}>

				{ (titleEditor === true || titleEditor === "disabled") && <>		
					<div className="file-path-wrapper">
						{p.file.path.replace(`/${p.file.name}`, '')}
					</div>

					<NoteTitleInput
						title={p.file.name.replace('.md', '')}
						enabled={titleEditor === true}
						onEdited={(o, n) => {
							p.onTitleEditedHook && p.onTitleEditedHook()
							const oPath = `${p.file.folder}${o}.md`
							const nPath = `${p.file.folder}${n}.md`
							gridContext.file.onTitleUpdate(oPath, nPath)
							const nFile = pathToIfile(nPath)
							// getApi(api => {
							// 	api.ui.browser.goTo(nFile.folder, nFile.name)
							// })
							forceCmRender()
						}}
					/>
				</>}

				{showToolbar && <div className="toolbar-and-dates-wrapper">

					<div className="editor-toolbar-dropdown">
						<Dropdown
							hover={true}
							dir="right"
							maxHeight={maxDropdownHeight}
							onMouseEnter={e => {p.onLayoutUpdate("windowActiveStatus")}}
						>
							<>

								{showViewToggler && 
									<div className="view-toggler-wrapper">
									{deviceType() !== 'mobile' &&
										<ButtonsToolbar
											class='editor-view-toolbar'
											size={0.8}
											buttons={[
												{
													title: 'Editor',
													icon: "custom_icons/view-3.svg",
													action: () => { askForViewToggle('editor') }
												},
												{
													title: 'Editor with minimap',
													icon: "custom_icons/view-4.svg",
													action: () => { askForViewToggle('editor-with-map') }
												},
												{
													title: 'Dual view',
													icon: "custom_icons/view-1.svg",
													action: () => { askForViewToggle('both') }
												},
												{
													title: 'Render view',
													icon: "custom_icons/view-2.svg",
													action: () => { askForViewToggle('preview') }
												},
											]}
										/>
									}
									</div>
								}

								<div className='toolbar-wrapper'>
									<ButtonsToolbar
										class='editor-main-toolbar'
										design="vertical"
										size={1}
										buttons={editorToolbarActions}
									/>
								</div>

								<div className="separation-bar"></div>
								<div className="note-id-wrapper">
									<h4>Note Link</h4>
									<div className="note-id-form">
										<input
											type="text"
											ref={idInputRef}
											onClick={e => {
												const el = e.target
												// @ts-ignore
												el.setSelectionRange(0, el.value.length)
											}}
											value={fileToNoteLink(p.file)}
											readOnly={true}
										/>
										<ButtonsToolbar
											class='note-id-toolbar'
											size={1}
											buttons={[
												{
													title: 'Copy note ID',
													icon: "faClipboard",
													action: () => {
														const el = idInputRef.current;
														if (!el) return
														copyToClickBoard(el)
													}
												},
											]}
										/>

									</div>
								</div>

								<div className="dates-wrapper">
									<div className='date modified'>
										<h4>Modified</h4>
										{formatDateList(new Date(p.file.modified || 0))}
									</div>
									<div className='date created'>
										<h4>Created</h4>
										{formatDateList(new Date(p.file.created || 0))}
									</div>
								</div>

								<div className="path-wrapper">
									<div className='path'>
										<h4>Path</h4>
										<span className="path-link" onClick={() => {
											getApi(api => { api.ui.browser.goTo(p.file.folder, p.file.name) })
										}}
										> {p.file.folder} </span>
									</div>
								</div>

							
							</>
						</Dropdown >
					</div>

				</div>}

			</div>

			{/* UPLOAD BAR FOR EACH EDITOR */}
			<UploadProgressBar progress={progressUpload} />


			{/* {MAIN EDITOR AREA} */}
			<div className={`main-editor-wrapper ${titleEditor ? "with-title-editor": "no-title-editor"} ${p.windowId}`}>

				{!isPreview && !simpleFallback && p.editorType === 'codemirror' &&
					<CodeMirrorEditor
						windowId={p.windowId}
						ref={codeMirrorEditorView}
						file={p.file}
						pluginsConfig={p.pluginsConfig}
						value={innerFileContent}
						posY={p.posY}
						jumpToLine={jumpToLine || 0}
						forceRender={cmRender}


						onChange={(v) => { 
							updateLastNotes()
							triggerNoteEdition(v) 
						}}
						onEvent={onCMEvent}
						onScroll={onScroll}
						onTitleClick={p.onTitleClick}
						onCursorMove={c => {setCursorInfos(c)}}	

					/>
				}

				{!isPreview && simpleFallback &&
					<div className="codemirror-mobile-fallback">
						<p> Note is too long for mobile, the advanced edition features are disabled </p>
						<textarea
							defaultValue={innerFileContent}
							onChange={e => { 
								updateLastNotes()
								triggerNoteEdition(e.target.value) 
							}}
						/>
					</div>
				}
			</div>

			{
				// BOTTOM MOBILE TOOLBAR
				// deviceType() !== 'desktop' &&
				<div className='mobile-text-manip-toolbar-wrapper' style={{ top: notePopupX, left: notePopupY  }}>
					<NoteToolsPopup
						cursorInfos={cursorInfos}
						selection={selectionTxt}
						onButtonClicked={(action, options) => {
							if (action === "aiSearch" ) {
								if (! options.aiConfig) return
								const aiBtnConfig:iAiBtnConfig = options.aiConfig
								AiAnswer({
									aiBtnConfig,
									typeAnswer: aiBtnConfig.typeAnswer, 
									aiCommand: aiBtnConfig.command,
									selectionTxt,
									// rest not required if newWindow type
									file: p.file,
									windowIdFile: p.windowId,
									innerFileContent,
									cursorInfos
								})
							} else if (action === "calc") {
								triggerCalc({
									windowId: p.windowId,
									file: p.file,
									fileContent: innerFileContent,
									selectionTxt,
									insertPos: cursorInfos.to
								})
							} else if (action === "addTableCol") {
								triggerAddTableCol({
									windowId: p.windowId,
									file: p.file,
									fileContent: innerFileContent,
									selectionTxt,
									cursorInfos
								})
							} else if (action === "removeTableCol") {
								triggerRemoveTableCol({
									windowId: p.windowId,
									file: p.file,
									fileContent: innerFileContent,
									selectionTxt,
									cursorInfos
								})
							} else if (action === "searchEngine") {
								let searchEngineStr = userSettingsSync.curr.ui_editor_search_highlight_url
								if (!searchEngineStr) return
								const final_url = searchEngineStr + selectionTxt
								// open in new tab
								// window.open(final_url, '_blank')
								window.open(final_url,'_blank');
							} else if (action === "highlightLine") {
								getApi(api => {
									api.ui.note.editorAction.dispatch({
										windowId: p.windowId,
										type:"highlightLine",
										cursorPos: cursorInfos.from
									})
								})

							} else if (action === "undo") {
								getApi(api => {
									api.ui.note.editorAction.dispatch({
										windowId: p.windowId,
										type:"undo"
										
									})
								})
							} else if (action === "redo") {
								getApi(api => {
									api.ui.note.editorAction.dispatch({
										windowId: p.windowId,
										type:"redo"
									})
								})
							} else if (action === "proofread") {
								getApi(api => {
									api.ui.floatingPanel.create({
										type: "ctag",
										layout: "bottom",
										ctagConfig: {
											tagName: "proofread",
											content: selectionTxt,
											opts:{
												file: p.file,
											}
										},
									})
								})
							} else if (action === "copyLineLink") {
								getApi(api => {
									const linkToCopy = fileToNoteLink(p.file, selectionTxt)
									api.popup.prompt({
										title: "Selection note link",
										text: `Link to the selected text <br/><br/> <input type="text" value="${linkToCopy}">`
									})
								})
							} else {
								
								let updatedText = applyTextModifAction(action)
								if (updatedText) {
									updateLastNotes()
									triggerNoteEdition(updatedText)
									forceCmRender()
								}
							}
						}}
					/>
				</div>
			}

			{askForPassword && APasswordPopup}

			{historyPopup && <FileHistoryPopup file={p.file} onClose={() => { setHistoryPopup(false) }} />}

		</div>
	)
}

// , (np, pp) => {
// 	let res = false
// 	// only compare tab struct, not content/layout
// 	// const t: any = cloneDeep({ n: np.tab, p: pp.tab })
// 	// t.n.grid = t.p.grid = {}
// 	// t.n.refresh = t.p.refresh = ""
// 	// let t1 = JSON.stringify(t.p)
// 	// let t2 = JSON.stringify(t.n)
// 	// if (t1 !== t2) res = false
// 	// if (pp.pos !== np.pos) res = false
// 	// if (pp.dragIndic !== np.dragIndic) res = false
// 	return res
// })



export const editorAreaCss = (v: iMobileView) => `

// @EDGE CASE FIX : when mobile + floating + editor => show preview instead
.floating-panel-wrapper .dual-view-wrapper.device-mobile.view-editor  .editor-area {
		position: relative!important;
		top: 0px;
}

.editor-area {
		width: ${isA('desktop') ? '50%' : (v === 'editor' ? '100vw' : '0vw')};
		display: block;

		position: ${isA('desktop') ? 'relative' : (v === 'editor' ? 'relative' : 'absolute!important')};
		top: ${v === 'editor' && !isA('desktop') ? '0px' : '-9999px'};

		.mobile-text-manip-toolbar {
				display: ${v === 'editor' && !isA('desktop') ? 'flex' : 'none'};
		}

		.infos-editor-wrapper {
				${isA('desktop') ? '' : `height: ${cssVars.sizes.mobile.editorTopWrapper}px;`}
				${isA('desktop') ? `width: calc(200% - ${(cssVars.sizes.block * 3) * 2}px);` : ``}
				padding: 0px ${isA('desktop') ? cssVars.sizes.block * 3 : cssVars.sizes.block * 2}px;
				position: relative;

				${commonCssEditors()}

				.title-input-wrapper {
						position:relative;
						margin-top: ${isA("desktop") ? 6 : 0}px;
						.press-to-save {
								position: absolute;
								top: 39px;
								font-size: 8px;
								color: ${cssVars.colors.main};
								right: 0px;
						}
						input {
								padding: 0px;
								border: none;
								background: none;
						}
				}

				

				.toolbar-and-dates-wrapper {
						display: flex;
				}

				.dates-wrapper {
						display: ${isA('desktop') ? 'block' : 'none'};
						.date {
						}
				}
				
				${uploadButtonCss}
    }
}




.main-editor-wrapper {
    ${!isA('desktop') ? `padding: 0px ${cssVars.sizes.block * 2}px 0px ${cssVars.sizes.block * 2}px;` : ''}
    ${!isA('desktop') ? `margin: 0px 0px ${cssVars.sizes.mobile.bottomBarHeight}px 0px;` : ''}
    .monaco-editor {
				margin: 0px;
    }
    .textarea-editor {
				border: none;
				width: 100%;
				height: calc(100vh - ${cssVars.sizes.mobile.editorTopWrapper + cssVars.sizes.mobile.editorBar + cssVars.sizes.mobile.bottomBarHeight * 2}px);
				margin: 0px;
				padding: 0px;
				background: rgba(255,255,255,0.7);
    }
}


.editor-area {
	position:initial;
	.infos-editor-wrapper {
			z-index: 2;
			position:absolute;
			top: 0px;
			right: 7px;
			width: 100%;
			&.with-title-editor {
				border-bottom: 1px solid rgba(0 0 0 / 5%);
			}
			//box-shadow: 0px 0px 5px rgba(0,0,0,.2);
			height: 32px;
			padding: 0px;
	}
	.main-editor-wrapper {
			padding-left: 0px;
			padding-right: 10px;
			${isA('desktop') ? 'margin-top: 33px;' : 'margin-top: 0px;'}; 
			width: 100%;
	}
	.main-editor-wrapper.no-title-editor {
		margin-top: 0px;
	}
	.infos-editor-wrapper {
			padding-left: 3px;
			padding-rigth: 10px;
			width: calc(100% - 10px);
			&.no-title-editor {
				width: 30px;
			}
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
							font-size: ${getFontSize(+5)}px;
					}
			}
		&.active {
			.title-input-wrapper {
				.big-title {
					color: ${cssVars.colors.main};
				}
			}
		}
	}
	
}

`

export const EditorArea = (p: iEditorProps) => {
	const api = useContext(ClientApiContext);
	const isConnected = api?.status.isConnected || false
	return useMemo(() => {
		return <EditorAreaInt {...p} isConnected={isConnected} />
	}, [
		p.viewType,
		p.mobileView,
		isConnected,
		p.canEdit,
		p.editorType,
		p.windowId,
		p.file.created,
		p.file.name,
		p.file.path,
		p.file,
		p.fileContent,
		p.isActive,
		p.editorAction])
}




export const commonCssEditors = () => `


.file-path-wrapper {
		padding-top: ${isA('desktop') ? cssVars.sizes.block : cssVars.sizes.block / 2}px;
		font-size: ${getFontSize(+3)}px;
		font-weight: 600;
		color: #b6b5b5;
		cursor: pointer;
		text-transform: capitalize;
}
.big-title {
		color: ${cssVars.colors.main};
		font-size: ${getFontSize(+5)}px;
		font-weight: 600;
		width: 100%;
}

.separation-bar {
		width: 86%;
    height: 1px;
    background: #e6e6e6;
    margin: 10px 6%;
}

.dates-wrapper {
		position: relative;
		margin: 0px 0px 5px 0px;
		display: block!important;
    .modified {
				color: grey;
				text-align: left;
    }
		.created {
				// text-align: right;
				// position: absolute;
				// top: 0px;
				// right: 0px;
				margin-top: 4px;
				color: ${cssVars.colors.editor.interfaceGrey};
		}
}

.path-wrapper {
		color: grey;
    text-align: left;
		padding: 0px 0px 5px 0px;
    .path-link {
				color: ${cssVars.colors.main};
				font-weight: bold;
				cursor: pointer;
    }
}

.note-id-wrapper {
		color: grey;
    text-align: left;
		.note-id-form {
				margin-bottom: 5px;
				display:flex;
				input {
						border: none;
						padding: 5px;
						background: #ebebeb;
						border-radius: 3px;
						font-size: 9px;
						font-weight: 400;
				}
		}
}
.toolbar-and-dates-wrapper {
		h4 {
				margin: 0px;

		}
}
`
