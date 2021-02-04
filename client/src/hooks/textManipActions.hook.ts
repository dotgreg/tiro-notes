import React, {  useState } from 'react';
import { MonacoEditorWrapper } from '../components/MonacoEditor.Component';
import { DeviceType, deviceType } from '../managers/device.manager';
import { getTextAreaLineInfos, LineTextInfos, TextModifAction, TextModifActionParams, triggerTextModifAction } from '../managers/textEditor.manager';

export interface TextManipActionsHookParams {
  editorType:DeviceType
  editorRef:React.RefObject<HTMLTextAreaElement|MonacoEditorWrapper>
}
export const useTextManipActions = (p:TextManipActionsHookParams) => {
    const [currentCursorPos, setCurrentCursorPos] = useState<any>(0)

    let editorRefDesktop = p.editorRef as React.RefObject<MonacoEditorWrapper>
    let editorRefMobile = p.editorRef as React.RefObject<HTMLTextAreaElement>

    const getLineTextInfos = ():LineTextInfos|null => {
      let res
      
      if (p.editorType === 'desktop') {
        res = editorRefDesktop.current?.getCurrentLineInfos()
        setCurrentCursorPos(res.monacoPosition)
    } else {
        res = editorRefMobile.current ? getTextAreaLineInfos(editorRefMobile.current) : null
        setCurrentCursorPos(res.currentPosition)
      }
      return res
    }


    const resetCursorPosition = (decal:number) => {
      if (deviceType() === 'desktop') {
        editorRefDesktop.current?.editor.setPosition(currentCursorPos);
      } else {
        let textarea = editorRefMobile.current
        if (!textarea) return
        textarea.focus()
        setTimeout(()=>{
            if (!textarea) return
          textarea.selectionStart = currentCursorPos + decal
          textarea.selectionEnd = currentCursorPos + decal
        })
      }
    }

    const applyTextModifAction = (
      action:TextModifAction, 
      actionsParams?:TextModifActionParams
    ):string|null => {
        let linesInfos = getLineTextInfos()
        if (!linesInfos) return null
        let newText = triggerTextModifAction(
            action, 
            linesInfos,
            charDecal => {
                resetCursorPosition(charDecal)
            },
            actionsParams
        )
        return newText
    }

    return {getLineTextInfos, resetCursorPosition, applyTextModifAction}
}