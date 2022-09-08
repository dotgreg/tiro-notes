import { Icon } from "./Icon.component"
import React from 'react';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { deviceType, isA, isIpad } from "../managers/device.manager";

export const NewFileButton = React.memo((p: {
	onNewFile: () => void
}) =>
	<button
		className="new-file-button"
		onClick={(e) => {
			p.onNewFile()
		}}
	>
		<Icon name="faPlusCircle" color="white" />
		<span>{strings.newNote}</span>
	</button>
	, (np, pp) => {
		return true
	})

export const newFileButtonCss = () => `
    .new-file-button {
        ${cssVars.els().redButton}
        ${cssVars.font.main};
        padding: ${isA('desktop') ? `14px 5px` : `13px 7px`};
        margin: 13px 15px 15px 15px;
				width: calc(100% - 30px); 
        font-size: ${isA('desktop') ? 11 : 11}px;
        svg {
            margin-right: ${isA('desktop') ? `10px` : `5px`};
        }
        
    }
`
