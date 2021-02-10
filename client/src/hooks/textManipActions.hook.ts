import React, {  useState, useEffect, useRef} from 'react';
import { MonacoEditorWrapper } from '../components/MonacoEditor.Component';
import { DeviceType, deviceType } from '../managers/device.manager';
import { getTextAreaLineInfos, LineTextInfos, TextModifAction, TextModifActionParams, triggerTextModifAction } from '../managers/textEditor.manager';

export interface TextManipActionsHookParams {
  editorType:DeviceType
  editorRef:React.RefObject<HTMLTextAreaElement|MonacoEditorWrapper>
}
export const useTextManipActions = (p:TextManipActionsHookParams) => {
    // const [currentCursorPos, saveCursorPosition] = useState<any>(0)
    const currentCursorPos = useRef<any>(0)

    let editorRefDesktop = p.editorRef as React.RefObject<MonacoEditorWrapper>
    let editorRefMobile = p.editorRef as React.RefObject<HTMLTextAreaElement>

    const getLineTextInfos = ():LineTextInfos|null => {
      let res
      
      if (p.editorType === 'desktop') {
        res = editorRefDesktop.current?.getCurrentLineInfos()
        currentCursorPos.current = res.monacoPosition
    } else {
        res = editorRefMobile.current ? getTextAreaLineInfos(editorRefMobile.current) : null
        currentCursorPos.current = res.currentPosition
      }
      return res
    }


    const resetCursorPosition = (decal:number) => {
      // console.log({decal, currentCursorPos});
      
      if (deviceType() === 'desktop') {
        editorRefDesktop.current?.editor.setPosition(currentCursorPos.current + decal);
      } else {
        let textarea = editorRefMobile.current
        if (!textarea) return
        textarea.focus()
        setTimeout(()=>{
            if (!textarea) return
            textarea.selectionStart = currentCursorPos.current + decal
            textarea.selectionEnd = currentCursorPos.current + decal
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