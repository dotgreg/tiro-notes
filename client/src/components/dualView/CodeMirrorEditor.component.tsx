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
import { debounce, random, throttle } from "lodash";
import { cssVars } from "../../managers/style/vars.style.manager";
import { syncScroll2 } from "../../hooks/syncScroll.hook";


const CodeMirrorEditorInt = forwardRef((p: {
	windowId: string,

	value: string,
	onChange: (text: string) => void

	posY: number
	jumpToLine: number

	forceRender: number
}, forwardedRef) => {

	///////////////////////////////////
	// v3 => working with no state and dispatch only => KEEPING CURSOR MAIS PERDS SI PLUSIEURS IMGS UPLOADED...

	// => pb parfois quand currentPosition, celui-ci renvoie 0, est perdu
	// => S1 => fixer cpos => nope, ca donne meme result, a un moment il insere a 0

	// => S2 => BOOOOF ralentir quand insertAt avec un setTimeout tt 100ms?
	// => S3 => si on stabilise lineInfos, est-ce stable? => OUIII
	// => S3b => du coup, cacher les vals, 1ere val on prend direct, puis tt autres req retourne cette cached avec un debounce update


	const getEditorObj = (): any => {
		// @ts-ignore
		const f: any = forwardedRef.current
		if (!f || !f.state) return null
		return f
	}

	// useEffect(() => {
	// 	console.log(3332);
	// }, [p.onChange]);

	// useEffect(() => {
	// 	const f = getEditorObj()
	// 	f.view.contentAttrs.autocorrect = false
	// 	f.view.contentAttrs.contenteditable = false
	// }, []);


	const histVal = useRef("")
	useEffect(() => {
		const f = getEditorObj()
		// @ts-ignore
		window.cmobj = f
		if (!f) return
		// f.view.contentAttrs.autocorrect = false
		// f.view.contentAttrs.contenteditable = "false"

		// document.querySelector(".cm-content").
		// @ts-ignore
		document.querySelector(".cm-content").contentEditable = true
		// @ts-ignore
		document.querySelector(".cm-content").autoCorrect = false


		if (p.value === histVal.current) return
		if (p.value === "loading...") return
		if (f.view.state.doc.toString() === p.value) return
		const li = CodeMirrorUtils.getCurrentLineInfos(f)
		const cpos = li.currentPosition
		CodeMirrorUtils.updateText(f, p.value, cpos)
		CodeMirrorUtils.updateCursor(f, cpos)

		histVal.current = p.value
	}, [p.value]);

	const onChange = (value, viewUpdate) => {
		p.onChange(value)
	}




	useEffect(() => {
		const f = getEditorObj()
		if (!f) return
		if (p.posY <= -10) return
		// f.view.scrollDOM.scrollTop = p.posY
		// f.view.scrollDOM.scrollTop = p.posY
		// CodeMirrorUtils.scrollTo(f, p.posY)
	}, [p.posY])


	useEffect(() => {
		console.log("JUMP COODEMIRROR", p.jumpToLine);
		if (p.jumpToLine === -1) return
		const f = getEditorObj()
		if (!f) return
		if (p.posY <= -10) return
		// f.view.scrollDOM.scrollTop = p.posY
		// f.view.scrollDOM.scrollTop = 200
		// CodeMirrorUtils.scrollTo(f, 200)
		CodeMirrorUtils.scrollToLine(f, p.jumpToLine)
	}, [p.jumpToLine])





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
					// scrollBarStyle: null,
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
						}
					}),
					// EditorView.contentAttributes({autocorrect: "off"})
				]}
			/>
		</div>
	);
})
export const CodeMirrorEditor = React.memo(CodeMirrorEditorInt,
	(np, pp) => {
		// console.log(np.value.length - pp.value.length);
		// console.log(np.value, pp.value);
		// console.log(np, pp);
		// if edition diff is more than 2 chars, reupdate content 
		// if (Math.abs(np.value.length - pp.value.length) > 10) {
		// return false // updaaaaate
		// }
		if (
			np.value !== pp.value &&
			np.forceRender !== pp.forceRender
		) return false

		if (np.jumpToLine !== pp.jumpToLine) return false
		return true
	})


// export const codeMirrorEditorCss = () => `
// `
export const codeMirrorEditorCss = () => `
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
		margin: 32px 0px 0px 0px!important;
    padding: 0px!important;
		width:100%!important;
		height: calc(100% - 32px)!important;
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
	// @ts-ignore
	// window.cmobj = CMObj;
	const vstate = CMObj.view.state
	const vtxt = vstate.doc.toString()
	const length = vtxt.length

	const dstate = CMObj.state
	const dtxt = dstate.doc.toString()
	const dlen = dtxt.length
	// console.log(55512, vtxt, dtxt, newText);

	CMObj.view.dispatch(
		CMObj.view.state.update(
			{ changes: { from: 0, to: length, insert: newText } },
			// { selection: EditorSelection.single(charPos) }
		)
	)
}
const updateCursor = (CMObj: any, newPos: number) => {
	console.log(555, "CM update cursor", newPos);
	setTimeout(() => {

		// CMObj.view.focus()
		try {
			CMObj.view.dispatch(
				CMObj.view.state.update(
					{ selection: EditorSelection.cursor(newPos) }
				)
			)
		} catch (e) {
			console.warn("update Cursor", e)
		}
	}, 10)
}



//
// GET CURRENT POS AND LINE
// 
// as getPosition is quite unstable, cache it to stabilize it
let cachedPosition = 0
const throt = throttle((CMObj) => {
	cachedPosition = CMObj.view.state.selection.ranges[0].from
}, 1000)
const getCachedPosition = (CMObj: any) => {
	throt(CMObj)
	return cachedPosition
}
const getCurrentLineInfos = (CMObj: any): LineTextInfos => {
	const currentLineIndex = CMObj.view.state.doc.lineAt(CMObj.view.state.selection.main.head).number
	const currentPosition = getCachedPosition(CMObj)
	const currentText = CMObj.view.state.doc.toString()
	let splitedText = currentText.split("\n");

	let res = {
		lines: splitedText,
		currentPosition,
		activeLine: splitedText[currentLineIndex] || "",
		lineIndex: currentLineIndex
	}
	// console.log(555, "CM getInfos", res);
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
	// console.log(666, lineToJump, lengthFromBegin);
	// scrollTo(CMObj, lengthFromBegin)
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
		lineHighlight: "#fff"
	},
	styles: [
		{ tag: t.comment, color: "#787b80" },
		{ tag: t.definition(t.typeName), color: "#194a7b" },
		{ tag: t.typeName, color: "#194a7b" },
		{ tag: t.tagName, color: "#008a02" },
		{ tag: t.variableName, color: "#1a00db" },
		{ tag: t.heading, color: cssVars.colors.main },
		{ tag: t.heading1, color: cssVars.colors.main, fontSize: "15px", fontWeight: "bold", textDecoration: "underline" },
		{ tag: t.heading2, color: cssVars.colors.main, fontSize: "13px", fontWeight: "normal", textDecoration: "underline" },
		{ tag: t.heading3, color: cssVars.colors.main, fontSize: "12px" },
		// { tag: t.lineHighlight, color: cssVars.colors.main, fontSize: "12px" },
		{ tag: t.heading4, color: cssVars.colors.main },
		{ tag: t.heading5, color: cssVars.colors.main },
		{ tag: t.heading6, color: cssVars.colors.main },
		{ tag: t.string, color: cssVars.colors.main }
	]
});



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


