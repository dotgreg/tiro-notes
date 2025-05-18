import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { iTtsStatus } from '../hooks/app/useTtsPopup.hook';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { strings } from "../managers/strings.manager";
import { Icon } from './Icon.component';
import { Popup } from './Popup.component';
import { chunkTextInSentences, chunkTextInSentences2, cleanText2Speech } from '../managers/tts.manager';
import { userSettingsSync } from '../hooks/useUserSettings.hook';
import { getApi } from '../hooks/api/api.hook';
import { notifLog } from '../managers/devCli.manager';

const pre = "[TtsCustomPopup] "

export const TtsCustomPopup = (p: {
	// allows to retain tracking 
	id: string | null,
	fileContent: string
	startString: string | null

	onUpdate: (status: iTtsStatus) => void
	onClose: Function
}) => {

	const [isPlaying, setIsPlaying] = useState(false)
	const [selectedVoiceId, setSelectedVoiceId] = useLocalStorage<number>('tts-selected-voice', 0)
	const [currRate, setCurrRateInt] = useLocalStorage<number>(`tts-rate`, 1)
	const currRateRef = useRef<number>(currRate)
	const setCurrRate = (rate: number) => {
		setCurrRateInt(rate)
		currRateRef.current = rate
	}
	const [currChunk, setCurrChunkInt] = useLocalStorage<number>(`tts-pos-${p.id}`, 0)




	const [textChunks, setTextChunks] = useState<string[]>([])

	useEffect(() => {
		p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying })
	}, [textChunks, currChunk, isPlaying])



	useEffect(() => {
		// split p.fileContent into sentences
		let cleanedText = cleanText2Speech(p.fileContent)
		let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
		let chunkedText2 = chunkTextInSentences2(cleanedText, sentencesPerPart)

		setTextChunks(chunkedText2)
		console.log(`${pre}: loading and chunking text in ${chunkedText2.length} parts`,{chunkedText2})

	}, [p.fileContent])



	const playChunk = (chunkNb, preloadNext = true) => {
		if (audioRef.current) {
			audioRef.current.pause()
		}
		downloadAudioFile(chunkNb, urlAudio => {
			if (urlAudio) playAudio(urlAudio, () => {
				next()
			}) 
		})
		if (preloadNext && chunkNb < textChunks.length - 1) {
			downloadAudioFile(chunkNb + 1, () => {})
		}

	}
	
	const audioRef = useRef<any>(null)
	const currChunkRef = useRef<number>(currChunk)
	const setCurrChunk = (chunkNb) => {
		setCurrChunkInt(chunkNb)
		currChunkRef.current = chunkNb
	}

	
	const playAudio = (urlAudio:string, onEnd:Function) => {
		// stop previous audio if any
		if (audioRef.current) {
			audioRef.current.pause()
		}
		setIsPlaying(true)
		let audio = new Audio(urlAudio)
		audioRef.current = audio

		audio.play()
		updateSpeedAudio(currRateRef.current)
		audio.onended = () => {
			setIsPlaying(false)
			onEnd()
		}
	}
	const next = () => {
		if (currChunkRef.current < textChunks.length - 1) {
			let nChunk = currChunkRef.current + 1
			console.log(`${pre}: next chunk ${nChunk}`)
			playChunk(nChunk)
			setCurrChunk(nChunk)
		}
	}
	const prev = () => {
		if (currChunkRef.current !== 0) {
			let nChunk = currChunkRef.current - 1
			console.log(`${pre}: prev chunk ${nChunk}`)
			playChunk(nChunk)
			setCurrChunk(nChunk)
		}
	}
	const togglePlay = () => {
		if (isPlaying) {
			setIsPlaying(false)
			audioRef.current.pause()
		} else {
			playChunk(currChunk)
		}
	}
	const updateSpeedAudio = (speed:number) => {
		audioRef.current.playbackRate = speed
	}

	// const [audioUrls, setAudioUrls] = useState<string[]>([])
	const audioUrls = useRef<string[]>([])
	const downloadAudioFile = (chunkId:number, cb: (urlAudio:string) => void) => {
		let stringCmd = userSettingsSync.curr.tts_custom_engine_command
		// replace {{input}} in txt by the chunk text
		let textToSent = textChunks[chunkId]
		// let textToSent = "hello world 333"
		stringCmd = stringCmd.replace("{{input}}", textToSent)

		if (audioUrls.current[chunkId]) {
			cb(audioUrls.current[chunkId])
			console.log(`${pre}: already downloaded chunk ${chunkId}`)
			return
		}

		// console.log(`${pre}: asking api`,{stringCmd})
		console.log(`${pre}: asking api for chunk ${chunkId}`)
		// request api
		getApi( api => {
			api.command.exec(stringCmd, (apiAnswer:string) => {
				// console.log(`${pre}: `,{apiAnswer})
				// look for an url ending with .mp3/wav
				let url = apiAnswer.match(/https?:\/\/[^\s]+\.(mp3|wav)/g)
				if (url && url[0]) {
					// console.log(`${pre}: found url ${url[0]}`)
					console.log(`${pre}: [ok] api done for chunk ${chunkId}`)
					audioUrls.current[chunkId] = url[0]
					cb(url[0])
				} else {
					notifLog(`Text to Speech API answer error: `, apiAnswer)
				}
			})
		})
	}
	// START BY PLAYING
	useEffect(() => {
		playChunk(currChunk)
	}, [textChunks])

	const [estimatedTime, setEstimatedTime] = useState<string>("")
	useEffect(() => {
		let formatTime = (mins: number): string => {
			let hours = 0
			let res = `${Math.ceil(mins)}m`
			if (mins > 60) {
				hours = Math.floor(mins / 60)
				let minsLeft = Math.ceil(mins % 60)
				res = `${hours}h`
			}
			return res
		}
		let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
		let sentencesLength = textChunks.length * sentencesPerPart
		let left = formatTime((6 * (sentencesLength - currChunk)) / (currRate * 60))
		let tot = formatTime((6 * sentencesLength) / (currRate * 60))
		let res = ` ${left} left of ${tot}`
		setEstimatedTime(res)
	}, [textChunks, currRate, currChunk])



	return (
		<StyledDiv>
			<Popup
				title={`${strings.ttsPopup.title}`}
				onClose={() => {
					audioRef.current?.pause()
					p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying: false })
					p.onClose()
				}}
			>
				<span> SPEED : </span>
				<input className="speed-range" type="range" value={currRate} min="0.5" max="2" step="0.1"
					onChange={e => {
						const nVal = e.target.value as any
						setCurrRate(nVal)
						updateSpeedAudio(currRateRef.current)
					}}>
				</input> ({currRate})
				<br />

				<br />
				<b> PARTS : </b>
				<input type="number" className="text-pos" value={currChunk} min="0" max={textChunks.length}
					onChange={e => {
						let val = parseInt(e.target.value)
						setCurrChunk(val)
						playChunk(val)
					}}>
				</input> / {textChunks.length}
				<br />
				<input type="range" value={currChunk} className="range-pos" min="0" max={textChunks.length}
					onChange={e => {
						let val = parseInt(e.target.value)
						setCurrChunk(val)
						playChunk(val)
					}}>
				</input>
				<div className="estimated-time"><b>Reading Time</b> :{estimatedTime}</div>



				<div className="buttons">
					<button onClick={e => {prev()}}>
						<Icon name="faFastBackward" color="black" />
					</button>
					<button onClick={e => {
						togglePlay()				
					}}>
						<Icon name={!isPlaying ? "faPlay" : "faPause"} color="black" />
					</button>
					<button onClick={e => {next()}}>
						<Icon name="faFastForward" color="black" />
					</button>
				</div>
			</Popup>


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
		z-index: 100005;
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
		.speed-range {
				position: relative;
				top: 8px;
				width: 90%;
		}
		.range-pos {
				width: 100%;
				margin-bottom:10px;
		}
		.text-pos {
				width: 50px;
				margin-bottom:10px;
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
