import { Icon } from "./Icon.component"
import React from 'react';
import { strings } from "../managers/strings.manager";
import { cssVars } from "../managers/style/vars.style.manager";
import { deviceType, isA } from "../managers/device.manager";

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
        border: none;
        padding: ${isA('desktop') ? `15px 15px` : `13px 7px`};
        margin: ${cssVars.sizes.block}px;
        width: calc(100% + ${isA('desktop') ? cssVars.sizes.scrollbar : 0}px - ${cssVars.sizes.block*2}px );
        background: ${cssVars.colors.main};
        &:hover {
            background: rgba(${cssVars.colors.mainRGB},0.8);
        }
        color: white;
        border-radius: 5px;
        cursor: pointer;
        font-size: ${isA('desktop') ? 13 : 11}px;
        font-weight: 700;
        text-transform: uppercase;
        svg {
            margin-right: ${isA('desktop') ? `10px` : `5px`};
        }
        ${cssVars.font.main};
        letter-spacing: 1px;
    }
`