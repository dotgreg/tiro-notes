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
import { iFile } from "../../../../shared/types.shared";
import { Icon } from "../../components/Icon.component";
import { LinkPreview, LinkPreviewCss } from "../../components/LinkPreview.component";
import { RessourcePreview } from "../../components/RessourcePreview.component";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { renderReactToId } from "../reactRenderer.manager";
import { cssVars } from "../style/vars.style.manager";
import { absoluteLinkPathRoot } from "../textProcessor.manager";


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
// FILES
//
export const imagePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.image,
	replacement: matchs => {

		let full = matchs[0]
		let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		let resEl = document.createElement("div");
		let url = `${absoluteLinkPathRoot(cFile.folder)}/${matchs[1]}`
		resEl.classList.add('cm-mdpreview-wrapper')
		resEl.classList.add('image-wrapper')
		let btnEnlarge = renderToString(
			<div className="enlarge" data-src={url}>
				<Icon name="faExpand" color={`white`} />
			</div>
		)

		resEl.innerHTML = `<div class="cm-mdpreview-image" >${btnEnlarge}<img onerror="this.style.display='none'" src="${url + getUrlTokenParam()}" /></div>${sourceHtml}`

		return resEl;
	}
})

export const filePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.ressource,
	replacement: matchs => {
		let full = matchs[0]
		let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		let resEl = document.createElement("span");
		let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
		resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
		return resEl
	}
})



export const imagePreviewCss = () => `
.cm-mdpreview-wrapper.image-wrapper {
		.mdpreview-source {
				line-height: initial;
		}
}

`



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

		// let idW = renderReactToId(<LinkPreview url={fullLink} />)
		let idW = ""

		let html = `<a href="${fullLink}" class="link-mdpreview" title="${fullLink}" target="_blank" rel="noreferrer">${renderToString(<Icon name="faLink" color={cssVars.colors.main} />)} ${previewStr} </a> <div class="links-infos-wrapper" id=${idW}> </div> `
		resEl.innerHTML = `${html}`;
		return resEl
	}
})


export const linksPreviewMdCss = () => `
.link-mdpreview-wrapper {
		position: relative;
		&:hover {
				.links-infos {
						opacity: 1;
						pointer-events: all;
				}
		}
		.links-infos {
				transition: 0.2s all;
				transition-delay: 1s;
				position: absolute;
				bottom: -50px;
				opacity: 0;
				pointer-events: none;
				background: white;
				border-radius: 5px;
				padding: 8px;
				box-shadow: 0 0 5px rgba(0,0,0,0.4);
				${LinkPreviewCss()}
				font-size: 8px;


		}

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
