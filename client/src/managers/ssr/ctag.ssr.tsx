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
export const ssrToggleIframeCtag = (
	elWrapper: any,
	url: string,
	fullscreen?: boolean,
	shouldShow?: boolean,
) => {
	ssrToggleCtag(elWrapper, ssrGenCtag("iframe", url, null, false, fullscreen), shouldShow)
}

// EPUB
const heightIframe = {
	big: 400,
	small: 200
}
export const ssrToggleEpubCtag = (
	elWrapper: any,
	previewLink: string,
	file: iFile,
	fullscreen: boolean,
	shouldShow?: boolean,
) => {
	getApi(api => {
		api.file.getContent("/.tiro/tags/epub.md", content => {
			ssrToggleCtag(elWrapper, ssrGenCtag("epub", previewLink, file, false, fullscreen), shouldShow)
		}, {
			onError: err => { ssrOpenIframeEl2(elWrapper, previewLink) }
		})
	})
}


// PDF
export const ssrTogglePdfCtag = (
	elWrapper: any,
	previewLink: string,
	file: iFile,
	fullscreen: boolean,
	shouldShow?: boolean,
) => {
	getApi(api => {
		api.file.getContent("/.tiro/tags/pdf.md", content => {
			ssrToggleCtag(elWrapper, ssrGenCtag("pdf", previewLink, file, false, fullscreen), shouldShow)
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
	openStatus?: boolean
) => {
	if (!elWrapper) return ""
	let isIframeOpen = elWrapper.querySelector(`iframe`)
	let idEl = renderReactToId(Compo, { delay: 100 });
	let iframeHtml = `<div id="${idEl}" class="resource-link-ctag"><div class="loading-string">loading...</div></div>`
	let shouldShow = !isIframeOpen || openStatus === true
	elWrapper.innerHTML = shouldShow ? iframeHtml : ""
}

// CTAG GEN
export const ssrGenCtag = (
	tagName: string,
	content: string,
	file?: iFile | null,
	sandboxed?: boolean,
	fullscreen?: boolean
): React.ReactElement => {
	if (!file) file = generateEmptyiFile()
	return <ContentBlock
		file={file}
		block={{ type: 'tag', tagName, content, start: 0, end: 0 }}
		windowHeight={heightIframe.big + 75}
		windowId="null"
		yCnt={0}
		onIframeMouseWheel={() => { }}
		ctagSandboxed={sandboxed}
		ctagFullscreen={fullscreen}
	/>
}

