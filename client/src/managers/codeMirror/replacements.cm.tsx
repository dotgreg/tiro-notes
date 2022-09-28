import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { Icon } from "../../components/Icon.component";
import { cssVars } from "../style/vars.style.manager";


////////////////////// 
// REPLACEMENT SYSTEM ABSTRACTION
//
export type iReplacementFn = (matchs: string[]) => HTMLElement
class ReplacementWidget extends WidgetType {
	constructor(readonly match: any, readonly replacement: iReplacementFn) { super(); }
	ignoreEvent() { return false; }
	toDOM() { return this.replacement(this.match) }
}
const matcher = (pattern: RegExp, replacement: iReplacementFn) => new MatchDecorator({
	regexp: pattern,
	decoration: match => Decoration.widget({ widget: new ReplacementWidget(match, replacement), })
})

export const genericReplacementPlugin = (p: {
	pattern: RegExp,
	replacement: iReplacementFn
	options?: {
		isAtomic?: boolean
	}
}) => {
	return ViewPlugin.fromClass(class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
		}
		update(update: ViewUpdate) {
			this.decorations = matcher(p.pattern, p.replacement).updateDeco(update, this.decorations)
		}
	}, {
		decorations: instance => instance.decorations,
		provide: plugin => EditorView.atomicRanges.of(view => {
			let res = view.plugin(plugin)?.decorations || Decoration.none
			if (!p.options?.isAtomic) res = Decoration.none
			// disable atomic range => allows edition
			return res
		})
	})
}










///////////////////////////////////
// CTAG
//
export const ctagPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.userCustomTagFull2,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.innerHTML = `||wooooooooooooooo||`;
		return resEl
	}
})








///////////////////////////////////
// LINK
//
export const linksPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.externalLink,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.classList.add('link-mdpreview-wrapper')
		resEl.classList.add('link-wrapper')

		let limitChar = 20
		let fullLink = matchs[0]
		let website = matchs[1].replace("www.", "")
		if (website.length > limitChar) website = website.substring(website.length - limitChar)
		let artTitle = matchs[3]
		if (artTitle === "" || !artTitle) artTitle = matchs[2]
		if (artTitle.length > limitChar) artTitle = artTitle.substring(0, limitChar) + ""

		let previewStr = ` ${website}:${artTitle}`
		let html = renderToString(
			<a
				href={fullLink}
				className="link-mdpreview"
				title={fullLink}
				target="_blank"
				rel="noreferrer">
				<Icon name="faLink" color={cssVars.colors.main} />
				{previewStr}
			</a>)
		resEl.innerHTML = `${html}`;

		return resEl
	}
})

export const linksPreviewMdCss = () => `
.link-mdpreview-wrapper {
		.link-mdpreview {
				opacity: 0.6;
				transition: 0.2s all;
				&:hover {
						opacity: 1;
				}
				line-height: 20px;
				text-decoration: none;
				color: ${cssVars.colors.main};
				// border: solid 2px ${cssVars.colors.main};
				padding: 0px 6px;
				cursor: pointer;
				border-radius: 5px;
				svg {
						color: ${cssVars.colors.main};
				}
		}
}
`
