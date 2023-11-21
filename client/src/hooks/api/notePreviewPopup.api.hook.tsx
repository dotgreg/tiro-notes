import React, { useEffect, useRef, useState } from 'react';
import { notePreviewPopupDims } from '../../components/NotePreviewPopup.component';

export type iNotePreviewPopup = {
    isOpen: boolean
    filepath:string
    position:[number, number]
    opts?:{
        windowIdToOpenIn: string,
        searchedString?:string
    }
}

export interface iNotePreviewPopupApi {
	open: (path:string, position: [number,number], opts?:{windowIdToOpenIn: string,  searchedString?:string}) => void
	close: () => void
}

const h = `[NOTE PREVIEW POPUP API]`
export const useNotePreviewPopupApi = () => {

	const [notePreviewPopup, setNotePreviewPopup] = useState<iNotePreviewPopup|null>(null)

    const openPopup = (path, position, opts) => {
        // if too far left/right
        let nX = position[0]
        let nY = position[1]
        if (notePreviewPopupDims.w+nX > window.innerWidth) nX = nX - (Math.abs(window.innerWidth-notePreviewPopupDims.w-nX-10))
        position = [nX, nY]

        setNotePreviewPopup({
            isOpen: true,
            filepath: path,
            position,
            opts
        })
    }
    const closePopup = () => {
        setNotePreviewPopup(null)
    }

    const notePreviewPopupApi:iNotePreviewPopupApi = {
		open: openPopup,
		close: closePopup,
	}

	return {
        notePreviewPopupApi, 
		notePreviewPopup, setNotePreviewPopup
	}


}
