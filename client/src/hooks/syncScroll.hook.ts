import { useRef, useState } from 'react';


// let baseY = 0
// let scrollByEditor = 0
interface iScrollConfig {
	baseY: number
	editorY: number
	previewEl: any
	editorEl: any
}

interface iDbScroll {
	[wid: string]: iScrollConfig
}

let db: iDbScroll = {}
export const cleanDb = () => {
	console.log("syncScroll => cleaning db");
	db = {}
}
const getScrollObj = (wid) => {
	const previewEl = document.querySelector(`.window-id-${wid} .preview-area-wrapper`)
	const editorEl = document.querySelector(`.window-id-${wid} .cm-scroller`)
	if (!db[wid]) {
		db[wid] = {
			baseY: 0,
			editorY: 0,
			previewEl,
			editorEl,
		}
	}
	return db[wid]
}


//
// NEW NATURAL SYNC SCROLL SYSTEM WITHOUT REACT, MUCH FASTER
//
export const syncScroll2 = {
	cleanDb,
	editorToPreview: (wid: string) => {
		// console.log(111, wid);
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid: ', wid)
		c.editorY = c.editorEl.scrollTop
		c.previewEl.scrollTop = c.editorY + c.baseY
		// console.log(c);
	},
	previewToEditor: (wid: string) => {
		// console.log(222, wid);
		const c = getScrollObj(wid)
		if (!c.editorEl || !c.previewEl) return console.warn('no wid 2: ', wid)
		c.baseY = c.previewEl.scrollTop - c.editorY
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
		// console.log(3, deltaY, getSyncY(), syncYRef.current, newY);
		if (newY > -200 && newY < maxY) setSyncY(newY)
	}

	const yCnt = cnt

	return { getSyncY, setSyncY, yCnt, updateSyncYWithDelta }
}
