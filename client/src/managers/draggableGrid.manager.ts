import { cloneDeep, each } from "lodash-es"
import { iWindow } from "../../../shared/types.shared"
import { draggableGridConfig } from "../components/windowGrid/DraggableGrid.component"

export const calculateNewWindowPosAndSize = (layout: iWindow[]) => {

	// create a busy grid state
	const gridState: any = []
	const conf = draggableGridConfig
	for (let y = 0; y < conf.rows; y++) {
		let nRow: any = []
		for (let x = 0; x < conf.cols; x++) {
			let res = 0
			each(layout, window => {
				// 1:1
				for (let k = 0; k < window.w; k++) {
					for (let l = 0; l < window.h; l++) {
						const xw = window.x + k
						const yw = window.y + l
						//console.log({ x, y, xw, yw });
						if (xw === x && yw === y) res = 1
					}
				}
			})
			nRow.push(res)
		}
		gridState.push(nRow)
	}

	// find the first and last available spot
	const first = [-1, -1]
	const last = [-1, -1]
	for (let y = 0; y < conf.rows; y++) {
		for (let x = 0; x < conf.cols; x++) {
			if (gridState[y][x] === 0 && first[0] === -1 && first[1] === -1) {
				first[0] = x
				first[1] = y
			}
			if (gridState[y][x] === 0) {
				last[0] = x
				last[1] = y
			}
		}
	}

	// get w & h according to these extremes
	let w = last[0] - first[0] + 1
	let h = last[1] - first[1] + 1

	const res = { x: first[0], y: first[1], w, h }

	return res
}


export const updateLayout_onewindowleft_tofullsize = (nlayout: iWindow[]) => {
	const conf = draggableGridConfig
	// if only one window left, make it fullsize
	if (nlayout.length === 1) {
		nlayout[0].x = 0
		nlayout[0].y = 0
		nlayout[0].h = conf.rows
		nlayout[0].w = conf.cols
	}
	return nlayout
}

export const updateLayout_twowindows_to_equal = (nlayout: iWindow[]) => {
	const l = nlayout
	const conf = draggableGridConfig
	// resize ii|i  to  ii|ii
	if (l.length === 2) { }//console.log('0234 1', l[0].w, l[1].w, conf.cols / 2, conf.cols);
	if (
		l.length === 2 && (
			// (l[0].w === conf.cols - 1 && l[0].h === conf.rows
			// 	&& l[1].w === conf.cols / 2 && l[1].h === conf.rows) ||
			// (l[1].w === conf.cols - 1 && l[1].h === conf.rows
			// 	&& l[0].w === conf.cols / 2 && l[0].h === conf.rows)
			(l[0].w === (conf.cols / 2) - 1 && l[1].w === conf.cols / 2) ||
			(l[1].w === (conf.cols / 2) - 1 && l[0].w === conf.cols / 2)
		)
	) {
		l[0].w = conf.cols / 2
		l[1].w = conf.cols / 2
	}
	return l
}



// l.length === 2 &&
// 	checkIfOneWindowIs(l, [cols / 2, rows], [0, 0]) &&
// 	checkIfOneWindowIs(l, [cols / 2 + 1, rows], [cols / 2 - 1, rows]) &&
// 	l.length === 2 &&
// 	checkIfOneWindowIs(l, [cols - 1, rows], [0, 0]) &&
// 	checkIfOneWindowIs(l, [cols - 1, rows], [cols / 2, rows]) &&

export const searchAlternativeLayout = (nlayout: iWindow[]) => {
	const l = nlayout
	const conf = draggableGridConfig
	let alternativeLayout: iWindow[] | null = null
	console.log('0035', l);
	// resize i|iii  to  ii|ii
	if (
		l.length === 2 && (
			(l[0].w === conf.cols - 1 && l[0].h === conf.rows
				&& l[1].w === conf.cols / 2 && l[1].h === conf.rows) ||
			(l[1].w === conf.cols - 1 && l[1].h === conf.rows
				&& l[0].w === conf.cols / 2 && l[0].h === conf.rows)
		)
	) {
		console.log(`[ALT LAYOUT] 0035 found i|iii to ii|ii`);
		alternativeLayout = cloneDeep(nlayout)
		let a = alternativeLayout
		each(alternativeLayout, (w, i) => {
			w.w = conf.cols / 2
			w.y = 0
			if (i === 1) w.x = conf.cols / 2
		})
	}


	// resize ii|ii  to  iii|i
	else if (
		l.length === 2 && (
			(l[0].w === conf.cols - 1 && l[0].h === conf.rows
				&& l[1].w === conf.cols / 2 && l[1].h === conf.rows) ||
			(l[1].w === conf.cols - 1 && l[1].h === conf.rows
				&& l[0].w === conf.cols / 2 && l[0].h === conf.rows)
		)
	) {
		console.log(`[ALT LAYOUT] 0035 found i|iii to ii|ii`);
		alternativeLayout = cloneDeep(nlayout)
		let a = alternativeLayout
		each(alternativeLayout, (w, i) => {
			w.w = conf.cols / 2
			w.y = 0
			if (i === 1) w.x = conf.cols / 2
		})
	}

	return alternativeLayout
}
