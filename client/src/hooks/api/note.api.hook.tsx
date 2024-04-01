import React, { useState } from 'react';
import { iEditorSelection } from '../../managers/codeMirror/editorUtils.cm';
import { iNoteFuncsApi, noteApiFuncs } from '../../managers/renderNote.manager';


type iCMPosition = number | "currentPos" | "currentLineStart" 
export interface iEditorAction {
	windowId?: string
	type: "highlightLine" | "lineJump" | "insertText" | "replaceText"  | "searchWord" | "setSelection" | "triggerAiSearch" | "undo" | "redo" | "uploadProgress"

	lineJumpNb?: number
	lineJumpString?: string

	insertText?: string
	insertPos?: iCMPosition
	
	replaceText?: string
	replacePos?: iCMPosition

	uploadProgress?: number 
	
	searchWordString?: string
	searchReplacementString?: string

	cursorPos?: number
	// searchWordOpenPanel?: boolean

	selection?: iEditorSelection

}


interface iNoteUiApi {
	ui: {
		// old way to linejump
		lineJump: {
			jump: (windowId: string, line: number) => void
		},
		editorAction: {
			dispatch: (editorAction: iEditorAction) => void
			get: iEditorAction|null
		},
	}
}

export type iNoteApi = iNoteUiApi & iNoteFuncsApi

export const useNoteApi = (p: {
}): iNoteApi => {
	const h = `[NOTE API] `

	//
	// STATE
	//
	const [editorAction, setEditorActionInt] = useState<iEditorAction|null>(null)
	const setEditorAction = (a: iEditorAction) => {
		if (!a.windowId) a.windowId = "active"
		if (!a.insertPos) a.insertPos = "currentPos"
		setEditorActionInt(a)
	}

	const legacyLineJump:iNoteUiApi["ui"]["lineJump"]["jump"] = (windowId, line) => {
		setEditorAction({
			type: "lineJump",
			windowId,
			lineJumpNb: line
		})
	}

	//
	// EXPORTS
	//
	return {
		...noteApiFuncs,
		ui: {
			lineJump: { 
				jump: legacyLineJump, 
			},
			editorAction: {
				dispatch: setEditorAction,
				get: editorAction
			},
		},
	}
}
