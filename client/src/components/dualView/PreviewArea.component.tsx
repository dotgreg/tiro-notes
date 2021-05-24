import React, { Ref, useEffect, useRef } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { formatDateEditor, formatDateList } from '../../managers/date.manager';
import { deviceType, isA, isIpad, MobileView } from '../../managers/device.manager';
import { md2html } from '../../managers/markdown.manager';
import { replaceAll } from '../../managers/string.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { transformSearchLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks, transformTitleSearchLinks } from '../../managers/textProcessor.manager';
import { commonCssEditors } from './EditorArea.component';


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
        // setTimeout(() => {
        //     previewAreaRefs.wrapper.current.scrollTop = p.posY
        //     console.log(`reinit1 ${p.posY} ${previewAreaRefs.wrapper.current.scrollTop} `)
        // }, 1000)
    }, [p.posY, p.file.path])
    
    useEffect(() => {
        // @ts-ignore
        window.previewHtmlOutput = '';
        return () => {
        }
    }, [p.file.path])

    return (
        <div 
            
            className={`preview-area`}
            ref={previewAreaRefs.wrapper}
            >

            { 
                deviceType() !== 'desktop' &&
                <div className="mobile-buttons-up-down">
                    <div id="top" onClick={() => { 
                        previewAreaRefs.wrapper.current.scrollTop = 0
                    }}>=</div>
                    <div id="up" onClick={() => { 
                        previewAreaRefs.wrapper.current.scrollTop -= 300
                    }}>^</div>
                    <div id="down" onClick={() => {
                        previewAreaRefs.wrapper.current.scrollTop += 300
                    }}>v</div>
                </div>
            }

            <div className="infos-preview-wrapper">
                
                <div className="file-path-wrapper">
                    {p.file.path.replace(`/${p.file.name}`,'')}
                </div>

                <h1 className="title big-title">
                    {p.file.name.replace('.md','')}
                </h1>

                <div className="dates-wrapper">
                  <div className='date modified'>modified: {formatDateList(new Date(p.file.modified || 0))}</div>
                  <div className='date created'>created: {formatDateList(new Date(p.file.created || 0))}</div>
                </div>
            </div>
            
            <PreviewRenderer
                filecontent={p.fileContent}
                currentFolder={currentFolder}
            />

        </div>
    )
}


export const previewAreaCss = (v:MobileView) => `
.preview-area {
    position: relative;
    display: ${isA('desktop') ? 'block' : (v === 'editor' ? 'none' : 'block')};
    padding: ${isA('desktop') ? `0px ${cssVars.sizes.block*3}px 0px ${(cssVars.sizes.block*3)/2}px` : `0px ${cssVars.sizes.block*2}px`};
    margin-top: ${isA('desktop') ? '140':'0'}px;
    height: ${isA('desktop') ? '100vh':'100vh'};
    margin-bottom: 100px;
    overflow: ${isIpad() ? 'scroll' : 'hidden'};
    ${isA('desktop') ? 'width: 50%':''};
    ${deviceType() !== 'desktop' ? 'overflow-y: scroll;':''}

    ${commonCssEditors}

    .infos-preview-wrapper {
        display: ${isA('desktop') ? 'none' : 'block'};
    }

    .mobile-buttons-up-down {
        position: fixed;
        right: 0px;
        top: 50%;
        div {
            background: #d6d6d6;
            padding: 10px;
            color:white;
            cursor: pointer;
        }
    }

    .title {
        margin: 0px 0px;
    }

    .dates-wrapper {
        margin-bottom: ${cssVars.sizes.block}px;
    }

    color: ${cssVars.colors.editor.font};
    h1, h2, h3, h4, h5, h6 {
        color: ${cssVars.colors.main};
    }
    .preview-link {
      font-weight: 800;
      
      background-repeat: no-repeat;
      background-position: 4px 2px;
      padding-left: 20px;
      background-size: 10px;
      
      &.external-link {
        background-image: url(${cssVars.assets.worldIcon});
        }
        &.search-link {
            color: ${cssVars.colors.main};
            background-image: url(${cssVars.assets.searchIcon});
        }
        &.title-search-link {
            color: ${cssVars.colors.main};
            background-image: url(${cssVars.assets.linkIcon});
        }
        &.resource-link {
          color: ${cssVars.colors.main};
        background-image: url(${cssVars.assets.fileIcon});
      }

    }

    img,
    .content-image {
        border-radius: 7px;
        box-shadow: 0px 0px 10px rgb(0 0 0 / 10%);
        max-width: 100%;
    }


    p {
        margin-top: 0px;
        margin-bottom: 1em;
    }
    .preview-content {
      margin-bottom:100px;
    }
    pre {
      code {
        display: block;
        border-radius: 8px;
        padding: 10px;
      }
    }
  }
`



const PreviewRenderer = React.memo((p:{filecontent:string, currentFolder:string}) => {
    const processRender = (raw:string):string => {
        return transformRessourcesInHTML(p.currentFolder ,
        transformImagesInHTML (p.currentFolder ,
        transformSearchLinks (
        transformTitleSearchLinks (
        transformUrlInLinks ( 
            raw
        )))))
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
    
    return (
        <>
            <div id='preview-script-area'></div>
            <div 
                className='preview-content'
                ref={previewAreaRefs.main}
                dangerouslySetInnerHTML={{__html: md2html(processRender ( p.filecontent))}}>
            </div>  
        </>

    )
})
