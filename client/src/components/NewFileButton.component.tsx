import { Icon } from "./Icon.component"
import React from 'react';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { deviceType, isA, isIpad } from "../managers/device.manager";

export const NewFileButton = (p:{
    onNewFile: ()=>void
}) => 
    <button 
        className="new-file-button"
        onClick={(e) => {
            p.onNewFile()
        }}
    >
        <Icon name="faPlusCircle" color="white"/>
        <span>{strings.newNote}</span>
    </button>

export const newFileButtonCss = `
    .new-file-button {
        ${cssVars.els.redButton}
        ${cssVars.font.main};
        padding: ${isA('desktop') ? `15px 5px` : `13px 7px`};
        margin: ${cssVars.sizes.block}px;
        width: calc(100% - ${cssVars.sizes.block*(isA('desktop') && !isIpad() ? 2 : 3)}px );
        font-size: ${isA('desktop') ? 13 : 11}px;
        svg {
            margin-right: ${isA('desktop') ? `10px` : `5px`};
        }
        
    }
`