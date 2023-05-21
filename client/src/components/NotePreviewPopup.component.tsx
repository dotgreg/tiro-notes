import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pathToIfile } from '../../../shared/helpers/filename.helper';
import { getApi } from '../hooks/api/api.hook';
import { iNotePreviewPopup } from '../hooks/api/notePreviewPopup.api.hook';
import { NotePreview } from './NotePreview.component';

// notePreviewPopupStatus && <notePreviewPopup> unique in app.tsx
// un notePreviewPopup.hook.api.tsx qui gere une var 
    // notePreviewPopupStatus {open,filePath}
// ui.notePreviewPopup.open
// ui.notePreviewPopup.close

export const NotePreviewPopup = (p: {
    notePreview: iNotePreviewPopup
}) => {
    let notePreview = pathToIfile(p.notePreview.filepath)

    const closePopup = e => {
        getApi(api => {
            api.ui.notePreviewPopup.close()
        })
    }

    return (
        <div
            className="page-link-preview-popup-ext"
            onMouseLeave={closePopup}
            style={{ left: p.notePreview.position[0], top: p.notePreview.position[1] }}>
            <div className='page-link-preview-popup-int'>
                <NotePreview
                    file={notePreview}
                    // searchedString={activeLine}
                    height={200}
                />
            </div>
        </div>
    )

}

export const notePreviewPopupCss = () => `
    .page-link-preview-popup-ext {
        position: absolute;
        z-index: 100;
        cursor:pointer;
        .page-link-preview-popup-int {
            cursor:default;
            margin-top: 20px;
            background: white;
            width: 400px;
            height: 300px;
            border-radius: 10px;
            box-shadow: 0px 0px 3px 1px rgba(0,0,0,0.1);
            overflow-y:auto;
            overflow-x:hidden;
        }
    }
`
