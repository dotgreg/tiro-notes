import { MatchDecorator } from "@codemirror/view"
import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
	Decoration,
	DecorationSet
} from "@codemirror/view";
import { iFile } from "../../../../shared/types.shared";
import { devCliAddFn } from "../devCli.manager";

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
devCliAddFn("code_mirror", "cache_get", () => cacheDecoration)

//
// @cache @ctag
// caching les decorations!!!
// 
const matcher = (pattern: RegExp, replacement: iReplacementFn, file:iFile, windowId:string) => new MatchDecorator({
	regexp: pattern,
	decoration: match => {
		let id = match.input
		let cacheId = file.path+windowId
		if (!cacheDecoration[cacheId]) cacheDecoration[cacheId] = {}
		if (!cacheDecoration[cacheId][id]) {
		// if (!cacheDecoration[id]) {
			let widget = new ReplacementWidget(match, replacement)
			let deco = Decoration.widget({ widget })
			cacheDecoration[cacheId][id] = deco
		} 
		return cacheDecoration[cacheId][id]
	}
})
const matcherClass = (pattern: RegExp, classFn: iClassWrapperFn) => new MatchDecorator({
	regexp: pattern,
	decoration: matchs => {
		return Decoration.mark({ class: classFn(matchs) })
	}
})

export const genericReplacementPlugin = (p: {
	file:iFile,
	windowId:string
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
				this.decorations = matcher(p.pattern, p.replacement, p.file, p.windowId).createDeco(view)
			}
			else {
				this.decorations = matcherClass(p.pattern, p.classWrap as iClassWrapperFn).createDeco(view)
			}
		}
		update(update: ViewUpdate) {
			try {
				if (p.replacement && (update.docChanged || update.viewportChanged)) {
					//@ts-ignore
					this.decorations = matcher(p.pattern, p.replacement, p.file, p.windowId)
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


