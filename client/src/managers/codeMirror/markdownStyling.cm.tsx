import { debounce, floor } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper"
									import { genericReplacementPlugin } from "./replacements.cm"

																											export const evenTable = { val: false }
let even = evenTable


export const markdownStylingTableLimiter = genericReplacementPlugin({
				pattern: /\|/gmi,
				classWrap: matchs => {
						return `md-table-limiter`
				}
		})

export const markdownStylingTableCell = genericReplacementPlugin({
				pattern: regexs.mdTableCell,
				classWrap: matchs => {
						// console.log(11111111112);
						let m = matchs[0]
						if (m && m === "-") { return "" }
						if (m && m === "-|") { return "" }
						// if (m && m.includes("|")) return ""
						return `md-table-cell`
				}
		})

let resetEven = debounce(() => { even.val = false }, 1)

export const markdownStylingTable = () => genericReplacementPlugin({
				pattern: regexs.mdTableLine,
				classWrap: matchs => {
						let nbCells = matchs[0].split("|").length
						even.val = !even.val
						// resetEven()
						return `md-table-line md-table-${nbCells} ${even.val ? "even" : ""}`
				}
		})

export const markdownStylingCss = () => {
		let cssLines = ``
		for (var i = 0; i < 30; i++) {
				let w = Math.floor(100 / i) - 2
				cssLines += `
				&.md-table-${i} span.md-table-cell{
						width: calc(${w}% - 13px);
				}`
		}

		return `
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
				}
				span.md-table-cell>span:first-child {
						width: 100%;
				}

    }
		.cm-activeLine {
				.md-table-line {
						/* background: #cecece; */
						background: #d9d9d9;
						span.md-table-cell span.md-table-limiter {
								color: black;
						}
				}
		}

		`
}

