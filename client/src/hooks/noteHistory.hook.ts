import { useState } from "react"
import { useInterval } from "./interval.hook"

export const useIntervalNoteHistory = (fileContent: string,p:{
    shouldCreateIntervalNoteHistory: Function
}) => {
    const [historyContent, setHistoryContent] = useState('')

    // console.log('[HISTORY FILE] : restartAutomaticHistorySave');
    let historySaveInMin = 5 
    // let historySaveIntTime = historySaveInMin * 60 * 1000 
    let historySaveIntTime = 10 * 1000 
    
    useInterval(() => {
      if (fileContent !== historyContent) {
        setHistoryContent(fileContent)           
        console.log(`[HISTORY FILE] : content changed, saving history version`);
        p.shouldCreateIntervalNoteHistory()
      } else {
        console.log(`[HISTORY FILE] : content not changed, do nothing`);
      }
    }, historySaveIntTime )
}