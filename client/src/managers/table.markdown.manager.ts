import { iFile } from "../../../shared/types.shared"
import { iCursorInfos } from "../components/dualView/CodeMirrorEditor.component"
import { getApi } from "../hooks/api/api.hook"
import { getTextLineInfos } from "./textEditor.manager"

export interface iParamsTableColManip {
    windowId: string,
    file: iFile,
    fileContent: string,
    selectionTxt:string, 
    cursorInfos: iCursorInfos, 
}

export const triggerAddTableCol = (p:iParamsTableColManip) => {
   
    const res = prepareTableColManip(p)
    if (!res) return
    const {linesOfTable, linesInfos, colIndex} = res

    // for each line of the table, add a | after the colIndex nth | 
    for (let i = 0; i < linesOfTable.length; i++) {
        const lineIndex = linesOfTable[i]
        const line = linesInfos.lines[lineIndex]
        const lineParts = line.split("|")
        if (i == 1) lineParts[colIndex] = lineParts[colIndex] + " | - "
        else lineParts[colIndex] = lineParts[colIndex] + " | "
        linesInfos.lines[lineIndex] = lineParts.join("|")
    }

    const finaleContent = linesInfos.lines.join("\n")
    getApi(api => {
        api.file.saveContent(p.file.path, finaleContent, {history:true })
    })

}

export const triggerRemoveTableCol = (p:iParamsTableColManip) => {
    const res = prepareTableColManip(p)
    if (!res) return
    const {linesOfTable, linesInfos, colIndex} = res

    // for each line of the table, remove the colIndex nth | 
    for (let i = 0; i < linesOfTable.length; i++) {
        const lineIndex = linesOfTable[i]
        const line = linesInfos.lines[lineIndex]
        const lineParts = line.split("|")
        lineParts.splice(colIndex, 1)
        linesInfos.lines[lineIndex] = lineParts.join("|")
    }

    const finaleContent = linesInfos.lines.join("\n")
    getApi(api => {
        api.file.saveContent(p.file.path, finaleContent, {history:true, withMetas: p.file})
    })
}


const prepareTableColManip = (p:iParamsTableColManip) => {
    console.log("addTableCol")
    
    // find on which line we are
    const posInTxt = p.cursorInfos.from
    const linesInfos = getTextLineInfos(p.fileContent, posInTxt)
    const activeLine = linesInfos.activeLine
    // is there a table on this line => find if at least one | 
    const hasTable = activeLine.includes("|")
    if (!hasTable) return
    
    const tableColsNb = activeLine.split("|").length
    console.log("tableColsNb", tableColsNb)

    const linesOfTable:number[] = []
    // get all the lines of the table, from linesInfos.lineIndex to linesInfos.lines.length
    for (let i = linesInfos.lineIndex; i < linesInfos.lines.length; i++) {
        const line = linesInfos.lines[i]
        if (line.split("|").length === tableColsNb) {
            linesOfTable.push(i)
            // console.log("line inside table", i, line)
        }
        else break
    }

    // console.log( "linesOfTable", linesOfTable)
    const posInActiveLine = linesInfos.activeLinePos

    // find on which "col" on the activeLine we are
    const activeLineParts = activeLine.split("|")
    let colIndex = 0
    let colStart = 0
    for (let i = 0; i < activeLineParts.length; i++) {
        const part = activeLineParts[i]
        if (posInActiveLine >= colStart && posInActiveLine <= colStart + part.length) {
            colIndex = i
            break
        }
        colStart += part.length + 1
    }
    // console.log("colIndex", colIndex)

    return {linesOfTable, linesInfos, colIndex}
}