import React, { useEffect, useRef, useState } from 'react';
import { iFileImage } from '../../../shared/types.shared';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { detachNote } from '../managers/detachNote.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar, iToolbarButton } from './ButtonsToolbar.component';
import { useThrottle } from '../hooks/lodash.hooks';
import { getKeyModif, keysModifiers } from '../managers/keys.manager';
import { deviceType } from '../managers/device.manager';
import { addKeyShortcut, releaseKeyShortcut, releaseKeyShortcuts } from '../managers/keyboard.manager';
import { getFontSize } from '../managers/font.manager';

type iZoomDir = -1 | 1

export const Lightbox = (p: {
	images: iFileImage[]
	startingIndex: number
	onClose: Function
}) => {
	const [currIndex, setCurrIndexInt] = useState(0)
	const currIndexRef = useRef<number>(0)
	useEffect(() => {
		
		setCurrIndex(p.startingIndex)
	}, [p.startingIndex])

	const setCurrIndex = (index: number) => {
		console.log(11111111)
		resetZoom()
		setCurrIndexInt(index)
		currIndexRef.current = index
	}
	const resetZoom = () => {
		setZoomState(false)
		setZoomLevel(10)
	}
	const incrementIndex = (direction: iZoomDir) => {
		setZoomState(false)
		setZoomLevel(10)
		// let nIndex = currIndexRef.current
		if (direction === -1 && currIndexRef.current === 0) currIndexRef.current = p.images.length - 1
		else if (direction === 1 && currIndexRef.current === p.images.length - 1) currIndexRef.current = 0
		else currIndexRef.current = currIndexRef.current + direction
		setCurrIndex(currIndexRef.current)
	}

	//
	// zooming mechanism
	//
	const [zoomLevel, setZoomLevel] = useState(10)
	const [zoomState, setZoomState] = useState(false)
	const zoom = (dir: -1 | 1) => {
		let nLevel = dir + zoomLevel
		if (nLevel < 0) nLevel = 0
		if (nLevel > 20) nLevel = 20
		setZoomLevel(nLevel)
	}
	// const imgsRef = useRef<any[]>([])
	// const getZoomDims = (id) => {
	// 	const updateDims = () => {
	// 		const cImgRef = document.getElementById(id) as HTMLImageElement
	// 		const wrapperRef = document.getElementById(`lightbox-image-id`) as HTMLElement

	// 		let percent = ((zoomLevel - 10) * 50) + 99
	// 		if (zoomLevel < 10) percent = (-(10 - zoomLevel) * 10) + 99
	// 		// let val = `${percent}%`
	// 		// let res: any = { height: val }
	// 		if (cImgRef && wrapperRef) {
	// 			cImgRef.style.transform = `scale(${percent/100})`
	// 			cImgRef.style.transformOrigin = (percent/100) < 1 ? `center` : "left top"
	// 			let iw = cImgRef.naturalWidth
	// 			let ih = cImgRef.naturalHeight
	// 			let ir = iw/ih
	// 			let ww = wrapperRef.offsetWidth
	// 			let wh = wrapperRef.offsetHeight
	// 			let wr = ww/wh

	// 			// if ratio image < ratio wrapper = image height LONGER = should fit to wrapper height => MOST OF THE CASE?
	// 			if (ir < wr) cImgRef.style.height = `${wh-10}px`
	// 			if (ir > wr) cImgRef.style.width = `${ww-10}px`
	// 		}
	// 	}
	// 	setTimeout(() => {updateDims()}, 50)
	// 	return {}
	// }
	const zoomContainerRef = useRef<any>(null)
	const getLineHeight = () => {
		let res = `0px`
		if (zoomContainerRef.current) {
			let h = zoomContainerRef.current.clientHeight
			res = `${h-5}px`
		}
		return res
	}
	let lineHeight = getLineHeight()

	const onWheelThrottle = useThrottle((e) => {
		// if ctrl pressed, zoom
		// console.log(getKeyModif("ctrl"), keysModifiers)
		// if (keysModifiers.Meta || keysModifiers.ctrl) {
			let dir:iZoomDir = e.deltaY > 0 ? 1 : -1
			zoom(dir)
		// }
	}, 150)

	const histTouchYPos = useRef<number>(0)
	const onTouchMoveThrottle = useThrottle((e) => {
		// if scroll up two fingers, zoom
		if (e.touches.length === 2) {
			let dir:iZoomDir = e.touches[0].clientY > histTouchYPos.current ? 1 : -1
			histTouchYPos.current = e.touches[0].clientY
			zoom(dir)
		}
	}, 150)

	const startZoom = (el) => {
		// get el.src and put it in the background of el.parent
		let src = el.target.src
		let parent = el.target.parentElement
		parent.style.backgroundImage = `url(${src})`
		setZoomState(true)
	}

	const zoom2 = (e) => {
		let offsetX
		let offsetY
		let x
		let y
		var zoomer = e.currentTarget;
		// console.log(e.offsetX, e)
		// e.offsetX ? offsetX = e.offsetX : offsetX = e.touches[0].pageX
		// e.offsetY ? offsetY = e.offsetY : offsetX = e.touches[0].pageX
		offsetX = e.clientX
		offsetY = e.clientY
		x = offsetX/zoomer.offsetWidth*100
		y = offsetY/zoomer.offsetHeight*100

		// if (x < 10) {x = 0}
		// if (x > 90) {x = 100}
		// si x > 50 
		// x = x > 50 ? x - (50/x) : x + (50/x)
		// y = y > 50 ? y - (50/x) : y + (50/x)

		// x = x > 50 ? x + (50/x) : x - (50/x)
		// console.log(111, x, y)
		// console.log(112, 10*(x/50), 10*(y/50))
		// x = x > 50 ? x + 10*(x/50) : x - 10*(x/50)
		// y = y > 50 ? y + 10*(y/50) : y - 10*(y/50)
		// console.log(222, x, y)

		// the more you reach the border, the more you zoom
		// x = x > 50 ? x + (50/x) : x - (50/x)
		// y = y > 50 ? y + (50/y) : y - (50/y)
		const f1 = (x) => {
			const factor = deviceType() === 'mobile' ? 1 : 3
			return (x - 50) / factor
		}

		x = x > 50 ? x + f1(x) : x + f1(x)
		y = y > 50 ? y + f1(y) : y + f1(y)

		// zoom offsets with the following behavior:
		// if x is 10 20 30 40 50 60 70 80 90
		// then x1 is -
		
		// if (x < 10) {x = 0}

		let res = x + '% ' + y + '%';
		zoomer.style.backgroundPosition = res
	}

	const genButtonsConfig = (): iToolbarButton[] => {
		const classDevice = deviceType() === 'mobile' ? 'mobile' : 'desktop'
		let res:iToolbarButton[] = [
			{
				class: `left ${classDevice}`,
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
				class: `right ${classDevice}`,
				title: 'right',
				icon: 'faChevronRight',
				action: () => { incrementIndex(+1) }
			},
		]

		if (zoomState) {
			res.unshift({
				class: 'zoom',
				title: 'zoom',
				icon: 'faPlus',
				action: () => { zoom(1) }
			})
			res.unshift({
				class: 'dezoom',
				title: 'dezoom',
				icon: 'faMinus',
				action: () => { zoom(-1) }
			})
		}

		res.push({
				class: 'zoomToggle',
				title: 'zoomToggle',
				icon: `magnifying-glass-${zoomState	? 'minus' : 'plus'}`,
				action: () => { setZoomState(!zoomState) }
			})
			
		return res
	}


	useEffect(() => {
		const increment = () => { incrementIndex(+1) }
		const decrement = () => { incrementIndex(-1) }
		addKeyShortcut("right", increment)
		addKeyShortcut("left", decrement)
		return () => {
			console.log("destroying lightbox")
			releaseKeyShortcut("right", increment)
			releaseKeyShortcut("left", decrement)
		}
	},[])

	const onMouseWheelZoom = (e) => {
		console.log("onMouseWheelZoom", e)

	}

	return (
		<div className={`lightbox-component`}>
			<div className={`lightbox-bg`} onClick={() => { p.onClose() }}>
			</div>
			<div
				className={`lightbox-content images-nb-${p.images.length}`}
				onWheel={onWheelThrottle}
				// onTouchMove={onTouchMoveThrottle}
				ref={zoomContainerRef}
			>
				<div className='lightbox-main-image-wrapper'>
				{
					p.images.map((image, key) =>
						<div
							key={key}
							className={`lightbox-image`}
							style={{ display: key === currIndex ? 'flex' : 'none' }}
						>

							<figure 
								className={`zoom2 ${zoomState ? 'zoomed' : 'not-zoomed'}`} 
								// style={{ backgroundImage: `url(${absoluteLinkPathRoot(image.url) + getUrlTokenParam()})`, backgroundSize: `${(zoomLevel * 100)/5}%` }}
								// id={`img-lightbox-id-${key}`}
								style={{ 
									backgroundImage: `url(${absoluteLinkPathRoot(image.url) + getUrlTokenParam()})`, 
									backgroundSize: `${(zoomLevel/10) * 100}%`, 
								}}
								onMouseMove={e => {zoom2(e)}}>
								<img 
									src={absoluteLinkPathRoot(image.url) + getUrlTokenParam()} 
									onClick={(el) => {startZoom(el)}} 
								/>
							</figure>

							{/* <div
								className="image-zoom-wrapper"
								style={{ lineHeight, backgroundImage: `url(${absoluteLinkPathRoot(image.url) + getUrlTokenParam()})` }}>
								onMouseMove={e => {zoom2(e)}}>
								<img
									// ref={ref => {imgsRef.current[key] = ref}}
									id={`img-lightbox-id-${key}`}
									style={getZoomDims(`img-lightbox-id-${key}`)}
									src={absoluteLinkPathRoot(image.url) + getUrlTokenParam()} />
							</div> */}
							<div className="counter">
								{currIndex + 1}/{p.images.length}{zoomState === true && ` - [${zoomLevel * (100/5)}%]`}
							</div>
							<div className="image-infos">
								{image.file.name && image.title && 
									<div className="image-name" onClick={e => detachNote(image.file)}>
										{image.file.name} - {image.title} 
									</div>
								}
								<ButtonsToolbar
									popup={false}
									buttons={genButtonsConfig()}
								/>
							</div>
						</div>
					)
				}
				</div>
				<div className="lightbox-images-thumbnail">
					<div className="lightbox-images-thumbnail-scroll" style={{width: `${p.images.length * (120 + 20)}px`}}>
						{p.images.map((image, key) =>
							<div
								key={key}
								className={`thumbnail` + (key === currIndex ? ' selected' : '')}
								style={{ backgroundImage: `url(${absoluteLinkPathRoot(image.url) + getUrlTokenParam()})`}}
								onClick={() => { setCurrIndex(key) }}
							>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export const lightboxCss = () => `
.lightbox-component {
	.lightbox-main-image-wrapper {
		height: 100%;
	}
	.lightbox-images-thumbnail:hover {
		bottom: -17px;
	}
	.lightbox-images-thumbnail {
		transition: all 0.3s;
		
		position: absolute;
		width: 100%;
		height: 100px;
		bottom: -117px;
		z-index: 10000;
		
		
		padding-top: 50px;
		overflow-x: scroll;
		overflow-y: hidden;
		
		.lightbox-images-thumbnail-scroll {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 70px;
			
		}
		
		.thumbnail {
			&.selected {
				border: 2px solid white;
			}
			background-size: contain;
			background-repeat: no-repeat;
			background-position: center center;
			background-color: black;
			margin: 0px 10px;
			border-radius: 8px;
			min-width: 120px;
			cursor: pointer;
			width: 100%;
			height: 100%;
		
		}
	
	}
	figure.zoom2 {
		display: flex;
		justify-content: center;
		position: relative;
		
		background-repeat: no-repeat;
		margin: 0px;
		width: 100%;
		height: 100%;
		overflow: hidden;
		
		z-index: 10;
		
	}
	.counter {
		position: absolute;
		bottom: 5px;
		left: 10px;
		color: rgba(255,255,255,0.2);
		z-index: 15;
	}
	figure.zoom2.not-zoomed {
		background-size: 0%!important;
		cursor: zoom-in;
	}
	figure.zoom2.zoomed {
		background-position: 50% 50%;

		img {
			opacity: 0;
		}
	}
	figure.zoom2 img {
		transition: opacity .5s;
		display: block;
		// width: 100%;
		// height: 100%;
		// object-fit: contain;
		max-width: 10000px;
		max-height: 100000px;
		width: auto;
		height: auto;
	}
	  

    position: fixed;
	z-index: 2000;
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
		&.images-nb-1 {
				.left, .right {
						display: none!important;
				}
		}

		border-radius: 9px;
		overflow: hidden;
        position: absolute;
        width: 95vw;
        height: 85vh;
        background: black;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%); 
		.zoomToggle {
			position: absolute;
			top: 9px;
			left: 11px;
			z-index: 13;
		}
		.zoom {
			top: 3px;
			left: 28px;
		}
		.dezoom {
			top: 3px;
			left: 45px;
		}
		.zoom, .dezoom {
				position: absolute;
				
				z-index: 100;
				height: 43px;
				margin-right: 5px;
				svg path {
						box-shadow: 0px 0px 5px #0006;
				}
		}
		svg {
			padding: 3px;
			border-radius: 22px;
			width: 13px;
			box-shadow: 0px 0px 5px #00000040;
			transition: all 0.2s ease-in-out;
			&:hover {
				background: white;
			}
		}

		
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
													top: calc(50% - 20px);
													height: 40px;
													width: 40px;
													z-index: 15;

													position: absolute;
													display: flex;
													justify-content: space-evenly;
													button {
															// display: none;
															width: 100%;
													}
													&.mobile {
														button {
															// display: block;
															svg {
																background: white;
															}
														}
													}
													&.desktop:hover {
															button {
																	// display: block;
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
														z-index:14;
														
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
                    font-size: ${getFontSize()}px;
                    position: absolute;
                    top: 5px;
                    left: 5px;
                }
            }
			.image-zoom-wrapper {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 100%;
				height: 100%;
				text-align: center;
				overflow: auto;
				position: relative;
				z-index: 2;
					img {
						vertical-align: middle;
						z-index:2;
					}
			}
        }
    }

}
`
