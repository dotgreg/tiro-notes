import React, { useEffect, useRef, useState } from 'react';
import { each, isString } from 'lodash';
import { iFile, iFileImage } from '../../../../shared/types.shared';
import { pathToIfile } from '../../../../shared/helpers/filename.helper';

export interface iTtsStatus {
	isPlaying: boolean
	totalChunks: number
	currentChunk: number
	currentText?: string
}

export interface iTtsApi {
	open: (filePath: string, content: string, startString?: string) => void
	getStatus: (
		// rand: string,
		cb: (status: iTtsStatus) => void
	) => void
	close: () => void
}

const h = `[TTS API]`
export const useTtsPopup = () => {

	const [ttsPopup, setTtsPopup] = useState(false)
	const [ttsPopupFile, setTtsPopupFile] = useState<iFile | null>(null)
	const [ttsPos, setTtsPos] = useState<string | null>(null)
	const [ttsPopupContent, setTtsPopupContent] = useState("")

	const openTtsPopup: iTtsApi['open'] = (filePath, content, startString) => {
		console.log(h, `open`, { filePath, content, startString });
		let nfile = pathToIfile(filePath)
		if (nfile) {
			setTtsPopupFile(nfile)
			if (startString) setTtsPos(startString)
			setTtsPopupContent(content)
			setTtsPopup(true)
		}
	}
	const closeTtsPopup: iTtsApi['close'] = () => {
		console.log(h, ` close`);
		setTtsPopup(false)
	}

	// GET STATUS PLAY TTS
	const getStatus: iTtsApi['getStatus'] = (cb) => {
		console.log(h, `getStatus`, ttsStatusInt.current, cb, cb.toString());
		if (ttsStatusInt.current) cb(ttsStatusInt.current)
	}
	const ttsStatusInt = useRef<iTtsStatus | null>(null)
	const syncTtsStatus = (status: iTtsStatus) => {
		// console.log("synctts", status);
		ttsStatusInt.current = status
	}


	const ttsApi: iTtsApi = {
		open: openTtsPopup,
		close: closeTtsPopup,
		getStatus
	}
	return {
		ttsApi,
		ttsPopupContent, ttsPopupFile,
		ttsPos,
		setTtsPopup, ttsPopup,
		syncTtsStatus
	}


}
