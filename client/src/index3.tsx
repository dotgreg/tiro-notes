import React from 'react';
import ReactDOM from 'react-dom';
import {App2} from './App2';
import { MonacoEditor2 } from './components/MonacoEditor2.Component';
import { MonacoEditorWrapper } from './components/MonacoEditor.Component';
const val = `
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
  Hello world
`


ReactDOM.render(
  <MonacoEditor2 value={val} />,
  // <MonacoEditorWrapper
  //   vimMode={false}
  //   posY={0}
  //   readOnly={false}
  //   onChange={()=>{}}
  //   onScroll={()=>{}}
  //   value={val} />,
  document.getElementById('root')
);

