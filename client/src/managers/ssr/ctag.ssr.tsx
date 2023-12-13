import React, { memo, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { ContentBlock } from '../../components/ContentBlock.component';
import { getApi } from '../../hooks/api/api.hook';
import { generateEmptyiFile } from '../../hooks/app/useLightbox.hook';
import { renderReactToId } from "../reactRenderer.manager"
import { memoize } from 'lodash';
import { getUrlTokenParam } from '../../hooks/app/loginToken.hook';
import { deviceType } from '../device.manager';

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

export interface iCtagGenConfig {
	tagName: string,
	content: string,
	opts?: {
		windowId?:string,
		file?: iFile | null,
		wrapperHeight?: number | string,
		open?: boolean,
		sandboxed?: boolean,
		fullscreen?: boolean,
		onFullscreenClose?: Function,
	}
}
// 
export const generateCtag = (
	ctagConfig: iCtagGenConfig
): React.ReactElement => {

	// if tagName is PDF or EPUB and content includes ?token, replace it with the current token
	// if (ctagConfig.tagName === "pdf" || ctagConfig.tagName === "epub") {
	// 	// console.log(11111, ctagConfig.content)
	// 	let nurl = ctagConfig.content?.split("?token=")[0]
	// 	// console.log(111112, nurl)
	// 	nurl = nurl + getUrlTokenParam()
	// 	// console.log(111113, nurl)
	// 	ctagConfig.content = nurl
	// }

	return ssrGenCtag(ctagConfig.tagName, ctagConfig.content, ctagConfig.opts?.windowId || "null", ctagConfig.opts)
}

// CTAG GEN
export const ssrGenCtag = (
	tagName: string,
	content: string,
	windowId:string,
	opts?: {
		file?: iFile | null,
		ctagHeightOffset?: number,
		sandboxed?: boolean,
		wrapperHeight?: number | string,
		fullscreen?: boolean,
		onFullscreenClose?: Function,
	}
): React.ReactElement => {
	if (!opts) opts = {}
	if (!opts.file) opts.file = generateEmptyiFile()
	
	// const height = opts?.wrapperHeight || heightIframe.big + 75
	// let ctagHeightOffset = deviceType() === "mobile" ? -300 : -100?
	let ctagHeightOffset = opts?.ctagHeightOffset || 0
	return <ContentBlock
		file={opts.file}
		block={{ type: 'tag', tagName, content, start: 0, end: 0 }}
		windowId={windowId}
		ctagHeightOffset={ctagHeightOffset}
		yCnt={0}
		onIframeMouseWheel={() => { }}

		ctagSandboxed={opts.sandboxed}
		ctagFullscreen={opts.fullscreen}
		ctagOnFullscreenClose={opts.onFullscreenClose}
	/>
}

