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

class LinkWidget extends WidgetType {
	constructor(readonly match: any,) { super(); }
	ignoreEvent() { return false; }
	toDOM() {
		let resEl = document.createElement("span");
		resEl.classList.add('link-mdpreview-wrapper')
		resEl.classList.add('link-wrapper')

		let limitChar = 20
		let fullLink = this.match[0]
		let website = this.match[1].replace("www.", "")
		if (website.length > limitChar) website = website.substring(website.length - limitChar)

		let artTitle = this.match[3]
		if (artTitle === "" || !artTitle) artTitle = this.match[2]
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
}
const linksPreviewMatcher = new MatchDecorator({
	regexp: regexs.externalLink,
	decoration: match => Decoration.widget({ widget: new LinkWidget(match), })
})

export const linksPreviewPlugin = ViewPlugin.fromClass(class {
	decorations: DecorationSet
	constructor(view: EditorView) { this.decorations = linksPreviewMatcher.createDeco(view) }
	update(update: ViewUpdate) {
		this.decorations = linksPreviewMatcher.updateDeco(update, this.decorations)
	}
}, {
	decorations: instance => instance.decorations,
	provide: plugin => EditorView.atomicRanges.of(view => {
		return view.plugin(plugin)?.decorations || Decoration.none
	})
}
)

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
