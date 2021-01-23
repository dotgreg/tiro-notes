import React, {  useState } from 'react';
import { previewAreaRefs } from './PreviewArea.component';

export const useSyncScroll = () => {
    // scrolling logic
    const [posY, setPosY] = useState(0)
    const updateSyncScroll = (e:any) => {
        let direction = e.deltaY > 0 ? 1 : -1
        let delta = direction * Math.min(Math.abs(e.deltaY),40)
        let newY = posY + delta
        let previewDiv = previewAreaRefs.main.current
        let monacoHeight = monacoEditor ? monacoEditor.editor.getContentHeight() : 0
        let maxHeight = Math.max(previewDiv.offsetHeight, monacoHeight)
        
        if (newY > -200 && newY < maxHeight) setPosY(newY)
    }
    return {syncScrollY:posY, updateSyncScroll}
}