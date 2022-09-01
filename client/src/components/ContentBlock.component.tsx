import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { iContentChunk, noteApiFuncs } from '../managers/renderNote.manager'
																			 import { generateIframeHtml, iframeParentManager, iIframeData } from '../managers/iframe.manager'
																																																			 import { callApiFromString, getClientApi2 } from '../hooks/api/api.hook';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';
import { useDebounce } from '../hooks/lodash.hooks';
import { isString } from 'lodash';
import { replaceAll } from '../managers/string.manager';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { getBackendUrl } from '../managers/sockets/socket.manager';
import { renderLatex } from '../managers/latex.manager';
import { Icon } from './Icon.component';

const h = `[IFRAME COMPONENT] 00562`
const reservedTagNames = ["latex", "l"]
export type onIframeMouseWheelFn = (e: WheelEvent) => void

export const ContentBlock = (p: {
				windowId: string
									file: iFile
												block: iContentChunk
															 windowHeight?: number

																							yCnt: number
																										onIframeMouseWheel: onIframeMouseWheelFn
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
		} else {
				// if custom tag, look for its content and insert that one in the iframe
															 // console.log("======== ", p.block.tagName, p.block);
				getClientApi2().then(api => {
				api.file.getContent(`/.tiro/tags/${p.block.tagName}.md`, ncontent => {
				setNoteTagContent(ncontent)
				setTimeout(() => {
		setCtagStatus("loaded")
}, 100)
				// console.log("======== 333", p.block.tagName, p.block);
		}, {
				onError: () => {
						setNoteTagContent(null)
				}
		})
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

		// INCLUDED RENDERINGS (LIKE LATEX)
		if (isLatex) ncontent = renderLatex(p.block.content)

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



export const ContentBlockTagView = (p: {
				noteTagContent: string
												windowId: string
																	file: iFile
																				block: iContentChunk
																							 windowHeight?: number
																															yCnt: number
																																		onIframeMouseWheel: onIframeMouseWheelFn
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

				// RESIZE
				if (m.action === 'resize') {
						const data: iIframeData['resize'] = m.data
																	 let nheight = data.height
																	 if (isString(nheight) && nheight.endsWith("%")) {
								const percent = parseInt(nheight.replace("%", "")) / 100
								nheight = (p.windowHeight || 200) * percent
						}
						console.log(h, 'resizing to', nheight);
						setIframeHeight(nheight);
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

						// console.log(333566, data, m);
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
																																													 backendUrl: getBackendUrl()
		}

		iframeParentManager.send(iframeRef.current, { action: 'init', data })
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
				<div class="simple-css-wrapper">
				${iframeHtml}
				</div>
				<style>
				${previewAreaSimpleCss()}
				</style>
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
		// console.log("==============================================");
		return () => {
				// cleaning when updating the component
				iframeParentManager.unsubscribe(nid)
		}
}, [p.windowId, p.block.content, p.block.tagName, p.noteTagContent, reload])


		return (
				<div className={`iframe-view-wrapper ${canShow ? 'can-show' : 'hide'} iframe-tag-${p.block.tagName}`}>
				<div className="ctag-reload" onClick={incrementReload}>
				<Icon name="faRetweet" color={`#b2b2b2`} />
																								 </div>

				{!reloadIframe &&
				 <iframe
				 ref={iframeRef}
				 id={iframeId}
				 data-testid="iframe"
				 title={iframeId}
				 srcDoc={htmlContent}
				 className="tag-iframe"
				 style={{ height: iframeHeight }}
				 // style={{ height: iframeHeight }}
				 sandbox="allow-scripts allow-same-origin allow-popups" // allow-same-origin required for ext js caching
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
				</div>
		)

}


export const contentBlockCss = () => `

.content-blocks-wrapper {
		padding: 0px 15px;
}
.simple-css-wrapper {
		/* overflow: hidden; */
}

.content-blocks-wrapper,
.simple-css-wrapper,
.simple-css-wrapper > div,
.content-block,
.iframe-view-wrapper
{
}

.iframe-view-wrapper {
		position: relative;
		.ctag-reload {
				position: absolute;
				top: 4px;
				left: 10px;
				cursor: pointer;
				opacity: 0;
				transition: 0.2s all; 
		}
		&:hover {
				.ctag-reload {
						opacity:0.5;
				}
		}

		&.hide iframe {
				opacity: 0;
		}
		iframe {
				transition: 0.3s all;
				width: calc(100% );
				// border: 2px #eaeaea solid;
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
