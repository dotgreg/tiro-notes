export const editorToggleButtonConfig = (onEditorToggle:Function) => {return {
    title:'toggle editor', 
    icon:'faEdit', 
    action: () => {onEditorToggle()}
  }}