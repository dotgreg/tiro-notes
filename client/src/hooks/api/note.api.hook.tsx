import React, { useState } from 'react';
import { iEditorSelection } from '../../managers/codeMirror/editorUtils.cm';
import { iNoteFuncsApi, noteApiFuncs } from '../../managers/renderNote.manager';
import { iNoteParentType } from '../../components/NotePreview.component';
import { generateUUID } from '../../../../shared/helpers/id.helper';


type iCMPosition = number | "currentPos" | "currentLineStart" 
export interface iEditorAction {
	uuid?:string|null

	windowId?: string
	noteParentType?: iNoteParentType

	type: "highlightLine" | "lineJump" | "insertText" | "replaceText"  | "searchWord" | "setSelection" | "triggerAiSearch" | "undo" | "redo" | "uploadProgress" | 
		"toggleContextMenu" | 
		"toggleEncryption"  |
		"triggerUpload"

	lineJumpNb?: number
	lineJumpString?: string
	lineJumpType? : "editor" | "preview" | "both"

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

	state?: boolean

}


interface iNoteUiApi {
	ui: {
		// old way to linejump => SHOULD USE api.note.ui.editorAction.dispatch({type: "lineJump", windowId: "active", lineJumpNb: 1})
		lineJump: {
			jump: (windowId: string, line: number) => void
		},
		editorAction: {
			dispatch: (editorAction: iEditorAction) => void
			get: iEditorAction|null
			canExecuteAction: (a: iEditorAction) => boolean
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
	const editorActionIdRef = React.useRef<string|null>(null)
	const generateActionId = () => {
		editorActionIdRef.current = generateUUID()
	}
	const canExecuteAction = (a: iEditorAction) => {
		if (a.uuid === editorActionIdRef.current) {
			editorActionIdRef.current = null // reset action id
			return true
		}
		return false
	}

	const setEditorAction = (a: iEditorAction) => {
		if (a.windowId && a.windowId !== "active") a.noteParentType = "any"
		if (!a.windowId) a.windowId = "active"
		if (!a.noteParentType) a.noteParentType = "grid"
		if (!a.insertPos) a.insertPos = "currentPos"
		// uuid to only exec action once
		generateActionId()
		a.uuid = editorActionIdRef.current

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
				get: editorAction,
				canExecuteAction: canExecuteAction
			},
		},
	}
}
