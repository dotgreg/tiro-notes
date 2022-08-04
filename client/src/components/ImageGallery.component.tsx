import React, { useEffect, useRef, useState } from 'react';
import { iFileImage } from '../../../shared/types.shared';
import { getLoginToken, getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { detachNote } from '../managers/detachNote.manager';
import { deviceType } from '../managers/device.manager';
import { getImageDimensions } from '../managers/imageDimensions.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar } from './ButtonsToolbar.component';
import { Icon } from './Icon.component';

export const ImageGallery = (p: {
	images: iFileImage[]
	forceRender: boolean
	onImageClicked: (index: number, images: iFileImage[]) => void
}) => {


	type imagesCol = { height: number, images: iFileImage[] }
	const [cols, setCols] = useState<imagesCol[]>([])
	const basicColsType = true


	const getNbCols = () => deviceType() === 'desktop' ? 3 : 1
	const [nbCols, setNbCols] = useState(getNbCols())
	useEffect(() => {
		setNbCols(getNbCols())
	}, [p.forceRender])

	// create all cols
	useEffect(() => {
		setCols([])

		if (basicColsType) {
			/**
			 *  BASIC BUT FASTER
			 */
			const nCols: imagesCol[] = []
			let colsCounter = 0
			for (let i = 0; i < p.images.length; i++) {
				if (!nCols[colsCounter]) nCols[colsCounter] = { height: 0, images: [] }
				const nImage: iFileImage = p.images[i]
				nImage.index = i
				nCols[colsCounter].images.push(nImage)
				colsCounter++
				if (colsCounter > nbCols - 1) colsCounter = 0
			}
			setCols(nCols)
		}


		else {
			/**
			 *  INTELLIGENT (HEIGHT BASED) YET SLOWER
			 *  - TAKING IN ACCOUNT HEIGHT OF EACH IMAGE (should actually more be the ratio w/h than height)
			 */
			const nCols: imagesCol[] = []
			for (let i = 0; i < nbCols; i++) {
				nCols.push({ height: 0, images: [] })
			}

			const triggerColsUpdate = () => {
				loadCounter++
				if (loadCounter === p.images.length) {
					setCols(nCols)
				}
			}

			let loadCounter = 0
			const allSrcs: string[] = []
			for (let i = 0; i < p.images.length; i++) {
				const srcImg = absoluteLinkPathRoot(p.images[i].url) + getUrlTokenParam()

				// all images should be unique
				if (!allSrcs.includes(srcImg)) {
					getImageDimensions(srcImg).then(imgDims => {
						let sid = 0
						for (let y = 0; y < nCols.length; y++) {
							if (nCols[sid].height > nCols[y].height) sid = y
						}
						const nImage: iFileImage = p.images[i]
						nImage.index = i
						nCols[sid].images.push(nImage)
						nCols[sid].height += imgDims.height

						triggerColsUpdate()
					}).catch(() => {
						console.log(`[GALLERY] could not load ${srcImg}`)
						triggerColsUpdate()
					})
					allSrcs.push(srcImg)

				} else {
					triggerColsUpdate()

				}
			}
		}

	}, [p.images, nbCols])


	return (
		<div className={`image-gallery-component-wrapper`}>
			<div className={`masonry-gallery`}>
				{
					cols.map((col, key1) =>
						<div className={`masonry-col`} key={key1}>
							{col.images.map((image, key2) =>
								<div className={`masonry-col-item`} key={key2}>
									<img src={absoluteLinkPathRoot(image.url) + getUrlTokenParam()} />
									<div className="image-infos">
										<ButtonsToolbar
											buttons={[{
												title: 'open note',
												icon: 'faExternalLinkAlt',
												action: () => { detachNote(image.file) }
											},
											{
												title: 'open lightbox',
												icon: 'faExpand',
												action: () => { p.onImageClicked(image.index || 0, p.images) }
											}
											]}
											size={1}
										/>
									</div>
								</div>
							)}
						</div>
					)
				}
			</div>
		</div>
	)
}

export const imageGalleryCss = () => `
 .image-gallery-component-wrapper {
   margin: 0px 17px;
   overflow-y: scroll;
  //  height: calc(100vh - ${cssVars.sizes.search.padding + cssVars.sizes.gallery.topH + (deviceType() === 'desktop' ? 0 : 190)}px);
   height: calc(100vh - ${cssVars.sizes.search.padding + cssVars.sizes.gallery.topH}px);
  //  height: 100%;
   width: 100%;

   .masonry-gallery {
     display: flex;
     list-style: none;
     flex-direction: row;
     flex-wrap: wrap;

     .masonry-col {
       width: ${deviceType() === 'desktop' ? 32 : 90}%;
       margin-right: 1%;

      .masonry-col-item {
        position: relative;
        &:hover {
          .image-infos {
            display: block;
          }
        }
        .image-infos {
          display: none;
         ${cssVars.els().imageInfos}
        }
        img {
          ${cssVars.els().images}
        }
        margin-bottom: 10px;
      }
     }
   }
 }
`
