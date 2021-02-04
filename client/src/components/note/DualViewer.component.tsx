import React, { useEffect,  useState } from 'react';
import {PreviewArea} from './PreviewArea.component'
import { EditorArea, onFileDeleteFn, onFileEditedFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile } from '../../../../shared/types.shared';
import { PathModifFn } from './TitleEditor.component';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { ButtonToolbar } from './NoteToolbar.component';
import { editorToggleButtonConfig } from '../../managers/editorToggler.manager';
import { detachNoteNewWindowButtonConfig } from '../../managers/detachNote.manager';

//@TODO mobile bar
//@TODO mobile bar func to desktop

export const DualViewer = (p:{
    file:iFile
    fileContent:string
    onFileEdited: onFileEditedFn
    onFilePathEdited: PathModifFn
    onSavingHistoryFile: onSavingHistoryFileFn
    onFileDelete: onFileDeleteFn
  }) => {
      const {syncScrollY, updateSyncScroll} = useSyncScroll()


    const [editorEnabled, setEditorEnabled] = useState(true)
    const [previewContent, setPreviewContent] = useState('')

    useEffect(() => {
        setPreviewContent(p.fileContent)
    }, [p.fileContent])

    return <div 
        className={`dual-view-wrapper ${!editorEnabled ? 'preview-only' : ''}`}
        onWheelCapture={updateSyncScroll}
        >

            { !editorEnabled &&
                <div className='toolbar-wrapper'>
                  <ButtonToolbar
                    buttons={[
                        editorToggleButtonConfig(() => {setEditorEnabled(!editorEnabled)}),
                        detachNoteNewWindowButtonConfig()
                    ]}
                  />
                </div>
            }

            <EditorArea
                file={p.file}
                posY={syncScrollY}
                fileContent={p.fileContent}
                
                onFilePathEdited={p.onFilePathEdited}
                onSavingHistoryFile={p.onSavingHistoryFile}
                onFileEdited={(path, content) => {
                    p.onFileEdited(path, content)
                    setPreviewContent(content)
                }}
                onFileDelete={p.onFileDelete}
                editorEnabled={editorEnabled}
                onEditorToggle={() => {setEditorEnabled(!editorEnabled)}}
                />

           <PreviewArea
                file={p.file}
                posY={syncScrollY}
                fileContent={previewContent}
                editorEnabled={editorEnabled}
           />

    </div>
}

