import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';

export const NotePreview = (p: {
	searchedString?: string
	file: iFile
	height?: number
}) => {

	const [content, setContent] = useState("");

	let loadContent = useDebounce(() => {
		getApi(api => {
			api.file.getContent(p.file.path, ncontent => {
				if (p.searchedString) {
					let string2Search = p.searchedString
					// console.log(22222222, { string2Search, s1: p.searchedString, content: ncontent });
					// const htmlEntities = (str) => {
					// 	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
					// }
					// string2Search = htmlEntities(string2Search)
					ncontent = ncontent.replaceAll(
						string2Search,
						`<span class='found-word'>${p.searchedString}</span>`)

				}
					ncontent = api.note.render({
						raw: ncontent,
						file: p.file,
						windowId: ''
					})

					setTimeout(() => {
						document.querySelector('.note-preview-wrapper .found-word')?.scrollIntoView();
					}, 100)

				let html = `<div class='file-content render-latex'>${ncontent} </div>`;
				setContent(html)
			})
		})
	}, 200)



	useEffect(() => {
		loadContent()
	}, [p.file, p.searchedString])

	return (
		<div className="note-preview-wrapper">
			<div
				className="simple-css-wrapper"
				dangerouslySetInnerHTML={{ __html: content }} >
			</div>
		</div >
	)
}

export const NotePreviewCss = () => `

.note-preview-wrapper {
		padding: 15px ;
		${previewAreaSimpleCss()}
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

		// .note-preview-wrapper .content-preview h3.note-title {
				// 		margin-bottom: 10px;
				// 		margin-top: 0px;
				// }
		// .note-preview-wrapper .content-preview p {
				// 		margin: 0px;
				// }
		// .note-preview-wrapper .content-preview ul,
		// .note-preview-wrapper .content-preview li {
				// 		margin: 0px;
				// }
		// .note-preview-wrapper .content-preview img {
				// 		max-width: 300px;
				// }
		// .note-preview-wrapper .content-preview .file-content {
				// 		padding: 10px 30px;
				// }
		// .note-preview-wrapper .content-preview {
				// 		/* max-height: 50vh; */
				// }

}
`
