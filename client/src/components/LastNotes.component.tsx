import React, { useRef } from 'react'; 
import { iFile } from "../../../shared/types.shared";
import { strings } from "../managers/strings.manager";
import { cssVars } from '../managers/style/vars.style.manager';
import { Icon } from './Icon.component';

const limitTxt = 20
const liHeight = 15

export const LastNotes = (p:{
    files:iFile[]
    onClick: (file:iFile) => void
}) => {
    const {files} = {...p}
    
    return (
        <>
            { files.length > 0 &&
                <div className="last-notes-component">
                <h3 className="subtitle">{strings.lastNotes}</h3>
                <ul>
                    {
                        files.map(file => {
                            let name = file.name.replace('.md', '')
                            name = name.length > limitTxt ? `${name.substr(0, limitTxt)}` : name
                            return (
                            <li 
                                title={name}
                                onClick={e => {p.onClick(file)}}
                                className="note" >
                                <Icon name="faFile" />
                                {name}
                            </li>   )
                            } 
                        )
                    }
                </ul>
            </div>
            }
        </>
    )
}

export const lastNotesCss = `
.last-notes-component {
    padding: 0px ${cssVars.sizes.block}px;
    
    h3 {

    }
    ul {
        height: ${(liHeight+7)*5}px;
        overflow: hidden;
        &:hover {
            min-height: ${(liHeight+7)*5}px;
            height: auto;
        }

        padding: 0px;
        margin: 0px;
        li {
            cursor: pointer;
            margin-bottom: 7px;
            overflow: hidden;
            height: ${liHeight}px;
            list-style: none;
            font-size: 11px;
            font-weight: 400;
            svg {
                color: ${cssVars.colors.main};
                margin-right: 10px;
            }
        }
    }
}
`