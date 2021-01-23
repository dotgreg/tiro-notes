import React, { useEffect,  useState } from 'react';
import {PreviewArea} from './PreviewArea.component'
import { EditorArea, onFileEditedFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile } from '../../../../shared/types.shared';
import { PathModifFn } from './TitleEditor.component';
import { useSyncScroll } from './syncScroll.hook';

//@TODO scroll logic

export const Note2 = (p:{
    file:iFile
    fileContent:string
    onFileEdited: onFileEditedFn
    onFilePathEdited: PathModifFn
    onSavingHistoryFile: onSavingHistoryFileFn
    onFileDelete: (filepath:string) => void
    onEditorDetached: (filepath:string) => void
  }) => {
    const [editorEnabled, setEditorEnabled] = useState(true)
    const {syncScrollY, updateSyncScroll} = useSyncScroll()

    return <div 
        className="editor"
        onWheelCapture={updateSyncScroll}
        >

            <EditorArea
                file={p.file}
                posY={syncScrollY}
                fileContent={p.fileContent}
                editorEnabled={editorEnabled}

                onFilePathEdited={p.onFilePathEdited}
                onSavingHistoryFile={p.onSavingHistoryFile}
                onFileEdited={p.onFileEdited}
                />

           <PreviewArea
                file={p.file}
                posY={syncScrollY}
                fileContent={p.fileContent}
                editorEnabled={editorEnabled}
           />

    </div>
}

