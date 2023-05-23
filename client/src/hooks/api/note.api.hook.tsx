import React, { useState } from 'react';
import { iNoteFuncsApi, noteApiFuncs } from '../../managers/renderNote.manager';



export interface iEditorAction {
	type: "lineJump" | "insertText"
	windowId?: string
	lineJump?: number
	insertText?: string
	insertPos?: number | "currentPos"
}


interface iNoteUiApi {
	ui: {
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
			lineJump: line
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
