import React, { useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { ContentBlock } from '../../components/ContentBlock.component';
import { getApi } from '../../hooks/api/api.hook';
import { generateEmptyiFile } from '../../hooks/app/useLightbox.hook';
import { renderReactToId } from "../reactRenderer.manager"

const heightIframe = {
	big: 400,
	small: 200
}

//
// SUPPORT 
// Generic CTAG show system
export const ssrToggleCtag = (
	elWrapper: any,
	Compo: React.ReactElement,
	openOnly?: boolean
) => {
	if (!elWrapper) return ""
	let isIframeOpen = elWrapper.querySelector(`iframe`)
	let idEl = renderReactToId(Compo, { delay: 100 });
	let iframeHtml = `<div id="${idEl}" class="resource-link-ctag"><div class="loading-string">loading...</div></div>`
	let shouldShow = !isIframeOpen || openOnly === true
	elWrapper.innerHTML = shouldShow ? iframeHtml : ""
}

// CTAG GEN
export const ssrGenCtag = (
	tagName: string,
	content: string,
	opts?: {
		file?: iFile | null,
		windowId?:string,
		sandboxed?: boolean,
		fullscreen?: boolean,
		onFullscreenClose?: Function,
	}
): React.ReactElement => {
	if (!opts) opts = {}
	if (!opts.file) opts.file = generateEmptyiFile()
	
	
	return <ContentBlock
		file={opts.file}
		block={{ type: 'tag', tagName, content, start: 0, end: 0 }}
		windowHeight={heightIframe.big + 75}
		windowId={opts.windowId || "null"}
		yCnt={0}
		onIframeMouseWheel={() => { }}

		ctagSandboxed={opts.sandboxed}
		ctagFullscreen={opts.fullscreen}
		ctagOnFullscreenClose={opts.onFullscreenClose}
	/>
}

