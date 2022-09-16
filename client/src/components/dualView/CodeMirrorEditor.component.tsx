import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useCodeMirror } from '@uiw/react-codemirror';
import { languages } from "@codemirror/language-data";
import { autocompletion, CompletionSource } from "@codemirror/autocomplete";

import { LineTextInfos } from "../../managers/textEditor.manager";
import { tags as t } from "@lezer/highlight";

import { createTheme } from "@uiw/codemirror-themes";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { debounce, each, random, throttle } from "lodash";
import { cssVars } from "../../managers/style/vars.style.manager";
import { syncScroll2, syncScroll3 } from "../../hooks/syncScroll.hook";
import { useDebounce, useThrottle } from "../../hooks/lodash.hooks";
import { deviceType, isA } from "../../managers/device.manager";
import { sharedConfig } from "../../../../shared/shared.config";
import { getApi } from "../../hooks/api/api.hook";
import { iFile } from "../../../../shared/types.shared";
import { onTitleClickFn } from "./EditorArea.component";
import { useResize } from "../../hooks/useResize.hook";


const h = `[Code Mirror]`
const log = sharedConfig.client.log.verbose

const CodeMirrorEditorInt = forwardRef((p: {
	windowId: string,

	value: string,
	onChange: (text: string) => void

	posY: number
	jumpToLine: number

	forceRender: number
	file: iFile

	// using it for title scrolling, right now its more title clicking
	onScroll: Function
	onTitleClick: onTitleClickFn
}, forwardedRef) => {








	const getEditorObj = (): any => {
		// @ts-ignore
		const f: any = forwardedRef.current
		if (!f || !f.state) return null
		return f
	}

	const histVal = useRef<null | string>(null)
	const initVal = (): boolean => {
		const f = getEditorObj()
		// @ts-ignore
		window.cmobj = f
		if (!f) return false

		if (p.value === histVal.current) return false
		if (p.value === "loading...") return false
		if (f.view.state.doc.toString() === p.value) return false
		// console.log(3332, p.value,);
		const li = CodeMirrorUtils.getCurrentLineInfos(f)
		const cpos = li.currentPosition
		CodeMirrorUtils.updateText(f, p.value, cpos)
		histVal.current = p.value
		return true
	}

	//
	// INIT VAL MECHANISME
	//
	useEffect(() => {
		// setTimeout(() => {
		// need to wait for 100ms to get codemirror object, need to refactor that
		// console.log(res, 4440, p.value, p.forceRender);
		let res = initVal()
		// }, 100)
	}, [p.value, p.forceRender]);


	const onChange = (value, viewUpdate) => {
		// do not trigger change if value didnt changed from p.value (on file entering)
		if (value === p.value) return
		debouncedActivateTitles()
		histVal.current = value
		p.onChange(value)

		syncScrollUpdateDims()
	}


	//
	// JUMP TO LINE
	//
	useEffect(() => {
		log && console.log(h, "JUMP to line :", p.jumpToLine);
		if (p.jumpToLine === -1) return
		const f = getEditorObj()
		if (!f) return
		if (p.posY <= -10) return
		CodeMirrorUtils.scrollToLine(f, p.jumpToLine)
	}, [p.jumpToLine])






	//
	// ON TITLE HOVER, CREATE A LINK
	//

	const onAction = (event) => {
		let title = event.target.innerHTML.replace(/^#{1,6} /, "");
		const f = getEditorObj()
		if (!f) return
		const infs = CodeMirrorUtils.getCurrentLineInfos(f)
		log && console.log(h, "CLICK ON TITLE DETECTED", title, infs);
		p.onTitleClick(infs.lineIndex)
	}

	const activateTitleInt = () => {
		const els = document.querySelectorAll(".actionable-title")
		each(els, el => {
			el.addEventListener('click', onAction)
		})
	}

	const debouncedActivateTitles = useDebounce(() => { activateTitleInt() }, 500)
	const throttleActivateTitles = useThrottle(() => { activateTitleInt() }, 500)

	useEffect(() => {
		debouncedActivateTitles()
		syncScrollUpdateDims()
	}, [p.value])


	const { resizeState } = useResize()
	useEffect(() => {
		syncScrollUpdateDims()
	}, [resizeState])

	//
	// SYNCSCROLL SIZE UPDATE
	//
	const syncScrollUpdateDims = () => {
		const f = getEditorObj()
		if (!f) return
		let infs = CodeMirrorUtils.getEditorInfos(f.view)
		console.log(infs);
		syncScroll3.updateEditorDims(p.windowId, { viewport: infs.viewportHeight, full: infs.contentHeight })
		syncScroll3.updateScrollerDims(p.windowId)
	}


	return (
		<div className="codemirror-editor-wrapper">
			<CodeMirror
				value=""
				ref={forwardedRef as any}
				theme={getCustomTheme()}
				onChange={onChange}

				basicSetup={{
					foldGutter: false,
					dropCursor: false,
					allowMultipleSelections: false,
					indentOnInput: false,
					closeBrackets: false,
					lineNumbers: false,

				}}
				extensions={[
					autocompletion({ override: getAllCompletionSources(p.file) }),
					markdown({ base: markdownLanguage, codeLanguages: languages }),
					EditorView.domEventHandlers({
						scroll(event, view) {
							// @ts-ignore
							// let y = Math.round(view.viewState.pixelViewport.top)
							// let cblock = view.lineBlockAtHeight(y)
							// let cline = view.state.doc.lineAt(cblock.from).number
							// let linesLength = p.value.split("\n").length
							// let editorHeight = view.contentHeight
							// syncScroll2.updateEditorInfos(p.windowId, cline, linesLength, editorHeight)
							debouncedActivateTitles();
							throttleActivateTitles();
						},
						wheel(event, view) {
							let infs = CodeMirrorUtils.getEditorInfos(view)
							syncScroll3.onEditorScroll(p.windowId, infs.currentPercentScrolled)
							p.onScroll()
						}
					}),
				]}
			/>
		</div>
	);
})

//
// CACHING MECHANISM

// export const CodeMirrorEditor = CodeMirrorEditorInt
export const CodeMirrorEditor = React.memo(CodeMirrorEditorInt,
	(np, pp) => {
		let res = true
		if (np.forceRender !== pp.forceRender) res = false
		if (np.jumpToLine !== pp.jumpToLine) res = false
		// console.log("rerendercontrol cm", res);
		return res
	})



// THEMING
//
const getCustomTheme = () => createTheme({
	theme: "light",
	settings: {
		background: "#ffffff",
		foreground: "#4D4D4C",
		caret: "#AEAFAD",
		selection: "#D6D6D6",
		selectionMatch: "#D6D6D6",
		gutterBackground: "#FFFFFF",
		gutterForeground: "#4D4D4C",
		gutterBorder: "#ddd",
		lineHighlight: "#fff",
	},
	styles: [
		{ tag: t.comment, color: "#787b80" },
		{ tag: t.definition(t.typeName), color: "#194a7b" },
		{ tag: t.typeName, color: "#194a7b" },
		{ tag: t.tagName, color: "#008a02" },
		{ tag: t.variableName, color: "#1a00db" },
		{ tag: t.heading, color: cssVars.colors.main },
		{
			tag: t.heading1,
			class: "actionable-title h1"
		},
		{
			tag: t.heading2,
			class: "actionable-title h2"
		},
		{
			tag: t.heading3,
			class: "actionable-title h3"
		},
		{ tag: t.heading4, class: "actionable-title h4" },
		{ tag: t.heading5, class: "actionable-title h5" },
		{ tag: t.heading6, class: "actionable-title h6" },
		{ tag: t.content, fontSize: "10px" }
	]
});




export const codeMirrorEditorCss = () => `
.actionable-title {
		color: ${cssVars.colors.main};
		position: relative;
		&:before {
				content: "➝";
				position: absolute;
				right: -20px;
				color: #c6c6c6;
				font-size: 18px;
				opacity: 0;
				transition: 0.2s all;
		}
		&:hover {
				&:before {
						opacity: 1
				}
		}
		&.h1 {
				font-size: 15px;
				font-weight: bold;
				text-decoration: underline;

		}
		&.h2 {
				font-size: 13px;
				text-decoration: underline;

		}
		&.h3 {
				font-size: 12px;
		}

}


.cm-matchingBracket {
		background-color: rgba(0,0,0,0)!important;
}


.cm-content {
		// font-family: 'Open sans', sans-serif;
		font-family: Consolas, monaco, monospace;
		font-size: 11px;
}

.cm-focused {
		outline: none!important;
}
.main-editor-wrapper {
    width: calc(100% + 18px);
		margin: 32px 0px 0px 0px;
    padding: 0px;
		width:100%;
		height: ${isA('desktop') ? 'calc(100% - 32px);' : 'calc(100% - 280px);'}; 
}

.codemirror-editor-wrapper {
		margin-right: 18px;
}
.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: calc(100% - 30px);
}
.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: 100% ;
		overflow:hidden;
		padding: 0px;
}
.cm-editor {
    word-break: break-all;
}
.cm-content {
		width: 100%;
		overflow:hidden;
		white-space: pre-wrap;
}
.cm-scroller {
    left: 15px;
    padding-right: 15px;
}
.cm-line {
}
.cm-cursor {
}

.cm-tooltip-autocomplete {
		padding: 10px 5px;
		background: white;
		border-radius: 5px;
		border: none;
		box-shadow: 0px 0px 5px rgba(0,0,0,0.3);
		[aria-selected="true"]{
				background: ${cssVars.colors.main};
				border-radius: 2px;
		}

}

.codemirror-mobile-fallback {
		margin: 10px;
		textarea {
				width: calc(100% - 20px);
				height: calc(100vh - 350px);
		}
}
`







///////////////////////////////////////////////////
// UTILS FUNCTIONS FOR MANIP AND CURSOR WORK
//

// interface iCodeMirrorInfos {
// 	contentHeight: number
// 	viewportHeight: number
// 	visibleFirstLine: number
// }

// const getEditorInfos = (cmView: any): iCodeMirrorInfos => {
const getEditorInfos = (cmView: any) => {
	let view = cmView
	let y = Math.round(view.viewState.pixelViewport.top)
	let cblock = view.lineBlockAtHeight(y)
	let visibleFirstLine = view.state.doc.lineAt(cblock.from).number
	let contentHeight = view.contentHeight
	// console.log(view);
	let viewportHeight = view.viewState.editorHeight
	let percentPx = (contentHeight - viewportHeight) / 100

	let currentPercentScrolled = view.viewState.pixelViewport.top / percentPx

	return {
		viewportHeight,
		contentHeight,
		visibleFirstLine,
		percentPx,
		currentPercentScrolled

	}

}


//
// UPDATING TEXT
// 
const updateText = (CMObj: any, newText: string, charPos: number) => {
	const vstate = CMObj.view.state
	const vtxt = vstate.doc.toString()
	const length = vtxt.length

	CMObj.view.dispatch(
		CMObj.view.state.update(
			{ changes: { from: 0, to: length, insert: newText } },
		)
	)
}
const updateCursor = (CMObj: any, newPos: number) => {
	log && console.log(h, " update cursor", newPos);
	setTimeout(() => {

		// CMObj.view.focus()
		try {
			CMObj.view.dispatch(
				CMObj.view.state.update(
					{ selection: EditorSelection.cursor(newPos) }
				)
			)
		} catch (e) {
			console.warn(h, "update Cursor error", e)
		}
	}, 10)
}



//
// GET CURRENT POS AND LINE
// 

// let cachedPosition = 0
// const throt = throttle((CMObj) => {
// 	cachedPosition = CMObj.view.state.selection.ranges[0].from
// }, 1000)
const getCachedPosition = (CMObj: any) => {
	// throt(CMObj)
	// cachedPosition = CMObj.view.state.selection.ranges[0].from
	return CMObj.view.state.selection.ranges[0].from
}
const getCurrentLineInfos = (CMObj: any): LineTextInfos => {
	const currentLineIndex = CMObj.view.state.doc.lineAt(CMObj.view.state.selection.main.head).number - 1
	const currentPosition = getCachedPosition(CMObj)
	const currentText = CMObj.view.state.doc.toString()
	let splitedText = currentText.split("\n");

	let res = {
		lines: splitedText,
		currentPosition,
		activeLine: splitedText[currentLineIndex] || "",
		lineIndex: currentLineIndex
	}
	return res
}


//
// GET SCROLLING LINE -> NOT USED, SHOULD BE UPDATED
// 
let cachedLine = 0
const getScrolledLine = (CMObj) => {
	intGetLine(CMObj)
	return cachedLine
}

const intGetLine = (CMObj: any) => {
	console.log("GET SCROLLING LINE -> NOT USED, SHOULD BE UPDATED");
	if (!CMObj.view) return -1

	const currentText = CMObj.view.state.doc.toString()
	const lineAtHeight = CMObj.view.elementAtHeight(CMObj.view.scrollDOM.scrollTop)
	const lineStart = lineAtHeight.from
	// split the text to lines
	const splitText = currentText.split('\n')

	let lengthFromBegin = 0
	let line = 0
	// for each line, add its length to tot length, till it is > from found
	for (let i = 0; i < splitText.length; i++) {
		lengthFromBegin += splitText[i].length
		if (lengthFromBegin < lineStart) line = i
		else break
	}

	cachedLine = line
}
// const bgGetLine = throttle(intGetLine, 100)
// const bgGetLine2 = debounce(intGetLine, 200)


//
// SCROLLTOLINE
//
const scrollToLine = (CMObj: any, lineToJump: number) => {
	let line = CMObj.view.state.doc.line(lineToJump)
	updateCursor(CMObj, line.from)

	setTimeout(() => {
		const cPosCursor = CMObj.view.state.selection.ranges[0].from
		console.log(33334, cPosCursor);
		scrollTo(CMObj, cPosCursor)
	}, 10)


}


//
// SCROLLTO (quite slow)
//
const scrollTo = (CMObj: any, posY: number) => {
	if (!CMObj.view) return -1
	CMObj.view.dispatch({
		effects: EditorView.scrollIntoView(posY, { y: "start" }),
	})
}




export const CodeMirrorUtils = {
	getEditorInfos,
	getCurrentLineInfos,
	getScrolledLine,
	updateCursor,
	updateText,
	scrollTo,
	scrollToLine,
	getCustomTheme
}

































const completionsTags = [
	{
		label: "[[l]]",
		type: "tag",
		info: "Term of content",
		apply: "[[l]]sqrt{3}[[l]]"
	},
	{ label: "[[latex]]", type: "tag", info: "Term of content" },
	{ label: "[[toc]]", type: "tag", info: "Term of content" },
	{ label: "[[hello]]", type: "tag", info: "Term of content" },
	{ label: "[[world]]", type: "tag", info: "Term of content" },
	{ label: "[[rss]]", type: "tag", info: "Term of content" },
	{ label: "[[calendar]]", type: "tag", info: "Term of content" },
	{ label: "panic", type: "keyword" },
	{ label: "park", type: "constant", info: "Test completion" },
	{ label: "password", type: "variable" }
];
function myCompletionsTags(context) {
	let before = context.matchBefore(/\[\[/);
	if (!context.explicit && !before) return null;
	return {
		from: before ? before.from : context.pos,
		options: completionsTags,
		validFor: /^\w*$/
	};
}

interface iCompletionTerm { label: string, type: string, info?: string, apply: string, detail?: string, boost?: number }
const createCompletionTerm = (label: string, toInsert?: string, info?: string, boost?: number, detail?: string): iCompletionTerm => {
	let type = "tag"
	return {
		label,
		apply: toInsert || label,
		// apply: testapply,
		info,
		detail: detail,
		type,
		boost: boost || 0
	}
}

//
// ALL COMPLETION SOURCES
//
// cached in ram + file + update
const getAllCompletionSources = (file: iFile): CompletionSource[] => {
	const completionSourceHashtags: any = getCompletionSourceHashtags(file)
	return [
		completionSourceCtag,
		completionSourceHashtags,
		completionSourceSnippets
	]
}

//
// AUTOCOMPLETE WITH SNIPPETS 
// with --
//
const completionSourceSnippets = (context) => {
	let before = context.matchBefore(/\-\-/);
	if (!context.explicit && !before) return null;
	const path = `${sharedConfig.path.configFolder}/snippets.md`
	return new Promise((reso, rej) => {
		getApi(api => {
			api.file.getContent(path, content => {
				const arr: iCompletionTerm[] = []
				const arrContent = content.split("\n")
				each(arrContent, line => {
					line = line.split("\\n").join("\n")
					let rawSnippet = line.split("|")
					let from = rawSnippet.shift()?.trim()
					let to = rawSnippet.join("|").trim()
					if (!to || !from) return
					from = "--" + from
					// if to is ${javascript} interpret it
					if (to.includes("${")) {
						let oto = to
						try { to = new Function("return `" + oto + "`")() }
						catch (e) { console.warn(h, "snippets error: ", e, oto); }
					}
					let preview = to.length > 20 ? `${to.substring(0, 20)}...` : to

					arr.push(createCompletionTerm(from, to, undefined, undefined, preview))
				})
				let res = {
					from: before ? before.from : context.pos,
					options: arr,
					validFor: /.*/
				};
				reso(res)
			})
		})
	})
}


//
// SCAN HASHTAGS FROM FOLDER
//
const getCompletionSourceHashtags = (file: iFile) => (context) => {
	let before = context.matchBefore(/\#/);
	if (!context.explicit && !before) return null;
	return new Promise((reso, rej) => {
		getApi(api => {
			api.search.hashtags(file.folder, hashs => {
				const arr: iCompletionTerm[] = []
				each(hashs.nodesArr, hash => {
					arr.push(createCompletionTerm(hash.name, hash.name))
				})
				let res = {
					from: before ? before.from : context.pos,
					options: arr,
					validFor: /.*/
				};
				reso(res)
			})
		})
	})
}

//
// SCAN ALL CTAGS AVAILABLE
//
const completionSourceCtag: CompletionSource = (context) => {
	let before = context.matchBefore(/\[\[/);
	if (!context.explicit && !before) return null;
	return new Promise((reso, rej) => {
		const path = "/.tiro/tags"
		getApi(api => {
			api.files.get(path, files => {
				const tags: iCompletionTerm[] = []
				let cnt = 0
				each(files, f => {
					const name = f.name.replace(".md", "")
					const tagname = `[[${name}]]`
					const fulltagname = `${tagname} ${tagname}`
					let completion = fulltagname
					let info = `Insert installed custom tag ${tagname}`
					let boost = 0
					api.file.getContent(f.path, content => {
						const lines = content.split("\n")
						let headerInsert = "// --insert:"
						let headerComment = "// --comment:"
						let headerBoost = "// --boost:"
						each(lines, line => {
							line = line.split("\\n").join("\n")
							if (line.startsWith(headerInsert)) {
								completion = line.replace(headerInsert, "")
							}
							if (line.startsWith(headerComment)) {
								info = line.replace(headerComment, "")
							}
							if (line.startsWith(headerBoost)) boost = parseInt(line.replace(headerBoost, ""))
						})
						tags.push(createCompletionTerm(tagname, completion, info, boost))
						cnt++
						if (cnt === files.length) triggerRes(tags)
					})
				})
			})

			const triggerRes = (tags: iCompletionTerm[]) => {
				let res = {
					from: before ? before.from : context.pos,
					options: tags,
					// validFor: /^\w*$/
					validFor: /.*/
				};
				console.log(res);
				reso(res)
			}
		})

		// if # scan for hashtags inside file + folder + caching

		// let res = {
		// 	from: before ? before.from : context.pos,
		// 	options: completionsTags,
		// 	validFor: /^\w*$/
		// };
		// setTimeout(() => {
		// 	reso(res)
		// }, 1000)

	})
}

const getLinesAndWordsSuggestions = (content) => {
	// lines
	const arr = content.split("\n");
	const res: any = [];
	for (let i = 0; i < arr.length; i++) {
		const line = arr[i];
		const preview = line.length > 20 ? line.substring(0, 20) + "... (line)" : line;
		res.push({
			label: preview,
			apply: line
		});
	}
	// words
	const words = content.split(/( |\n)/);
	let resWords: any = [];
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		let isWordArr = word.match(/[-'0-9a-zÀ-ÿ]+/gi);
		let isWord = isWordArr && isWordArr.length === 1 ? true : false;
		if (word.length > 1) {
			resWords.push({
				label: word + " (word)",
				apply: word
			});
		}
	}
	return [...resWords, ...res];
};

const myCompletionsWord = (content) => (context) => {
	let before = context.matchBefore(/.*/);
	if (!context.explicit && !before) return null;
	const allCompletions = [
		...completionsTags,
		...getLinesAndWordsSuggestions(content)
	];
	return {
		from: before ? before.from : context.pos,
		options: allCompletions,
		validFor: /.*/
	};
};


