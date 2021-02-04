import { debounce, throttle } from 'lodash';
import  {  useState } from 'react';
import { onFileEditedFn } from '../components/note/EditorArea.component';
import { useDebounce, useThrottle } from './lodash.hooks';

export const useNoteSaveLogic = (p:{
    onNoteSave: onFileEditedFn
}) => {
    const [stopDelayedNoteSave, setStopDelayedNoteSave] = useState(false)
    const throttledOnNoteEdited = useThrottle((notePath:string, content:string) => {
      if (stopDelayedNoteSave) return
      console.log(1);
      p.onNoteSave(notePath, content)
    }, 1000)
    
    const debouncedOnNoteEdited = useDebounce((notePath:string, content:string) => {
      if (stopDelayedNoteSave) return
      console.log(2);
      p.onNoteSave(notePath, content)
    }, 1000)

    return {setStopDelayedNoteSave, throttledOnNoteEdited, debouncedOnNoteEdited}
}

