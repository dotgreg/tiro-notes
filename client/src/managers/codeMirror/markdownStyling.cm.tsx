import { debounce, floor } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper"
import { iFile } from "../../../../shared/types.shared";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm"

export const evenTable = { val: false }
let even = evenTable


export const markdownStylingTableLimiter = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: /\|/gmi,
	classWrap: matchs => {
		return `md-table-limiter`
	}
})

export const testClassLine = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: /t1.+t2/gmi,
	classWrap: matchs => {
		return `ttt4`
	}
})

export const markdownStylingTableCell = (file: iFile, windowId:string) =>  genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.mdTableCell,
	classWrap: matchs => {
		let m = matchs[0]
		if (m && m === "-") { return "" }
		if (m && m === "-|") { return "" }
		return `md-table-cell`
	}
})


export const markdownMobileTitle = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.mdTitle,
	classWrap: matchs => {
		// console.log(123, matchs)
		let level = matchs[1].length
		// let line = matchs[0].trim()
		// if (line.startsWith("|")) line = line.substring(1)
		// if (line.endsWith("|")) line = line.substring(0, line.length - 1)

		// let nbCells = line.split("|").length
		// even.val = !even.val
		// // resetEven()
		return `md-title-wrapper level-${level}`
	}
})

export const markdownStylingTable = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
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
.md-title-wrapper {
	color: ${cssVars.colors.main};
	
	&.level-1 {
		font-size: 15px;
		text-decoration: underline;
		font-weight: bold;
	}
	&.level-2 {
		font-size: 13px;
		text-decoration: underline;
		// font-weight: bold;
	}
	&.level-3 {
		font-size: 12px;
	}
}
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

