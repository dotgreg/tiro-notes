import { markdown } from '@codemirror/lang-markdown';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile, iTitleEditorStatus, iViewType, iWindowContent } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { codeMirrorEditorCss } from './dualView/CodeMirrorEditor.component';
import { previewAreaCss } from './dualView/PreviewArea.component';
import { WindowEditor } from './windowGrid/WindowEditor.component';
import { iLayoutUpdateFn } from './dualView/EditorArea.component';

export type iNotePreviewType = "editor"|"preview"
export const NotePreview = (p: {
	file: iFile
	view:iViewType
	searchedString?: string
	height?: number
	linkPreview?:boolean
	windowId?:string

	showToolbar?:boolean
	titleEditor?:iTitleEditorStatus
	showViewToggler?:boolean
	onLayoutUpdate?: iLayoutUpdateFn
}) => {
	const [content, setContent] = useState("");
	const [view, setView] = useState<iViewType>(p.view);

	let loadPreviewContent = useDebounce(() => {
		getApi(api => {
			api.file.getContent(p.file.path, ncontent => {
				if (p.searchedString) {
					let string2Search = p.searchedString
					ncontent = ncontent.replaceAll(
						string2Search,
						`<span class='found-word'>${p.searchedString}</span>`)

				}
					ncontent = api.note.render({
						raw: ncontent,
						file: p.file,
						windowId: 'preview-popup'
					})

					setTimeout(() => {
						document.querySelector('.note-preview-wrapper .found-word')?.scrollIntoView();
					}, 100)

				let html = `<div class='file-content render-latex'>${ncontent} </div>`;
				setContent(html)
			})
		})
	}, 200)

	let loadEditorContent = useDebounce(() => {
		getApi(api => {
			api.file.getContent(p.file.path, ncontent => {
				setContent(ncontent)
				if (p.searchedString) {
					getApi(api => {
						setTimeout(() => {
							api.ui.note.editorAction.dispatch({
								type:"searchWord", 
								searchWordString: p.searchedString,
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

	// const [forceUpdateInt, setforceUpdate] = useState<number>(0);
	// const forceUpdate = () => { 
	// 	setTimeout(() => {
	// 		// setforceUpdate(forceUpdateInt + 1) 
	// 	}, 100)
	// }
	useEffect(() => {
		// if (view === "preview") loadPreviewContent()
		// else loadEditorContent()
		// forceUpdate()
		loadEditorContent()
	}, [p.file, p.searchedString, view])


	let heightStr = p.height ? p.height + "px" : "100%"


	return (
		<div className={"note-preview-wrapper " + view} style={{ height: heightStr }}>
			<WindowEditor 
				content={{
					i:p.windowId || generateUUID(),
					file:p.file,
					active:true,
					view:p.view,
				}}
				canEdit={true}
				showViewToggler={p.showViewToggler}
				showToolbar={p.showToolbar}
				titleEditor={p.titleEditor}
				onLayoutUpdate={p.onLayoutUpdate || (() => {})}
			/>
			{/* <div className={`window-editor-wrapper`}>
					<DualViewer
						windowId={p.windowId || generateUUID()}
						file={p.file}
						fileContent={content}
						isActive={true}
						canEdit={true}
						showViewToggler={p.showViewToggler}
						showToolbar={p.showToolbar}
						titleEditor={p.titleEditor}

						viewType={p.view}
						mobileView={"editor"}
						
						onLayoutUpdate={p.onLayoutUpdate || (() => {})}
						
						onFileEdited={(path, content) => {
							// onFileEditedSaveIt(path, content);
							getApi(api => {
								api.file.saveContent(path, content)
							})
						}}
						pluginsConfig={{
							markdown: false,
							linkPreview: p.linkPreview
						}}
					/>
			</div > */}
		</div >
	)
}

export const NotePreviewCss = () => `

.note-preview-wrapper {
		&.preview {
			padding: 15px ;
		}

		

		${previewAreaCss()}
		${codeMirrorEditorCss()}

		.preview-area-wrapper {
			height: calc(100% - 0px);
			margin-top: 0px;
		}

		.preview-area {
			width: calc(100% + 24px);
		}

		// .note-preview-wrapper .preview-area-wrapper
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
		.main-editor-wrapper,
		.codemirror-editor-wrapper {height: 100%}


}
`
