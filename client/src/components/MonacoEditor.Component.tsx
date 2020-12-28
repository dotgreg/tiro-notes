import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { styleApp } from '../managers/style.manager';
import styled from '@emotion/styled'
import { initVimMode } from 'monaco-vim';

export class MonacoEditorWrapper extends React.Component<{
  value:string,
  vimMode:boolean,
  onChange:(text:string)=>void
  insertUnderCaret:string
  posY:number
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
    // console.log('didmount', editor, monaco);
    if (this.props.vimMode) {
      console.log('[MONACO EDITOR] vim mode started', this.vimStatusBar.current);
      initVimMode(editor, this.vimStatusBar.current)
    }
    this.editor = editor
    this.monaco = monaco
    // console.log(this.monaco.Position);
    // this.editor.modifyPosition
    // setTimeout(() => {
      
    //   // var model = this.editor.getModel();
    //   // console.log(222,model,editor.getPosition());
    //   // model.modifyPosition(editor.getPosition(), -100);
    //   this.editor.setScrollPosition({scrollTop: 300});

    // })
    
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

  shouldComponentUpdate ( nextProps: any,  nextState: any, nextContext: any) { 
    // setTimeout(() => {
    //   this.editor.setSelection(new this.monaco.Selection(0, 0, 0, 0));
    // })
    if (this.props.posY !== nextProps.posY) {
      // console.log('monaco should scroll');
      this.editor.setScrollPosition({scrollTop: this.props.posY});
    }

    if (this.props.insertUnderCaret !== nextProps.insertUnderCaret && nextProps.insertUnderCaret !== '') {
      console.log(`[MONACO EDITOR] insert under Caret ${nextProps.insertUnderCaret}`);
      this.editor.trigger('keyboard', 'type', {text: nextProps.insertUnderCaret});
    }
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
              automaticLayout: true,
              selectOnLineNumbers: true,
              minimap: {enabled: false},
              wordWrap: 'on',
              fontSize: 11,
              scrollbar: {
                handleMouseWheel: false
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