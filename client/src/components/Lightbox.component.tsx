import React, { useEffect, useRef, useState } from 'react';
import { iFileImage } from '../../../shared/types.shared';
import { detachNote } from '../managers/detachNote.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot, getUrlTokenParam } from '../managers/textProcessor.manager';
import { ButtonsToolbar } from './ButtonsToolbar.component';

export const Lightbox = (p: {
	images: iFileImage[]
	startingIndex: number
	onClose: Function
}) => {
	const [currIndex, setCurrIndex] = useState(0)
	useEffect(() => {
		setCurrIndex(p.startingIndex)
	}, [p.startingIndex])
	const incrementIndex = (direction: 1 | -1) => {
		let nIndex = currIndex
		if (direction === -1 && currIndex === 0) nIndex = p.images.length - 1
		else if (direction === 1 && currIndex === p.images.length - 1) nIndex = 0
		else nIndex = currIndex + direction
		setCurrIndex(nIndex)
	}

	return (
		<div className={`lightbox-component`}>
			<div className={`lightbox-bg`}>
			</div>
			<div className={`lightbox-content`}>
				{
					p.images.map((image, key) =>
						<div
							key={key}
							className={`lightbox-image`}
							style={{ display: key === currIndex ? 'flex' : 'none' }}
						>
							<img src={absoluteLinkPathRoot(image.url) + getUrlTokenParam()} />

							<div className="image-infos">
								<div className="image-name" onClick={e => detachNote(image.file)}>
									{image.file.name} - {image.title}
								</div>
								<ButtonsToolbar
									popup={false}
									buttons={[
										{
											class: 'left',
											title: 'left',
											icon: 'faChevronLeft',
											action: () => { incrementIndex(-1) }
										},
										{
											class: 'close',
											title: 'close',
											icon: 'faTimes',
											action: () => { p.onClose() }
										},
										{
											class: 'right',
											title: 'right',
											icon: 'faChevronRight',
											action: () => { incrementIndex(+1) }
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
		z-index: 1002;
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
				background: rgb(0 0 0 / 82%);
    }

    .lightbox-content {
				border-radius: 9px;
				overflow: hidden;
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
								position: absolute;
								top: 0px;
								height: 55px;
								left: 0px;
								width: 100%;
								background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
								ul {
										margin-top: 5px;
										justify-content: flex-end;
										height: 95vh;
										position: relative;
										margin: 0px;
										li {
												&.left,
												&.right {
														position: absolute;
														top: 0px;
														height: 100%;
														width: 20%;
														display: flex;
														justify-content: space-evenly;
														button {
																display: none;
																width: 100%;
														}
														&:hover {
																button {
																		display: block;
																}
														}
												}
												&.left {
														left: 0px;
												}	
												&.right {
														right: 0px;
												}	
												&.close {
														padding: 10px;
														position:relative;
														z-index: 2;
														
												}
										}
								}

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
