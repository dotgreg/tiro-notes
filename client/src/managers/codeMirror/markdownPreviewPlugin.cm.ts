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

////////////////////////////////////////
//  1. NEW MD PARSER TO DETECT ELEMENTS LIKE IMAGE
//
export const MdCustomTags = {
	ImageMdEl: Tag.define(),
};
const ImageMdElDelim = { resolve: "ImageMdEl" };
export const ImageMdEl = {
	defineNodes: ["ImageMdEl"],
	parseInline: [{
		name: "ImageMdEl",
		parse(cx, next, pos) {
			if (next === 33 && cx.char(pos + 1) === 91) {
				return cx.addDelimiter(ImageMdElDelim, pos, pos + 2, true, false);
			}
			else if (next === 41) {
				return cx.addDelimiter(ImageMdElDelim, pos, pos + 1, false, true);
			}
			else { return -1 }
		},
		after: "Emphasis"
	}],
	props: [
		styleTags({
			ImageMdEl: MdCustomTags.ImageMdEl,
			'Strikethrough/...': MdCustomTags.ImageMdEl
		})
	]
}


/* ////////////////////////////////////////
2. CREATING NEW PLUGIN
- loops inside doc elements
- when find one of the parsed new el,
- inject our custom widgets
*/
class ImageMdWidget extends WidgetType {
	constructor(readonly imgName: string, readonly imgUrl: string) { super(); }
	ignoreEvent() { return false; }
	toDOM() {
		let wrap = document.createElement("span");
		wrap.innerHTML = `hello world widget with img ${this.imgName}, ${this.imgUrl}`

		// wrap.setAttribute("aria-hidden", "true");
		// wrap.className = "cm-boolean-toggle";
		// let box = wrap.appendChild(document.createElement("input"));
		// box.type = "checkbox";
		// box.checked = this.checked;
		return wrap;
	}
}

function insertMdWidgets(view: EditorView) {
	let widgets: any = [];
	for (let { from, to } of view.visibleRanges) {
		syntaxTree(view.state).iterate({
			from, to, enter: (node: any) => {
				// console.log(2221, node.name, node.name === "ImageMdEl");
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
							new ImageMdWidget(imgName, imgUrl), side: 1
					});
					widgets.push(deco.range(node.to));
				}
			}
		});
	}
	return Decoration.set(widgets);
}
export const markdownPreviewPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) { this.decorations = insertMdWidgets(view); }

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = insertMdWidgets(update.view);
			}
		}
	},
	{
		decorations: (v) => v.decorations,

		eventHandlers: {
			mousedown: (e, view) => {
				let target = e.target as HTMLElement;
				if (
					target.nodeName == "INPUT" &&
					target.parentElement!.classList.contains("cm-boolean-toggle")
				)
					// return toggleBoolean(view, view.posAtDOM(target));
					return false
			}
		}
	}
);
