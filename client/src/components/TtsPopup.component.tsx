import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { iFile } from '../../../shared/types.shared';
import { iTtsStatus } from '../hooks/app/useTtsPopup.hook';
import { useInterval } from '../hooks/interval.hook';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { deviceType } from '../managers/device.manager';
import { strings } from "../managers/strings.manager";
import { getAvailableVoices, Text2SpeechManager } from '../managers/tts.manager';
import { startScreenWakeLock, stopScreenWakeLock } from '../managers/wakeLock.manager';
import { Icon } from './Icon.component';
import { Input, OptionObj } from './Input.component';
import { Popup } from './Popup.component';

export const TtsPopup = (p: {
	// allows to retain tracking 
	id: string|null,
	fileContent: string
	startString: string | null

	onUpdate: (status: iTtsStatus) => void
	onClose: Function
}) => {

	const [isPlaying, setIsPlaying] = useState(false)
	const [selectedVoiceId, setSelectedVoiceId] = useLocalStorage<number>('tts-selected-voice', 0)

	// const [currChunk, setCurrChunk] = useState(0)
	const [bgLock, setBgLock] = useState(false)
	// const [lockCounter, setBgLock] = useState(false)
	const lockBgScreen = (status: boolean) => {
		status === true ? startScreenWakeLock() : stopScreenWakeLock()
		setBgLock(status)
	}

	const [currChunk, setCurrChunk] = useLocalStorage<number>(`tts-pos-${p.id}`, 0)
	const [currRate, setCurrRate] = useLocalStorage<number>(`tts-rate`, 1)

	const [totChunks, setTotChunks] = useState(0)

	const tts = useRef<any>()

	useEffect(() => {
		setTimeout(() => {
			if (getAvailableVoices()[selectedVoiceId]) {
				tts.current.loadVoice(getAvailableVoices()[selectedVoiceId].obj)
			}
		})
		tts.current = new Text2SpeechManager({ text: p.fileContent })
		tts.current.goToChunk(currChunk)

	}, [])

	useEffect(() => {
		if (getAvailableVoices()[selectedVoiceId]) {
			tts.current.loadVoice(getAvailableVoices()[selectedVoiceId].obj)
		}
	}, [selectedVoiceId])

	useEffect(() => {
		tts.current.updateSpeed(currRate)
	}, [currRate])

	const initPos = useRef(false)
	useInterval(() => {
		setIsPlaying(tts.current.isPlaying())
		let nPos = -1


		if (tts.current.currChunkId !== 0) nPos = tts.current.currChunkId
		// if we have a p.startString
		if (p.startString && !initPos.current) {
			let chunkPos = tts.current.extractToChunkPos(p.startString)
			nPos = chunkPos
			tts.current.goToChunk(nPos)
			initPos.current = true
		}
		if (nPos !== -1) setCurrChunk(nPos)
		setTotChunks(tts.current.chunkedText.length)
	}, 500)

	useEffect(() => {
		let currentText = tts.current.getCurrentChunkText()
		p.onUpdate({ totalChunks: totChunks, currentChunk: currChunk, isPlaying, currentText })
	}, [totChunks, currChunk, isPlaying])

	return (
		<StyledDiv>
			<Popup
				title={`${strings.ttsPopup.title}`}
				onClose={() => {
					tts.current.stop()
					p.onUpdate({ totalChunks: totChunks, currentChunk: currChunk, isPlaying: false })
					p.onClose()
				}}
			>
				<Input
					value={selectedVoiceId}
					type='select'
					list={getAvailableVoices()}
					label={strings.ttsPopup.voice}
					onSelectChange={id => {
						setSelectedVoiceId(parseInt(id))
					}}
				/>

				<span> SPEED : </span>
				<input type="range" value={currRate} min="0" max="3" step="0.1"
					onChange={e => {
						const nVal = e.target.value as any
						setCurrRate(nVal)
					}}>
				</input>
				<br />
				<br />

				<input type="range" value={currChunk} min="0" max={totChunks}
					onChange={e => {
						let val = parseInt(e.target.value)
						tts.current.goToChunk(val)
						setCurrChunk(val)
					}}>
				</input>
				<input type="number" value={currChunk} min="0" max={totChunks}
					onChange={e => {
						let val = parseInt(e.target.value)
						tts.current.goToChunk(val)
						setCurrChunk(val)
					}}>
				</input> / {totChunks}


				<div className="buttons">
					<button onClick={e => { tts.current.goBack() }}>
						<Icon name="faFastBackward" color="black" />
					</button>
					<button onClick={e => {
						!isPlaying ? tts.current.play() : tts.current.pause()
					}}>
						<Icon name={!isPlaying ? "faPlay" : "faPause"} color="black" />
					</button>
					<button onClick={e => { tts.current.goForward() }}>
						<Icon name="faFastForward" color="black" />
					</button>
					{deviceType() !== "desktop" && <button onClick={e => { lockBgScreen(true) }}>
						<Icon name="faLock" color="black" />
					</button>
					}
				</div>
			</Popup>

			{bgLock && <div className="bg-lock">
				<button
					onContextMenu={e => { lockBgScreen(false) }}>
					<Icon name="faUnlock" color="black" />
				</button>
			</div>}

		</StyledDiv>
	)
}

export const StyledDiv = styled.div`
.bg-lock {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100vw;
		height: 100vh;
		z-index: 1005;
		background: rgba(0,0,0,0.3);
		display: flex;
		justify-content: center;
    align-items: center;
		button {
		}
}
.popup-wrapper .popupContent {
    padding: 20px;
		.input-component span, span {
				display: inline-block;
				width: 30%;
				font-size: 12px;
				font-weight: bold;
		}
}
}
 .buttons {
     display: flex;
     padding: 20px 0px 0px 0px;
     button {
         width: 30%;
         padding: 10px;
     }
 }
 `
