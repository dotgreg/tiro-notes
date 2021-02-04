import React, {  useState } from 'react';

export const useTextareaScrollStabilizer = (
  textarea:React.RefObject<HTMLTextAreaElement>
) => {
    const [textareaY, setTextareaY] = useState(0)
    const saveYTextarea = (scrollTop?:number) => {
      let textareaY = textarea.current ? textarea.current.scrollTop : 0
      setTextareaY(scrollTop ? scrollTop : textareaY)
    }
    const resetYTextarea = () => {
      if (!textarea.current) return
      textarea.current.scrollTop = textareaY
    }
    return {saveYTextarea, resetYTextarea}
}