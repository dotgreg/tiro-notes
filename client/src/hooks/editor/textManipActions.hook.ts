import { log } from 'console';
import React, { useState, useEffect, useRef } from 'react';
import { MonacoEditorWrapper } from '../../components/MonacoEditor.Component';
import { DeviceType, deviceType, isA } from '../../managers/device.manager';
import { getTextAreaLineInfos, LineTextInfos, TextModifAction, TextModifActionParams, triggerTextModifAction } from '../../managers/textEditor.manager';

export interface TextManipActionsHookParams {
	editorType: DeviceType
	editorRef: React.RefObject<HTMLTextAreaElement | MonacoEditorWrapper>
}
export const useTextManipActions = (p: TextManipActionsHookParams) => {
	// const [currentCursorPos, saveCursorPosition] = useState<any>(0)
	const currentCursorPos = useRef<any>(0)

	let editorRefDesktop = p.editorRef as React.RefObject<MonacoEditorWrapper>
	let editorRefMobile = p.editorRef as React.RefObject<HTMLTextAreaElement>

	const getLineTextInfos = (): LineTextInfos | null => {
		let res

		if (p.editorType === 'desktop') {
			res = editorRefDesktop.current?.getCurrentLineInfos()
			currentCursorPos.current = res && res.monacoPosition ? res.monacoPosition : 0
		} else {
			console.log(12125, p, editorRefMobile, editorRefDesktop);
			res = editorRefMobile.current ? getTextAreaLineInfos(editorRefMobile.current) : null
			currentCursorPos.current = res && res.currentPosition ? res.currentPosition : 0
		}
		return res
	}


	const resetCursorPosition = (decal: number) => {
		let newPos = currentCursorPos.current + decal
		console.log('resetCursorPosition to ', newPos);
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

	const applyTextModifAction = (
		action: TextModifAction,
		actionsParams?: TextModifActionParams
	): string | null => {
		let linesInfos = getLineTextInfos()
		if (!linesInfos) return null
		let newText = triggerTextModifAction(
			action,
			linesInfos,
			charDecal => {
				console.log('applyTextModifAction cb charDecal:', charDecal);

				resetCursorPosition(charDecal)
			},
			actionsParams
		)
		return newText
	}

	return { getLineTextInfos, resetCursorPosition, applyTextModifAction }
}
