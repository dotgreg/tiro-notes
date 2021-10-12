import React, { useRef, useState } from "react"
import { Icon } from "../../components/Icon.component"
import { configClient } from "../../config"
import { initClipboardListener } from "../../managers/clipboard.manager"
import {  clientSocket2 } from "../../managers/sockets/socket.manager"
import { safeString } from "../../managers/string.manager"
import { listenOnUploadSuccess, uploadFile, initListenUploadOnDrop, uploadOnInputChange } from "../../managers/upload.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { useDebounce } from "../lodash.hooks"
import { useStatMemo } from "../useStatMemo.hook"

let keyUploadSocketListener

export const useEditorUploadLogic = (p:{
    onUploadSuccess: (ressourceInMd:string) => void
}) => {
    const [dragzoneEnabled, setDragzoneEnabled] = useState(false)
    let uploadDragzoneRef = useRef<HTMLDivElement>(null)
    let uploadInputRef = useRef<HTMLInputElement>(null)

    const reinitUploadLogic = () => {
        configClient.log.upload && console.log(`[UPLOAD] cleanUploadLogic`);
        clientSocket2.off(keyUploadSocketListener)

        // WHEN RECEIVE FILE INFOS FROM API
        configClient.log.upload && console.log(`[UPLOAD] initUploadLogic`);
        
        keyUploadSocketListener = listenOnUploadSuccess((file) => {
            let ressourceInMd = `![${safeString (file.name)}](${file.path})\n\n`
            p.onUploadSuccess(ressourceInMd)
        })

        // UPLOAD FROM CLIPBOARD
        initClipboardListener({
            onImagePasted: (imageBlob) => {
                uploadFile(imageBlob)
            }
        })
        
        // UPLOAD FROM INPUT
        uploadInputRef.current ? uploadOnInputChange(uploadInputRef.current) : configClient.log.upload && console.error('[UPLOAD] uploadInputRef not detected');
        
        // UPLOAD FROM DRAG DROP
        if(uploadDragzoneRef.current) {
            initListenUploadOnDrop({
                onDragEnd: () => { setDragzoneEnabled(false)},
                onDragStart: () => { setDragzoneEnabled(true)}
            })
        }
    }

    const updateUploadFolder = (newUploadFolder:string) => {
        configClient.log.upload && console.log(`[UPLOAD] updateUploadFolder to ${newUploadFolder}`);
        debouncedUploadResourcesInfos(newUploadFolder)
    }
    const debouncedUploadResourcesInfos = useDebounce((newUploadFolder) => {
        clientSocket2.emit('uploadResourcesInfos', {folderpath: newUploadFolder, token: getLoginToken()}) 
    }, 3000)

    const uploadButtonConfig = {
        title:'upload files', 
        class:'upload-button-wrapper',
        action: () => {},
        customHtml: <>
          <input className='input-file-hidden' id="file" multiple name="file" type="file" ref={uploadInputRef}  />
          {/* @ts-ignore  */}
          <label for="file"
            ><Icon name="faPaperclip" /></label>
        </>
      }


    // COMPONENTS
    const UploadDragZone = useStatMemo(<div 
        className={`dragzone ${dragzoneEnabled ? '' : 'hidden'}`} 
        ref={uploadDragzoneRef} >
    </div>, [dragzoneEnabled])

    
    return {
        reinitUploadLogic, updateUploadFolder, 
        uploadButtonConfig,
        UploadDragZone
    }
}

export const DragzoneCss = `
    .dragzone {
        &.hidden {
        display:none;
        }
        display:block;
        position: absolute;
        top: 3vh;
        left: 3vw;
        width: 94vw;
        height: 94vh;
        z-index: 10;
        background: rgba(255,255,255,0.4);
    }
`