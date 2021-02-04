import React, { Ref, useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { formatDateEditor } from '../../managers/date.manager';
import { transformExtrawurstLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks } from '../../managers/textProcessor.manager';
const marked = require('marked');

export let previewAreaRefs

export const PreviewArea = (p:{
    editorEnabled: boolean,
    file:iFile, 
    posY:number, 
    fileContent:string
}) =>  {
    
    previewAreaRefs = {
        wrapper: useRef<HTMLDivElement>(null),
        main: useRef<HTMLDivElement>(null),
    }
    
    let currentFolderArr = p.file.path.split('/')
    currentFolderArr.pop()
    let currentFolder = currentFolderArr.join('/')

    // scroll effect
    useEffect(() => {
        previewAreaRefs.wrapper.current.scrollTop = p.posY
    }, [p.posY])

    return (
        <div 
            className={`preview-area ${p.editorEnabled ? 'half' : 'full'}`}
            ref={previewAreaRefs.wrapper}
            >

            <h3>{p.file.name}</h3>
            <br/>
            <div className='date modified'>modified: {formatDateEditor(new Date(p.file.modified || 0))}</div>
            <div className='date created'>created: {formatDateEditor(new Date(p.file.created || 0))}</div>
            
            <div 
                className='preview-content'
                ref={previewAreaRefs.main}
                dangerouslySetInnerHTML={{__html:
                marked( 
                transformRessourcesInHTML(currentFolder ,
                transformImagesInHTML (currentFolder ,
                transformExtrawurstLinks (
                transformUrlInLinks ( 
                    p.fileContent)))))}}>
            </div>

        </div>
    )
}