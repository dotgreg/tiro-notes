import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { appFontFamily, styleApp } from '../managers/style.manager';
import styled from '@emotion/styled'
import { initVimMode } from 'monaco-vim';
import { LineTextInfos } from '../managers/textEditor.manager';
import { onScrollFn } from './dualView/EditorArea.component';

export let monacoEditorInstance: any

export class MonacoEditorWrapper extends React.Component<{
  value:string,
  vimMode:boolean,
  posY:number
  readOnly:boolean,
  onChange:(text:string)=>void
  onScroll:onScrollFn
  insertUnderCaret?:string
},{}> {
  reactComp:any
  vimStatusBar:any
  constructor(props:any) {
    super(props);
    this.reactComp = React.createRef()
    this.vimStatusBar = React.createRef()
  }

  editor:any
  monaco:any
  editorDidMount = (editor:any, monaco:any) => {
    if (this.props.vimMode) {
      console.log('[MONACO EDITOR] vim mode started', this.vimStatusBar.current);
      initVimMode(editor, this.vimStatusBar.current)
    }
    this.editor = editor
    this.monaco = monaco
    monacoEditorInstance = editor

    editor.onDidScrollChange( (e) =>{
      this.props.onScroll(e.scrollTop)
    });

    //@ts-ignore
    window.monaco = monaco
    
    monaco.editor.defineTheme('customLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [{ background: 'EDF9FA' }],
      colors: {
          'editor.foreground': '#000000',
          'editor.background': styleApp.colors.bg.light,
      }
    });


    monaco.editor.setTheme('customLightTheme');
  }


  //
  // LINE MANAGER
  //
  getCurrentLineInfos = ():LineTextInfos => {
    let position = this.editor.getPosition();
    let text = this.editor.getValue(position) as string;
    let splitedText = text.split("\n");
    // this.editor.getPosition()
    let currentPosition = splitedText.slice(0,position.lineNumber-1).join('\n').length + position.column - 1
    
    return {
      monacoPosition: this.editor.getPosition(),
      lines:splitedText,
      currentPosition,
      activeLine: splitedText[position.lineNumber-1],
      lineIndex: position.lineNumber-1
    }
  }

  shouldComponentUpdate ( nextProps: any,  nextState: any, nextContext: any) { 
    
    if (this.props.posY !== nextProps.posY) {
      this.editor.setScrollPosition({scrollTop: this.props.posY});
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
            width="110%"
            height="100%"
            language="markdown"
            theme="vs"
            value={this.props.value}
            options={{
              fontFamily:'sans-serif',
              readOnly: this.props.readOnly,
              automaticLayout: true,
              selectOnLineNumbers: true,
              minimap: {enabled: false},
              wordWrap: 'on',
              fontSize: 12,
              mouseWheelScrollSensitivity: 0.5,
              lineNumbers: 'off',
              // glyphMargin: false,
              folding: false,
              // smoothScrolling: true,
              scrollbar: {
                handleMouseWheel: false,
                verticalScrollbarSize: 0,
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

const StyledWrapper  = styled.div`
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