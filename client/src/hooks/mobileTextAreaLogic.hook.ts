import { debounce } from 'lodash';
import React, {  useState } from 'react';
import { updateTextFromLetterInput } from '../managers/textEditor.manager';
import { useTextareaScrollStabilizer } from './textAreaScrollStabilizer.hook';
import { useTextManipActions } from './textManipActions.hook';


export const useMobileTextAreaLogic = (fileContent: string, p:{
    mobileTextarea:React.RefObject<HTMLTextAreaElement>
    onMobileNoteEdition: (string)=>void
}) => {
    const {
        getLineTextInfos, 
        resetCursorPosition, 
        applyTextModifAction} = useTextManipActions ({
            editorType: 'mobile',
            editorRef: p.mobileTextarea,
      })

    const {saveYTextarea, resetYTextarea} = useTextareaScrollStabilizer(p.mobileTextarea)

    const [isTextareaEdited, setIsTextareaEdited] = useState(false)
    const debounceTextareaEdited = debounce(() => {
      setIsTextareaEdited(false)
    }, 500)

    const onTextareaScroll = (e:any) => {
      if (isTextareaEdited) return
      // @ts-ignore
      let y = e.target.scrollTop
      saveYTextarea(y)
    } 
    const onTextareaChange = (e:any) => {
      setIsTextareaEdited(true)
      debounceTextareaEdited()
      resetYTextarea()
      let updatedText = e.target.value
      let newLetter = updatedText[e.target.selectionStart-1].charCodeAt(0)
      // only react on insertion
      if (updatedText.length > fileContent.length) {
        let linesInfos = getLineTextInfos()
        if (!linesInfos) return
        updatedText = updateTextFromLetterInput (
          linesInfos,
          newLetter,
          decalChars => {
            resetCursorPosition(decalChars)
          })
        }
        p.onMobileNoteEdition(updatedText)
        // triggerContentSaveLogic(updatedText); 
      }

      return {onTextareaChange, onTextareaScroll}
}