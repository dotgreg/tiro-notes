import React, { useEffect, useRef, useState } from 'react';
import { each, isString } from 'lodash';
import { iFile, iFileImage } from '../../../../shared/types.shared';
import { pathToIfile } from '../../../../shared/helpers/filename.helper';

export interface iTtsApi {
	open: (filePath: string, content: string, startString?: string) => void
	close: () => void
}

export const useTtsPopup = () => {

	const [ttsPopup, setTtsPopup] = useState(false)
	const [ttsPopupFile, setTtsPopupFile] = useState<iFile | null>(null)
	const [ttsPos, setTtsPos] = useState<string | null>(null)
	const [ttsPopupContent, setTtsPopupContent] = useState("")

	const openTtsPopup: iTtsApi['open'] = (filePath, content, startString) => {
		console.log(`[TTS API] : open`, { filePath, content, startString });
		let nfile = pathToIfile(filePath)
		if (nfile) {
			setTtsPopupFile(nfile)
			if (startString) setTtsPos(startString)
			setTtsPopupContent(content)
			setTtsPopup(true)
		}
	}
	const closeTtsPopup: iTtsApi['close'] = () => {
		console.log(`[TTS API] close`);
		setTtsPopup(false)
	}

	const ttsApi: iTtsApi = {
		open: openTtsPopup,
		close: closeTtsPopup,
	}
	return {
		ttsApi,
		ttsPopupContent, ttsPopupFile,
		ttsPos,
		setTtsPopup, ttsPopup
	}


}
