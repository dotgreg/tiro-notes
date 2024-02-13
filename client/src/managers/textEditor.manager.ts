import { each, isBoolean, isNumber, isString, throttle } from "lodash-es";
import { iFile } from "../../../shared/types.shared";
import { getApi } from "../hooks/api/api.hook";
import { notifLog } from "./devCli.manager";



export interface LineTextInfos {
	activeLine: string
	lines: string[]
	lineIndex: number
	currentPosition: number
	monacoPosition?: any
	scrollPos?: any
}

export const getLines = (rawtext: string): string[] => {
	return rawtext.split("\n");
}


export const getTextAreaLineInfos = (textarea: HTMLTextAreaElement): LineTextInfos => {
	// if (!textarea) return
	let text = textarea.value
	// var position = this.editor.getPosition();
	var splitedText = text.split("\n");
	let pos = textarea.selectionStart

	let c = 0
	let lineIndex = 0
	while (c < pos + 1) {
		let lineLength = splitedText[lineIndex].length + 1
		c += lineLength
		lineIndex++
	}
	lineIndex--

	return {
		currentPosition: pos,
		lines: splitedText,
		activeLine: splitedText[lineIndex],
		lineIndex
	}
};


export const diffStr = (s1: string, s2: string) => {
	return s1.split(s2).join('')
}

const isLineStartClean = (str: string): boolean => {
	let res = true
	for (let i = 0; i < str.length; i++) {
		if (
			str[i].charCodeAt(0) !== 32 &&
			str[i].charCodeAt(0) !== 45 &&
			str[i].charCodeAt(0) !== 91 &&
			str[i].charCodeAt(0) !== 93
		) {
			res = false
		}
	}
	return res
}





export const updateTextFromLetterInput = (
	infos: LineTextInfos,
	letterCode: number,
	cb: (decal: number) => void
): string => {

	// IF ENTER
	if (letterCode === 10) {
		console.log(`updateTextFromLetterInput => ENTER PRESSED`);

		let lastLine = infos.lines[infos.lineIndex - 1]
		let pattern1 = lastLine.indexOf('- [')
		let pattern2 = lastLine.indexOf('-')
		let newLineStart = ''
		// alert(lastLine)

		// IF LAST LINE STARTS "- [ ] ", DUPLICATE START	
		if (pattern1 !== -1 && lastLine !== '- [ ] ') {
			newLineStart = lastLine.substr(0, pattern1 + 3) + ' ] '
			if (isLineStartClean(newLineStart)) {
				infos.lines[infos.lineIndex] = newLineStart + infos.activeLine
				cb(newLineStart.length)
			}

			// IF LAST LINE STARTS "-", DUPLICATE START
		} else if (pattern2 !== -1 && lastLine !== '- ' && lastLine !== '- [ ] ') {
			newLineStart = lastLine.substr(0, pattern2 + 1) + ' '
			if (isLineStartClean(newLineStart)) {
				infos.lines[infos.lineIndex] = newLineStart + infos.activeLine
				cb(newLineStart.length)
			}
		}


	} /** END ON ENTER LOGIC */

	return infos.lines.join('\n')
}






export type TextModifAction = '->' | '<-' | '[x]' | '^' | 'v' | 'X' | 'C' | 'insertAt' | 'insertAtCurrentPos'
export interface TextModifActionParams {
	textToInsert: string
	insertPosition: number | 'currentPos' | 'currentLineStart'
	replaceText?: boolean
}

export const triggerTextModifAction = (
	action: TextModifAction,
	infos: LineTextInfos,
	cb: (decal: number) => void,
	actionParams?: TextModifActionParams
): string => {
	let lines = infos.lines

	if (action === '^') {
		let prevLine = lines[infos.lineIndex - 1]
		let currLine = lines[infos.lineIndex]
		lines[infos.lineIndex] = prevLine
		lines[infos.lineIndex - 1] = currLine
		// console.log();
		cb(-prevLine.length - 1)
	}
	if (action === 'v') {
		let nextLine = lines[infos.lineIndex + 1]
		let currLine = lines[infos.lineIndex]
		lines[infos.lineIndex] = nextLine
		lines[infos.lineIndex + 1] = currLine
		cb(+nextLine.length + 1)
	}
	if (action === 'X') {
		let lineLength = lines[infos.lineIndex].length
		let startOfLinePos = [...lines].splice(0, infos.lineIndex).join('\n').length
		let decal = startOfLinePos + 1 - infos.currentPosition
		lines[infos.lineIndex] = ''
		cb(decal)
	}
	if (action === 'C') {
		let lineLength = lines[infos.lineIndex].length
		// let startOfLinePos = [...lines].splice(0, infos.lineIndex).join('\n').length
		// let decal = startOfLinePos + 1 - infos.currentPosition
		let lineToClone = lines[infos.lineIndex]
		lines.splice(infos.lineIndex, 0, lineToClone)
		// lines[infos.lineIndex] = ''
		// console.log(startOfLinePos, infos, decal);
		cb(lineLength + 1)
	}

	if (action === '->') {
		lines[infos.lineIndex] = '  ' + lines[infos.lineIndex]
		cb(2)
	}
	if (action === '<-') {
		if (infos.activeLine.startsWith('  ')) {
			lines[infos.lineIndex] = lines[infos.lineIndex].substr(2, lines[infos.lineIndex].length)
			cb(-2)
		} else {
			cb(0)
		}
	}

	let activeLineContent = infos.activeLine.trim()

	if (action === '[x]') {
		if (!activeLineContent.startsWith('- [ ]') && !activeLineContent.startsWith('- [x]')) {
			lines[infos.lineIndex] = lines[infos.lineIndex].replace(activeLineContent, '- [ ] ' + activeLineContent.replace('-', ''))
			cb(6)
		} else if (activeLineContent.startsWith('- [ ]')) {
			lines[infos.lineIndex] = lines[infos.lineIndex].replace('[ ]', '[x]')
			cb(0)
		} else if (activeLineContent.startsWith('- [x]')) {
			lines[infos.lineIndex] = lines[infos.lineIndex].replace('[x]', '[ ]')
			cb(0)
		} else {
			cb(0)
		}
	}

	if (
		action === 'insertAt' &&
		actionParams &&
		actionParams.textToInsert &&
		(isNumber(actionParams.insertPosition) || isString(actionParams.insertPosition))
	) {
		let insertPos:number = 0
		if (isNumber(actionParams.insertPosition)) insertPos = actionParams.insertPosition
		if (actionParams.insertPosition === 'currentPos') insertPos = infos.currentPosition + 1
		if (actionParams.insertPosition === 'currentLineStart') insertPos = [...lines].splice(0, infos.lineIndex).join('\n').length 

		// console.log('inserting at', insertPos, actionParams, infos.lineIndex, infos)
		
		let text = lines.join('\n') as string
		const lengthToInsert = actionParams.textToInsert.length
		
		let text2 = [
			text.slice(0, insertPos),
			actionParams.textToInsert,
			actionParams.replaceText ? text.slice(insertPos + lengthToInsert, text.length) : text.slice(insertPos, text.length)
		].join('')
		lines = text2.split('\n')

		// decal char of 0
		// cb(0)
	} 


	return lines.join('\n')
}


//
// Word Count preview
//
export const wordsCount = (selection:string) => {
	let arrLines = selection.split("\n")
	let wordsCnt = 0
	// if arrlines not array
	if (!Array.isArray(arrLines)) return wordsCnt
	each(arrLines, line => {
		let arrline = line.split(" ").filter(w => w !== "")
		wordsCnt += arrline.length
	})
	return wordsCnt
}


//
// CALC PREVIEW
//
export const seemsArithmetic = (str:string) => {
	str = `${str}`
	let res = false
	if (str.toLowerCase().startsWith("math.")) res = true
	if (str.startsWith("(")) res = true
	// if starts with a number
	if (!isNaN(parseInt(str))) res = true
	if (str.includes("\n")) res = false
	if (str.length > 400) res = false
	return res
}
export const calcSelected = (selection:string) => {
	let res = null
	if (!seemsArithmetic(selection)) return res
	try {
		// if starts with number or () or Math
		res = new Function(`return ${selection}`)()
	} catch (error) {
		// res = "!"
	}
	return res
}

export const triggerCalc = (p:{
    windowId: string,
    file: iFile,
    fileContent: string,
    selectionTxt:string, 
    insertPos: number, 
}) => {
	const {windowId, file, fileContent, selectionTxt, insertPos} = p
	const genParams = () => {return { 
        wrapSyntax: false, 
		title: "", 
        currentContent:fileContent, 
        insertPos, 
        windowId, 
		selection:selectionTxt, 
        file,
		linejump: false, 
        isLast: false 
    }}
	
	try {
		let result = new Function(`return ${selectionTxt}`)()
		let p = {...genParams(), textUpdate:` = ${result}`, isLast:true}
		generateTextAt(p)
	} catch (err) {
		notifLog(`[CALC] Error <br/> "${err}"`)
	}

}


export const generateTextAt = (p2:{
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