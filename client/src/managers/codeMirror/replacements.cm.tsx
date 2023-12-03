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



import { StateField, StateEffect, EditorState, Extension } from '@codemirror/state';


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
		let id = match.input + match.index
		let cacheId = file.path+windowId
		if (!cacheDecoration[cacheId]) cacheDecoration[cacheId] = {}
		if (!cacheDecoration[cacheId][id]) {
		// if (!cacheDecoration[id]) {
			let widget = new ReplacementWidget(match, replacement)
			let deco = Decoration.replace({ widget })
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
			// if (!p.options?.isAtomic) res = Decoration.none
			if (!p.options?.isAtomic) res = Decoration.none
			// disable atomic range => allows edition
			return res
		})
	})
}

// what are the lines causing "Uncaught RangeError: Decorations that replace line breaks may not be specified via plugins"
// lines 1, 2, 3, 4, 5, 6, 7, 8, 9, 10



// like genericReplacementPlugin but with a stateField
// export const genericReplacementStateField = (p: {
// 	file:iFile,
// 	windowId:string
// 	pattern: RegExp,
// 	replacement?: iReplacementFn
// 	classWrap?: iClassWrapperFn
// 	options?: {
// 		isAtomic?: boolean
// 	}
// }) => {

// codemirror 6 function that put a decoration in a state field
// the decoration replace a pattern in text with by an html string in the text using replacement: matchs => {return html}
// class StrWidget extends WidgetType {
// 	constructor(readonly match: any) { super(); }
// 	toDOM() { 
// 		let wrap = document.createElement("span")
// 			wrap.setAttribute("aria-hidden", "true")
// 			wrap.className = "cm-boolean-toggle"
// 			let box = wrap.appendChild(document.createElement("input"))
// 			box.type = "checkbox"
// 			box.checked = true
// 			return wrap

// 	 }
// }

// export const matcherStateField = (view:any, pattern: RegExp, replacement: any ) => 
// {
// 	let deco = new MatchDecorator({
// 		regexp: pattern,
// 		decoration: match => {
// 			// let id = match.input + match.index
// 			// let cacheId = file.path+windowId
// 			// if (!cacheDecoration[cacheId]) cacheDecoration[cacheId] = {}
// 			// if (!cacheDecoration[cacheId][id]) {
// 				console.log(123, match, replacement)
// 				// let widget = new ReplacementWidget(match, replacement)
// 				let widget = new StrWidget(match, replacement)
// 				let deco = Decoration.widget({ widget })
// 				// cacheDecoration[cacheId][id] = deco
// 			// } 
// 			// return cacheDecoration[cacheId][id]
// 			return deco
// 		}
// 	})
// 	// deco.createDeco(view)
// 	return deco
// }

// // give me an example of implementing that matcherStateField in an existing editor cm6
// const example = () => {
// 	const myMatchDecorator = new MatchDecorator({
// 		regexp: /hello/g,
// 		decoration: match => Decoration.mark({ class: 'my-match' })
// 	})
// 	const myExtension = [
// 		myMatchDecorator
// 	]
// 	const myView = new EditorView({
// 		state: EditorState.create({
// 			doc: 'hello world',
// 			extensions: myExtension
// 		})
// 	})
// }

// import {EditorView, Decoration, MatchDecorator, WidgetType} from "@codemirror/view"
// import {EquationWidget} from "./equationWidget"
// export default function equations(view: EditorView) {
//   let decorator = new MatchDecorator(
//     {
//       regexp: new RegExp('\\$([^$]+)\\$', 'g'),
//       decoration: (match) => {  
//         return Decoration.replace({
//           widget: new EquationWidget(match[1])
//         })
//       },
//     }
//   )
//   return decorator.createDeco(view)
// }


// // give me an example how to use that MatchDecorator with EditorView
// const example = () => {
// 	const myMatchDecorator = new MatchDecorator({
// 		regexp: /hello/g,
// 		decoration: match => Decoration.mark({ class: 'my-match' })
// 	})
// 	const myExtension = [
// 		myMatchDecorator.
// 	]
// 	const myView = new EditorView({
// 		state: EditorState.create({
// 			doc: 'hello world',
// 			extensions: myExtension
// 		})
// 	})
// }




// import { Decoration } from "@codemirror/view";
// import { EditorView } from "@codemirror/view";

// export function createDecoration(view: EditorView, regex: RegExp, html: string) {
//     const decorations:any[] = [];
//     const doc = view.state.doc;
//     const text = doc.toString();

//     let match;

//     while ((match = regex.exec(text)) !== null) {
//         const from = match.index;
//         const to = match.index + match[0].length;
//         const replacementElement = document.createElement("span");
//         replacementElement.innerHTML = html;

//         decorations.push(
//             Decoration.widget({
// 				widget: new StrWidget(match ),
// 				side: 1
// 			}).range(from, to)
//         );
//     }

//     return Decoration.set(decorations);
// }


// editorView.dispatch({
//     effects: Decoration.of(myDecorations)
// });