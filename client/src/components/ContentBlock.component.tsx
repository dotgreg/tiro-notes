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

const h = `[IFRAME COMPONENT] 00562`
export type onIframeMouseWheelFn = (e: WheelEvent) => void

export const ContentBlock = (p: {
	windowId: string
	file: iFile
	block: iContentChunk
	windowHeight?: number

	yCnt: number
	onIframeMouseWheel: onIframeMouseWheelFn
}) => {

	const isTag = p.block.type === 'tag'
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
	useEffect(() => {
		if (isTag) return
		let ncontent = noteApiFuncs.render({
			raw: p.block.content,
			file: p.file,
			windowId: p.windowId
		})
		setHtmlTextContent(ncontent)
	}, [p.windowId, p.file, p.block])

	////////////////////////////////////////////////////
	// RENDERING
	return (
		<div
			className={`content-block ${isTag ? "block-tag" : "block-text"}`}>
			{
				ctagStatus === "loaded" && isTag && noteTagContent &&
				<ContentBlockTagView
					{...p}
					noteTagContent={noteTagContent}
				/>
			}

			{
				!isTag && htmlTextContent &&
				<div
					className="content-block-text"
					dangerouslySetInnerHTML={{
						__html: htmlTextContent
					}}
				>
				</div>
			}

		</div >
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
	const updateScroll = () => {
		const scrollHandler = (event: any) => {
			p.onIframeMouseWheel(event as WheelEvent)
		}
		iframeRef.current?.contentDocument?.addEventListener("mousewheel", scrollHandler);
		return () => iframeRef.current?.contentDocument?.removeEventListener("mousewheel", scrollHandler);
	}
	useEffect(updateScroll, [p.yCnt])


	const debounceStartIframeLogic = useDebounce((nid: string) => {
		updateScroll();
		setIframeId(nid)
		setIframeError(null)

		// listen to iframe calls
		iframeParentManager.subscribe(nid, m => {

			// RESIZE
			if (m.action === 'resize') {
				const data: iIframeData['resize'] = m.data
				// const nheight = data.height === "100%" ? (p.windowHeight || 200) : data.height
				let nheight = data.height
				if (isString(nheight) && nheight.endsWith("%")) {
					const percent = parseInt(nheight.replace("%", "")) / 100
					nheight = (p.windowHeight || 200) * percent
				}
				// console.log(h, 'resizing to', nheight, data.height, p.windowHeight);
				console.log(h, 'resizing to', nheight);
				setIframeHeight(nheight);
				// only at that moment show iframe
				setCanShow(true)
			}

			// API
			if (m.action === 'apiCall') {
				const data = m.data as iIframeData['apiCall']

				callApiFromString(data, (status, data) => {
					//console.log(h, "getting aswer from api call => ", JSON.stringify({ status, data }).substring(0, 150) + "\"");
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
				frameId: nid,
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

		// console.log(121212, { iframeHtml, fullHtml });
		setHtmlContent(fullHtml)
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
	}, [p.windowId, p.block.content, p.block.tagName, p.noteTagContent])


	return (
		<div className={`iframe-view-wrapper ${canShow ? 'can-show' : 'hide'} iframe-tag-${p.block.tagName}`}>
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

.content-blocks-wrapper,
.simple-css-wrapper,
.simple-css-wrapper > div,
.content-block,
.iframe-view-wrapper
{
}

.iframe-view-wrapper {
		&.hide iframe {
				opacity: 0;
		}
		iframe {
				transition: 0.3s all;
				width: calc(100% - 6px);
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
		padding: 15px;
		padding-bottom: 0px;
}
.content-block.block-tag {
		padding: 0px 0px 0px 0px;
}

`
