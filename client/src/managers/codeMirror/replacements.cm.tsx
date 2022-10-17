import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";


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






