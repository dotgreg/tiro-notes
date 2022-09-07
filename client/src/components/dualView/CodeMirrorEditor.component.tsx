import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useCodeMirror } from '@uiw/react-codemirror';
import { languages } from "@codemirror/language-data";
import { autocompletion } from "@codemirror/autocomplete";

import { LineTextInfos } from "../../managers/textEditor.manager";
import { tags as t } from "@lezer/highlight";

import { createTheme } from "@uiw/codemirror-themes";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { debounce, each, random, throttle } from "lodash";
import { cssVars } from "../../managers/style/vars.style.manager";
import { syncScroll2 } from "../../hooks/syncScroll.hook";
import { useDebounce, useThrottle } from "../../hooks/lodash.hooks";
import { isA } from "../../managers/device.manager";


const h = `[Code Mirror]`
const CodeMirrorEditorInt = forwardRef((p: {
	windowId: string,

	value: string,
	onChange: (text: string) => void

	posY: number
	jumpToLine: number

	forceRender: number

	// using it for title scrolling, right now its more title clicking
	onScroll: (lineNb: number) => void
}, forwardedRef) => {


	const getEditorObj = (): any => {
		// @ts-ignore
		const f: any = forwardedRef.current
		if (!f || !f.state) return null
		return f
	}

	const histVal = useRef("")
	useEffect(() => {
		const f = getEditorObj()
		// @ts-ignore
		window.cmobj = f
		if (!f) return

		// // @ts-ignore
		// document.querySelector(".cm-content").contentEditable = true
		// // @ts-ignore
		// document.querySelector(".cm-content").autoCorrect = false


		if (p.value === histVal.current) return
		if (p.value === "loading...") return
		if (f.view.state.doc.toString() === p.value) return
		const li = CodeMirrorUtils.getCurrentLineInfos(f)
		const cpos = li.currentPosition
		CodeMirrorUtils.updateText(f, p.value, cpos)

		// was just for not losing cursor after upload, but did it directly there
		// CodeMirrorUtils.updateCursor(f, cpos)

		histVal.current = p.value
	}, [p.value]);

	const onChange = (value, viewUpdate) => {
		// do not trigger change if value didnt changed from p.value (on file entering)
		if (value === p.value) return
		debouncedActivateTitles()
		p.onChange(value)
	}


	//
	// JUMP TO LINE
	//
	useEffect(() => {
		console.log(h, "JUMP to line :", p.jumpToLine);
		if (p.jumpToLine === -1) return
		const f = getEditorObj()
		if (!f) return
		if (p.posY <= -10) return
		CodeMirrorUtils.scrollToLine(f, p.jumpToLine)
	}, [p.jumpToLine])






	//
	// ON TITLE HOVER, CREATE A LINK
	//

	const onAction2 = () => { }
	const onAction = (event) => {
		let title = event.target.innerHTML.replace(/^#{1,6} /, "");
		const f = getEditorObj()
		if (!f) return
		const infs = CodeMirrorUtils.getCurrentLineInfos(f)
		console.log(h, "CLICK ON TITLE DETECTED", title, infs);
		p.onScroll(infs.lineIndex)
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
	}, [p.value])


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
					autocompletion({ override: [myCompletionsTags] }),
					markdown({ base: markdownLanguage, codeLanguages: languages }),
					EditorView.domEventHandlers({
						scroll(event, view) {
							// @ts-ignore
							syncScroll2.editorToPreview(p.windowId)

							debouncedActivateTitles();
							throttleActivateTitles();
						}
					}),
				]}
			/>
		</div>
	);
})

//
// CACHING MECHANISM
export const CodeMirrorEditor = React.memo(CodeMirrorEditorInt,
	(np, pp) => {
		if (
			np.value !== pp.value &&
			np.forceRender !== pp.forceRender
		) return false

		if (np.jumpToLine !== pp.jumpToLine) return false
		return true
	})


//
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

.main-title:before {
		content:'x<div class="woop">ww</div>';
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
		margin: 32px 0px 0px 0px;
    padding: 0px;
		width:100%;
		height: ${isA('desktop') ? 'calc(100% - 32px);' : 'calc(100% - 140px);'}; 
}

.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: calc(100% - 30px);
}
.codemirror-editor-wrapper, 	.cm-editor, .cm-theme {
		height: 100% ;
		overflow:hidden;
		padding: 3px;
}
.cm-content {
		width: 100%;
		overflow:hidden;
		white-space: pre-wrap;
}
.cm-scroller {
		/* display: none!important; */
		// overflow: hidden;
    left: 15px;
    padding-right: 18px;
}
`






///////////////////////////////////////////////////
// UTILS FUNCTIONS FOR MANIP AND CURSOR WORK
//


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
	console.log(h, " update cursor", newPos);
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
// GET SCROLLING LINE
// 
let cachedLine = 0
const getScrolledLine = (CMObj) => {
	intGetLine(CMObj)
	return cachedLine
}

const intGetLine = (CMObj: any) => {
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
const bgGetLine = throttle(intGetLine, 100)
const bgGetLine2 = debounce(intGetLine, 200)


//
// SCROLLTOLINE
//
const scrollToLine = (CMObj: any, lineToJump: number) => {
	// const lineAtHeight = CMObj.view.elementAtHeight(CMObj.view.scrollDOM.scrollTop)
	// find the char to jump to 
	const currentText = CMObj.view.state.doc.toString()
	const splitText = currentText.split('\n')
	let lengthFromBegin = 0
	// for each line, add its length to tot length, till it is > from found
	for (let i = 0; i < lineToJump + 1; i++) {
		lengthFromBegin += splitText[i].length
	}

	updateCursor(CMObj, lengthFromBegin + 2)

	setTimeout(() => {
		const cPosCursor = CMObj.view.state.selection.ranges[0].from
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


