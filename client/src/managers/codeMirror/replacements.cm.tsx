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
	constructor(readonly match: any, readonly replacement: iReplacementFn) {
		super();
		// console.log("replacement constructor");
	}
	// ignoreEvent() {
	// 	console.log(22222222222);
	// 	return false;
	// }
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

	// return StateField.define({
	// 	// decorations: DecorationSet
	// 	// constructor(view: EditorView) {
	// 	create(){
	// 		// console.log("PLUGIN REPLACEMENT", p.pattern);
	// 		// this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
	// 		return Decoration.none
	// 		// return matcher(p.pattern, p.replacement).createDeco(view)
	// 	},
	// 	update(update: ViewUpdate) {
	// 		// console.log("222PLUGIN REPLACEMENT", p.pattern);
	// 		try {
	// 			this.decorations = matcher(p.pattern, p.replacement).updateDeco(update, this.decorations)
	// 		} catch (e) {
	// 			console.log("3333333", e, update);
	// 		}
	// 	}
	// }, {
	// 	decorations: instance => instance.decorations,
	// 	provide: plugin => EditorView.atomicRanges.of(view => {
	// 		let res = view.plugin(plugin)?.decorations || Decoration.none
	// 		if (!p.options?.isAtomic) res = Decoration.none
	// 		// disable atomic range => allows edition
	// 		return res
	// 	})
	// })

	return ViewPlugin.fromClass(class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			// console.log("PLUGIN REPLACEMENT", p.pattern);
			this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
		}
		update(update: ViewUpdate) {
			// console.log("222PLUGIN REPLACEMENT", p.pattern);
			try {
				console.log(222222, matcher(p.pattern, p.replacement));
				this.decorations = matcher(p.pattern, p.replacement).updateDeco(update, this.decorations)
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






