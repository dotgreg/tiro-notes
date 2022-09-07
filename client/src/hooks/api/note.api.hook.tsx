import React, { useState } from 'react';
import { iNoteFuncsApi, noteApiFuncs } from '../../managers/renderNote.manager';

export interface iLineJump {
	windowId: string
	line: number
}

interface iNoteUiApi {
	ui: {
		lineJump: {
			jump: (lineJump: iLineJump) => void
			get?: iLineJump
		}
	}
}

export type iNoteApi = iNoteUiApi & iNoteFuncsApi

export const useNoteApi = (p: {
}): iNoteApi => {
	const h = `[NOTE API] 00568 `

	//
	// STATE
	//
	const [lineJump, setLineJump] = useState<iLineJump>()
	//
	// EXPORTS
	//
	return {
		...noteApiFuncs,
		ui: {
			lineJump: { jump: setLineJump, get: lineJump }
		},
	}
}
