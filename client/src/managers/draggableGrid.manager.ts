import { each } from "lodash"
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

	//console.log(6664, first, last, gridState, res);
	return res
}
