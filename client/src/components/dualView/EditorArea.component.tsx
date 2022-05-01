import React, { useContext, useEffect, useRef, useState } from 'react';
import { iFile, iFileImage, iViewType } from '../../../../shared/types.shared';
import { deviceType, isA, MobileView } from '../../managers/device.manager';
import { MonacoEditorWrapper, resetMonacoSelectionExt } from '../MonacoEditor.Component';
import { NoteTitleInput, PathModifFn } from './TitleEditor.component'
import { useTextManipActions } from '../../hooks/editor/textManipActions.hook';
import { useMobileTextAreaLogic } from '../../hooks/editor/mobileTextAreaLogic.hook';
import { useNoteEditorEvents } from '../../hooks/editor/noteEditorEvents.hook';
import { useIntervalNoteHistory } from '../../hooks/editor/noteHistory.hook';
import { useNoteEncryption } from '../../hooks/editor/noteEncryption.hook';
import { useEditorUploadLogic } from '../../hooks/editor/editorUpload.hook';
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
import { PopupContext } from '../../hooks/app/usePromptPopup.hook';
import { Dropdown } from '../Dropdown.component';
import { css } from '@emotion/css';

export type onSavingHistoryFileFn = (filepath: string, content: string, historyFileType: string) => void
export type onFileEditedFn = (filepath: string, content: string) => void
export type onFileDeleteFn = (filepath: string) => void
export type onScrollFn = (newYpercent: number) => void
export type onLightboxClickFn = (index: number, images: iFileImage[]) => void

export const EditorArea = (p: {
	file: iFile
	posY: number
	fileContent: string
	canEdit: boolean

	isLeavingNote: boolean

	onScroll: onScrollFn
	onFileTitleEdited: PathModifFn
	onSavingHistoryFile: onSavingHistoryFileFn
	onFileEdited: onFileEditedFn
	onFileDelete: onFileDeleteFn
	onLightboxClick: onLightboxClickFn

	onBackButton: Function
	onToggleSidebarButton: Function
	onViewToggle: (view: iViewType) => void
	onMaxYUpdate: (maxY: number) => void

}) => {

	const [vimMode, setVimMode] = useState(false)
	const [innerFileContent, setInnerFileContent] = useState('')
	let monacoEditorComp = useRef<MonacoEditorWrapper>(null)
	//@ts-ignore
	window.monacoEditComp = monacoEditorComp

	// LIFECYCLE EVENTS MANAGER HOOK
	const { triggerNoteEdition } = useNoteEditorEvents({
		file: p.file,
		fileContent: p.fileContent,
		canEdit: p.canEdit,

		onEditorDidMount: () => {
		},
		onEditorWillUnmount: () => {

		},
		onNoteContentDidLoad: () => {
			if (!clientSocket) return
			setInnerFileContent(p.fileContent)
			updateUploadFolder(p.file.folder)
			reinitUploadLogic()
		},
		onNoteEdition: (newContent, isFirstEdition) => {
			// reaction from triggerNoteEdition
			if (isFirstEdition) p.onSavingHistoryFile(p.file.path, p.fileContent /* still the old */, 'enter')
			setInnerFileContent(newContent)
			p.onFileEdited(p.file.path, newContent)
		},
		onNoteLeaving: (isEdited, oldPath) => {
			// if (isEdited) p.onFileEdited(oldPath, innerFileContent)
			if (isA('desktop')) resetMonacoSelectionExt()
			ifEncryptOnLeave((encryptedText) => { p.onFileEdited(oldPath, encryptedText) })
		}
	})

	useEffect(() => {
		ifEncryptOnLeave((encryptedText) => {
			p.onFileEdited(p.file.path, encryptedText)
		})
	}, [p.isLeavingNote])

	//  HOOK : CONTENT SAVE => REMOVED AS ITS A MESS TO USE DEBOUNCE/THROTTLE HERE :(
	// const {
	//   setStopDelayedNoteSave, throttledOnNoteEdited, debouncedOnNoteEdited} = useNoteSaveLogic({
	//     onNoteSave: (path, content) => {
	//       p.onFileEdited(path, content)
	//     }
	//   })

	// AUTOMATIC HISTORY HOOK Every 10m
	useIntervalNoteHistory(innerFileContent, {
		shouldCreateIntervalNoteHistory: () => {
			if (noHistoryBackupWhenDecrypted) return console.log('[HISTORY FILE] : noHistoryBackupWhenDecrypted')
			else {
				p.onSavingHistoryFile(p.file.path, innerFileContent, 'int')
				console.log(`[HISTORY FILE] : creating history file for ${p.file.path}`)
			}
		}
	})


	// UPLOAD LOGIC HOOK

	const {
		UploadDragZone, uploadButtonConfig, reinitUploadLogic, updateUploadFolder, uploadProgress
	} = useEditorUploadLogic({
		onUploadSuccess: ressLinkInMd => {
			insertTextAt(ressLinkInMd, 'currentPos')
		}
	})

	// MOBILE EDITOR LOGIC HOOK
	let mobileTextarea = useRef<HTMLTextAreaElement>(null)
	const { onTextareaChange, onTextareaScroll } = useMobileTextAreaLogic(innerFileContent, {
		mobileTextarea,
		onMobileNoteEdition: triggerNoteEdition
	})


	// TEXT MANIPULATION HOOK
	const { applyTextModifAction } = useTextManipActions({
		editorType: deviceType(),
		editorRef: deviceType() !== 'desktop' ? mobileTextarea : monacoEditorComp
	})
	const insertTextAt = (textToInsert: string, insertPosition: number | 'currentPos') => {
		let updatedText = applyTextModifAction('insertAt', { textToInsert, insertPosition })
		if (updatedText) triggerNoteEdition(updatedText)
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

	// TOOLBAR ACTIONS
	const editorToolbarActions = [
		uploadButtonConfig,
		isTextEncrypted(innerFileContent) ? decryptButtonConfig : encryptButtonConfig,
		{
			title: 'Insert unique id',
			icon: 'faFingerprint',
			action: () => {
				let folder = `${p.file.folder}`
				insertTextAt(`[link|${p.file.realname} ${folder}]\n`, 0)
			}
		},
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
			title: strings.editorBar.lightbox,
			icon: 'faImages',
			action: () => {
				const imgs = findImagesFromContent(p.fileContent, p.file)
				p.onLightboxClick(0, imgs)
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
				if (popups.confirm) popups.confirm(`${strings.trashNote}`, () => {
					p.onFileDelete(p.file.path)
				})
			}
		},
	]


	const popups = useContext(PopupContext);
	// File History
	const [historyPopup, setHistoryPopup] = useState(false)

	// TTS
	const [ttsPopup, setTtsPopup] = useState(false)

	return (
		// <div className={`editor-area ${p.previewEnabled ? 'active' : 'inactive'}`}>
		<div className={`editor-area`}>
			{uploadProgress !== '' && <div className="upload-progress"> {uploadProgress}</div>}
			{UploadDragZone}

			{/* { FIRST ZONE INFOS WITH TITLE/TOOLBARS ETC } */}
			<div className="infos-editor-wrapper">

				<div className="file-path-wrapper">
					{p.file.path.replace(`/${p.file.name}`, '')}
				</div>

				<NoteTitleInput
					title={p.file.name.replace('.md', '')}
					onEdited={p.onFileTitleEdited}
				/>

				<div className="toolbar-and-dates-wrapper">

					<div className="editor-toolbar-dropdown"> 																			<Dropdown
						hover={true}
						dir="right"
					>
						<>

							<div className="view-toggler-wrapper">
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
											action: () => { p.onViewToggle('editor') }
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
							</div>

							<div className='toolbar-wrapper'>
								<ButtonsToolbar
									class='editor-main-toolbar'
									design="vertical"
									size={0.8}
									buttons={editorToolbarActions}
								/>
							</div>

							<div className="dates-wrapper">
								<div className='date modified'>modified: {formatDateList(new Date(p.file.modified || 0))}</div>
								<div className='date created'>created: {formatDateList(new Date(p.file.created || 0))}</div>
							</div>
						</>
					</Dropdown >
					</div>

				</div>

			</div>


			{/* {MAIN EDITOR AREA} */}
			<div className="main-editor-wrapper">
				{
					deviceType() === 'desktop' &&
					<MonacoEditorWrapper
						value={innerFileContent}
						vimMode={vimMode}
						readOnly={!p.canEdit}
						ref={monacoEditorComp}
						onChange={triggerNoteEdition}
						onScroll={p.onScroll}
						posY={p.posY}
					/>
					// <MonacoEditor2
					//   value={innerFileContent}
					// />
				}
				{
					deviceType() !== 'desktop' &&
					<textarea
						className='textarea-editor'
						ref={mobileTextarea}
						readOnly={!p.canEdit}
						value={innerFileContent}
						onScroll={(e: any) => {
							p.onScroll(e)
							onTextareaScroll(e)
						}}
						onChange={onTextareaChange}
					/>
				}
			</div>


			{
				// BOTTOM MOBILE TOOLBAR
				deviceType() !== 'desktop' &&
				<NoteMobileToolbar
					onButtonClicked={action => {
						let updatedText = applyTextModifAction(action)
						if (updatedText) triggerNoteEdition(updatedText)
					}}
				/>
			}

			{askForPassword && APasswordPopup}

			{historyPopup && <FileHistoryPopup file={p.file} onClose={() => { setHistoryPopup(false) }} />}

			{ttsPopup && <TtsPopup fileContent={innerFileContent} onClose={() => { setTtsPopup(false) }} />}
		</div>
	)
}
const test = css`
		.test {
				background: red;
		}

`
const test2 = `
the color changed everywhere;
`

export const commonCssEditors = `
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

.dates-wrapper {
    color: ${cssVars.colors.editor.interfaceGrey};
    .modified {
      color: grey;
    }
  }
`

export const editorAreaCss = (v: MobileView) => `
.editor-area {
  width: ${isA('desktop') ? '50%' : (v === 'editor' ? '100vw' : '0vw')};
  display: ${isA('desktop') ? 'block' : (v === 'editor' ? 'block' : 'none')};
  position: relative;

  .infos-editor-wrapper {
    ${isA('desktop') ? '' : `height: ${cssVars.sizes.mobile.editorTopWrapper}px;`}
    ${isA('desktop') ? `width: calc(200% - ${(cssVars.sizes.block * 3) * 2}px);` : ``}
    padding: 0px ${isA('desktop') ? cssVars.sizes.block * 3 : cssVars.sizes.block * 2}px;
    position: relative;

    ${commonCssEditors}

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
      margin: ${cssVars.sizes.block}px 0px;
      .date {
        text-align: right;
      }
    }
    



      .upload-button-wrapper {
        position: relative;  
        .input-file-hidden {
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
      }
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
`


// let pass everything for the moment
// export const EditorArea = React.memo(EditorAreaInternal, (props, nextProps) => {
//   if(props.file.path === nextProps.file.path) {
//     return false
//   }
//   return false
// })
