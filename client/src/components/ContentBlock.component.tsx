import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { iContentChunk, noteApi } from '../managers/renderNote.manager'
import { iframeManager, iIframeData } from '../managers/iframe.manager'
import { getClientApi2 } from '../hooks/api/api.hook';
import { previewAreaSimpleCss } from './dualView/PreviewArea.component';


export const ContentBlock = (p: {
	windowId: string
	file: iFile
	block: iContentChunk
}) => {

	const isTag = p.block.type === 'tag'
	const [htmlContent, setHtmlContent] = useState('')

	////////////////////////////////////////////////////
	// IFRAME TAG LOGIC
	//

	const h = `[IFRAME COMPONENT] 00562`
	const [iframeId, setIframeId] = useState('')
	const [iframeHeight, setIframeHeight] = useState(200)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	useEffect(() => {
		if (!isTag) return
		const nid = `iframe-${generateUUID()}`

		getClientApi2().then(api => {
			// getting the content of custom tag
			api.file.getContent(`/.tiro/tags/${p.block.tagName}.md`, noteTagContent => {
				// console.log('iframe refreshed', p.block.content);
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
				`.replace('{{innerTag}}', p.block.content)


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


			}, {
				// no file found, hide iframe
				onError: () => {
				}
			})
		})
		return () => {
			// cleaning when updating the component
			iframeManager.unsubscribe(nid)
		}
	}, [p.windowId, p.file, p.block.content])

	const canShowIframe = iframeId !== ''





	////////////////////////////////////////////////////
	// TEXT RENDERING LOGIC
	//
	useEffect(() => {
		if (isTag) return
		let ncontent = noteApi.render({
			raw: p.block.content,
			currentFolder: p.file.folder,
			windowId: p.windowId
		})
		setHtmlContent(ncontent)
	}, [p.windowId, p.file, p.block])









	////////////////////////////////////////////////////
	// RENDERING
	//
	return (
		<div className="content-block">

			{
				isTag && canShowIframe &&
				<iframe
					ref={iframeRef}
					id={iframeId}
					title={iframeId}
					srcDoc={htmlContent}
					className="tag-iframe"
				style={{height: iframeHeight}}
					sandbox="allow-scripts"
				>
				</iframe>
			}

			{
				!isTag &&
				<div
					className="content-block-text"
					dangerouslySetInnerHTML={{
						__html: htmlContent
					}}
				>
				</div>
			}

		</div >
	)
}

