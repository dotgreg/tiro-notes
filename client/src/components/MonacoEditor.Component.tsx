import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { cssVars } from '../managers/style/vars.style.manager';
import styled from '@emotion/styled'
import { initVimMode } from 'monaco-vim';
import { LineTextInfos } from '../managers/textEditor.manager';
import { onScrollFn } from './dualView/EditorArea.component';

export let monacoEditorInstance: any
export const resetMonacoSelection = () => {
	if (!monacoEditorInstance) return
	let selection = {
		endColumn: 0,
		endLineNumber: 0,
		startColumn: 0,
		startLineNumber: 0
	}
	monacoEditorInstance.setSelection(selection)
}

export class MonacoEditorWrapper extends React.Component<{
	value: string,
	vimMode: boolean,
	posY: number
	readOnly: boolean,
	onChange: (text: string) => void
	onScroll: onScrollFn
	insertUnderCaret?: string
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
	editorDidMount = (editor: any, monaco: any) => {
		if (this.props.vimMode) {
			console.log('[MONACO EDITOR] vim mode started', this.vimStatusBar.current);
			initVimMode(editor, this.vimStatusBar.current)
		}
		this.editor = editor
		this.monaco = monaco
		monacoEditorInstance = editor

		editor.onDidScrollChange((e) => {
			this.props.onScroll(e.scrollTop)
		});

		//@ts-ignore
		window.monaco = monaco
		// const monokai = require('monaco-themes/themes/Monokai.json');
		// monaco.editor.defineTheme('monokai', monokai);
		// monaco.editor.setTheme('monokai');
		monaco.editor.defineTheme('customLightTheme', {
			base: 'vs',
			inherit: true,
			rules: [{ foreground: cssVars.colors.editor.font }],
			colors: {
				// 'editor.foreground': cssVars.colors.font.light,
				// 'editor.background': cssVars.colors.bg.black,
				// 'editor.foreground': ''cssVars.colors.editor.font'',
				// 'editor.background': cssVars.colors.bg.light,
				'editor.foreground': 'red',
				// 'editor.background': 'red',
			}
		});


		monaco.editor.setTheme('customLightTheme');
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

		// if (this.props.insertUnderCaret !== nextProps.insertUnderCaret && nextProps.insertUnderCaret !== '') {
		//   console.log(`[MONACO EDITOR] insert under Caret ${nextProps.insertUnderCaret}`);
		//   this.editor.trigger('keyboard', 'type', {text: nextProps.insertUnderCaret});
		// }
		return true
	}

	render() {
		return (
			<StyledWrapper>

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
						fontSize: 12,
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
			</StyledWrapper>
		);
	}
}

export const monacoColorsCss = `
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


.view-overlaysd  {
		display: none;
		}
// do not show bars
.view-overlayds div {
		display: none!important;
		}
`

const StyledWrapper = styled.div`
    height: 100vh;
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
`
