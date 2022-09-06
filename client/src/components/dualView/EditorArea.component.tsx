import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';
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
import { TtsPopup } from '../TtsPopup.component';
import { ButtonsToolbar } from '../ButtonsToolbar.component';
import { NoteMobileToolbar } from './NoteToolbar.component';
import { findImagesFromContent } from '../../managers/images.manager';
import { Dropdown } from '../Dropdown.component';
import { UploadButton, uploadButtonCss } from '../UploadButton.component';
import { UploadProgressBar } from '../UploadProgressBar.component';
import { GridContext } from '../windowGrid/WindowGrid.component';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { copyToClickBoard } from '../../managers/clipboard.manager';
import { CodeMirrorEditor, CodeMirrorUtils } from './CodeMirrorEditor.component';
import { debounce } from 'lodash';
import { useDebounce } from '../../hooks/lodash.hooks';

export type onSavingHistoryFileFn = (filepath: string, content: string, historyFileType: string) => void
export type onFileEditedFn = (filepath: string, content: string) => void
export type onScrollFn = (newYpercent: number) => void
export type onLightboxClickFn = (index: number, images: iFileImage[]) => void

export const EditorArea = (p: {
	editorType: iEditorType
	windowId: string

	file: iFile
	fileContent: string
	isActive: boolean
	canEdit: boolean

	onScroll: onScrollFn
	onUpdateY: onScrollFn
	onMaxYUpdate: (maxY: number) => void
	posY: number
	jumpToLine?: number

	onFileEdited: onFileEditedFn
	onViewToggle: (view: iViewType) => void
	onScrollModeChange: (v: boolean) => void

}) => {

	const [vimMode, setVimMode] = useState(false)
	const [innerFileContent, setInnerFileContent] = useState('')
	let monacoEditorComp = useRef<any>(null)

	const api = useContext(ClientApiContext);

	let canEdit = true
	if (p.canEdit === false) canEdit = false
	if (api && api.status.isConnected === false) canEdit = false


	// LIFECYCLE EVENTS MANAGER HOOK
	// console.log(55510, canEdit);
	const { triggerNoteEdition } = useNoteEditorEvents({
		file: p.file,
		fileContent: p.fileContent,
		canEdit: true,

		onEditorDidMount: () => {
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
			p.onFileEdited(p.file.path, newContent)

			// IF FIRST EDITION, backup old file
			if (isFirstEdition && api) {
				api.history.save(p.file.path, p.fileContent, 'enter')
			}
		},
		onNoteLeaving: (isEdited, oldPath) => {
			// if (isEdited) p.onFileEdited(oldPath, innerFileContent)
			// if (isA('desktop')) resetMonacoSelectionExt()
			ifEncryptOnLeave((encryptedText) => { p.onFileEdited(oldPath, encryptedText) })
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
		onTextEncrypted: triggerNoteEdition,
		onTextDecrypted: triggerNoteEdition
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
			stringToInsertUpload.current += `![${name}](${path})\n`
			debouncedUploadInsert()
		}

	}, [gridContext.upload])


	const stringToInsertUpload = useRef('')
	const debouncedUploadInsert = useDebounce(() => {
		const f = codeMirrorEditorView.current
		const cPos = CodeMirrorUtils.getCurrentLineInfos(f).currentPosition


		insertTextAt(stringToInsertUpload.current, 'currentPos')
		stringToInsertUpload.current = ''

		CodeMirrorUtils.updateCursor(f, cPos)
	}, 300)

	const idNote = `[link|${p.file.realname} ${p.file.folder}]\n`

	//
	// TOOLBAR ACTIONS
	//
	const editorToolbarActions = [
		// {
		// 	title: 'preview scroll',
		// 	class: 'toggle-scroll',
		// 	action: () => { },
		// 	customHtml: <input
		// 		type="checkbox"
		// 		defaultChecked={false}
		// 		onChange={(e) => {
		// 			// console.log('wooop', e.target.checked);
		// 			p.onScrollModeChange(!e.target.checked)
		// 		}}
		// 	/>
		// },
		{
			title: '',
			class: 'upload-button-wrapper',
			action: () => { },
			customHtml: <UploadButton
				file={p.file}
				onProgress={p => (setProgressUpload(p))}
				onSuccess={p => {
					insertTextAt(`\n![${p.name}](${p.path})\n`, 'currentPos')
				}}
			/>
		},
		isTextEncrypted(innerFileContent) ? decryptButtonConfig : encryptButtonConfig,
		{
			title: 'Print/download',
			icon: 'faFileDownload',
			action: () => {
				window.print()
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
				setTtsPopup(!ttsPopup)
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

	// TTS
	const [ttsPopup, setTtsPopup] = useState(false)

	const editorWrapperEl = useRef<HTMLDivElement>(null)

	// calc max size for dropdown before scrolling
	const el = editorWrapperEl.current
	let maxDropdownHeight = 700
	if (el) maxDropdownHeight = el.clientHeight / 1.3
	if (deviceType() === 'mobile') maxDropdownHeight = window.innerHeight


	// // Id note ref
	const idInputRef = useRef<HTMLInputElement>(null)


	//
	// on scroll posY update
	//
	const getCurrentLine = () => {
		let newLine
		if (p.editorType === "codemirror") {
			newLine = CodeMirrorUtils.getScrolledLine(codeMirrorEditorView.current)
			if (newLine > 1) newLine -= 1
		} else {
			newLine = monacoEditorComp.current?.getScrollLine() || 0;
		}
		return newLine
	}

	useEffect(() => {
		// IMPORTANT for title scrolling
		// p.onScroll(getCurrentLine())
		// debounce(() => {
		// 	p.onScroll(getCurrentLine())
		// }, 1000)
	}, [p.posY])

	useEffect(() => {
		// IMPORTANT for title scrolling
		// p.onScroll(getCurrentLine())
		// debounce(() => {
		// 	p.onScroll(getCurrentLine())
		// }, 1000)
		// console.log(333, p.fileContent.length);
		forceCmRender()
	}, [p.fileContent])


	//
	// new CODEMIRROR code adaptation
	//
	// console.log(4442, codeMirrorEditorView);
	// useEffect(() => { console.log(5550, innerFileContent); }, [innerFileContent])
	const [cmRender, setCmRender] = useState(0)
	const forceCmRender = () => { setCmRender(cmRender + 1) }



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
					}}
				/>

				<div className="toolbar-and-dates-wrapper">

					<div className="editor-toolbar-dropdown">
						<Dropdown
							hover={true}
							dir="right"
							maxHeight={maxDropdownHeight}
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
													action: () => { p.onViewToggle('editor') }
												},
												{
													title: 'Editor with minimap',
													icon: "custom_icons/view-4.svg",
													action: () => { p.onViewToggle('editor-with-map') }
												},
												{
													title: 'Dual view',
													icon: "custom_icons/view-1.svg",
													action: () => { p.onViewToggle('both') }
												},
												{
													title: 'Render view',
													icon: "custom_icons/view-2.svg",
													action: () => { p.onViewToggle('preview') }
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
											api?.ui.browser.goTo(p.file.folder, p.file.name)
											console.log(p.file.folder, p.file.name);
										}}
										> {p.file.folder} </span>
									</div>
								</div>

								<div className="note-id-wrapper">
									<h4>Node Id</h4>
									<div className="note-id-form">
										<input
											type="text"
											ref={idInputRef}
											onClick={e => {
												const el = e.target
												// @ts-ignore
												el.setSelectionRange(0, el.value.length)
											}}
											value={idNote}
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

							</>
						</Dropdown >
					</div>

				</div>

			</div>

			{/* UPLOAD BAR FOR EACH EDITOR */}
			<UploadProgressBar progress={progressUpload} />


			{/* {MAIN EDITOR AREA} */}
			<div className="main-editor-wrapper">

				{p.editorType === 'codemirror' &&
					<CodeMirrorEditor
						windowId={p.windowId}
						ref={codeMirrorEditorView}

						// initValue={innerFileContent}
						value={innerFileContent}
						onChange={triggerNoteEdition}

						posY={p.posY}
						jumpToLine={p.jumpToLine || 0}

						forceRender={cmRender}
					/>

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

			{ttsPopup && <TtsPopup file={p.file} fileContent={innerFileContent} onClose={() => { setTtsPopup(false) }} />}
		</div>
	)//jsx
}

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


`//css

export const editorAreaCss = (v: MobileView) => `//css
.editor-area {
  width: ${isA('desktop') ? '50%' : (v === 'editor' ? '100vw' : '0vw')};
  display: ${isA('desktop') ? 'block' : (v === 'editor' ? 'block' : 'none')};
  position: relative;

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
    // 10 = monaco browser gutter
    // padding: 0px ${isA('desktop') ? (cssVars.sizes.block * 3) - 10 : cssVars.sizes.block * 2}px;
    ${isA('desktop') ? `padding: 0px ${(cssVars.sizes.block * 3) / 2}px 0px ${(cssVars.sizes.block * 3) - 10}px;` : ''}
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
}
`//css


// let pass everything for the moment
// export const EditorArea = React.memo(EditorAreaInternal, (props, nextProps) => {
//   if(props.file.path === nextProps.file.path) {
//     return false
//   }
//   return false
// })
