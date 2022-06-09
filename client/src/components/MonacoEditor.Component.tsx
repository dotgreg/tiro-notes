import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { cssVars } from '../managers/style/vars.style.manager';
import styled from '@emotion/styled'
import { initVimMode } from 'monaco-vim';
import { LineTextInfos } from '../managers/textEditor.manager';
import { onScrollFn } from './dualView/EditorArea.component';

export let monacoEditorInstance: any
export const resetMonacoSelectionExt = () => {
	if (!monacoEditorInstance) return
	let selection = {
		endColumn: 0,
		endLineNumber: 0,
		startColumn: 0,
		startLineNumber: 0
	}
	monacoEditorInstance.setSelection(selection)
}

export type OnCursorChangeFn = (p: { word: string, line: string, position: { lineNumber: number, column: number } }) => void

export class MonacoEditorWrapper extends React.Component<{
	value: string,
	vimMode: boolean,
	posY: number
	readOnly: boolean,
	insertUnderCaret?: string
	onMaxYUpdate?: Function



	onChange: (text: string) => void
	onScroll: onScrollFn
	onUpdateY: onScrollFn
	onCursorChange: OnCursorChangeFn
	onKeyDown: (keyCode: string) => void

}, {}> {
	reactComp: any
	vimStatusBar: any
	constructor(props: any) {
		super(props);
		this.reactComp = React.createRef()
		this.vimStatusBar = React.createRef()
	}




	editor: any
	monaco: any









	///////////////////////////////////////////////////////
	// EDITOR MOUNTED
	//
	editorDidMount = (editor: any, monaco: any) => {
		if (this.props.vimMode) {
			console.log('[MONACO EDITOR] vim mode started', this.vimStatusBar.current);
			initVimMode(editor, this.vimStatusBar.current)
		}
		this.editor = editor
		this.monaco = monaco
		monacoEditorInstance = editor

		const updatePosY = () => {
			const nY = editor.getScrollTop()
			this.props.onUpdateY(nY)
		}

		// // on scroll change, update Y
		// editor.onDidScrollChange((e) => {
		// 	updateScrollY()
		// });

		// on scroll change, update Y
		console.log(1515, editor);
		editor.onKeyDown((e: any) => {
			// console.log(15154, e);
			this.props.onKeyDown(e.code.toLowerCase())
		})
		editor.onDidChangeCursorPosition((e: any) => {
			// console.log(15152, e);
			if (e.source !== 'keyboard' && e.source !== 'mouse') return
			const pos = e.position
			const model = editor.getModel()
			// console.log(1515111, pos);
			const wordObj = model.getWordAtPosition(pos)
			const line = model.getLineContent(pos.lineNumber)
			// console.log(15156, e, word);
			if (!wordObj) return
			this.props.onCursorChange({ word: wordObj.word, line, position: pos })
		})
		editor.onMouseDown((e: any) => {
			// const pos = e.target.position
			// const model = editor.getModel()
			// const word = model.getWordAtPosition(pos)
			// // console.log(1414, e, pos, word);
			// if (!word) return
			// this.props.onWordHover(word)
		})


		editor.updateOptions({ wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?' })
		monaco.languages.setLanguageConfiguration('markdown', {
			// Allow square brackets to be part of a word.
			wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\{\}\\\|\;\:\"\,\.\<\>\/\?\s]+)/g,
		})



		editor.onDidChangeCursorPosition((e) => {
			updatePosY()
		});

		// monaco.languages.setLanguageConfiguration('markdown', {
		// 	wordPattern: /'?\w[\w\]\['-.]*[?!,;:"]*/
		// });

		//@ts-ignore
		window.editor = editor
		//@ts-ignore
		window.monaco = monaco
		// const monokai = require('monaco-themes/themes/Monokai.json');
		// monaco.editor.defineTheme('monokai', monokai);
		// monaco.editor.setTheme('monokai');
		monaco.editor.defineTheme('customLightTheme', {
			base: 'vs',
			inherit: true,
			rules: [{ foreground: cssVars.colors.fontEditor }],
			colors: {
				// 'editor.foreground': cssVars.colors.font.light,
				// 'editor.background': cssVars.colors.bg.black,
				// 'editor.foreground': ''cssVars.colors.editor.font'',
				// 'editor.background': cssVars.colors.bg.light,
				'editor.background': cssVars.colors.bgEditor,
			}
		});


		monaco.editor.setTheme('customLightTheme');
		setTimeout(() => {
			//this.resetMonacoSelection();
		}, 100)

	} // END ON DID MOUNT





	//
	// click on word check
	//

	resetMonacoSelection = () => {
		const sel = this.editor.getSelection()
		if (!sel) return
		let selection = {
			endColumn: sel.startColumn,
			endLineNumber: sel.startLineNumber,
			startColumn: sel.startColumn,
			startLineNumber: sel.startLineNumber,
		}
		this.editor.setSelection(selection)
	}
	//
	// LINE MANAGER
	//
	getCurrentLineInfos = (): LineTextInfos => {
		let position = this.editor.getPosition();
		let text = this.editor.getValue(position) as string;
		let splitedText = text.split("\n");
		// this.editor.getPosition()
		let currentPosition = splitedText.slice(0, position.lineNumber - 1).join('\n').length + position.column - 1

		return {
			monacoPosition: this.editor.getPosition(),
			lines: splitedText,
			currentPosition,
			activeLine: splitedText[position.lineNumber - 1],
			lineIndex: position.lineNumber - 1
		}
	}

	shouldComponentUpdate(nextProps: any, nextState: any, nextContext: any) {

		if (this.props.posY !== nextProps.posY || this.props.value !== nextProps.value) {
			this.editor.setScrollPosition({ scrollTop: this.props.posY });
		}


		// TO REMOVE BUG : highlight everything on load
		if (this.props.value.length === 0 && this.props.value.length !== nextProps.value.length) {
			setTimeout(() => {
				this.resetMonacoSelection();
			}, 1)

			// update maxHeight when content updates
			const editor = this.reactComp.current
			if (editor && editor.containerElement) {
				const contentContainer = this.reactComp.current.containerElement.querySelectorAll('.view-lines')[0]
				setTimeout(() => {
					if (this.props.onMaxYUpdate) {
						const height = contentContainer.clientHeight
						// console.log('00331', height);
						this.props.onMaxYUpdate(height)
					}
				}, 1000)
			}

		}

		// if (this.props.insertUnderCaret !== nextProps.insertUnderCaret && nextProps.insertUnderCaret !== '') {
		//   console.log(`[MONACO EDITOR] insert under Caret ${nextProps.insertUnderCaret}`);
		//   this.editor.trigger('keyboard', 'type', {text: nextProps.insertUnderCaret});
		// }
		return true
	}

	render() {
		return (
			<div className="monaco-editor-wrapper">

				<div
					className={`vim-status-bar ${this.props.vimMode ? `active` : ``}`}
					ref={this.vimStatusBar}>
				</div>
				<MonacoEditor
					ref={this.reactComp}
					width="100%"
					height="100%"
					language="markdown"
					theme="vs"
					value={this.props.value}
					options={{
						fontFamily: cssVars.font.editor,
						readOnly: this.props.readOnly,
						quickSuggestions: false,
						automaticLayout: true,
						selectOnLineNumbers: true,
						minimap: { enabled: false },
						wordWrap: 'on',
						fontSize: 11,
						mouseWheelScrollSensitivity: 0.5,
						lineNumbers: 'off',
						// glyphMargin: false,

						renderIndentGuides: false,
						folding: false,
						// smoothScrolling: true,

						scrollbar: {
							handleMouseWheel: true,
							verticalScrollbarSize: 0,
							horizontal: "hidden",
						}
					}}
					editorDidMount={this.editorDidMount}
					onChange={(text) => {
						this.props.onChange(text)
					}}
				// editorDidMount={this.reactCompDidMount}
				/>
			</div>
		);
	}
}

export const monacoColorsCss = () => `
  [class^="mtk"]:not(.mtk1) {
    // color: ${cssVars.colors.main};
    font-weight: 800;
  }
  .mtk6 {color: ${cssVars.colors.main};}
  .mtk21 {color: ${cssVars.colors.main};}

  .mtk10 {color: ${cssVars.colors.compl[1]};} // () =>
  .mtk8 {color: ${cssVars.colors.compl[0]};} // comments
  .mtk7 {color: ${cssVars.colors.compl[0]};}  //  = 0o775
  .mtk23 {color: ${cssVars.colors.compl[0]};} // Promise

  // .mtk10 {color: ${cssVars.colors.dev[1]};} // () =>
  // .mtk8 {color: ${cssVars.colors.dev[2]};} // comments
  // .mtk7 {color: ${cssVars.colors.dev[2]};}  //  = 0o775
  // .mtk23 {color: ${cssVars.colors.dev[2]};} // Promise

  .mtk1 {}
  .mtk1 {}
  .mtk1 {}
  .mtk1 {}
  .mtk1 {}
  .mtk1 {}
  // .mtk6 {
  //   color: ${cssVars.colors.main};
  // }
  .monaco-editor .scroll-decoration {
    box-shadow: none;
  }


		.view-overlays .current-line {
				display:none;
		}
`

export const monacoEditorCss = () => `
.monaco-editor-wrapper {
    height: 100%;
    .scroll-wrapper {
      width: 100%;
      height: 100%;
    }
    .vim-status-bar {
      &.active {
        display: block
      }
      display: none;
      position: fixed;
      bottom: 0px;
      height: 18px;
      padding: 5px 5px 7px 5px;
      width: 80%;
      z-index: 1;
      background: rgba(255,255,255,0.9);
      input {
        background: #eeeeee;
        border: none;
        margin: 0px 5px;
      }
    }
    }
`;
