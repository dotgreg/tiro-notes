import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { iContentChunk, noteApi } from '../managers/renderNote.manager'
import { iframeManager, iIframeData } from '../managers/iframe.manager'
import { getClientApi2 } from '../hooks/api/api.hook';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';

const h = `[IFRAME COMPONENT] 00562`

export const ContentBlock = (p: {
	windowId: string
	file: iFile
	block: iContentChunk
}) => {

	const isTag = p.block.type === 'tag'
	const [noteTagContent, setNoteTagContent] = useState<string | null>(null)
	const [htmlTextContent, setHtmlTextContent] = useState<string | null>(null)

	////////////////////////////////////////////////////
	// IFRAME CONTENT LOGIC
	useEffect(() => {
		if (!isTag) return
		if (p.block.tagName === 'script') {
			// if script, inject it inside iframe wrapping it with '[[script]]'
			setNoteTagContent(`\n[[script]]${p.block.content}[[script]]`)
			// and remove the innertag logic if present
			p.block.content = ''
		} else {
			// if custom tag, look for its content and insert that one in the iframe
			getClientApi2().then(api => {
				api.file.getContent(`/.tiro/tags/${p.block.tagName}.md`, ncontent => {
					setNoteTagContent(ncontent)
				}, {
					onError: () => {
						setNoteTagContent(null)
					}
				})
			})
		}
	}, [p.windowId, p.file, p.block.content])

	////////////////////////////////////////////////////
	// TEXT LOGIC
	useEffect(() => {
		if (isTag) return
		let ncontent = noteApi.render({
			raw: p.block.content,
			currentFolder: p.file.folder,
			windowId: p.windowId
		})
		setHtmlTextContent(ncontent)
	}, [p.windowId, p.file, p.block])

	////////////////////////////////////////////////////
	// RENDERING
	return (
		<div className="content-block">

			{
				isTag && noteTagContent &&
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
}) => {
	const { noteTagContent } = { ...p }

	const [htmlContent, setHtmlContent] = useState('')
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [iframeId, setIframeId] = useState('')
	const [iframeHeight, setIframeHeight] = useState(200)

	useEffect(() => {

		const nid = `iframe-${generateUUID()}`
		setIframeId(nid)

		// format tag content
		const formatedNoteTagContent = noteApi.render({
			raw: noteTagContent,
			windowId: p.windowId,
			currentFolder: p.file.folder
		})

		// generate html content
		const iframeHtml = iframeManager.generateIframeHtml(formatedNoteTagContent)
		//iframeHtml.innerTag
		const fullHtml = `
						<div class="simple-css-wrapper">
							${iframeHtml}
						</div>
						<style>
							${previewAreaSimpleCss()}
						</style>
				`.replaceAll('{{innerTag}}', p.block.content.trim())


		// console.log(121212, { iframeHtml, fullHtml });
		setHtmlContent(fullHtml)

		// listen to iframe 
		iframeManager.subscribe(nid, m => {
			if (m.action === 'resize') {
				const data: iIframeData['resize'] = m.data
				console.log(h, 'resizing to', data.height);
				setIframeHeight(data.height);
			}
		})

		// send an init message with all datas
		setTimeout(() => {
			const data: iIframeData['init'] = {
				file: p.file,
				innerTag: p.block.content,
				frameId: nid,
				tagContent: noteTagContent,
				tagName: p.block.tagName || ''
			}

			iframeManager.send(iframeRef.current, {
				frameId: nid,
				action: 'init',
				data
			})
		}, 100)
		return () => {
			// cleaning when updating the component
			iframeManager.unsubscribe(nid)
		}
	}, [p.windowId, p.file, p.block.content])

	return (
		<iframe
			ref={iframeRef}
			id={iframeId}
			data-testid="iframe"
			title={iframeId}
			srcDoc={htmlContent}
			className="tag-iframe"
			style={{ height: iframeHeight }}
			sandbox="allow-scripts"
		>
		</iframe>
	)

}
