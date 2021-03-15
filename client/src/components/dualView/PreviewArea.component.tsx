import React, { Ref, useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { formatDateEditor } from '../../managers/date.manager';
import { replaceAll } from '../../managers/string.manager';
import { transformExtrawurstLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks } from '../../managers/textProcessor.manager';
const marked = require('marked');

export let previewAreaRefs

export const PreviewArea = (p:{
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
    
    useEffect(() => {
        // @ts-ignore
        window.previewHtmlOutput = '';
        return () => {
            console.log('preview unmount');
            
        }
    }, [p.file.path])

    return (
        <div 
            
            className={`preview-area`}
            ref={previewAreaRefs.wrapper}
            >

            <h3 className='preview-title'>{p.file.name}</h3>
            <br/>
            <div className='date modified'>modified: {formatDateEditor(new Date(p.file.modified || 0))}</div>
            <div className='date created'>created: {formatDateEditor(new Date(p.file.created || 0))}</div>
            
            
            <PreviewRenderer
                filecontent={p.fileContent}
                currentFolder={currentFolder}
            />

        </div>
    )
}




const PreviewRenderer = React.memo((p:{filecontent:string, currentFolder:string}) => {
    const processRender = (raw:string):string => {
        return transformRessourcesInHTML(p.currentFolder ,
        transformImagesInHTML (p.currentFolder ,
        transformExtrawurstLinks (
        transformUrlInLinks ( 
            raw
        ))))
    }

    // let test = p.filecontent.match()
    let regex = new RegExp(/\<script\>(.*)\<\/script\>/gms)
    let match = p.filecontent.match(regex)
    let scriptArea = document?.getElementById('preview-script-area');
    if (scriptArea) scriptArea.innerHTML = ''
    if (match && match[0]) {
        let code = replaceAll(match[0], [['<script>',''],['</script>','']])
        console.log(code);
        try {
            eval(code)
            // @ts-ignore
            if (scriptArea && window.previewHtmlOutput) scriptArea.innerHTML = window.previewHtmlOutput;
        } catch (error) {
            console.log('[EVAL CODE] error :', error)        
        }
        
    } 
    
    // const scriptToEval = 'console.log("111111113222222222")'
    // eval(scriptToEval)

    return (
        <>
            <div id='preview-script-area'></div>
            <div 
                className='preview-content'
                ref={previewAreaRefs.main}
                dangerouslySetInnerHTML={{__html: marked(processRender ( p.filecontent))}}>
            </div>  
        </>

    )
})
