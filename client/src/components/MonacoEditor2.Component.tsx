import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

export const MonacoEditor2 = (p:{
    value: string
}) => {
  const monaco = useMonaco();
  
  useEffect(() => {
    // do conditional chaining
    monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    // or make sure that it exists by other ways
    if (monaco) {
      
      console.log("here is the monaco instance:", monaco);
    }
  }, [monaco]);

  return (
    <Editor
      height="90vh"
      value={p.value}
      options={
        {
          //fontFamily:cssVars.font.editor,
          //readOnly: this.props.readOnly,
          quickSuggestions: false,
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
            handleMouseWheel: true,
            verticalScrollbarSize: 0,
          }
        }
      }
       defaultLanguage="markdown"
    />
  );
}
