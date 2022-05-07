import React, {  useEffect } from 'react';
import { iFile } from "../../../../shared/types.shared"
import { useDebounce } from '../lodash.hooks';
import { useBackendState } from '../useBackendState.hook';
import { useLocalStorage } from "../useLocalStorage.hook"

export const useLastFilesHistory = (activeFile: iFile) => {
  const [filesHistory, setFilesHistory, refreshFilesHistoryFromBackend] = useBackendState<iFile[]>('files-history',[])
    // const [filesHistory, setFilesHistory] = useState<iFile[]>([])
    
    useEffect(() => {
        console.log('[HISTORY] activeFile changed!', activeFile);
        // activeFile && addToHistory(activeFile)
        activeFile && debouncedAddToHistory(activeFile)
        activeFile && debouncedAddToHistory(activeFile)
    }, [activeFile])

    const cleanLastFilesHistory = () => {
        setFilesHistory([])
    }

    const addToHistory = (file:iFile) => {
        console.log('[HISTORY] Add to history', file.name);
        
        let shouldAddToHistory = true
        let indexOldPos = -1
        let newfilesHistory = filesHistory
        for (let i = 0; i < filesHistory.length; i++) {
            if (filesHistory[i].name === file.name) {
                // already in array
                shouldAddToHistory = false
                indexOldPos = i
            }
        }

        if (!shouldAddToHistory) newfilesHistory.splice(indexOldPos, 1)
        newfilesHistory = newfilesHistory.slice(0, 20)
        newfilesHistory.unshift(file)
        setFilesHistory(newfilesHistory)
    }
    const debouncedAddToHistory = useDebounce(addToHistory, 1000)

  return {filesHistory, cleanLastFilesHistory, refreshFilesHistoryFromBackend}
}
