import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useCodeMirror } from '@uiw/react-codemirror';
import { languages } from "@codemirror/language-data";
import { autocompletion } from "@codemirror/autocomplete";

import { LineTextInfos } from "../../managers/textEditor.manager";
import { tags as t } from "@lezer/highlight";

import { createTheme } from "@uiw/codemirror-themes";
import { EditorSelection, EditorState } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { debounce, throttle } from "lodash";



export const CodeMirrorEditor = forwardRef((p: {
	value: string,
	onChange: (text: string) => void

	// onInit: (CMObj: any) => void
}, forwardedRef) => {

	///////////////////////////////////
	// v3 => working with no state and dispatch only => KEEPING CURSOR MAIS PERDS SI PLUSIEURS IMGS UPLOADED...

	// => pb parfois quand currentPosition, celui-ci renvoie 0, est perdu
	// => S1 => fixer cpos => nope, ca donne meme result, a un moment il insere a 0

	// => S2 => BOOOOF ralentir quand insertAt avec un setTimeout tt 100ms?
	// => S3 => si on stabilise lineInfos, est-ce stable? => OUIII
	// => S3b => du coup, cacher les vals, 1ere val on prend direct, puis tt autres req retourne cette cached avec un debounce update


	const histVal = useRef("")
	useEffect(() => {
		// @ts-ignore
		const f: any = forwardedRef.current
		if (f && f.state) {
			if (p.value === histVal.current) return
			if (p.value === "loading...") return
			if (f.view.state.doc.toString() === p.value) return
			const li = CodeMirrorUtils.getCurrentLineInfos(f)
			const cpos = li.currentPosition
			// const cpos = 100
			// console.log(55567, li.currentPosition, cpos);
			console.log(5556, 'UPDATE FROM OUTSIDE', p.value, cpos)
			CodeMirrorUtils.updateText(f, p.value, cpos)
			CodeMirrorUtils.updateCursor(f, cpos)

			histVal.current = p.value
		}
	}, [p.value]);

	const onChange = (value, viewUpdate) => {
		if (value === p.value) return
		console.log(5554, "on change update, new val=>", value, p.value);
		p.onChange(value)
		histVal.current = value
	}

	///////////////////////////////////
	// v2 => working fine, but linejump on imageupload
	//
	// const onChange = (value, viewUpdate) => {
	// 	if (value === p.value) return
	// 	console.log(444, "on change update, new val=>", value, p.value);
	// 	p.onChange(value)
	// }


	///////////////////////////////////
	// v1 => intervertissement quand note switch...
	//
	// const ignoreChange = useRef(false)
	// const innerVal = useRef("")
	// useEffect(() => {
	// 	// @ts-ignore
	// 	const f: any = forwardedRef.current
	// 	if (f && f.state) {
	// 		if (p.value === innerVal.current) return
	// 		innerVal.current = p.value
	// 		console.log(5556, 'UPDATE FROM OUTSIDE', innerVal.current);
	// 		CodeMirrorUtils.update.text(f, innerVal.current)
	// 		ignoreChange.current = true
	// 	}
	// }, [p.value]);



	// ON UPDATE
	// const onChange = React.useCallback((value, viewUpdate) => {
	// 	if (ignoreChange.current) {
	// 		ignoreChange.current = false
	// 	} else {
	// 		console.log('55577 ONEDIT', p.value, value);
	// 		p.onChange(value)
	// 	}
	// }, []);








	/////
	// v0
	//

	// const recordedCursorPos = useRef(0)

	// useEffect(() => {
	// 	// @ts-ignore
	// 	const f: any = forwardedRef.current

	// 	if (f && f.state) {
	// 		console.log(55592, recordedCursorPos.current);
	// 		CodeMirrorUtils.updateCursorPosition(f, recordedCursorPos.current)
	// 	}
	// }, [p.value]);

	// const onChange = React.useCallback((value, viewUpdate) => {
	// 	p.onChange(value)

	// 	// @ts-ignore
	// 	const f: any = forwardedRef.current

	// 	if (f && f.state) {
	// 		const cPos = CodeMirrorUtils.getCurrentLineInfos(f).currentPosition
	// 		if (cPos !== 0) {
	// 			recordedCursorPos.current = cPos
	// 			console.log(5559, recordedCursorPos.current);
	// 		}
	// 	}
	// }, []);

	return (
		<div className="codemirror-editor-wrapper">
			<CodeMirror
				// value={p.value}
				value=""
				ref={forwardedRef as any}
				// ref={forwardedRef as any}
				theme={myTheme}
				onChange={onChange}
			/>
		</div>
	);
})







///////////////////////////////////////////////////
// UTILS FUNCTIONS FOR MANIP AND CURSOR WORK
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

	console.log(555, "CM getInfos", res);
	return res
}

export const CodeMirrorUtils = {
	getCurrentLineInfos,
	update: {
		cursor: updateCursor,
		text: updateText
	},
	updateCursor,
	updateText
}

































export const codeMirrorEditorCss = () => `
`
export const codeMirrorEditorCss2 = () => `
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
		}
	.cm-content {
width: 100%;
			overflow:hidden;
				white-space: pre-wrap;
	}
`


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
		//if (isWord) console.log(333, word, isWord, isWordArr)
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


const myTheme = createTheme({
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
		lineHighlight: "#EFEFEF"
	},
	styles: [
		{ tag: t.comment, color: "#787b80" },
		{ tag: t.definition(t.typeName), color: "#194a7b" },
		{ tag: t.typeName, color: "#194a7b" },
		{ tag: t.tagName, color: "#008a02" },
		{ tag: t.variableName, color: "#1a00db" },
		{ tag: t.heading, color: "red" },
		{ tag: t.heading1, color: "red" },
		{ tag: t.heading2, color: "red" },
		{ tag: t.heading3, color: "red" },
		{ tag: t.heading4, color: "red" },
		{ tag: t.heading5, color: "red" },
		{ tag: t.heading6, color: "red" }
	]
});
