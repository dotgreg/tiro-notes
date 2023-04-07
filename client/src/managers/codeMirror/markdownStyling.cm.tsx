import { debounce, floor } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper"
import { iFile } from "../../../../shared/types.shared";
import { genericReplacementPlugin } from "./replacements.cm"

export const evenTable = { val: false }
let even = evenTable


export const markdownStylingTableLimiter = (file: iFile) => genericReplacementPlugin({
	file,
	pattern: /\|/gmi,
	classWrap: matchs => {
		return `md-table-limiter`
	}
})

export const markdownStylingTableCell = (file: iFile) =>  genericReplacementPlugin({
	file,
	pattern: regexs.mdTableCell,
	classWrap: matchs => {
		let m = matchs[0]
		if (m && m === "-") { return "" }
		if (m && m === "-|") { return "" }
		return `md-table-cell`
	}
})


export const markdownStylingTable = (file: iFile) => genericReplacementPlugin({
	file,
	pattern: regexs.mdTableLine,
	classWrap: matchs => {
		let line = matchs[0].trim()
		if (line.startsWith("|")) line = line.substring(1)
		if (line.endsWith("|")) line = line.substring(0, line.length - 1)

		let nbCells = line.split("|").length
		even.val = !even.val
		// resetEven()
		return `md-table-line md-table-${nbCells} ${even.val ? "even" : ""}`
	}
})

export const markdownStylingTableCss = () => {
	let cssLines = ``
	for (var i = 0; i < 30; i++) {
		let w = Math.floor(100 / i)
		cssLines += `
				&.md-table-${i} span.md-table-cell{
						width: calc(${w}% - 15px);
				}`
	}

	return `
.md-table-preview-enabled {
		.md-table-line {
				&.even {
						background: #e3e3e3;
				}
				display: inline-flex;

				display: block;
				background: #f4f4f4;
				padding: 5px;
				${cssLines}
				span.md-table-cell {
						padding-right:13px;
						position: relative;
						display: inline-block;
						vertical-align: top;
				}
				span.md-table-cell span.md-table-limiter {
						position: absolute;
						top: 0px;
						right:0px;
						color: #c8c3c3;
						display: inline-block;
				}
				span.md-table-cell>span:first-child {
						width: 100%;
				}

    }
		.cm-activeLine {
				.md-table-line {
						background: #d9d9d9;
						span.md-table-cell span.md-table-limiter {
								color: black;
						}
				}
		}
		.cm-line .md-table-limiter {
				display: inline;
		}

}
		`
}

