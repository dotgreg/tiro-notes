import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pathToIfile } from '../../../shared/helpers/filename.helper';
import { getApi } from '../hooks/api/api.hook';
import { iNotePreviewPopup } from '../hooks/api/notePreviewPopup.api.hook';
import { stopDelayedNotePreview } from '../managers/codeMirror/noteLink.plugin.cm';
import { NotePreview } from './NotePreview.component';

export const NotePreviewPopup = (p: {
    notePreview: iNotePreviewPopup
}) => {
    let notePreview = pathToIfile(p.notePreview.filepath)

    const closePopup = e => {
        getApi(api => {
            api.ui.notePreviewPopup.close()
        })
    }

    const goToNote = e => {
        const file = pathToIfile(p.notePreview.filepath)
        if (!file || !p.notePreview.opts?.windowIdToOpenIn) return
        stopDelayedNotePreview()
        getApi(api => {
            api.ui.browser.goTo(
                file.folder,
                file.name, {
                openIn: p.notePreview.opts?.windowIdToOpenIn
            })
        })
    }

    useEffect(() => {

    })

    return (
        <div
            className="page-link-preview-popup-ext"
            onMouseLeave={closePopup}
            style={{ left: p.notePreview.position[0], top: p.notePreview.position[1] }}>
            <div className="click-throught" onClick={goToNote}></div>
            <div className='page-link-preview-popup-int'>
                <NotePreview
                    file={notePreview}
                    // searchedString={activeLine}
                    height={200}
                    type={"editor"}
                    linkPreview={false}
                />
            </div>
        </div>
    )

}

export const notePreviewPopupCss = () => `
    .page-link-preview-popup-ext {
        // pointer-events: none;
        position: absolute;
        z-index: 98;
        .click-throught {
            cursor:pointer;
            position: absolute;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 30px;
        }
        .page-link-preview-popup-int {
            // pointer-events: all;
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
