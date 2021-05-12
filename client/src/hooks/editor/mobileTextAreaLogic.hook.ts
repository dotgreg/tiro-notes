import { debounce } from 'lodash';
import React, {  useState } from 'react';
import { updateTextFromLetterInput } from '../../managers/textEditor.manager';
import { useTextareaScrollStabilizer } from './textAreaScrollStabilizer.hook';
import { useTextManipActions } from './textManipActions.hook';


export const useMobileTextAreaLogic = (fileContent: string, p:{
    mobileTextarea:React.RefObject<HTMLTextAreaElement>
    onMobileNoteEdition: (string)=>void
}) => {
    const {
        getLineTextInfos, 
        resetCursorPosition} = useTextManipActions ({
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
      console.log('onTextareaScroll');
      
    } 
    const onTextareaChange = (e:any) => {
      console.log('onTextareaChange');
      
      // setIsTextareaEdited(true)
      // debounceTextareaEdited()
      
      let updatedText = e.target.value
      let newLetter = updatedText[e.target.selectionStart-1].charCodeAt(0)
      // resetYTextarea()
      // only react on insertion
      if (updatedText.length > fileContent.length) {
          let linesInfos = getLineTextInfos()
          if (!linesInfos) return
          // IF JUMP, DUPLICATE LINE and other logic
          updatedText = updateTextFromLetterInput (
            linesInfos,
            newLetter,
            decalChars => {
              setTimeout(() => {
                resetCursorPosition(decalChars)
                resetYTextarea()
              })
          })
      }  
      p.onMobileNoteEdition(updatedText)
      // resetYTextarea()
      
      // setTimeout(() => {
      // }, 1000)
    }

      return {onTextareaChange, onTextareaScroll}
}