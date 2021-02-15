import {  useState } from 'react';
import { monacoEditorInstance } from '../components/MonacoEditor.Component';
import { previewAreaRefs } from '../components/dualView/PreviewArea.component';

export const useSyncScroll = () => {
    // scrolling logic
    const [posY, setPosY] = useState(0)
    const updateSyncScroll = (e:any) => {
        let direction = e.deltaY > 0 ? 1 : -1
        let delta = direction * Math.min(Math.abs(e.deltaY),40)
        let newY = posY + delta
        // let newY = posY + e.deltaY
        let previewDiv = previewAreaRefs.main.current
        
        let monacoHeight = monacoEditorInstance ? monacoEditorInstance.getContentHeight() : 0
        let maxHeight = Math.max(previewDiv.offsetHeight, monacoHeight)
        
        if (newY > -200 && newY < maxHeight) setPosY(newY)
    }
    // const updateSyncScroll = (e:any) => {
    //     let direction = e.deltaY > 0 ? 1 : -1
    //     let delta = direction * Math.min(Math.abs(e.deltaY),40)
    //     let newY = posY + delta
    //     let previewDiv = previewAreaRefs.main.current
        
    //     let monacoHeight = monacoEditorInstance ? monacoEditorInstance.getContentHeight() : 0
    //     let maxHeight = Math.max(previewDiv.offsetHeight, monacoHeight)
        
    //     if (newY > -200 && newY < maxHeight) setPosY(newY)
    // }
    return {syncScrollY:posY, updateSyncScroll, setPosY}
}