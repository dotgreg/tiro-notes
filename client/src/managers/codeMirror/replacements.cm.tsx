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


let cacheDecoration:any = {}

//
// caching les decorations!!!
// 
const matcher = (pattern: RegExp, replacement: iReplacementFn) => new MatchDecorator({
	regexp: pattern,
	decoration: match => {
		let id = match.input
		if (!cacheDecoration[id]) {
			let widget = new ReplacementWidget(match, replacement)
			let deco = Decoration.widget({ widget: widget})
			cacheDecoration[id] = deco
		} 
		return cacheDecoration[id]
	}
})
const matcherClass = (pattern: RegExp, classFn: iClassWrapperFn) => new MatchDecorator({
	regexp: pattern,
	decoration: matchs => {
		return Decoration.mark({ class: classFn(matchs) })
	}
})

export const genericReplacementPlugin = (p: {
	pattern: RegExp,
	replacement?: iReplacementFn
	// replacement?: any
	classWrap?: iClassWrapperFn
	options?: {
		isAtomic?: boolean
	}
}) => {
	return ViewPlugin.fromClass(class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			if (p.replacement) {
				this.decorations = matcher(p.pattern, p.replacement).createDeco(view)
			}
			else {
				this.decorations = matcherClass(p.pattern, p.classWrap as iClassWrapperFn).createDeco(view)
			}
		}
		update(update: ViewUpdate) {
			try {
				if (p.replacement && (update.docChanged || update.viewportChanged)) {
					//@ts-ignore
					this.decorations = matcher(p.pattern, p.replacement)
						.updateDeco(update, this.decorations)
				}
				else {
					this.decorations = matcherClass(p.pattern, p.classWrap as iClassWrapperFn)
						.updateDeco(update, this.decorations)
				}
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



