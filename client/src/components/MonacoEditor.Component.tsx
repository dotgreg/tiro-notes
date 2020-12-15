import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { styleApp } from '../managers/style.manager';
import styled from '@emotion/styled'

export class MonacoEditorWrapper extends React.Component<{
  value:string,
  onChange:(text:string)=>void
  insertUnderCaret:string
},{}> {
  reactComp:any
  constructor(props:any) {
    super(props);
    this.reactComp = React.createRef()
  }

  editor:any
  monaco:any
  editorDidMount = (editor:any, monaco:any) => {
    this.editor = editor
    this.monaco = monaco
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

    if (this.props.insertUnderCaret !== nextProps.insertUnderCaret && nextProps.insertUnderCaret !== '') {
      console.log(`[MONACO EDITOR] insert under Caret ${nextProps.insertUnderCaret}`);
      this.editor.trigger('keyboard', 'type', {text: nextProps.insertUnderCaret});
    }
    return true
  }

  render() {
    return (
      <StyledWrapper>
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
    
`