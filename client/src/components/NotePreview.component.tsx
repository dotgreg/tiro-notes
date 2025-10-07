import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile, iTitleEditorStatus, iViewType, iWindowContent } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { codeMirrorEditorCss } from './dualView/CodeMirrorEditor.component';
import { previewAreaCss } from './dualView/PreviewArea.component';
import { WindowEditor } from './windowGrid/WindowEditor.component';
import { iLayoutUpdateFn } from './dualView/EditorArea.component';
import { getOperatingSystem } from '../managers/device.manager';

export type iNotePreviewType = "editor"|"preview"
export type iNoteParentType = "floating" | "grid" | "popup" | "omnibar" | "any"
export const NotePreviewInt = (p: {
	noteParentType: iNoteParentType

	file: iFile
	view?:iViewType
	searchedString?: string
	replacementString?: string
	height?: number
	linkPreview?:boolean
	windowId?:string

	showToolbar?:boolean
	titleEditor?:iTitleEditorStatus
	showViewToggler?:boolean
	isActive?:boolean

	onLayoutUpdate?: iLayoutUpdateFn
}) => {
	const [content, setContent] = useState("");
	const [view, setView] = useState<iViewType|undefined>(p.view);

	let loadEditorContent = useDebounce(() => {
		console.log(333333333, p.file, p.searchedString, view)
		getApi(api => {
			api.file.getContent(p.file.path, ncontent => {
				setContent(ncontent)
				if (p.searchedString) {
					getApi(api => {
						setTimeout(() => {
							console.log("searchword", p.searchedString, p.replacementString, p.windowId)
							api.ui.note.editorAction.dispatch({
								type:"searchWord", 
								searchWordString: p.searchedString,
								searchReplacementString: p.replacementString,
								windowId: p.windowId
							})	
							let omnibarInput = document.querySelector('.select-wrapper input') as HTMLInputElement
							if (!omnibarInput) return 
							omnibarInput.focus()
							setTimeout(()=>{
								omnibarInput.focus()
								setTimeout(()=>{
									omnibarInput.focus()
								},100)
							},50)
						}, 300)
					})
				}
			})
		})
	}, 200)

	useEffect(() => {
		loadEditorContent()
	}, [p.file.path, p.searchedString, view])

	let heightStr = p.height ? p.height + "px" : "100%"

	const [windowId, setWindowId] = useState<string>(p.windowId || generateUUID())
	useEffect(() => {
		setWindowId(p.windowId || generateUUID())
	}, [p.windowId])

	return (
		<div className={"note-preview-wrapper " + view} style={{ height: heightStr }}>
			<WindowEditor 
				noteParentType={p.noteParentType}
				content={{
					i:windowId,
					file:p.file,
					// active:false, // keep it false, otherwise will trigger itself as active and mess with lastFilesHistory
					active:p.isActive || false, // keep it false, otherwise will trigger itself as active and mess with lastFilesHistory
					view:p.view || "editor", // it is overrideable by user last view choice for that note
				}}
				forceView={p.view}
				canEdit={true}
				showViewToggler={p.showViewToggler}
				showToolbar={p.showToolbar}
				titleEditor={p.titleEditor}
				onLayoutUpdate={p.onLayoutUpdate || (() => {})}
			/>
		</div >
	)
}


export const NotePreview = React.memo(NotePreviewInt, (np, pp) => {
	if (JSON.stringify(np) !== JSON.stringify(pp)) return false
	return true
});

export const NotePreviewCss = () => `

.note-preview-wrapper {
	&.preview {
		padding: 15px ;
	}
	 

		${previewAreaCss()}
		${codeMirrorEditorCss({searchBottom: 0})}

		.preview-area-wrapper {
			height: calc(100% - 0px);
			margin-top: 0px;
		}

		.preview-area {
			width: calc(100% + ${getOperatingSystem() === "mac" && "0px"});
			 
		}
 
		//
		// PREVIEW
		//
		
		
				.simple-css-wrapper {

				.resource-link-content-wrapper ul {
						opacity:1!important;
						pointer-events:all!important;
				}
				iframe {
						// height: 100%!important;
				}
				.resource-link-iframe-wrapper {
						margin-bottom: 5px;
				}
		}

		.found-word {
				font-weight: bold;
				background: #fff876;
				padding: 2px;
		}

		

		//
		// EDITOR VIEW
		//

		&.editor,
		.window-editor-wrapper,
		.dual-view-wrapper,
		.editor-area,
		.codemirror-editor-wrapper {height: 100%}



}

//
// FLOATING PANEL SPECIFIC
//
.floating-panel-wrapper .main-editor-wrapper {height: calc(100% - 33px)}

//
// SIMPLE NOTE POPUP SPECIFIC
//
.page-link-preview-popup-ext .main-editor-wrapper {height: calc(100%)}



`
