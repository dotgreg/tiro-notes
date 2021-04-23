import React, {  useEffect } from 'react';
import { iFile } from "../../../../shared/types.shared"
import { useLocalStorage } from "../useLocalStorage.hook"

export const useLastFilesHistory = (activeFile: iFile|null) => {
    const [filesHistory, setFilesHistory] = useLocalStorage<iFile[]>('filesHistory',[])
    // const [filesHistory, setFilesHistory] = useState<iFile[]>([])
    
    useEffect(() => {
        activeFile && addToHistory(activeFile)
    }, [activeFile])

    const cleanLastFilesHistory = () => {
        setFilesHistory([])
    }

    const addToHistory = (file:iFile) => {
        let shouldAddToHistory = true
        for (let i = 0; i < filesHistory.length; i++) {
            if (filesHistory[i].name === file.name) shouldAddToHistory = false
        }
        if (shouldAddToHistory) {
            const newFilesHistory = filesHistory.slice(0, 4)
            newFilesHistory.unshift(file)
            setFilesHistory(newFilesHistory)
        }
    }

    return {filesHistory, cleanLastFilesHistory}
}