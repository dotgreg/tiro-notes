import { log } from 'console';
import React, { useState, useEffect, useRef } from 'react';
import { CodeMirrorUtils } from '../../components/dualView/CodeMirrorEditor.component';
import { MonacoEditorWrapper } from '../../components/MonacoEditor.Component';
import { DeviceType, deviceType, isA } from '../../managers/device.manager';
import { getTextAreaLineInfos, LineTextInfos, TextModifAction, TextModifActionParams, triggerTextModifAction } from '../../managers/textEditor.manager';

export type iEditorType = 'monaco-textarea' | 'codemirror'
export interface TextManipActionsHookParams {
	editorType: iEditorType
	deviceType: DeviceType
	editorRef: React.RefObject<HTMLTextAreaElement | MonacoEditorWrapper | any>
}
export const useTextManipActions = (p: TextManipActionsHookParams) => {
	const currentCursorPos = useRef<any>(0)

	let CMEditorObjRef = p.editorRef as React.RefObject<any> // codemirror editor view obj
	let editorRefDesktop = p.editorRef as React.RefObject<MonacoEditorWrapper>
	let editorRefMobile = p.editorRef as React.RefObject<HTMLTextAreaElement>

	const getLineTextInfos = (): LineTextInfos | null => {
		let res

		//
		// LOGIC FOR UNIFIED CODEMIRROR
		//
		if (p.editorType === 'codemirror') {
			let lineInfo = CodeMirrorUtils.getCurrentLineInfos(CMEditorObjRef.current)
			res = lineInfo
			currentCursorPos.current = lineInfo.currentPosition

			//
			// LOGIC FOR OLD MONACO / TEXTAREA
			//
		} else if (p.editorType === 'monaco-textarea') {
			if (p.deviceType === 'desktop') {
				res = editorRefDesktop.current?.getCurrentLineInfos()
				currentCursorPos.current = res && res.monacoPosition ? res.monacoPosition : 0
			} else {
				res = editorRefMobile.current ? getTextAreaLineInfos(editorRefMobile.current) : null
				currentCursorPos.current = res && res.currentPosition ? res.currentPosition : 0
			}
		}
		// console.log(555, res);
		return res
	}


	const resetCursorPosition = (decal: number) => {
		let newPos = currentCursorPos.current + decal
		console.log('resetCursorPosition to ', newPos);
		//
		// LOGIC FOR UNIFIED CODEMIRROR
		//
		if (p.editorType === 'codemirror') {
			// let lineInfo = CodeMirrorUtils.getCurrentLineInfos(CMEditorObjRef.current)
			// newPos = lineInfo.currentPosition + decal
			// newPos = lineInfo.currentPosition + decal
			CodeMirrorUtils.update.cursor(CMEditorObjRef.current, newPos)
			console.log(555, "resetCurpos", newPos);
		}


		//
		// LOGIC FOR OLD MONACO / TEXTAREA
		//
		else {
			if (isA('desktop')) {
				editorRefDesktop.current?.editor.setPosition(newPos);
			} else {
				let textarea = editorRefMobile.current
				if (!textarea) return
				textarea.focus()
				// should wait abit, otherwise, will jump back to bottom of textarea in mobile
				setTimeout(() => {
					if (!textarea) return
					textarea.selectionStart = newPos
					textarea.selectionEnd = newPos
				})
			}
		}
	}



	///////////////////////////////////
	// FINAL FUNCTION
	//
	const applyTextModifAction = (
		action: TextModifAction,
		actionsParams?: TextModifActionParams
	): string | null => {
		let linesInfos = getLineTextInfos()
		if (!linesInfos) return null
		console.log(555, "APPLY TEXTMODIFS", linesInfos);
		let newText = triggerTextModifAction(
			action,
			linesInfos,
			charDecal => {
				console.log(555, 'applyTextModifAction cb charDecal:', charDecal);
				resetCursorPosition(charDecal)
			},
			actionsParams
		)
		return newText
	}

	return { getLineTextInfos, resetCursorPosition, applyTextModifAction }
}


// 
/*
	1.
	applyTextModifAction2 = ({
	editorGetLineTextInfosFn: fn
	editorResetCursorPosition: fn
	}) => (action, {}) => {

	}

	2. on la config DANS EDITOR COMPONENT

	3. on output la fonction dans
	- applyTextModifActionFn =

	////////////////////

	1. forwardref l'objet codemirror donc
*/
