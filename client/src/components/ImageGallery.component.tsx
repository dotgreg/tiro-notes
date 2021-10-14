import React, { useEffect, useRef, useState }  from 'react';
import { iFileImage } from '../../../shared/types.shared';
import { useDebounce } from '../hooks/lodash.hooks';
import { getImageDimensions } from '../managers/imageDimensions.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';

export const ImageGallery = (p:{
  images: iFileImage[]
}) => {
  const colsNb = 3
  
  // BASIC SYSTEM
  // const imgsNbPerCols = Math.round(p.images.length / colsNb)
  // const cols:iFileImage[][] = []
  // let colsCounter = 0
  // for (let i = 0; i < p.images.length; i++) {
    //   if (!cols[colsCounter]) cols[colsCounter] = []
    //   cols[colsCounter].push(p.images[i]) 
    //   colsCounter++
    //   // getImageDimensions(absoluteLinkPathRoot(p.images[i].url))
    //   if (colsCounter > colsNb - 1) colsCounter = 0
    // }
    
  // TAKING IN ACCOUNT HEIGHT OF EACH IMAGE
  type imagesCol = {height: number, images: iFileImage[]}
  const [cols, setCols] = useState<imagesCol[]>([])
  // const [statusLabel, setStatusLabel] = useState<string>('')

  // create all cols
  // const debounceNoResult = useDebounce(() => {
  //   if (p.images.length === 0) {
  //     // setStatusLabel('No results')
  //   }
  // }, 1000)
  useEffect(() => {

    // setStatusLabel('Loading ...')
    // debounceNoResult()
    setCols([])

    const nCols:imagesCol[] = []
    for (let i = 0; i < colsNb; i++) {
      nCols.push({height: 0, images: []})
    }
    
    let loadCounter = 0
    for (let i = 0; i < p.images.length; i++) {
      const srcImg = absoluteLinkPathRoot(p.images[i].url)
      getImageDimensions(srcImg).then(imgDims => {
        let sid = 0
        for (let y = 0; y < nCols.length; y++) {
          if (nCols[sid].height > nCols[y].height) sid = y
        }
        nCols[sid].images.push(p.images[i])
        nCols[sid].height += imgDims.height
        
        triggerColsUpdate()
      }).catch(() => {
        console.log(`[GALLERY] could not load ${srcImg}`)
        triggerColsUpdate()
      })
    }
   
    const triggerColsUpdate = () => {
      loadCounter++
      // console.log(loadCounter, p.images.length);
      if (loadCounter === p.images.length) {
        setCols(nCols)
        // setStatusLabel('')
      }
    }
  }, [p.images])
  

    return (
        <div className={`image-gallery-component-wrapper` }>
            {/* <div className={'status-label'}>{statusLabel}</div> */}
            <div className={`masonry-gallery`}>
              {
                cols.map((col, key1) => 
                  <div className={`masonry-col`} key={key1}>
                    { col.images.map((image, key2) => 
                      <div className={`masonry-col-item`} key={key2}>
                        <img src={absoluteLinkPathRoot(image.url)} />
                      </div>
                    )}
                  </div>
                )
              }
          </div>
        </div>
    )
}

export const imageGalleryCss = `
 .image-gallery-component-wrapper {
   overflow-y: scroll;
   height: 100vh;
   width: 100%;

   .masonry-gallery {
     display: flex;
     list-style: none;
     flex-direction: row;
     flex-wrap: wrap;

     .masonry-col {
       width: 32%;

      .masonry-col-item {
        img {
          width: 100%;
        }
      }
     }
   }
 }
`