import { cloneDeep } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { iContentChunk, iNoteFuncsApi, noteApiFuncs } from '../../managers/renderNote.manager';

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

// const test: iNoteApi['  = ''

export const useNoteApi = (p: {
}): iNoteApi => {
	const h = `[NOTE API] 00568 `

	//
	// STATE
	//
	const [lineJump, setLineJump] = useState<iLineJump>()

	// const jump = (jObj:iLineJump) => {
	// 	const nObj = cloneDeep(jObj)
	// 	if (nObj.windowId === "active") {
	// 		nObj.windowId = 
	// 	}
	// }

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
