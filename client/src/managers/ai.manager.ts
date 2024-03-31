import { debounce, isBoolean, throttle } from "lodash-es"
import { getApi } from "../hooks/api/api.hook"
import { iFile } from "../../../shared/types.shared"
import { generateTextAt } from "./textEditor.manager"
import { cleanString, pathToIfile } from "../../../shared/helpers/filename.helper"
import { type } from "os"
import { iToolbarButton } from "../components/ButtonsToolbar.component"
import { userSettingsSync } from "../hooks/useUserSettings.hook"
import { deviceType } from "./device.manager"
const h = `[AI]`
export const lineJumpWhileGeneratingAiText = {}
export type iAiTypeAnswer = "newWindow"|"currentWindow"
export type iAiBtnConfig = {
    icon: string,
    command: string,
    title: string,
    typeAnswer: iAiTypeAnswer
}
export const genAiButtonsConfig = ():iAiBtnConfig[] => {
    const rawCmd = userSettingsSync.curr.ui_editor_ai_command
    let res:iAiBtnConfig[] = []
        // btnsConfigClosed.push(aiBtn)
    // split by lines
    let lines = rawCmd.split("\n")
    // for each line, split by |
    let id = 1
    for (let line of lines) {
        let parts = line.split("|")
        // if 3 parts
        if (parts.length >= 4) {
            let finalTypeAnswer = parts[2].trim() 
            if (finalTypeAnswer.startsWith("new") ) finalTypeAnswer = "newWindow"
            else if (finalTypeAnswer.startsWith("current")) finalTypeAnswer = "currentWindow"
            else finalTypeAnswer = "newWindow"

            // finalCommand is all parts joined again minus 1,2,3
            const commandParts = parts.slice(3)
            const finalCommand = commandParts.join("|")

            res.push({
                title: parts[0].trim(),
                icon: parts[1].trim(), 
                typeAnswer: finalTypeAnswer as iAiTypeAnswer,
                command: finalCommand,
            })
        } else {
            if (line.trim() === "") continue
            res.push({
                icon: 'wand-magic-sparkles', 
                title:`AI assistant ${id}`,
                command: line.trim(),
                typeAnswer: "newWindow"
            })
        }
        id++
    }
    // if one line
    return res
}

export const AiAnswer = (p:{
    typeAnswer:iAiTypeAnswer, 
    aiCommand:string,  
    selectionTxt:string, 
    file?:iFile, 
    windowIdFile?:string, 
    innerFileContent?:string, 
    cursorInfos?:any 
}) => {
    let {typeAnswer, aiCommand, selectionTxt, file, windowIdFile, innerFileContent, cursorInfos} = p
    console.log(h, "AiAnswer", {typeAnswer, aiCommand, selectionTxt, file, windowIdFile, innerFileContent, cursorInfos})  
    if (typeAnswer === "currentWindow") {
        if (!file || !windowIdFile || !innerFileContent || !cursorInfos) return
        triggerAiSearch({
            command: aiCommand,
            windowId: windowIdFile,
            file: file,
            fileContent: innerFileContent,
            selectionTxt,
            insertPos: cursorInfos.to,
        })
    }
    else if (typeAnswer === "newWindow") {
        getApi(api => {
            // name should be .tiro/ai-answers/{yy-mm-dd-hh-ss}-answer-{selectionTxt.substring(0, 40)}.md
            let dateStr = new Date().toISOString().replace(":", "h").replace(":", "m").replace(/T/g, "-").substring(0,19)
            let selectionTxtStr = cleanString(selectionTxt).substring(0, 40)
            let finalPathNoteAnswer = `.tiro/answers/answer-${dateStr}---${selectionTxtStr}.md`
            let textBeforeAnswer = `# Answer for "${selectionTxtStr}" \n ## Answer \n\n `
            let textAfterAnswer = `\n ## Question: \n \n ${selectionTxt} \n`
            let innerFileContent = textBeforeAnswer + textAfterAnswer
            let nFile = pathToIfile(finalPathNoteAnswer)
            let floatingPanelId = cleanString(finalPathNoteAnswer)
            let insertPos = textBeforeAnswer.length
            api.file.saveContent(finalPathNoteAnswer, innerFileContent, {}, () => {
                api.ui.floatingPanel.create({
                    type: "file",
                    file: nFile,
                    view: "editor",
                    id: floatingPanelId,
                    layout: deviceType() === "mobile" ? "bottom" : "bottom-right",
                    
                })
                triggerAiSearch({
                    command: aiCommand,
                    windowId: floatingPanelId,
                    file: nFile,
                    fileContent: innerFileContent,
                    selectionTxt,
                    insertPos: insertPos,
                    wrapSyntax: false,
                })
            })
        })
    }
    else {
        console.error(h, "AiAnswer: typeAnswer not recognized", typeAnswer)
    }
}

export const triggerAiSearch = (p:{
    windowId: string,
    file: iFile,
    fileContent: string,
    command:string,

    selectionTxt:string, 
    insertPos: number, 
    wrapSyntax?: boolean
}) => {
    console.log("trigger AI search", p.windowId, p.file.path, p.selectionTxt, p.insertPos)
    // close the popup
    // setShowHoverPopup(false)
    // const s = currSelection.current
    // let selectionTxt = textContent.current.substring(s.from, s.to)
    let {selectionTxt, fileContent, insertPos} = p
    const currentContent = fileContent
    // const insertPos = s.to
    let isError = false
    selectionTxt = selectionTxt.replaceAll('"', '\\"')
    selectionTxt = selectionTxt.replaceAll("'", "\\'")
    selectionTxt = selectionTxt.replaceAll("`", "\\`")
    selectionTxt = selectionTxt.replaceAll("$", "\\$")
    
    const question = selectionTxt
    const genParams = () => {return { 
        title: "Ai Answer", 
        currentContent, 
        textUpdate: "⏳ waiting for answer...", 
        question, 
        insertPos, 
        windowId: p.windowId, 
        file: p.file,
        isLast: false,
        wrapSyntax: p.wrapSyntax
    }}

    // if user scrolled, stop linejump
    console.log()
    lineJumpWhileGeneratingAiText[p.windowId] = true

    const errorLog = {curr: ``}
    const debouncedErrorNotif = debounce(() => {    
        getApi(api => {
            api.ui.notification.emit({
                content: `[AI] Error while executing command  <br/> at  ${new Date().toLocaleString()} <br/><br/> COMMAND ANSWER => <br/> <code>${errorLog.curr}</code> </br>`,
                options: {hideAfter: 10 * 60 },
                id: "ai-error"
            })
        })
    }, 500)
    
    getApi(api => {
        let startDateInTs = Date.now()
        let cmd = p.command
        cmd = cmd.replace("{{input}}", selectionTxt)
        generateTextAt(genParams())
        api.command.stream(cmd, streamChunk => {

            if (streamChunk.isError) isError = true
            // if it is an error, display it in a popup
            if (isError) {
                // let cmdPreview = cmd.length > 200 ? cmd.substring(0, 200) + "..." : cmd
                // let cmdPreview = ""
                
                console.log(h, "ERROR", streamChunk)
                if (streamChunk.text === "" || streamChunk.text === "[object Object]") return
                errorLog.curr += streamChunk.text + "\n\n"
                debouncedErrorNotif()

                // erase everything if one error detected
                generateTextAt({...genParams(), textUpdate:"", isLast: true, viewFollow:lineJumpWhileGeneratingAiText[p.windowId]})
            } else {
                // else insert it
                // if is last, add at the end of textTot the date
                if (streamChunk.isLast) streamChunk.textTot += `\n\n ⏱️ generated in ${(Date.now() - startDateInTs)/1000}s`
                generateTextAt({...genParams(), textUpdate:streamChunk.textTot, isLast: streamChunk.isLast, viewFollow:lineJumpWhileGeneratingAiText[p.windowId]})
            }
        })
    })
}