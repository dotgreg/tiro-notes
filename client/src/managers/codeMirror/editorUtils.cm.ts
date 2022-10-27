import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { sharedConfig } from "../../../../shared/shared.config";
import { LineTextInfos } from "../textEditor.manager";
import { getCustomTheme } from "./theme.cm";
import { cloneDeep } from "lodash";

const h = `[Code Mirror]`
// const log = sharedConfig.client.log.verbose
const log = true

///////////////////////////////////////////////////
// UTILS FUNCTIONS FOR MANIP AND CURSOR WORK
//

// interface iCodeMirrorInfos {
// 	contentHeight: number
// 	viewportHeight: number
// 	visibleFirstLine: number
// }

// const getEditorInfos = (cmView: any): iCodeMirrorInfos => {
const getEditorInfos = (cmView: any) => {
	let view = cmView
	let y = Math.round(view.viewState.pixelViewport.top)
	let cblock = view.lineBlockAtHeight(y)
	let visibleFirstLine = view.state.doc.lineAt(cblock.from).number
	let contentHeight = view.contentHeight
	// console.log(view);
	let viewportHeight = view.viewState.editorHeight
	let percentPx = (contentHeight - viewportHeight) / 100

	let currentPercentScrolled = view.viewState.pixelViewport.top / percentPx

	return {
		viewportHeight,
		contentHeight,
		visibleFirstLine,
		percentPx,
		currentPercentScrolled

	}

}


//
// UPDATING TEXT
// 
const updateText = (CMObj: any, newText: string, charPos: number) => {
	const vstate = CMObj.view.state
	const vtxt = vstate.doc.toString()
	const length = vtxt.length

	const oldCursor = CMObj.view.state.selection.ranges[0].from

	// let oldScroll = CMObj.view.scrollDOM.scrollTop
	// if (oldScroll < 0) oldScroll = 0
	// // seems following decalled line, which is ok
	// let o2 = oldScroll + window.innerHeight / 2

	CMObj.view.dispatch(
		CMObj.view.state.update(
			{ changes: { from: 0, to: length, insert: newText } },
		)
	)
	updateCursor(CMObj, oldCursor, true)
	// CMObj.view.dispatch(
	// 	CMObj.view.state.update(
	// 		{ selection: EditorSelection.cursor(oldCursor) },
	// 		{ effects: EditorView.scrollIntoView(o2, { y: "start" }) },
	// 	)
	// )

	// setTimeout(() => {
	// 	let oldScroll = CMObj.view.scrollDOM.scrollTop
	// 	if (oldScroll < 0) oldScroll = 0
	// 	console.log(333344, oldScroll);
	// }, 1000)

}
const updateCursor = (CMObj: any, newPos: number, scrollTo: boolean = false) => {
	log && console.log(h, " update cursor", newPos, CMObj);
	try {
		// CMObj.view.dispatch(
		// 	CMObj.view.state.update(
		// 		{ selection: EditorSelection.cursor(newPos) }
		// 	)
		// )
		// if (scrollTo) {
		// 	setTimeout(() => {
		// 		CMObj.view.dispatch({
		// 			effects: EditorView.scrollIntoView(newPos, { y: "start" }),
		// 		})
		// 	})
		// }

		if (!scrollTo) {

			// CMObj.view.dispatch(
			// 	CMObj.view.state.update(
			// 		{ selection: EditorSelection.cursor(newPos) }
			// 	)
			// )
		} else {
			// CMObj.view.dispatch(
			// 	{ effects: EditorView.scrollIntoView(newPos, { y: "start" }) },
			// 	CMObj.view.state.update(
			// 		{ selection: EditorSelection.cursor(newPos) },
			// 	)
			// )

			// CMObj.view.dispatch(
			// 	// { effects: EditorView.scrollIntoView(newPos, { y: "center" }) },
			// 	// { selection: EditorSelection.cursor(newPos), scrollIntoView: true },
			// 	{
			// 		selection: EditorSelection.cursor(newPos),
			// 		effects: EditorView.scrollIntoView(newPos, { y: "start" })
			// 	},
			// )

			// console.log(CMObj.view.dispatch);
			CMObj.view.dispatch(
				{
					selection: { anchor: newPos, head: newPos },
					scrollIntoView: true
				}
			)




			// 		selection: EditorSelection.cursor(newPos),
			// 		effects: EditorView.scrollIntoView(newPos, { y: "start" })
			// 	},
			// )

		}
		// setTimeout(() => {
		// 	CMObj.view.dispatch({
		// 		effects: EditorView.scrollIntoView(newPos, { y: "start" }),
		// 	})
		// })

	} catch (e) {
		console.warn(h, "update Cursor error", e)
	}
}



//
// GET CURRENT POS AND LINE
// 

// let cachedPosition = 0
// const throt = throttle((CMObj) => {
// 	cachedPosition = CMObj.view.state.selection.ranges[0].from
// }, 1000)
const getCachedPosition = (CMObj: any) => {
	// throt(CMObj)
	// cachedPosition = CMObj.view.state.selection.ranges[0].from
	return CMObj.view.state.selection.ranges[0].from
}
const getCurrentLineInfos = (CMObj: any): LineTextInfos => {
	const currentLineIndex = CMObj.view.state.doc.lineAt(CMObj.view.state.selection.main.head).number - 1
	const currentPosition = getCachedPosition(CMObj)
	const currentText = CMObj.view.state.doc.toString()
	let splitedText = currentText.split("\n");

	let res = {
		lines: splitedText,
		currentPosition,
		activeLine: splitedText[currentLineIndex] || "",
		lineIndex: currentLineIndex
	}
	return res
}


//
// GET SCROLLING LINE -> NOT USED, SHOULD BE UPDATED
// 
let cachedLine = 0
const getScrolledLine = (CMObj) => {
	intGetLine(CMObj)
	return cachedLine
}

const intGetLine = (CMObj: any) => {
	console.log("GET SCROLLING LINE -> NOT USED, SHOULD BE UPDATED");
	if (!CMObj.view) return -1

	const currentText = CMObj.view.state.doc.toString()
	const lineAtHeight = CMObj.view.elementAtHeight(CMObj.view.scrollDOM.scrollTop)
	const lineStart = lineAtHeight.from
	// split the text to lines
	const splitText = currentText.split('\n')

	let lengthFromBegin = 0
	let line = 0
	// for each line, add its length to tot length, till it is > from found
	for (let i = 0; i < splitText.length; i++) {
		lengthFromBegin += splitText[i].length
		if (lengthFromBegin < lineStart) line = i
		else break
	}

	cachedLine = line
}
// const bgGetLine = throttle(intGetLine, 100)
// const bgGetLine2 = debounce(intGetLine, 200)


//
// SCROLLTOLINE
//
const scrollToLine = (CMObj: any, lineToJump: number) => {
	let line = CMObj.view.state.doc.line(lineToJump)
	updateCursor(CMObj, line.from, true)

	// setTimeout(() => {
	// 	const cPosCursor = CMObj.view.state.selection.ranges[0].from
	// 	// console.log(33334, cPosCursor);
	// 	scrollTo(CMObj, cPosCursor)
	// }, 10)


}


//
// SCROLLTO (quite slow)
//
const scrollTo = (CMObj: any, posY: number) => {
	if (!CMObj.view) return -1
	// CMObj.view.dispatch({
	// 	effects: EditorView.scrollIntoView(posY, { y: "start" }),
	// })
	updateCursor(CMObj, posY, true)
}


export const CodeMirrorUtils = {
	getEditorInfos,
	getCurrentLineInfos,
	getScrolledLine,
	updateCursor,
	updateText,
	scrollTo,
	scrollToLine,
	getCustomTheme
}