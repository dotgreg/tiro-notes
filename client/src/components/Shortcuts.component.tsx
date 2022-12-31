import React, { useEffect, useRef, useState } from 'react';
import { iFile } from "../../../shared/types.shared";
import { cssVars } from '../managers/style/vars.style.manager';
import { RenderedNote } from './RenderedNote.component';


export const Shortcuts = (p: {
				filePath: string,
									onClick: (file: iFile) => void
		}) => {

		return (
				<>
				<div className="shortcut-component">
				<h3 className="subtitle">shortcuts</h3>

				<RenderedNote filePath={p.filePath} />
																						</div>
																						</>
		)
}


export const shortcutCompCss = () => `
.shortcut-component {
		margin: 0px ${cssVars.sizes.block}px;
		margin-bottom: 10px;
		overflow: hidden;
		.rendered-note-component {
				width: 800px;
				.preview-link {
						color: #585757!important;
				}
				.preview-link {
						font-weight: 400!important;
				}
				
		}
}
`;
