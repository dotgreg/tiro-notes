import React from "react";
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { styleTags, Tag } from "@lezer/highlight";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { renderLatex } from "../latex.manager";
import { linksPreviewMdCss } from "./urlLink.plugin.cm";
import { imagePreviewCss } from "./image.plugin.cm";
import { noteLinkActionClick } from "./noteLink.plugin.cm";


/*************************************
 *  1. NEW MD PARSER TO DETECT ELEMENTS LIKE IMAGE
 */
export const MdCustomTags = {
	LatexMdEl: Tag.define()
};
const LatexMdElDelim = { resolve: "LatexMdEl" };
export const LatexMdEl = {
	defineNodes: ["LatexMdEl"],
	parseInline: [{
		name: "MdCustomTagsParser",
		parse(cx, next, pos) {
			// LATEX
			if (next === 36) {/* $ */
				return cx.addDelimiter(LatexMdElDelim, pos, pos + 1, true, true);
			}
			else { return -1 }
		},
		after: "Emphasis"
	}],
	props: [
		styleTags({
			LatexMdEl: MdCustomTags.LatexMdEl,
		})
	]
}



/*************************************
 * 2. CREATING NEW PLUGIN
 * - loops inside doc elements
 * - when find one of the parsed new el,
 * - inject our custom widgets
 */
// class ImageMdWidget extends WidgetType {
// 	constructor(
// 		readonly imgName: string,
// 		readonly imgUrl: string,
// 		readonly file: iFile
// 	) { super(); }
// 	ignoreEvent() { return false; }
// 	toDOM() {
// 		let resEl = document.createElement("div");
// 		let url = `${absoluteLinkPathRoot(this.file.folder)}/${this.imgUrl}`
// 		resEl.classList.add('cm-mdpreview-wrapper')
// 		resEl.classList.add('image-wrapper')
// 		resEl.onclick = () => {
// 		}

// 		let btnEnlarge = renderToString(
// 			<div className="enlarge" data-src={url}>
// 				<Icon name="faExpand" color={`white`} />
// 			</div>
// 		)

// 		// should be inline otherwise create whitespace
// 		resEl.innerHTML = `<div class="cm-mdpreview-image" >${btnEnlarge}<img onerror="this.style.display='none'" src="${url + getUrlTokenParam()}" /></div>`


// 		return resEl;
// 	}
// }

class LatexMdWidget extends WidgetType {
	constructor(readonly str: string,) { super(); }
	ignoreEvent() { return false; }
	toDOM() {
		let resEl = document.createElement("div");
		resEl.classList.add('cm-mdpreview-wrapper')
		resEl.classList.add('latex-wrapper')
		let latex = renderLatex(this.str)
		resEl.innerHTML = ` <div class="latex-height" >${latex}</div> `
		return resEl;
	}
}






/*************************************
 * 3. OVERALL INSERTION LOGIC
 */
function insertMdWidgets(view: EditorView, file: iFile) {
	let widgets: any = [];
	for (let { from, to } of view.visibleRanges) {
		syntaxTree(view.state).iterate({
			from, to, enter: (node: any) => {
				// if (node.name === "ImageMdEl") {
				// 	let rawStr = view.state.doc.sliceString(node.from, node.to)
				// 	let matches: any = [...rawStr.matchAll(regexs.imageAndTitleCapture2)]
				// 	if (!matches || !matches[0]) return
				// 	matches = matches[0]
				// 	if (!matches[1] || !matches[2]) return
				// 	let imgName = matches[1]
				// 	let imgUrl = matches[2]
				// 	let deco = Decoration.widget({
				// 		widget:
				// 			new ImageMdWidget(imgName, imgUrl, file), side: 1
				// 	});
				// 	widgets.push(deco.range(node.from));
				// }
				if (node.name === "LatexMdEl") {
					let rawStr = view.state.doc.sliceString(node.from, node.to)
					let deco = Decoration.widget({
						widget:
							new LatexMdWidget(rawStr), side: 1
					});
					widgets.push(deco.range(node.from));
				}
			}
		});
	}
	return Decoration.set(widgets);
}

export const markdownPreviewPlugin = (p: {
	file: iFile
	onTitleClick: Function
}) => ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) { this.decorations = insertMdWidgets(view, p.file); }
		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = insertMdWidgets(update.view, p.file);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
		eventHandlers: {
			mousedown: (e, view) => {
				let el = e.target as HTMLElement;

				// URL LINK
				// linkActionClick(el)

				// NOTE LINK
				noteLinkActionClick(el)


				// TITLE ACTION
				if (el.classList.contains("actionable-title")) {
					let title = el.innerHTML.replace(/^#{1,6} /, "");
					p.onTitleClick(title)
				}

				// IMAGE POPUP
				// if (el.classList.contains("enlarge")) {
				// 	// @ts-ignore
				// 	let url = el.parentNode.querySelector("img")?.src as string
				// 	// let url = el.parentNode.dataset.src as string
				// 	if (!isString(url) || !url.startsWith("http")) return;
				// 	url = url.replace(getUrlTokenParam(), '')
				// 	getApi(api => {
				// 		api.ui.lightbox.open(0, [url])
				// 	})
				// }
			}
		}
	}
);


/*************************************
 * 4. Styling
 */
export const styleCodeMirrorMarkdownPreviewPlugin = () => `
.latex-height {
		height: 20px;
		overflow: scroll;
		line-height: initial;
		background: rgb(247,247,247);
		padding: 10px;
		border-radius: 5px;
		color: rgba(0,0,0,0);
		transition: all 0.2s;
		.katex, .katex span {
				color: black;
		}
}

.mdpreview-source {
		font-weight: bold;
		color: #b4b4b4;
		font-size: 9px;
		display: block;
}

.cm-mdpreview-wrapper {
		line-height: 0px;

		&.latex-wrapper {
				position: relative;
				left: -10px;
				display: inline-block;
		}
		&.image-wrapper {
				/* max-height: 160px; */
		}

		.cm-mdpreview-image {
				position: relative;
				display: inline-block;

				img {
						margin: 5px 0px;
						border-radius: 5px;
						box-shadow: 0px 0px 5px rgba(0,0,0,.2);
						max-width: calc(100% - 20px);
						border-radius: 5px;
						max-height: 220px;
				}
				.enlarge {
						width: 10px;
						opacity: 0;
						transition: 0.2s all;
						position: absolute;
						top: 8px;
						right: 23px;
						z-index: 2;
						padding: 6px;
						cursor: pointer;
						background: rgba(0,0,0,0.6);
						border-radius: 19px;
				}
				svg, span {
						pointer-events: none;
				}
				svg {
						box-shadow: 0 0 0 rgba(0,0,0,0.4);
				}

		}
		&:hover .enlarge {
				opacity: 0.3;
				/* pointer-events: all; */
		}
}
}

 ${linksPreviewMdCss()}
 ${imagePreviewCss()}
 `
