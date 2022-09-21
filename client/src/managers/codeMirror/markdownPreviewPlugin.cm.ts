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
import { absoluteLinkPathRoot } from "../textProcessor.manager";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { renderLatex } from "../latex.manager";
import { isString } from "lodash";
import { linksPreviewMdCss } from "./linksPreviewPlugin.cm";

/*************************************
 *  1. NEW MD PARSER TO DETECT ELEMENTS LIKE IMAGE
 */
export const MdCustomTags = {
	ImageMdEl: Tag.define(),
	LatexMdEl: Tag.define()
};
const ImageMdElDelim = { resolve: "ImageMdEl" };
const LatexMdElDelim = { resolve: "LatexMdEl" };
export const ImageMdEl = {
	defineNodes: ["ImageMdEl", "LatexMdEl"],
	parseInline: [{
		name: "MdCustomTagsParser",
		parse(cx, next, pos) {
			// IMAGE
			if (next === 33 && cx.char(pos + 1) === 91) {// ![
				return cx.addDelimiter(ImageMdElDelim, pos, pos + 2, true, false);
			}
			else if (next === 41) { //)
				return cx.addDelimiter(ImageMdElDelim, pos, pos + 1, false, true);
			}
			// LATEX
			else if (next === 36) {/* $ */
				return cx.addDelimiter(LatexMdElDelim, pos, pos + 1, true, true);
			}
			// else if (next === 46) {/* $ */
			// 	return cx.addDelimiter(LatexMdElDelim, pos, pos + 1, false, true);
			// }
			else { return -1 }
		},
		after: "Emphasis"
	}],
	props: [
		styleTags({
			ImageMdEl: MdCustomTags.ImageMdEl,
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
class ImageMdWidget extends WidgetType {
	constructor(
		readonly imgName: string,
		readonly imgUrl: string,
		readonly file: iFile
	) { super(); }
	ignoreEvent() { return false; }
	toDOM() {
		let resEl = document.createElement("div");
		let url = `${absoluteLinkPathRoot(this.file.folder)}/${this.imgUrl}`
		resEl.classList.add('cm-mdpreview-wrapper')
		resEl.classList.add('image-wrapper')
		resEl.onclick = () => {
		}
		resEl.innerHTML = `
				<div class="cm-mdpreview-image" ><img onerror="this.style.display='none'" src="${url + getUrlTokenParam()}" /></div>
				`
		return resEl;
	}
}

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
				if (node.name === "ImageMdEl") {
					let rawStr = view.state.doc.sliceString(node.from, node.to)
					let matches: any = [...rawStr.matchAll(regexs.imageAndTitleCapture2)]
					if (!matches || !matches[0]) return
					matches = matches[0]
					if (!matches[1] || !matches[2]) return
					let imgName = matches[1]
					let imgUrl = matches[2]
					let deco = Decoration.widget({
						widget:
							new ImageMdWidget(imgName, imgUrl, file), side: 1
					});
					widgets.push(deco.range(node.from));
				}
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

export const markdownPreviewPlugin = (file: iFile) => ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) { this.decorations = insertMdWidgets(view, file); }
		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = insertMdWidgets(update.view, file);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
		eventHandlers: {
			mousedown: (e, view) => {
				let el = e.target as HTMLElement;
				// 	if (
				// 		target.nodeName == "INPUT" &&
				// 		target.parentElement!.classList.contains("cm-boolean-toggle")
				// 	)
				// 		// return toggleBoolean(view, view.posAtDOM(target));
				// 		return false

				// console.log(el.querySelector('img')?.src);

				console.log(el);
				let url = el.querySelector('img')?.src as string
				if (!isString(url)) return;
				url = url.replace(getUrlTokenParam(), '')
				getApi(api => {
					api.ui.lightbox.open(0, [url])
				})
			}
		}
	}
);


/*************************************
 * 4. Styling
 */
export const styleCodeMirrorMarkdownPreviewPlugin = () => `

${linksPreviewMdCss()}

.latex-height {
		height: 20px;
		overflow: scroll;
		line-height: initial;
		background: rgb(247,247,247);
		padding: 10px;
		border-radius:5px;
		color: rgba(0,0,0,0);
		transition: all 0.2s;
		.katex, .katex span {
				color: black;
		}
}

.mdpreview-source {
		font-weight: bold;
		color: #b4b4b4!important;
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
				max-height: 160px;
		}

		.cm-mdpreview-image {
				// width: 100%;
				// height: auto;
				// background-color: rgb(247,247,247);
				// background-size: contain;
				// background-repeat: no-repeat;
				cursor: pointer;
				position: relative;
				// top: -15px;

				img {
						margin: 5px 0px;
						border-radius: 5px;
						box-shadow: 0px 0px 5px rgba(0,0,0,.2);
						max-width: calc(100% - 20px);
						border-radius: 5px;
						max-height: 150px;
						cursor: pointer;
				}
		}
}
`
