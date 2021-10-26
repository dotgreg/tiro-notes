import React, { useEffect, useRef, useState }  from 'react';
import { iFileImage } from '../../../shared/types.shared';
import { detachNote } from '../managers/detachNote.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar } from './ButtonsToolbar.component';

export const Lightbox = (p:{
  images: iFileImage[]
  startingIndex: number
  onClose: Function
}) => {
    const [currIndex, setCurrIndex] = useState(0)
    useEffect(() => {
        setCurrIndex(p.startingIndex)
    }, [p.startingIndex])
    const incrementIndex = (direction:1|-1) => {
        let nIndex = currIndex
        if (direction === -1 && currIndex === 0) nIndex = p.images.length - 1
        else if (direction === 1 && currIndex === p.images.length - 1) nIndex = 0
        else nIndex = currIndex + direction
        setCurrIndex(nIndex)
    }

    return (
        <div className={`lightbox-component` }>
            <div className={`lightbox-bg` }>
            </div>
            <div className={`lightbox-content` }>
                {/* <div className="close">
                    <ButtonsToolbar buttons={[{ title: 'close', icon:'faTimes', action: () => {p.onClose()} }]} />
                </div> */}
                
                {
                    p.images.map((image, key) => 
                        <div 
                            key={key}
                            className={`lightbox-image`}
                            style={{display: key === currIndex ? 'flex' : 'none'}}
                        >
                            <img src={absoluteLinkPathRoot(image.url)} />

                            <div className="image-infos">
                                <div className="image-name" onClick={e => detachNote(image.file)}> 
                                    {image.file.name} - {image.title}
                                </div>
                                <ButtonsToolbar
                                    buttons={[
                                        {
                                            title: 'left', 
                                            icon:'faChevronLeft', 
                                            action: () => {incrementIndex(-1)} 
                                        },
                                        {
                                            title: 'open note',
                                            icon:'faExternalLinkAlt',
                                            action: () => {detachNote(image.file)}
                                        },
                                        {
                                            title: 'close', 
                                            icon:'faTimes', 
                                            action: () => {p.onClose()} 
                                        },
                                        {
                                            title: 'right', 
                                            icon:'faChevronRight', 
                                            action: () => {incrementIndex(+1)} 
                                        },
                                    ]}
                                />
                                </div>
                        </div>    
                    )
                }
            </div>
        </div>
    )
}

export const lightboxCss = () => `
 .lightbox-component {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100vw;
    height: 100vh;
    
    .lightbox-bg {
        top: 0px;
        left: 0px;
        width: 100vw;
        height: 100vh;
        position: absolute;
        background: rgba(0,0,0,0.2);
    }

    .lightbox-content {
        position: absolute;
        width: 95vw;
        height: 95vh;
        background: black;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%); 

        .lightbox-image {
            position: relative;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            height: 100%;

            &:hover {
                .image-infos {
                    display: block;
                }
            }
            .image-infos {
                ${cssVars.els.imageInfos}
                // position: relative;
                &:hover {
                    .image-name {
                        display: block;
                    }
                }
                .image-name {
                    display: none;
                    cursor: pointer;
                    color: grey;
                    padding: 5px;
                    font-size: 10px;
                    position: absolute;
                    top: 5px;
                    left: 5px;
                }
            }
            img {
                max-width: 95vw;
                max-height: 95vh;
            }
        }
     }
 }
`
