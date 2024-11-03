import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { iContentChunk, noteApiFuncs } from '../managers/renderNote.manager'
import { generateIframeHtml, iframeParentManager, iIframeData } from '../managers/iframe.manager'
import { callApiFromString, getApi, getClientApi2 } from '../hooks/api/api.hook';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';
import { useDebounce } from '../hooks/lodash.hooks';
import { isNumber, isString, random } from 'lodash-es';
import { replaceAll } from '../managers/string.manager';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { getBackendUrl } from '../managers/sockets/socket.manager';
import { Icon, Icon2 } from './Icon.component';
import { sharedConfig } from '../../../shared/shared.config';
import { defocusMouse } from '../managers/focus.manager';
import { getCtagContent } from '../managers/ctag.manager';
import { isMobile } from '../managers/device.manager';
import { notifLog } from '../managers/devCli.manager';
import { iCreateFloatingPanel } from '../hooks/api/floatingPanel.api.hook';
import { ressCacheIdSync } from '../managers/cacheRessources.manager';


const h = `[IFRAME COMPONENT]`
const log = sharedConfig.client.log.verbose

let pinStore = {}
let pinStoreFullscreen = {}

const reservedTagNames = ["latex", "l"]
export type onIframeMouseWheelFn = (e: WheelEvent) => void

export const ContentBlockInt = (p: {
	windowId: string
	file: iFile
	block: iContentChunk
	// windowHeight?: number | string
	reactOnHeightResize?: boolean
	index?: number
	yCnt: number
	onIframeMouseWheel: onIframeMouseWheelFn
	
	ctagHeightOffset?: number 
	ctagSandboxed?: boolean
	ctagFullscreen?: boolean
	ctagOnFullscreenClose?: Function
}) => {
	const isTag = p.block.type === 'tag' && !reservedTagNames.includes(p.block.tagName || "")
	const [noteTagContent, setNoteTagContent] = useState<string | null>(null)
	const [htmlTextContent, setHtmlTextContent] = useState<string | null>(null)
	const [ctagStatus, setCtagStatus] = useState("null")

	////////////////////////////////////////////////////
	// IFRAME CONTENT LOGIC
	useEffect(() => {
		if (!isTag) return
		setCtagStatus("loading")
		if (p.block.tagName === 'script') {
			// if script, inject it inside iframe wrapping it with '[[script]]'
			setNoteTagContent(`\n[[script]]${p.block.content}[[script]]`)
			setTimeout(() => {
				setCtagStatus("loaded")
			}, 100)
			// and remove the innertag logic if present
			p.block.content = ''
		} else if (p.block.tagName) {
			// if custom tag, look for its content and insert that one in the iframe
			getCtagContent(p.block.tagName, ctagContent => {
				if (ctagContent) {
					setNoteTagContent(ctagContent)
					setTimeout(() => {
						setCtagStatus("loaded")
					}, 100)
				} else {
					setNoteTagContent(null)
				}
			})
		}
	}, [p.windowId, p.block.content])

	////////////////////////////////////////////////////
	// TEXT LOGIC
	const isLatex = p.block.tagName === "l" || p.block.tagName === "latex"

	useEffect(() => {
		if (isTag) return
		// NORMAL RENDERING
		let ncontent = noteApiFuncs.render({
			raw: p.block.content,
			file: p.file,
			windowId: p.windowId
		})

		// INCLUDED RENDERINGS (LIKE LATEX) => done globally with css path instead
		// if (isLatex) ncontent = renderLatex(p.block.content)
		if (isLatex) ncontent = `[[l]]${p.block.content}[[l]]`

		setHtmlTextContent(ncontent)
	}, [p.windowId, p.file, p.block])

	// const isTextInline = isLatex ? true : false
	// const isTextInline = true

	////////////////////////////////////////////////////
	// RENDERING
	return (
		<span
			className={`content-block ${isTag ? "block-tag" : "block-text"} `}>
			{
				ctagStatus === "loaded" && isTag && noteTagContent &&
				<ContentBlockTagView
					{...p}
					noteTagContent={noteTagContent}
				/>
			}
			{
				!isTag && htmlTextContent &&
				<span
					className="content-block-text"
					dangerouslySetInnerHTML={{
						__html: htmlTextContent
					}}
				>
				</span>
			}

		</span >
	)
}

export const ContentBlock = React.memo(ContentBlockInt, (np, pp) => {
	let res = true
	if (JSON.stringify(np.block) !== JSON.stringify(pp.block)) res = false
	if (np.block.content !== pp.block.content) res = false
	if (np.file.path !== pp.file.path) res = false
	if (np.windowId !== pp.windowId) res = false
	// if (np.windowHeight !== pp.windowHeight && np.reactOnHeightResize === true) res = false
	return res
})



export const ContentBlockTagView = (p: {
	noteTagContent: string
	windowId: string
	file: iFile
	block: iContentChunk
	// windowHeight?: number | string
	reactOnHeightResize?: boolean
	index?: number
	yCnt: number
	onIframeMouseWheel: onIframeMouseWheelFn
	ctagSandboxed?: boolean
	ctagFullscreen?: boolean
	ctagOnFullscreenClose?: Function
	ctagHeightOffset?: number 
}) => {
	const { noteTagContent } = { ...p }

	const [htmlContent, setHtmlContent] = useState('')
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [iframeId, setIframeId] = useState('')
	const [canShow, setCanShow] = useState(false)
	const [iframeHeight, setIframeHeight] = useState<string | number>(0)
	const [iframeError, setIframeError] = useState<string | null>(null)

	// IFRAME SCROLLING
	const [canScrollIframe, setCanScrollIframe] = useState(false)
	const updateScroll = () => {
		const scrollHandler = (event: any) => {
			if (!canScrollIframe) return;
			p.onIframeMouseWheel(event as WheelEvent)
		}
		iframeRef.current?.contentDocument?.addEventListener("mousewheel", scrollHandler);
		return () => iframeRef.current?.contentDocument?.removeEventListener("mousewheel", scrollHandler);
	}
	useEffect(updateScroll, [p.yCnt, canScrollIframe])


	const debounceStartIframeLogic = useDebounce((nid: string) => {
		updateScroll();
		setIframeId(nid)
		setIframeError(null)

		// listen to iframe calls
		iframeParentManager.subscribe(nid, m => {

			// RESIZE AND CTAG HEIGHT MANAGEMENT
			if (m.action === 'resize') {
				const data: iIframeData['resize'] = m.data
				let nHeight = 0

				const parentWindow = document.querySelector(`.window-id-sizeref-${p.windowId}`)
				if (!parentWindow) return
				const pDims = parentWindow.getBoundingClientRect()

				if (isString(data.height) && data.height.endsWith("%")) {
					const nHeightPercent = parseInt(data.height.replace("%", "")) / 100
					// get height and width from window-id-sizeref-p.windowId
					nHeight = (pDims.height * nHeightPercent) 
				} else if (isNumber(data.height)) {
					nHeight = data.height
				} else {
					const pDims = parentWindow.getBoundingClientRect()
					nHeight = 300
				}

				if (p.ctagHeightOffset) nHeight = nHeight + p.ctagHeightOffset

				// console.log("resize", nHeight, pDims.height, data.height)
				setIframeHeight(`${nHeight}px`);
				// only at that moment show iframe
				setCanShow(true)
			}

			// CAN SCROLL IFRAME
			if (m.action === 'canScrollIframe') {
				const data: iIframeData['canScrollIframe'] = m.data
				setCanScrollIframe(data.status)
			}

			// API
			if (m.action === 'apiCall') {
				const data = m.data as iIframeData['apiCall']

				callApiFromString(data, (status, data) => {
					// if no, directly return the error 
					if (status === 'nok') return setIframeError(data.error)

					// if yes send back result to iframe
					const res: iIframeData['apiAnswer'] = { reqId: m.data.reqId, data }
					iframeParentManager.send(iframeRef.current, { action: 'apiAnswer', data: res })
				})




			}

			// SCRIPT ERROR
			if (m.action === 'iframeError') {
				// const err = escapeHtml(m.data.error)
				const err = m.data.error
				setIframeError(err)
				notifLog(`${err}`)
			}


		})

		// send an init message with all datas
		setTimeout(() => {
			const data: iIframeData['init'] = {
				file: p.file,
				innerTag: p.block.content,
				windowId: p.windowId,
				frameId: nid,
				reloadCounter: reload,
				tagContent: noteTagContent,
				tagName: p.block.tagName || '',
				loginToken: getLoginToken(),
				backendUrl: getBackendUrl(),
				ressCacheId: ressCacheIdSync.curr
			}

			iframeParentManager.send(iframeRef.current, { action: 'init', data })

			// setTimeout(() => {
			// }, 3000)
		}, 100)

	}, 500)


	const updateIframeHtml = () => {
		// format tag content
		const formatedNoteTagContent = noteApiFuncs.render({
			raw: noteTagContent,
			windowId: p.windowId,
			file: p.file
		})


		// generate html content
		const iframeHtml = generateIframeHtml(formatedNoteTagContent)
		//iframeHtml.innerTag
		let fullHtml = `
			<html>
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body>
					<div class="simple-css-wrapper">
					${iframeHtml}
					</div>
					<style>
					${previewAreaSimpleCss()}
					</style>
				</body>
			</html>
				`
		fullHtml = replaceAll(fullHtml, [['{{innerTag}}', p.block.content.trim()]])

		setHtmlContent(fullHtml)
	}

	const [reload, setReload] = useState(0)
	const [reloadIframe, setReloadIframe] = useState(false)

	const incrementReload = () => {
		setReload(reload + 1);
		setReloadIframe(true)
		setTimeout(() => { setReloadIframe(false) }, 100)
	}

	useEffect(() => {
		// console.log("===== CHANGING CONTENT CTAG", p);
		setCanShow(false)
		updateIframeHtml()

		const nid = `iframe-${generateUUID()}`
		debounceStartIframeLogic(nid)
		return () => {
			// cleaning when updating the component
			iframeParentManager.unsubscribe(nid)
		}
	}, [p.windowId, p.block.content, p.block.tagName, p.noteTagContent, reload])

	// const askFullscreen = () => {
	// 	iframeParentManager.send(iframeRef.current, {
	// 		action: 'askFullscreen', data: {}
	// 	})
	// }
	// const askDetach = () => {
	// 	if (!p.block.tagName) return
	// 	let tagName = p.block.tagName || ''	
	// 	const floatConfig:iCreateFloatingPanel = {type:"ctag", file: p.file, ctagConfig:{tagName: tagName, content:p.block.content, } }
	// 	console.log("ASK DETACH", floatConfig)
	// 	getApi(api => { api.ui.floatingPanel.create(floatConfig) })
	// }
	



	//
	// pinning
	//
	let key = p.index || 0
	let pinId = `${p.windowId}-${key}-${p.block.tagName}`
	useEffect(() => {
		if (pinStore[pinId]) { setPinned(true) } else { pinStore = {} }
		if (pinStoreFullscreen[pinId]) { setPinnedFullscreen(true) } else { pinStore = {} }
	}, [])
	const [isPinned, setPinned] = useState(false)
	const [isPinnedFullscreen, setPinnedFullscreen] = useState(false)
	const askPin = (status?: boolean) => {
		if (!status) status = !isPinned
		pinStore[pinId] = status
		setPinned(status)
		setPinnedFullscreen(false)
	}
	const askPinFullscreen = (status?: boolean) => {
		if (!status) status = !isPinnedFullscreen
		pinStoreFullscreen[pinId] = status
		setPinnedFullscreen(status)
		setPinned(false)
	}
	useEffect(() => {
		if (p.ctagFullscreen) askPinFullscreen(true)
	}, [p.ctagFullscreen])

	const fullscreenClose = () => {
		askPinFullscreen(false)
		p.ctagOnFullscreenClose && p.ctagOnFullscreenClose()
	}

	let refocusId = generateUUID()

	// on iframe-view-wrapper resize, resize iframe
	// const iframeWrapperRef = useRef<HTMLDivElement>(null)
	// useEffect(() => {
	// 	const resizeHandler = () => {
	// 		console.log("RESIZE")
	// 		if (!iframeRef.current) return
	// 		iframeParentManager.send(iframeRef.current, {
	// 			action: 'resize'
	// 			data: {
	// 				height: '100%'
	// 			}
	// 		})
	// 	}
	// 	console.log(123, iframeWrapperRef.current)
	// 	setTimeout(() => {
	// 		console.log(123, iframeWrapperRef.current)
	// 		iframeWrapperRef.current?.addEventListener('resize', resizeHandler)
	// 	}, 1000)
	// 	iframeWrapperRef.current?.addEventListener('resize', resizeHandler)
	// 	return () => {
	// 		iframeWrapperRef.current?.removeEventListener('resize', resizeHandler)
	// 	}
	// },[])

	return (
		<>
			{
				isPinnedFullscreen && <div
					className="fullscreen-pin-bg"
					onClick={e => { fullscreenClose() }}
				></div>
			}
			<div 
			// ref={iframeWrapperRef}
			
			className={`iframe-view-wrapper ${canShow ? 'can-show' : 'hide'} iframe-tag-${p.block.tagName} ${isPinned ? 'pinned' : 'not-pinned'} ${isPinnedFullscreen ? 'pinned fullscreen' : 'not-fullscreen'}  ${isMobile() ? 'mobile' : ''}`} >

				{/* <div className="ctag-menu" >
					<div className="ctag-ellipsis" >
						<Icon name="faEllipsisH" color={`#b2b2b2`} />
					</div>
					<div className="ctag-menu-button ctag-reload" onClick={incrementReload}>
						<Icon name="faRetweet" color={`#b2b2b2`} />
					</div>
					<div className="ctag-menu-button ctag-fullscreen" onClick={askFullscreen}>
						<Icon name="faExpand" color={`#b2b2b2`} />
					</div>
					<div className="ctag-menu-button ctag-detach" onClick={askDetach}>
						<Icon2 name="window-restore" color={`#b2b2b2`} />
					</div> */}
					{/* <div className="ctag-menu-button ctag-pin" onClick={e => { askPin() }}>
						<Icon name="faThumbtack" color={`#b2b2b2`} />
					</div>
					<div className="ctag-menu-button ctag-pin" onClick={e => { askPinFullscreen() }}>
						<Icon name="faExpandArrowsAlt" color={`#b2b2b2`} />
					</div> */}
				{/* </div> */}

				{!reloadIframe &&
					<iframe
						onMouseLeave={e => {defocusMouse(e, refocusId)}}
						ref={iframeRef}
						id={iframeId}
						data-testid="iframe"
						title={iframeId}
						srcDoc={htmlContent}
						// add header media query

						className="tag-iframe"
						style={{ height: iframeHeight }}
						sandbox={p.ctagSandboxed ? "allow-scripts allow-same-origin allow-popups" : undefined} // allow-same-origin required for ext js caching

					>
					</iframe>
				}
				{iframeError &&
					<div className="iframe-error">
						<code><pre>
							{iframeError}
						</pre></code>
					</div>
				}
				<input className="refocus-input" id={refocusId} type="text" />
			</div>
		</>
	)

}


export const contentBlockCss = () => `
.refocus-input {
	position: fixed;
	z-index: -10000;
	width: 0px;
	height: 0px;
	opacity: 0.00001;
	top: -10000px;
	left: -10000px;
}
.content-blocks-wrapper {
		// padding: 0px 15px;
}
.simple-css-wrapper {
}

.content-blocks-wrapper,
.simple-css-wrapper,
.simple-css-wrapper > div,
.content-block,
.iframe-view-wrapper
{
}

.fullscreen-pin-bg {
		position: fixed;
		top:0px;
		right: 0px;
		width: 100vw;
		height: 100vh;
		background: rgba(0,0,0,0.5);
		z-index:101;
}
.iframe-view-wrapper {
	height: 100%;
		&.pinned {
				position: fixed;
				transform: rotate(360deg);
				top: 10px;
				right: 10px;
				z-index: 1000;
				overflow:hidden;
				border: 2px;
				background: white;
				border-radius: 12px;
				box-shadow: 0px 0px 5px #0006;
				iframe {
						max-height: 90vh;
						overflow-y: scroll;
				}
		}
		&.pinned.fullscreen.mobile {
			height: calc(100vh - 80px);
			right: 10px;
			width: calc(100vw - 20px);
		}
		&.pinned.fullscreen {
				top: 20px;
				right: 20px;
				z-index:102;
				width: calc(100vw - 40px);
				height: calc(100vh - 40px);
				iframe {
						height: calc(100% - 1px)!important;
						max-height: calc(100% - 1px)!important;
				}
		}
		position: relative;
		.ctag-menu {
				position: absolute;
				top: 3px;
				z-index: 10;
				left: 15px;
				cursor: pointer;
				opacity: 0;
				transition: 0.2s all; 
				display: flex;
				padding: 3px;
				padding-left: 8px;

				margin-left: 8px;
				margin-right: 8px;

				.ctag-ellipsis {
						margin-right: 15px;
				}
		}
		.ctag-menu .ctag-menu-button {
				display: none;
		}
		&:hover {
				.ctag-menu {
						opacity:0.5;
				}
				.ctag-menu:hover {
						opacity:1;
						background: white;
						box-shadow: 0px 0px 3px rgba(0,0,0,.1);
						border-radius: 5px;
						.ctag-menu-button {
								margin-right: 15px;
								display: block;
						}
				}
		}

		&.hide iframe {
				opacity: 0;
		}
		iframe::backdrop {
				background-color: rgba(255,255,255,1);
		}

		iframe {
				width: calc(100% );
				border: none;
				border-radius: 5px;
		}
		.iframe-error {
				background: #ffddba;
				font-size: 8px;
				padding: 14px;
				border: 2px #ffc080 solid;
				border-radius: 5px;
				line-height: 14px;
		}
}

.content-block.block-text {
		padding-bottom: 0px;
}

/* .content-block-text > * { */
/* 		padding: 0px 15px; */
/* } */

.content-block.block-tag {
		padding: 0px 0px 0px 0px;
    position: relative;
    left: -15px;
    top: 0;
    width: calc(100% + 20px);
    height: calc(100% );
    display: block;
}

`
