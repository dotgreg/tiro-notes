import { markdown } from '@codemirror/lang-markdown';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { codeMirrorEditorCss } from './dualView/CodeMirrorEditor.component';
import { DualViewer } from './dualView/DualViewer.component';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';

export type iNotePreviewType = "editor"|"preview"
export const NotePreview = (p: {
	searchedString?: string
	file: iFile
	height?: number
	type?:iNotePreviewType
	linkPreview?:boolean
	windowId?:string
}) => {
	if (!p.type) p.type = "editor"
	const [content, setContent] = useState("");
	const [type, setType] = useState<iNotePreviewType>(p.type);
	const toggleType = () => type === "editor" ? setType("preview") : setType("editor")

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
		if (type === "preview") loadPreviewContent()
		else loadEditorContent()
		// forceUpdate()
	}, [p.file, p.searchedString, type])


	return (
		<div className={"note-preview-wrapper " + type}>
			{/* <div className='' onClick={e => { toggleType()}}>toggle view</div> */}
			{
				type === "preview" && 
				<div
					className="simple-css-wrapper"
					dangerouslySetInnerHTML={{ __html: content }} >
				</div>
			}
			{
				type === "editor" && 
				// <div className={`window-editor-wrapper ${forceUpdateInt}`}>
				<div className={`window-editor-wrapper`}>
					<DualViewer
						windowId={p.windowId || generateUUID()}
						file={p.file}
						fileContent={content}
						isActive={true}
						canEdit={true}

						viewType={"editor"}
						mobileView={"editor"}
						
						// onViewChange={p.onViewChange}
						// onEditorDropdownEnter={p.onEditorDropdownEnter}
						askForLayoutUpdate={() => {}}
						
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
			</div >
			}
		</div >
	)
}

export const NotePreviewCss = () => `

.note-preview-wrapper {
		&.preview {
			padding: 15px ;
		}

		${previewAreaSimpleCss()}
		${codeMirrorEditorCss()}

		//
		// PREVIEW
		//
		.simple-css-wrapper {

				.resource-link-content-wrapper ul {
						opacity:1!important;
						pointer-events:all!important;
				}
				iframe {
						height: 400px!important;
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
		.infos-editor-wrapper {
			display: none;
		}

		&.editor,
		.window-editor-wrapper,
		.dual-view-wrapper,
		.editor-area,
		.main-editor-wrapper,
		.codemirror-editor-wrapper {height: 100%}


}
`
