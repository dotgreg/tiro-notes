import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { cssVars } from "../style/vars.style.manager";

class LinkWidget extends WidgetType {
	constructor(readonly str: any,) { super(); }
	ignoreEvent() { return false; }
	toDOM() {
		console.log(333, this.str);
		let resEl = document.createElement("div");
		resEl.classList.add('link-mdpreview-wrapper')
		let previewStr = `${this.str[2]} ${this.str}`
		resEl.innerHTML = ` <div class="link-mdpreview">Click</div> `
		return resEl;
	}
}
const linksPreviewMatcher = new MatchDecorator({
	regexp: regexs.externalLink,
	decoration: match => Decoration.widget({ widget: new LinkWidget(match), })
})

// export const linksPreviewPlugin = ViewPlugin.fromClass(class {
// 	decorations: DecorationSet
// 	constructor(view: EditorView) { this.decorations = linksPreviewMatcher.createDeco(view) }
// 	update(update: ViewUpdate) {
// 		this.decorations = linksPreviewMatcher.updateDeco(update, this.decorations)
// 	}
// }, {
// 	decorations: instance => instance.decorations,
// 	provide: plugin => EditorView.atomicRanges.of(view => {
// 		return view.plugin(plugin)?.decorations || Decoration.none
// 	})
// })

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
})

export const linksPreviewMdCss = () => `
.link-mdpreview-wrapper {
		display: inline-block;
		line-height: 0;
		.link-mdpreview {
				background: ${cssVars.colors.main};
				cursor: pointer;
				border-radius: 5px;
		}
}
`
