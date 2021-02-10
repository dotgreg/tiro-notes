export const editorToggleButtonConfig = (onEditorToggle:Function) => {return {
    title:'toggle editor', 
    icon:'faEye', 
    action: () => {onEditorToggle()}
  }}