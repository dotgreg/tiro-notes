import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useCodeMirror } from '@uiw/react-codemirror';
import { languages } from "@codemirror/language-data";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import { autocompletion } from "@codemirror/autocomplete";

export const CodeMirrorEditor = (p: {
	value: string,
}) => {

	const myCompletionsWordsGeneric = (wordsSugg) => (context) => {
		let before = context.matchBefore(/[-'0-9a-zÀ-ÿ]{2,15}/);
		if (!context.explicit && !before) return null;
		return {
			from: before ? before.from : context.pos,
			options: wordsSugg,
			validFor: /^\w*$/
		};
	};

	const completionFn = useRef<any>(() => { });

	useEffect(() => {
		let totLorem = "";
		for (let i = 0; i < 10000; i++) {
			// totLorem += i + " == > " + lorem;
		}
		setVal(code + totLorem);
	}, []);
	const [val, setVal] = useState(code);

	useEffect(() => {
		if (val.length > 10000) return;
		const wordsSugg = getLinesAndWordsSuggestions(val);
		completionFn.current = myCompletionsWordsGeneric(wordsSugg);
	}, [val]);

	//const completionFromLine = myCompletionsWord(code)


	const wrapperRef = useRef<any>()
	// const cmRef = useRef<ReactCodeMirrorRef | null>(null)
	// console.log();
	// cmRef.current?.view?.lineWrapping = false

	// const extensions = [];
	// const editor = useRef<any>(null)
	// const cm = useCodeMirror({
	// 	container: editor.current,
	// 	extensions,
	// 	value: code,
	// });

	// console.log(2222, cm.view);
	// useEffect(() => {
	// 	if (editor.current) {
	// 		cm.setContainer(editor.current);
	// 	}
	// }, [editor.current]);

	return (
		<div ref={wrapperRef} className="codemirror-editor-wrapper">
			<CodeMirror
				value={p.value}
				// ref={editor}
				theme={myTheme}
				basicSetup={{
					foldGutter: false,
					dropCursor: false,
					allowMultipleSelections: false,
					indentOnInput: false,
					closeBrackets: false,
					lineNumbers: false
				}}
				onChange={(e) => {
					setVal(e);
				}}
				extensions={[
					autocompletion({ override: [completionFn.current, myCompletionsTags] }),
					markdown({ base: markdownLanguage, codeLanguages: languages })
				]}
			/>
		</div>
	);
}


// <div ref={editor} ></div>
// <CodeMirror
// 	value={val}
// 	ref={editor}
// 	theme={myTheme}
// 	basicSetup={{
// 		foldGutter: false,
// 		dropCursor: false,
// 		allowMultipleSelections: false,
// 		indentOnInput: false,
// 		closeBrackets: false,
// 		lineNumbers: false
// 	}}
// 	onChange={(e) => {
// 		setVal(e);
// 	}}
// 	extensions={[
// 		autocompletion({override: [completionFn.current, myCompletionsTags] }),
// 		markdown({base: markdownLanguage, codeLanguages: languages })
// 	]}
// />

export const codeMirrorEditorCss = () => `
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

// npm i @codemirror/lang-markdown @codemirror/language-data @uiw/codemirror-themes @lezer/highlight @codemirror/autocomplete --save --legacy-peer-deps 


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
	//console.log(3331, words)
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
	//console.log(3332, resWords)

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

const lorem = `Lorem ipsum dolor sit amet,\n consectetur adipiscing elit\n, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n`;

const code = `## Title

\`\`\`jsx
function Demo() {
		return <div>demo</div>
}
\`\`\`
- [ ] [[hello]]

\`\`\`bash
# Not dependent on uiw.
npm install @codemirror/lang-markdown --save
npm install @codemirror/language-data --save
\`\`\`

bonjour je m'appelle machin truc bidule

[weisit ulr](https://uiwjs.github.io/react-codemirror/)

\`\`\`go
package main
import "fmt"
func main() {
  fmt.Println("Hello, 世界")
}
\`\`\`
`;

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
