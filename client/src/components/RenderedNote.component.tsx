import React, { useEffect, useRef, useState } from 'react';
import { pathToIfile } from "../../../shared/helpers/filename.helper";
import { getApi } from '../hooks/api/api.hook';
import { cssVars } from '../managers/style/vars.style.manager';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';


export const RenderedNote = (p: {
	filePath: string,
}) => {

	const [content, setContent] = useState("")
	useEffect(() => {
		getApi(api => {
			api.file.getContent(p.filePath, raw => {
				let file = pathToIfile(p.filePath)
				let html = api.note.render({ raw, file })
				setContent(html)
			})
		})
	}, [p.filePath])

	return (
		<>
			<div className="rendered-note-component">

				<span
					className="rendered-note-content-wrapper"
					dangerouslySetInnerHTML={{
						__html: content
					}}
				>
				</span>
			</div>
		</>
	)
}


export const renderedNoteCompCss = () => `
.rendered-note-component {
		h3 {

		}
		.rendered-note-content-wrapper {
			${previewAreaSimpleCss()}
				&>p {
						margin: 0px;
						padding:0px;
				}

		}

}
`;
