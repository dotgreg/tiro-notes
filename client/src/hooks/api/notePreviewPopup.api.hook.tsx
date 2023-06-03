import React, { useEffect, useRef, useState } from 'react';

export type iNotePreviewPopup = {
    isOpen: boolean
    filepath:string
    position:[number, number]
    opts?:{windowIdToOpenIn: string}
}

export interface iNotePreviewPopupApi {
	open: (path:string, position: [number,number], opts?:{windowIdToOpenIn: string}) => void
	close: () => void
}

const h = `[NOTE PREVIEW POPUP API]`
export const useNotePreviewPopupApi = () => {

	const [notePreviewPopup, setNotePreviewPopup] = useState<iNotePreviewPopup|null>(null)

    const openPopup = (path, position, opts) => {
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
