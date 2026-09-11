import React, { useEffect, useRef, useState } from 'react';

export interface iTtsStatus {
	isPlaying: boolean
	totalChunks: number
	currentChunk: number
	currentText?: string
	// 0..1, 5 decimals — position in the book (chunk ratio), set by TtsCustomPopup
	progress?: number
}

export interface iTtsApi {
	open: (content: string, opts?: { startString?: string, startPercent?: number, id?: string }) => void
	getStatus: (
		// rand: string,
		cb: (status: iTtsStatus) => void
	) => void
	close: () => void
}

const h = `[TTS API]`
export const useTtsPopup = () => {

	const [ttsPopup, setTtsPopup] = useState(false)
	const [ttsPopupId, setTtsPopupId] = useState<string | null>(null)
	const [ttsPos, setTtsPos] = useState<string | null>(null)
	const [ttsStartPercent, setTtsStartPercent] = useState<number | null>(null)
	const [ttsPopupContent, setTtsPopupContent] = useState("")

	const openTtsPopup: iTtsApi['open'] = (content, opts) => {
		opts = opts ? opts : {}
		let id = opts.id ? opts.id : null
		let startString = opts.startString ? opts.startString : null
		let startPercent = opts.startPercent != null && opts.startPercent > 0 ? opts.startPercent : null

		let contentSub = content.length < 1500 ? content : content.substring(0, 1500) + "..., total size chars = " + content.length
		console.log(h, `open`, { id, contentSub, startString, startPercent });

		setTtsPopupId(id)
		if (startString) setTtsPos(startString)
		setTtsStartPercent(startPercent)
		setTtsPopupContent(content)
		setTtsPopup(true)
	}
	const closeTtsPopup: iTtsApi['close'] = () => {
		// console.log(h, ` close`);
		setTtsPopup(false)
		setTtsStartPercent(null)
	}

	// GET STATUS PLAY TTS
	const getStatus: iTtsApi['getStatus'] = (cb) => {
		// console.log(h, `getStatus`, ttsStatusInt.current, cb, cb.toString());
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
		ttsPopupContent, ttsPopupId,
		ttsPos, ttsStartPercent,
		setTtsPopup, ttsPopup,
		syncTtsStatus
	}


}
