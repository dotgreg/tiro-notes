import { useRef, useState } from 'react';
import { sharedConfig } from '../../../shared/shared.config';
import { getApi } from './api/api.hook';
import { getActiveTabIndex } from './app/tabs.hook';


// let baseY = 0
// let scrollByEditor = 0
interface iScrollConfig {
	baseY: number
	editorY: number
	previewEl: any
	editorEl: any
	line: number
}

interface iDbScroll {
	[wid: string]: iScrollConfig
}

const log = sharedConfig.client.log.verbose
let db: iDbScroll = {}
export const cleanDb = () => {
	console.log("[syncScroll] => cleaning db");
	db = {}
}
// @ts-ignore
window.dbscroll = db

const getScrollObj = (wid) => {
	const previewEl = document.querySelector(`.window-id-${wid} .preview-area-wrapper`)
	const editorEl = document.querySelector(`.window-id-${wid} .cm-scroller`)
	if (!db[wid]) {
		db[wid] = {
			baseY: 0,
			editorY: 0,
			previewEl,
			editorEl,
			line: 0
		}
	}
	db[wid].previewEl = previewEl
	db[wid].editorEl = editorEl
	return db[wid]
}


//
// NEW NATURAL SYNC SCROLL SYSTEM WITHOUT REACT, MUCH FASTER
//
const h = `[SYNC SCROLL 2]`
export const syncScroll2 = {
	cleanDb,

	// updateLine: (wid: string, line: number) => {
	// 	console.log("liiiiiine", line, wid);
	// 	const c = getScrollObj(wid)
	// 	if (!c.editorEl || !c.previewEl) return console.warn('no wid: ', wid)
	// 	c.line = line
	// },
	reinitPos: (wid: string) => {
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid: ', wid)
		console.log(3333, c.editorY, c.baseY, c.line);
		c.previewEl.scrollTop = c.editorY + c.baseY
		c.editorEl.scrollTop = c.editorY
		// getApi(api => {
		// api.ui.note.lineJump.jump({ windowId: wid, line: c.line })
		// })
	},
	editorToPreview: (wid: string) => {
		// console.log(111);
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid: ', wid)
		// console.log(222, c.previewEl.scrollTop);
		// @ts-ignore
		window.pel = c.previewEl

		c.editorY = c.editorEl.scrollTop
		c.previewEl.scrollTop = c.editorY + c.baseY
	},
	syncPreviewOffset: (wid: string) => {
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid 2: ', wid)
		c.baseY = c.previewEl.scrollTop - c.editorY
	},
	updatePreviewOffset: (wid: string, nOffset: number) => {
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid 3: ', wid)
		c.baseY = nOffset - c.editorY
		log && console.log(h, "update preview offset to ", nOffset);
		c.previewEl.scrollTop = c.editorY + c.baseY
	}
}





export const useSyncScroll = (maxY: number) => {
	// // scrolling logic
	// const updateSyncScroll = (deltaY: number) => {
	// 	let direction = deltaY > 0 ? 1 : -1
	// 	let delta = direction * Math.min(Math.abs(deltaY), 40)
	// 	let newY = posY + delta
	// 	if (newY > -200 && newY < maxY) setPosY(newY)
	// }
	// const syncScrollY = posY


	const [cnt, setCnt] = useState(0)
	const syncYRef = useRef(0)

	const getSyncY = (): number => { return syncYRef.current }
	const setSyncY = (nY: number) => {
		syncYRef.current = nY
		setCnt(cnt + 1)
	}
	const updateSyncYWithDelta = (deltaY: number) => {
		setCnt(cnt + 1) // should be very sensitive for iframe scrolling
		let direction = deltaY > 0 ? 1 : -1
		let delta = direction * Math.min(Math.abs(deltaY), 40)
		let newY = getSyncY() + delta
		if (newY > -200 && newY < maxY) setSyncY(newY)
	}

	const yCnt = cnt

	return { getSyncY, setSyncY, yCnt, updateSyncYWithDelta }
}
