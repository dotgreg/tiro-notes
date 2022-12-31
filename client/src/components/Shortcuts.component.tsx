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
		padding: 0px ${cssVars.sizes.block}px;
padding-bottom: 10px;

}
`;
