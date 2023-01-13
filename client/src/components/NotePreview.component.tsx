import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { cleanSearchString } from '../managers/textProcessor.manager';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';

export const NotePreview = (p: {
				searchedString?: string
												 file: iFile
		}) => {

		const [content, setContent] = useState("");

		let loadContent = useDebounce(() => {
		getApi(api => {
				api.file.getContent(p.file.path, ncontent => {
				let ncontent2 = api.note.render({
				raw: ncontent,
						 file: p.file,
									 windowId: ''
		})

				if (p.searchedString) {
						ncontent2 = ncontent2.replaceAll(
								cleanSearchString(p.searchedString),
								`<span class='found-word'>${p.searchedString}</span>`)
						setTimeout(() => {
		document.querySelector('.note-preview-wrapper .content-preview .found-word')?.scrollIntoView();
}, 100)
				}

				// let html = `<div class='file-content render-latex'><h3>${p.file.path}</h3> ${ncontent2} </div>`;
				let html = `<div class='file-content render-latex'>${ncontent2} </div>`;
				setContent(html)
		})
		})
}, 200)

		useEffect(() => {
		loadContent()
}, [p.file, p.searchedString])

		return (
				<div className="note-preview-wrapper">
				<div className="simple-css-wrapper" dangerouslySetInnerHTML={{ __html: content }} ></div>
																																													</div >
		)
}

export const NotePreviewCss = () => `

.note-preview-wrapper {
		padding: 15px ;
${previewAreaSimpleCss()}
.simple-css-wrapper {
		/* padding: 0px 0px; */
		/* overflow-wrap: break-word; */
		/* counter-reset: sh1 ; */

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
// .note-preview-wrapper .content-preview .found-word {
		// 		font-weight: bold;
		// 		background: #fff876;
		// 		padding: 2px;
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
