import { useState } from "react"

let historySaveInterval: any = ''
let historyContent: string = ''

export const useIntervalNoteHistory = (p:{
    noHistoryBackup:boolean
    fileContent: string
    
    shouldCreateIntervalNoteHistory: Function
}) => {
    const restartAutomaticHistorySave = () => {
      clearInterval(historySaveInterval)
      let historySaveInMin = 10 
      let historySaveIntTime = historySaveInMin * 60 * 1000 
      
      historySaveInterval = setInterval(() => {
        if (p.noHistoryBackup) return
        if (p.fileContent !== historyContent) {
          historyContent = p.fileContent
          console.log(`[EDITOR => HISTORY SAVE CRON] : content changed, saving history version`);
          p.shouldCreateIntervalNoteHistory()
        } else {
          console.log(`[EDITOR => HISTORY SAVE CRON] : content not changed, do nothing`);
        }
      }, historySaveIntTime )
    }
    return {restartAutomaticHistorySave}
}