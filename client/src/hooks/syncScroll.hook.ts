import { useRef, useState } from 'react';
import { sharedConfig } from '../../../shared/shared.config';
import { getApi } from './api/api.hook';

interface iDim {
	viewport: number
	full: number
}
interface iScrollConfig {
	els: {
		preview: any
		editor: any
		scroller: any
	}

	dims: {
		preview: iDim
		editor: iDim
		scroller: iDim
	}

	posPercent: number
	previewOffsetY: number
}

interface iDbScroll {
	[wid: string]: iScrollConfig
}

let db: iDbScroll = {}

// @ts-ignore
window.dbscroll = db





const log = sharedConfig.client.log.verbose
const h = `SYNCSCROLL`

////////////////////////////////////////////////////////////
// SUPPORT FUNCS
//

const getScrollObj = (wid) => {
	const preview = document.querySelector(`.window-id-${wid} .preview-area`)
	const editor = document.querySelector(`.window-id-${wid} .cm-scroller`)
	const scroller = document.querySelector(`.window-id-${wid} .scrolling-bar-wrapper`)
	if (!db[wid]) {
		db[wid] = {
			els: { preview, editor, scroller },
			dims: {
				editor: { viewport: 0, full: 0 },
				preview: { viewport: 0, full: 0 },
				scroller: { viewport: 0, full: 0 },
			},
			posPercent: 0,
			previewOffsetY: 0
		}
	}
	db[wid].els.preview = preview
	db[wid].els.editor = editor
	db[wid].els.scroller = scroller
	return db[wid]
}



//
// 1. DIMS UPDATERS
//
const updateEditorDims = (wid: string, dims: iDim) => {
	const c = getScrollObj(wid)
	// viewport = viewport > full ? full : viewport
	c.dims.editor = dims
	console.log(h, "editor dims update", c.dims.editor);
}

const updatePreviewDims = (wid: string) => {
	const c = getScrollObj(wid)
	let full = c.els.preview.querySelector('.simple-css-wrapper').clientHeight
	let viewport = c.els.preview.clientHeight
	c.dims.preview = { viewport, full }
	console.log(h, "preview dims update", c.dims.preview);
}

const updateScrollerDims = (wid: string) => {
	const c = getScrollObj(wid)
	// get smaller percent ratio viewport/full
	let ratioEditor = c.dims.editor.viewport / c.dims.editor.full || 10000000
	let ratioPreview = c.dims.preview.viewport / c.dims.preview.full || 10000000
	let ratio = ratioEditor < ratioPreview ? ratioEditor : ratioPreview
	let winner = ratioEditor < ratioPreview ? "editor" : "preview"

	// get scroller full size
	let full = c.els.scroller.clientHeight
	// calculate scrollbar height
	let viewport = ratio * full
	viewport = viewport > full ? full : viewport
	let dim: iDim = { viewport, full }

	// update dims
	c.dims.scroller = dim
	console.log(h, `scroller dim update from ${winner}`, c.dims.scroller);

	// trigger react refresh?? (oula) => on pourra mettre un debounce plus tard si necess
	let dataset = c.els.scroller.dataset
	if (!dataset.scrollRefresh) dataset.scrollRefresh = 1
	dataset.scrollRefresh = parseInt(dataset.scrollRefresh) + 1
}

//
// 2. SCROLL UPDATERS
//
const scrollScroller = (wid: string, percent: number) => {
	const c = getScrollObj(wid)

	// just ask for a refresh, bar position in calculated in component in react
	let dataset = c.els.scroller.dataset
	if (!dataset.scrollRefresh) dataset.scrollRefresh = 1
	dataset.scrollRefresh = parseInt(dataset.scrollRefresh) + 1
}

const scrollEditor = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	let e = c.dims.editor
	let percentPxEditor = (e.full - e.viewport) / 100
	c.els.editor.scrollTop = percentPxEditor * percent
}

const scrollPreview = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	let d = c.dims.preview
	let percentPxPreview = (d.full) / 100
	let newY = Math.round(percentPxPreview * percent)

	c.els.preview.scrollTop = newY + c.previewOffsetY
}


//
// 3. EVENTS ON
//
const onEditorScroll = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	c.posPercent = percent

	scrollScroller(wid, percent)
	scrollPreview(wid, percent)
}

const onScrollerScroll = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	c.posPercent = percent

	scrollEditor(wid, percent)
	scrollPreview(wid, percent)
}

const onPreviewScroll = (wid: string) => {
	const c = getScrollObj(wid)
	let d = c.dims.preview
	let percentPxPreview = (d.full) / 100
	let normalY = Math.round(percentPxPreview * c.posPercent)
	let currY = c.els.preview.scrollTop
	let offset = currY - normalY
	console.log(offset);
	c.previewOffsetY = offset
}

////////////////////////////////////////////////////////////
// EXPORT
//
export const syncScroll3 = {
	getScrollObj,

	updateEditorDims,
	updatePreviewDims,
	updateScrollerDims,


	onEditorScroll,
	onScrollerScroll,
	onPreviewScroll
}























export const syncScroll2 = {}
