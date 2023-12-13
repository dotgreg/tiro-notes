import React, { useEffect, useRef, useState } from 'react';
import { notePreviewPopupDims } from '../../components/NotePreviewPopup.component';

export type iNotePreviewPopup = {
    isOpen: boolean
    filepath:string
    position:[number, number]
    opts?:{
        windowIdToOpenIn: string,
        searchedString?:string
        replacementString?:string
    }
}

export interface iNotePreviewPopupApi {
	open: (
        path:string, 
        position: [number,number], 
        opts?:{
            windowIdToOpenIn: string,  
            searchedString?:string
            replacementString?:string
        }
        ) => void
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
        if (notePreviewPopupDims.h+nY > window.innerHeight) nY = nY - (Math.abs(window.innerHeight-notePreviewPopupDims.h-nY-10))
        // if 50% 50% take width/height into account
        if (nX === "50%") nX = `calc(50% - ${notePreviewPopupDims.w/2}px)`
        if (nY === "50%") nY = `calc(50% - ${notePreviewPopupDims.w/2}px)`
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
