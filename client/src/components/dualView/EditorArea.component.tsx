import React, { forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { iFile, iFileImage, iViewType } from '../../../../shared/types.shared';
import { deviceType, isA, MobileView } from '../../managers/device.manager';
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
import { NoteMobileToolbar } from './NoteToolbar.component';
import { Dropdown } from '../Dropdown.component';
import { iUploadType, UploadButton, uploadButtonCss } from '../UploadButton.component';
import { UploadProgressBar } from '../UploadProgressBar.component';
import { GridContext } from '../windowGrid/WindowGrid.component';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { copyToClickBoard } from '../../managers/clipboard.manager';
import { CodeMirrorEditor } from './CodeMirrorEditor.component';
import { useDebounce } from '../../hooks/lodash.hooks';
import { CodeMirrorUtils } from '../../managers/codeMirror/editorUtils.cm';
import { openExportFilePopup } from '../../managers/print-pdf.manager';
import { setNoteView } from '../../managers/windowViewType.manager';
import { iEditorAction } from '../../hooks/api/note.api.hook';
import { fileToNoteLink } from '../../managers/noteLink.manager';

export type onSavingHistoryFileFn = (filepath: string, content: string, historyFileType: string) => void
export type onFileEditedFn = (filepath: string, content: string) => void
export type onTitleClickFn = (newYpercent: number) => void

export type onLightboxClickFn = (index: number, images: iFileImage[]) => void
export type iLayoutUpdateFn = (type: "windowActive"|"windowView", data?:{view?: iViewType}) => void

interface iEditorProps {
	viewType?: iViewType
	mobileView: MobileView
	

	editorType: iEditorType
	windowId: string

	file: iFile
	fileContent: string
	isActive: boolean
	canEdit: boolean

	onScroll: Function
	onTitleClick: onTitleClickFn
	

	onUpdateY: onTitleClickFn
	onMaxYUpdate: (maxY: number) => void
	posY: number
	editorAction: iEditorAction | null
	
	onFileEdited: onFileEditedFn
	onScrollModeChange: (v: boolean) => void

	// onDropdownEnter?: Function
	// onViewToggle: (view: iViewType) => void

	askForLayoutUpdate: iLayoutUpdateFn
}

const EditorAreaInt = (
	p: iEditorProps & { isConnected: boolean }
) => {

	const [innerFileContent, setInnerFileContent] = useState('')
	let monacoEditorComp = useRef<any>(null)


	let canEdit = true
	if (p.canEdit === false) canEdit = false
	if (p.isConnected === false) canEdit = false


	// LIFECYCLE EVENTS MANAGER HOOK
	const { triggerNoteEdition } = useNoteEditorEvents({
		file: p.file,
		fileContent: p.fileContent,
		canEdit: canEdit,

		onEditorDidMount: () => {
			// devHook("editor_mount")(p.fileContent)
			// setInnerFileContent(p.fileContent)
		},
		onEditorWillUnmount: () => {
		},
		onNoteContentDidLoad: () => {
			if (!clientSocket) return
			setInnerFileContent(p.fileContent)
		}
		,
		onNoteEdition: (newContent, isFirstEdition) => {
			setInnerFileContent(newContent)
			// IF FIRST EDITION, backup old file
			if (isFirstEdition) {
				getApi(api => {
					api.history.save(p.file.path, p.fileContent, 'enter')
				})
			}

			p.onFileEdited(p.file.path, newContent)
		},
		onNoteLeaving: (isEdited, oldPath) => {
			// if (isEdited) p.onFileEdited(oldPath, innerFileContent)
			// if (isA('desktop')) resetMonacoSelectionExt()


			// disable encryption on leave as it causes encryption bleeding on other notes
			// ifEncryptOnLeave((encryptedText) => { p.onFileEdited(oldPath, encryptedText) })
		}
	})

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

	const insertTextAt = (textToInsert: string, insertPosition: number | 'currentPos') => {
		let updatedText = applyTextModifAction('insertAt', { textToInsert, insertPosition })
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

	
	//
	// MANAGE UPLOAD / PROGRESS
	//
	const gridContext = useContext(GridContext)
	const [progressUpload, setProgressUpload] = useState(-1)
	useEffect(() => {
		if (gridContext.upload.progress && p.isActive) {
			setProgressUpload(gridContext.upload.progress)
		}
		if (gridContext.upload.file && p.isActive) {
			const { name, path } = { ...gridContext.upload.file }
			gridContext.upload.reinit();
			insertImage(name, path)
		}
	}, [gridContext.upload])


	//
	// IMAGE INSERTION
	//
	const insertImage = (name: string, path: string) => {
		stringToInsertUpload.current += `![${name}](${path})\n`
		debouncedUploadInsert()
	}
	const stringToInsertUpload = useRef('')
	const debouncedUploadInsert = useDebounce(() => {
		const f = codeMirrorEditorView.current
		if (!f) return
		const cPos = CodeMirrorUtils.getCurrentLineInfos(f).currentPosition
		insertTextAt(stringToInsertUpload.current, 'currentPos')
		stringToInsertUpload.current = ''
		CodeMirrorUtils.updateCursor(f, cPos, true)
	}, 500)



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
				type={type}
				label={label}
				onProgress={p => (setProgressUpload(p))}
				onSuccess={p => {
					insertImage(p.name, p.path)
				}}
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

	//
	// TOOLBAR ACTIONS
	//
	const editorToolbarActions = [
		...uploadBtns(),
		isTextEncrypted(innerFileContent) ? decryptButtonConfig : encryptButtonConfig,
		{
			title: 'Export/Print',
			icon: 'faFileDownload',
			action: () => {
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
	}, [p.fileContent, p.file.path])


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
		let nval = innerFileContent.length > 30000 && deviceType() !== "desktop"
		setSimpleFallback(nval)
		// forceCmRender() // cannot force render otherwise get very slow
	}, [innerFileContent, p.viewType, p.mobileView])


	useEffect(() => {
		let nval = innerFileContent.length > 30000 && deviceType() !== "desktop"
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
		setNoteView(p.file.path, nView)
		// p.onViewToggle(nView)
		// p.onViewToggle(nView)
		p.askForLayoutUpdate("windowView", {view:nView})
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
		if (a.windowId === "active" && !p.isActive) return
		if (a.windowId !== "active" && a.windowId !== p.windowId) return

		console.log("[EDITOR ACTION] =>", {a})
		// lineJump
		if (a.type === "lineJump" && a.lineJump) {
			setJumpToLine(a.lineJump)
			setTimeout(() => {
				setJumpToLine(-1)
			}, 100)
		}

		// insert at
		if (a.type === "insertText" && a.insertText && a.insertPos) {
			insertTextAt(a.insertText, a.insertPos)
		}

	}, [p.editorAction])



	return (
		<div
			className={`editor-area`}
			ref={editorWrapperEl}
		>
			{/* { FIRST ZONE INFOS WITH TITLE/TOOLBARS ETC } */}
			<div className="infos-editor-wrapper">

				<div className="file-path-wrapper">
					{p.file.path.replace(`/${p.file.name}`, '')}
				</div>

				<NoteTitleInput
					title={p.file.name.replace('.md', '')}
					onEdited={(o, n) => {
						const oPath = `${p.file.folder}${o}.md`
						const nPath = `${p.file.folder}${n}.md`
						gridContext.file.onTitleUpdate(oPath, nPath)
						forceCmRender()
					}}
				/>

				<div className="toolbar-and-dates-wrapper">

					<div className="editor-toolbar-dropdown">
						<Dropdown
							hover={true}
							dir="right"
							maxHeight={maxDropdownHeight}
							onMouseEnter={e => {p.askForLayoutUpdate("windowActive")}}
						>
							<>

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

								<div className='toolbar-wrapper'>
									<ButtonsToolbar
										class='editor-main-toolbar'
										design="vertical"
										size={0.8}
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

				</div>

			</div>

			{/* UPLOAD BAR FOR EACH EDITOR */}
			<UploadProgressBar progress={progressUpload} />


			{/* {MAIN EDITOR AREA} */}
			<div className="main-editor-wrapper">

				{!isPreview && !simpleFallback && p.editorType === 'codemirror' &&
					<CodeMirrorEditor
						windowId={p.windowId}
						ref={codeMirrorEditorView}

						value={innerFileContent}
						onChange={triggerNoteEdition}

						posY={p.posY}
						jumpToLine={jumpToLine || 0}

						forceRender={cmRender}
						onScroll={p.onScroll}
						onTitleClick={p.onTitleClick}

						file={p.file}
					/>
				}

				{!isPreview && simpleFallback &&
					<div className="codemirror-mobile-fallback">
						<p> Note is too long for mobile, the advanced edition features are disabled </p>
						<textarea
							defaultValue={innerFileContent}
							onChange={e => { triggerNoteEdition(e.target.value) }}
						/>
					</div>
				}


			</div>


			{
				// BOTTOM MOBILE TOOLBAR
				deviceType() !== 'desktop' &&
				<NoteMobileToolbar
					onButtonClicked={action => {
						let updatedText = applyTextModifAction(action)
						if (updatedText) {
							triggerNoteEdition(updatedText)
							forceCmRender()
						}
					}}
				/>
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



export const commonCssEditors = () => `
.mobile-text-manip-toolbar {
		.toolbar-button {
				padding: 13px 20px;
		}
}

.file-path-wrapper {
		padding-top: ${isA('desktop') ? cssVars.sizes.block : cssVars.sizes.block / 2}px;
		font-size: 13px;
		font-weight: 700;
		color: #b6b5b5;
		cursor: pointer;
		text-transform: capitalize;
}
.big-title {
		color: ${cssVars.colors.main};
		font-size: 30px;
		font-weight: 800;
		width: 100%;
		text-transform: uppercase;
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
				text-align: right;
				position: absolute;
				top: 0px;
				right: 0px;
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

export const editorAreaCss = (v: MobileView) => `

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
`

export const EditorArea = (p: iEditorProps) => {
	const api = useContext(ClientApiContext);
	const isConnected = api?.status.isConnected || false
	return useMemo(() => {
		return <EditorAreaInt {...p} isConnected={isConnected} />
	}, [
		p.viewType,
		isConnected,
		p.canEdit,
		p.editorType,
		p.file.path,
		p.file,
		p.fileContent,
		p.isActive,
		p.editorAction])
}
