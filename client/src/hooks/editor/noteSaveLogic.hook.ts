import { debounce, throttle } from 'lodash';
import  {  useState } from 'react';
import { onFileEditedFn } from '../../components/dualView/EditorArea.component';
import { useDebounce, useThrottle } from '../lodash.hooks';

export const useNoteSaveLogic = (p:{
    onNoteSave: onFileEditedFn
}) => {
    const [stopDelayedNoteSave, setStopDelayedNoteSave] = useState(false)
    const throttledOnNoteEdited = useThrottle((notePath:string, content:string) => {
      if (stopDelayedNoteSave) return
      p.onNoteSave(notePath, content)
    }, 1000)
    
    const debouncedOnNoteEdited = useDebounce((notePath:string, content:string) => {
      if (stopDelayedNoteSave) return
      p.onNoteSave(notePath, content)
    }, 1000)

    return {setStopDelayedNoteSave, throttledOnNoteEdited, debouncedOnNoteEdited}
}

