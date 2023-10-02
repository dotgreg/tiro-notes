import { sharedConfig } from '../../../shared/shared.config';
import { devCliAddFn } from '../managers/devCli.manager';

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
devCliAddFn("syncscroll","get_db", () => {return db})




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
	if (!c.els.editor) return;
	c.dims.editor = dims
	// if (!c.els.preview) return;
	// viewport = viewport > full ? full : viewport
	// console.log(h, "editor dims update", c.dims.editor);
}

const updatePreviewDims = (wid: string) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	if (!c.els.preview) return;
	let full = c.els.preview.querySelector('.simple-css-wrapper').clientHeight
	let viewport = c.els.preview.clientHeight
	c.dims.preview = { viewport, full }
	// console.log(h, "preview dims update", c.dims.preview);
}

const updateScrollerDims = (wid: string) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	// if (!c.els.preview) return;
	// get smaller percent ratio viewport/full
	let ratioEditor = c.dims.editor.viewport / c.dims.editor.full || 10000000
	let ratioPreview = c.dims.preview.viewport / c.dims.preview.full || 10000000
	let ratio = ratioEditor < ratioPreview ? ratioEditor : ratioPreview
	let winner = ratioEditor < ratioPreview ? "editor" : "preview"

	// get scroller full size
	let full = c.els.scroller?.clientHeight || 0
	// calculate scrollbar height
	let viewport = ratio * full
	viewport = viewport > full ? full : viewport
	let dim: iDim = { viewport, full }

	// update dims
	c.dims.scroller = dim
	// console.log(h, `scroller dim update from ${winner}`, c.dims.scroller);

	// trigger react refresh?? (oula) => on pourra mettre un debounce plus tard si necess
	let dataset = c.els.scroller?.dataset
	if (!dataset) return
	if (!dataset.scrollRefresh) dataset.scrollRefresh = 1
	dataset.scrollRefresh = parseInt(dataset.scrollRefresh) + 1
}

//
// 2. SCROLL UPDATERS
//
const scrollScroller = (wid: string, percent?: number) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	if (!percent) percent = c.posPercent

	// just ask for a refresh, bar position in calculated in component in react
	let dataset = c.els.scroller?.dataset
	if (!dataset) return
	if (!dataset.scrollRefresh) dataset.scrollRefresh = 1
	dataset.scrollRefresh = parseInt(dataset.scrollRefresh) + 1
}

const scrollEditor = (wid: string, percent?: number) => {
	const c = getScrollObj(wid)
	if (!c.els.editor) return;
	let e = c.dims.editor
	if (!percent) percent = c.posPercent
	let percentPxEditor = (e.full - e.viewport) / 100
	c.els.editor.scrollTop = percentPxEditor * percent
}

const scrollPreview = (wid: string, percent?: number) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	if (!c.els.preview) return;
	let d = c.dims.preview
	if (!percent) percent = c.posPercent
	let percentPxPreview = (d.full) / 100
	let newY = Math.round(percentPxPreview * percent)
	c.els.preview.scrollTop = newY + c.previewOffsetY
}


//
// 3. EVENTS ON
//
const onEditorScroll = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	if (!c.els.editor) return;
	c.posPercent = percent

	scrollScroller(wid, percent)
	scrollPreview(wid, percent)
}

const onScrollerScroll = (wid: string, percent: number) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	c.posPercent = percent

	scrollEditor(wid, percent)
	scrollPreview(wid, percent)
}

const onPreviewScroll = (wid: string) => {
	const c = getScrollObj(wid)
	if (!c.els.editor) return;
	let previewY = c.els.preview.scrollTop
	
	updatePreviewOffset(wid, previewY)
	c.posPercent = (previewY / c.dims.preview.full) * 100

	scrollEditor(wid, c.posPercent)
	scrollScroller(wid, c.posPercent)
}

const onWindowLoad = (wid: string) => {
	// reinit older positions if they exists
	if (db[wid]) {
		const c = getScrollObj(wid)
		// if (!c.els.editor) return
		let percent = c.posPercent
		updateScrollerDims(wid)
		scrollScroller(wid, percent)
		scrollEditor(wid, percent)
		scrollPreview(wid, percent)
	}
}


//
// ELSE
//
const updatePreviewOffset = (wid: string, newY: number) => {
	const c = getScrollObj(wid)
	// if (!c.els.editor) return;
	let d = c.dims.preview
	let percentPxPreview = (d.full) / 100
	let normalY = Math.round(percentPxPreview * c.posPercent)
	let offset = newY - normalY
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

	updatePreviewOffset,


	onEditorScroll,
	onScrollerScroll,
	onPreviewScroll,

	onWindowLoad,

	scrollEditor,
	scrollPreview,
	scrollScroller,
}























export const syncScroll2 = {}
