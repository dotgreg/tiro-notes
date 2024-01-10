import { isBoolean, throttle } from "lodash-es"
import { getApi } from "../hooks/api/api.hook"
import { iFile } from "../../../shared/types.shared"
import { generateTextAt } from "./textEditor.manager"

export const lineJumpWhileGeneratingAiText = {}

export const triggerAiSearch = (p:{
    windowId: string,
    file: iFile,
    fileContent: string,

    selectionTxt:string, 
    insertPos: number, 
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
        textUpdate: " waiting for answer...", 
        question, 
        insertPos, 
        windowId: p.windowId, 
        file: p.file,
        isLast: false 
    }}

    // if user scrolled, stop linejump
    lineJumpWhileGeneratingAiText[p.windowId] = true
    getApi(api => {
        let cmd = api.userSettings.get("ui_editor_ai_command")
        cmd = cmd.replace("{{input}}", selectionTxt)
        generateTextAt(genParams())
        api.command.stream(cmd, streamChunk => {

            if (streamChunk.isError) isError = true
            // if it is an error, display it in a popup
            if (isError) {
                // let cmdPreview = cmd.length > 200 ? cmd.substring(0, 200) + "..." : cmd
                // let cmdPreview = ""
                
                console.log("[AI ERROR]", streamChunk)
                if (streamChunk.text === "" || streamChunk.text === "[object Object]") return
                api.ui.notification.emit({
                    content: `[AI] Error while executing command <br/>============<br/> ANSWER => <br/>${streamChunk.text} </br>============`,
                    options: {hideAfter: 10 * 60 }
                })
                // erase everything if one error detected
                generateTextAt({...genParams(), textUpdate:"", isLast: true, linejump:lineJumpWhileGeneratingAiText[p.windowId]})
            } else {
                // else insert it
                generateTextAt({...genParams(), textUpdate:streamChunk.textTot, isLast: streamChunk.isLast, linejump:lineJumpWhileGeneratingAiText[p.windowId]})
            }
        })
    })
}