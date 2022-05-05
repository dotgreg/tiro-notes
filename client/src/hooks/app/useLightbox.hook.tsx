import React, { useEffect, useRef, useState } from 'react';
import { iFileImage } from '../../../../shared/types.shared';

export interface iLightboxApi {
	open: (index: number, images: iFileImage[]) => void
	close: () => void
}

export const useLightbox = () => {

	const [lightboxImages, setLightboxImages] = useState<iFileImage[]>([])
	const [lightboxIndex, setLigthboxIndex] = useState(0)

	const openLightbox: iLightboxApi['open'] = (index, images) => {
		console.log(`[LIGHTBOX] open ${images.length} images to index ${index}`, { images });
		setLightboxImages(images)
		setLigthboxIndex(index)
	}
	const closeLightbox: iLightboxApi['close'] = () => {
		console.log(`[LIGHTBOX] close`);
		setLightboxImages([])
		setLigthboxIndex(0)
	}

	const lightboxApi: iLightboxApi = {
		open: openLightbox,
		close: closeLightbox,
	}
	return {
		lightboxApi,
		lightboxImages, lightboxIndex
	}


}
