import React, { useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { ContentBlock } from '../../components/ContentBlock.component';
import { getApi } from '../../hooks/api/api.hook';
import { generateEmptyiFile } from '../../hooks/app/useLightbox.hook';
import { renderReactToId } from "../reactRenderer.manager"
import { ssrOpenIframeEl2 } from '../ssr.manager';




//
// TAGS in SSRs
//
// IFRAME
export const ssrShowIframeCtag = (
	elWrapper: any,
	url: string,
) => {
	ssrToggleCtag(elWrapper, ssrGenCtag("iframe", url))
}

// EPUB
const heightIframe = {
	big: 400,
	small: 200
}
export const ssrShowEpubCtag = (
	elWrapper: any,
	previewLink: string,
	file: iFile,
) => {
	getApi(api => {
		api.file.getContent("/.tiro/tags/epub.md", content => {
			ssrToggleCtag(elWrapper, ssrGenCtag("epub", previewLink, file))
		}, {
			onError: err => { ssrOpenIframeEl2(elWrapper, previewLink) }
		})
	})
}


// PDF
export const ssrShowPdfCtag = (
	elWrapper: any,
	previewLink: string,
	file: iFile,
) => {
	getApi(api => {
		api.file.getContent("/.tiro/tags/pdf.md", content => {
			ssrToggleCtag(elWrapper, ssrGenCtag("pdf", previewLink, file))
		}, {
			onError: err => { ssrOpenIframeEl2(elWrapper, previewLink) }
		})
	})
}




// <ContentBlock
// 		file={p.file}
// 		block={{ type: 'tag', tagName: 'epub', content: previewLink, start: 0, end: 0 }}
// 		windowHeight={heightIframe.big + 75}

// 		windowId="null"
// 		yCnt={0}
// 		onIframeMouseWheel={() => { }}
// 	/>

//
// SUPPORT 
//
// Generic CTAG show system
export const ssrToggleCtag = (
	elWrapper: any,
	Compo: React.ReactElement,
) => {
	if (!elWrapper) return ""
	let isIframeOpen = elWrapper.querySelector(`iframe`)
	let idEl = renderReactToId(Compo, { delay: 100 });
	let iframeHtml = `<div id="${idEl}" class="resource-link-ctag"><div class="loading-string">loading...</div></div>`
	elWrapper.innerHTML = !isIframeOpen ? iframeHtml : ""
	// setStatus(!isIframeOpen ? "open" : "closed")
}

// CTAG GEN
export const ssrGenCtag = (
	tagName: string,
	content: string,
	file?: iFile | null,
	sandboxed?: boolean
): React.ReactElement => {
	if (!file) file = generateEmptyiFile()
	return <ContentBlock
		file={file}
		block={{ type: 'tag', tagName, content, start: 0, end: 0 }}
		windowHeight={heightIframe.big + 75}
		windowId="null"
		yCnt={0}
		onIframeMouseWheel={() => { }}
		sandboxed={sandboxed}
	/>
}

