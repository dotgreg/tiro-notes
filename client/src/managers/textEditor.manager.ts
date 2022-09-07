import { isNumber, isString } from "lodash";



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
	insertPosition: number | 'currentPos'
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
		let insertPos = actionParams.insertPosition === 'currentPos' ? infos.currentPosition + 1 : actionParams.insertPosition

		let text = lines.join('\n') as string
		let text2 = [
			text.slice(0, insertPos),
			actionParams.textToInsert,
			text.slice(insertPos)
		].join('')
		lines = text2.split('\n')

		// decal char of 0
		// cb(0)
	}


	return lines.join('\n')
}
