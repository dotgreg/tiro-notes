import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state"

////////////////////// 
// REPLACEMENT SYSTEM ABSTRACTION
//
export type iReplacementFn = (matchs: string[]) => HTMLElement
class ReplacementWidget extends WidgetType {
	constructor(readonly match: any, readonly replacement: iReplacementFn) { super(); }
	toDOM() { return this.replacement(this.match) }
}


const matcher = (pattern: RegExp, replacement: iReplacementFn) => new MatchDecorator({
	regexp: pattern,
	decoration: match => Decoration.widget({ widget: new ReplacementWidget(match, replacement), })
})
const matcherClass = (pattern: RegExp, className: string) => new MatchDecorator({
	regexp: pattern,
	decoration: match => Decoration.mark({ class: className })
})

export const genericReplacementPlugin = (p: {
	pattern: RegExp,
	replacement?: iReplacementFn
	classWrap?: string
	options?: {
		isAtomic?: boolean
	}
}) => {
	return ViewPlugin.fromClass(class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			if (p.replacement) this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
			else this.decorations = matcherClass(p.pattern, p.classWrap as string).createDeco(view)
		}
		update(update: ViewUpdate) {
			try {
				if (p.replacement) this.decorations = matcher(p.pattern, p.replacement).updateDeco(update, this.decorations)
				else this.decorations = matcherClass(p.pattern, p.classWrap as string).updateDeco(update, this.decorations)
			} catch (e) {
				console.warn("[ERROR VIEWPLUGIN CM]", e, update);
			}
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






