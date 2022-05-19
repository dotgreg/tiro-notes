import { each, isString } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { iFile, iFileImage } from '../../../../shared/types.shared';

export interface iLightboxApi {
	open: (index: number, images: iFileImage[] | string[]) => void
	close: () => void
}

export const useLightbox = () => {

	const [lightboxImages, setLightboxImages] = useState<iFileImage[]>([])
	const [lightboxIndex, setLigthboxIndex] = useState(0)

	const openLightbox: iLightboxApi['open'] = (index, images) => {
		console.log(`[LIGHTBOX] open ${images.length} images to index ${index}`, { images });
		const imgsRes: iFileImage[] = []

		// if imgs are just string, generate a empty fileImage object around it
		each(images, img => {
			if (isString(img)) {
				const nImg: iFileImage = {
					file: generateEmptyiFile(),
					title: '',
					url: img
				}
				imgsRes.push(nImg)
			} else {
				imgsRes.push(img as iFileImage)
			}
		})

		setLightboxImages(imgsRes)
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

export const generateEmptyiFile = (): iFile => {
	return {
		nature: 'file',
		name: '',
		realname: '',
		path: '',
		folder: '',
	}
}
