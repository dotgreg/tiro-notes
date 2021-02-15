import React, { useEffect,  useState } from 'react';
import {PreviewArea} from './PreviewArea.component'
import { EditorArea, onFileDeleteFn, onFileEditedFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile } from '../../../../shared/types.shared';
import { PathModifFn } from './TitleEditor.component';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { ButtonToolbar } from './NoteToolbar.component';
import { editorToggleButtonConfig } from '../../managers/editorToggler.manager';
import { detachNoteNewWindowButtonConfig } from '../../managers/detachNote.manager';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';

//@TODO mobile bar
//@TODO mobile bar func to desktop
export type ViewType = 'editor'| 'both' | 'preview'

export const DualViewer = (p:{
    file:iFile
    fileContent:string
    onFileEdited: onFileEditedFn
    onFilePathEdited: PathModifFn
    onSavingHistoryFile: onSavingHistoryFileFn
    onFileDelete: onFileDeleteFn
  }) => {
      const {syncScrollY, updateSyncScroll, setPosY} = useSyncScroll()


    const [viewType, setViewType] = useLocalStorage('viewtype','both')
    const [previewContent, setPreviewContent] = useState('')

    useEffect(() => {
        setPreviewContent(p.fileContent)
    }, [p.fileContent])

    // back to top when change file
    useEffect(() => {
        if (syncScrollY !== 0) setPosY(0)
    }, [p.file.path])

    return <div 
            className={`dual-view-wrapper view-${viewType}`}
            onWheelCapture={updateSyncScroll}
            onTouchMoveCapture={updateSyncScroll}
        >
            <EditorArea
                file={p.file}
                posY={syncScrollY}
                fileContent={p.fileContent}
                
                onScroll={newYPercent => {}}
                onFilePathEdited={p.onFilePathEdited}
                onSavingHistoryFile={p.onSavingHistoryFile}
                onFileEdited={(path, content) => {
                    p.onFileEdited(path, content)
                    setPreviewContent(content)
                }}
                onFileDelete={p.onFileDelete}
                onViewToggle={() => {
                    if (viewType === 'both') setViewType('editor')
                    if (viewType === 'editor') setViewType('preview')
                    if (viewType === 'preview') setViewType('both')
                }}
                />

           <PreviewArea
                file={p.file}
                posY={syncScrollY}
                fileContent={previewContent}
           />

    </div>
}






