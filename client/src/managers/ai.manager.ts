import { isBoolean, throttle } from "lodash"
import { getApi } from "../hooks/api/api.hook"
import { iFile } from "../../../shared/types.shared"

export const triggerAiSearch = (p:{
    windowId: string,
    file: iFile,
    fileContent: string,

    selectionTxt:string, 
    insertPos: number, 
}) => {
    console.log("trigger AI search", p)
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
                generateTextAt({...genParams(), textUpdate:"", isLast: true})
            } else {
                // else insert it
                generateTextAt({...genParams(), textUpdate:streamChunk.textTot, isLast: streamChunk.isLast})
            }
        })
    })
}


const generateTextAt = (p2:{
		currentContent: string,
		textUpdate: string,
		insertPos: number,
		isLast: boolean
		title?: string, 
		question?: string,
		linejump?:boolean,
		viewFollow?: boolean
		wrapSyntax?: boolean

        windowId: string
        file: iFile

	}) => {
		if (!p2.question) p2.question = ""
		if (!p2.title) p2.title = ""
		if (!isBoolean(p2.linejump)) p2.linejump = true
		if (!isBoolean(p2.viewFollow)) p2.viewFollow = true
		if (!isBoolean(p2.wrapSyntax)) p2.wrapSyntax = true

		// gradually insert at the end of the selection the returned text
		let jumpTxt = p2.linejump ? "\n\n" : " "
		let separatorDoing = "###"
		let separatorDone = "---"
		// const contextQuestion = `\n => Answering to '${p2.question.trim()}`
		let headerDoing = `${jumpTxt} ${separatorDoing} [${p2.title}] (generating ...) ${jumpTxt}`
		let headerDone = `${jumpTxt} ${separatorDone} [${p2.title}] (done) ${jumpTxt}`
		let textToInsert = `${jumpTxt}${p2.textUpdate}`
		
		if (!p2.wrapSyntax) {
			headerDoing =  headerDone = separatorDone = separatorDoing = ""
		}

		// TEXT WHILE GENERATING
		textToInsert = `${headerDoing}${p2.textUpdate}${jumpTxt}${separatorDoing} \n`
		// TEXT WHEN DONE
		if (p2.isLast) textToInsert = `${headerDone}${p2.textUpdate}${jumpTxt}${separatorDone} \n`

		// SAVE NOTE GLOBALLY and INSERT TEXT GENERATED INSIDE
		const noteContentBefore = p2.currentContent.substring(0, p2.insertPos) 
		const noteContentAfter = p2.currentContent.substring(p2.insertPos) 
		const nText = noteContentBefore + textToInsert + noteContentAfter
		getApi(api => {
			// UPDATE TEXT
			api.file.saveContent(p2.file.path, nText)

			// JUMP TO THE WRITTEN LINE
			if (p2.viewFollow) {
				let currentLine = `${noteContentBefore}${textToInsert}`.split("\n").length || 0
				let lineToJump = currentLine - 2
				if (lineToJump < 0) lineToJump = 0
				lineJumpThrottle(p2.windowId, lineToJump)
			}
		})
	}
	const lineJumpThrottle = throttle((windowId, lineToJump) => {
		// getApi(api => {
		// 	api.ui.note.lineJump.jump(windowId, lineToJump)
		// })
		getApi(api => {
			api.ui.note.editorAction.dispatch({
				windowId,
				type:"lineJump", 
				lineJumpNb: lineToJump,
			})	
		})
	}, 1000)