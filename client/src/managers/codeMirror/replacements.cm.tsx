import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import { debounce } from "lodash";

////////////////////// 
// REPLACEMENT SYSTEM ABSTRACTION
//
export type iReplacementFn = (matchs: string[]) => HTMLElement
export type iClassWrapperFn = (matchs: string[]) => string

class ReplacementWidget extends WidgetType {
	constructor(readonly match: any, readonly replacement: iReplacementFn) { super(); }
	toDOM() { return this.replacement(this.match) }
}


const matcher = (pattern: RegExp, replacement: iReplacementFn) => new MatchDecorator({
	regexp: pattern,
	decoration: match => Decoration.widget({ widget: new ReplacementWidget(match, replacement), })
})
const matcherClass = (pattern: RegExp, classFn: iClassWrapperFn) => new MatchDecorator({
	regexp: pattern,
	decoration: matchs => {
		return Decoration.mark({ class: classFn(matchs) })
	}
})

// const cnt = {value:0}
// const incrementCnt = () => {

// }
// const resetCnt = debounce(() => {

// },1000)

export const genericReplacementPlugin = (p: {
	pattern: RegExp,
	replacement?: iReplacementFn
	classWrap?: iClassWrapperFn
	options?: {
		isAtomic?: boolean
	}
}) => {
	return ViewPlugin.fromClass(class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			if (p.replacement) {
				// console.log(1233444, view, );
				// console.log(4444444444, view);
				this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
			}
			else {
				this.decorations = matcherClass(p.pattern, p.classWrap as iClassWrapperFn).createDeco(view)
			}
		}
		update(update: ViewUpdate) {
			try {
				// @ts-ignore
				if (p.replacement && update.changedRanges.length > 0) {
					// @ts-ignore
					// console.log(333333333, update.changedRanges);
					this.decorations = matcher(p.pattern, p.replacement)
						.updateDeco(update, this.decorations)
				}
				else this.decorations = matcherClass(p.pattern, p.classWrap as iClassWrapperFn).updateDeco(update, this.decorations)
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



// export const genericReplacementPlugin = (
// 	p: {
// 		pattern: RegExp,
// 		replacement?: iReplacementFn
// 		classWrap?: iClassWrapperFn
// 		options?: {
// 			isAtomic?: boolean
// 		}
// 	}) => {
// 	console.log(123333, p.pattern, p.replacement);
// 	return genericReplacementPluginInt(p)
// }



