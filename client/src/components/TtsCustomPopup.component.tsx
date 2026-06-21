import styled from '@emotion/styled';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { iTtsStatus } from '../hooks/app/useTtsPopup.hook';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { strings } from "../managers/strings.manager";
import { Icon } from './Icon.component';
import { Popup } from './Popup.component';
import { chunkTextInSentences, chunkTextInSentences2, cleanText2Speech, extractToChunkPos } from '../managers/tts.manager';
import { userSettingsSync } from '../hooks/useUserSettings.hook';
import { getApi } from '../hooks/api/api.hook';
import { notifLog } from '../managers/devCli.manager';
import { useInterval } from '../hooks/interval.hook';
import { useBackendState } from '../hooks/useBackendState.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { startScreenWakeLock, stopScreenWakeLock } from '../managers/wakeLock.manager';
import { deviceType } from '../managers/device.manager';
import { chunk, isNumber, last, set, transform } from 'lodash-es';
import { transformString } from '../managers/string.manager';
import { useTtsPlaybackController, useChunkDownloader } from './TtsPlayback';

const pre = "[TtsCustomPopup] "

export const TtsCustomPopup = (p: {
  // allows to retain tracking 
  id: string | null,
  fileContent: string
  startString: string | null

  onUpdate: (status: iTtsStatus) => void
  onClose: Function
}) => {

  const [isPlaying, setIsPlayingInt] = useState(false)
  const isPlayingRef = useRef<boolean>(false)
  const setIsPlaying = (isPlaying: boolean) => {
    setIsPlayingInt(isPlaying)
    isPlayingRef.current = isPlaying
  }
  const [selectedVoiceId, setSelectedVoiceId] = useLocalStorage<number>('tts-selected-voice', 0)
  const [currRate, setCurrRateInt] = useLocalStorage<number>(`tts-rate`, 1)
  const currRateRef = useRef<number>(currRate)
  const setCurrRate = (rate: number) => {
    setCurrRateInt(rate)
    currRateRef.current = rate
  }
  const [wordStat, setWordStat, refreshBackendWordStat] = useBackendState<number>('tts-word-stats', 0, { debug: false })
  const wordStatRef = useRef<number>(0)
  useEffect(() => {
    refreshBackendWordStat(res => {
      if (typeof res === "number") wordStatRef.current = res
    })
  }, [])

  // const [currChunk, setCurrChunk] = useState(0)
  const [bgLock, setBgLock] = useState(false)
  // const [lockCounter, setBgLock] = useState(false)
  const lockBgScreen = (status: boolean) => {
    status === true ? startScreenWakeLock() : stopScreenWakeLock()
    setBgLock(status)
  }

  const [currChunk, setCurrChunkInt] = useLocalStorage<number>(`tts-pos-${p.id}`, 0)

  const [logTxt, setLogTxt] = useState<string>("")

  const [logTxtProcess, setLogTxtProcess] = useState<string>("")
  const [logTxtSaid, setLogTxtSaid] = useState<string>("")
  const logProcessRef = useRef<string>("")
  const logSaidRef = useRef<string>("")

  const [showLog, setShowLog] = useState<boolean>(true)
  const [logCategory, setLogCategoryInt] = useState<string>("processus")
  const logCategoryRef = useRef<string>(logCategory)
  const setLogCategory = (category: string) => {
    // clear log content
    logCategoryRef.current = category
    // logRef.current = ""
    setLogCategoryInt(category)
  }
  let logToShow = logCategoryRef.current === "processus" ? logTxtProcess : logTxtSaid
  // const logRef = useRef<string>("")
  const log = (messageText: string, category: string = "processus") => {
    // prepend to logTxt
    if (category !== logCategoryRef.current) return

    let messageText2 = messageText.replaceAll(`${pre}:`, "")
    messageText2 = messageText2.replaceAll(pre, "")

    // prepend HH:SS + chunk number (S2T1)
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    messageText2 = `${timeStr} ${currChunkRef.current} ${messageText2}`

    const limitLines = (log: string) => {
      // limit to 40 lines, cut the last ones
      let limitLines = 200
      if (log.split("<br>").length > limitLines) {
        let allLines = log.split("<br>")
        // keep only the first limitLines lines for not text
        if (category !== "text") {
          log = allLines.slice(0, limitLines).join("<br>")
          log = log + "<br>~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
        } else {
          log = allLines.slice(allLines.length - limitLines, allLines.length).join("<br>")
        }
      }
      return log
    }

    // append if category is text
    if (category === "processus") {
      logProcessRef.current = messageText2 + "<br>" + logProcessRef.current
      logProcessRef.current = limitLines(logProcessRef.current)
      setLogTxtProcess(logProcessRef.current)
    } else {
      logSaidRef.current = logSaidRef.current + "<br>" + messageText2
      logSaidRef.current = limitLines(logSaidRef.current)
      setLogTxtSaid(logSaidRef.current)
    }
    // console.log(messageText)
    // setLogTxt(logRef.current)
  }



  const [textChunks, setTextChunks] = useState<string[]>([])

  useEffect(() => {
    let currentText = textChunks[currChunk]
    if (currentText) currentText = currentText.split(/[.?!:]/)[0]
    p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying, currentText })
  }, [textChunks, currChunk, isPlaying])



  useEffect(() => {
    // split p.fileContent into sentences
    let cleanedText = cleanText2Speech(p.fileContent)
    let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
    let maxWordsPerSentence = userSettingsSync.curr.tts_max_words_per_sentence
    let chunkedText2 = chunkTextInSentences2(cleanedText, sentencesPerPart, maxWordsPerSentence)
    // console.log(chunkedText2)

    setTextChunks(chunkedText2)
    console.log(`${pre}: loading and chunking text in ${chunkedText2.length} parts`)

  }, [p.fileContent])

  const currChunkRef = useRef<number>(currChunk)
  const setCurrChunk = (chunkNb: number) => {
    setCurrChunkInt(chunkNb)
    currChunkRef.current = chunkNb
  }

  // Extract TTS headers
  const extractTtsHeaders = (cmd: string): Record<string, string> => {
    const headers: Record<string, string> = {}
    const hRegex = /-H\s+["']([^"']+)["']/g
    let m
    while ((m = hRegex.exec(cmd)) !== null) {
      const kv = m[1].split(':')
      if (kv.length >= 2) {
        const key = kv[0].trim()
        const val = kv.slice(1).join(':').trim()
        headers[key] = val
      }
    }
    return headers
  }
  const ttsHeadersRef = useRef<Record<string, string>>({})
  useEffect(() => {
    const cmd = userSettingsSync.curr.tts_custom_engine_command || ''
    ttsHeadersRef.current = extractTtsHeaders(cmd)
    if (Object.keys(ttsHeadersRef.current).length > 0) {
      log(`${pre}: 🔑 extracted TTS headers: ${Object.keys(ttsHeadersRef.current).join(', ')}`)
    }
  }, [])

  // Initialize playback hooks
  const downloader = useChunkDownloader({
    textChunks,
    log,
    setWordStat,
  })

  const controller = useTtsPlaybackController({
    log,
    onChunkEnd: () => next(),
    downloadChunk: downloader.downloadChunk,
    totalChunks: textChunks.length,
    currentChunk: currChunk,
    playbackRate: currRateRef.current,
    ttsHeaders: ttsHeadersRef.current,
    preloadCount: userSettingsSync.curr.tts_preload_parts || 1,
    setIsPlaying,
  })

  const { audioRef } = controller
  const { downloadInProgress } = downloader

  // Debounced playChunk for user inputs (range/number) to prevent race conditions
  const playChunkDebounced = useDebounce((chunkNb: number) => {
    setCurrChunk(chunkNb)
    controller.playChunk(chunkNb, true)
  }, 300)

  // Problem counter for audio error recovery
  const problemCounterRef = useRef<number>(0)

  // Auto-advance to next chunk
  const next = useCallback(() => {
    if (currChunkRef.current < textChunks.length - 1) {
      let nChunk = currChunkRef.current + 1
      log(`${pre}: ️⏭ next chunk ${nChunk}`)
      setCurrChunk(nChunk)
      controller.playChunk(nChunk, false)
    }
  }, [textChunks.length, log, controller])

  // Prev chunk (debounced for user action)
  const prev = useCallback(() => {
    if (currChunkRef.current !== 0) {
      let nChunk = currChunkRef.current - 1
      log(`${pre}:️⏮ prev chunk ${nChunk}`)
      setCurrChunk(nChunk)
      controller.playChunk(nChunk, true)
    }
  }, [log, controller])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      controller.pause()
      log(`${pre}: ⏸️ paused`)
    } else {
      controller.resume()
      log(`${pre}: ▶️ resumed`)
    }
  }, [isPlaying, controller, log])

  // Update audio speed — FIXED: optional chaining
  const updateSpeedAudio = useCallback((speed: number) => {
    controller.audioRef.current?.playbackRate && (controller.audioRef.current!.playbackRate = speed)
  }, [controller])

  // Auto-play on textChunks load (use ref, not stale state)
  const textChunksRef = useRef<string[]>(textChunks)
  textChunksRef.current = textChunks

  useEffect(() => {
    if (textChunks.length > 0 && !isPlaying && !downloadInProgress.current.has(currChunk)) {
      controller.playChunk(currChunk, false)
    }
  }, [textChunks])

  // START BY PLAYING
  useEffect(() => {
    log("=====================================================================")
  }, [])

  // Search for initial chunk position
  const initPos = useRef(false)
  useInterval(() => {
    if (p.startString && !initPos.current && !isPlaying && downloadInProgress.current.size === 0) {
      let nPos = -1
      let chunkPos = extractToChunkPos(p.startString, textChunks, 1000)
      nPos = chunkPos
      initPos.current = true

      let startStringStr = p.startString.substring(0, 100)
      let logStr = `${pre}  🔎 found startString "${startStringStr}" at chunk ${chunkPos}`
      if (chunkPos === -1) logStr = `${pre}  🔎 NOT FOUND  startString "${startStringStr}" at chunk ${chunkPos}`
      log(logStr)
      if (nPos != -1) {
        setCurrChunk(nPos)
        controller.playChunk(nPos, false)
      }
    }
  }, 500)

  // Buffer underrun recovery
  useInterval(() => {
    if (isPlayingRef.current === true) {
      if (!controller.audioRef.current) return
      if (!controller.audioRef.current.src) return
      if (controller.audioRef.current.paused && controller.audioRef.current.readyState >= 2 && !downloadInProgress.current.has(currChunkRef.current)) {
        controller.audioRef.current.play().catch(() => { })
      }
    }
  }, 5000)

  // Audio status monitoring
  useInterval(() => {
    let audio = controller.audioRef.current
    if (!audio) return

    let positionAudio = Math.round(audio.currentTime)
    let timeAudio = audio.duration
    let statusAudio = audio.paused
    let roundTimeAudio = Math.round(timeAudio)
    let durationStr = (!isNumber(timeAudio) || isNaN(roundTimeAudio)) ? "loading" : `${roundTimeAudio}s`
    log(`${pre}: audio status: ${positionAudio}s/${durationStr} ${statusAudio ? "paused" : "playing"} ${isPlayingRef.current ? "isPlaying" : "isNotPlaying"} readyState=${audio.readyState}`)
    if (audio.readyState < 2) {
      problemCounterRef.current = 0
      return
    }
    if (downloadInProgress.current.has(currChunkRef.current)) {
      problemCounterRef.current = 0
      return
    }

    if (!isNumber(timeAudio) || isNaN(roundTimeAudio) || `${roundTimeAudio}` === "NaN") {
      log(`${pre}: ❌  audio ERROR detected ${problemCounterRef.current} times (timeAudio: ${timeAudio}, roundTimeAudio: ${roundTimeAudio})`)
      if (problemCounterRef.current >= 5) {
        log(`${pre}: ❌>> audio ERROR, stopping and restarting`)
        problemCounterRef.current = 0
        controller.pause()
        controller.playChunk(currChunkRef.current, true)
      }
      problemCounterRef.current = problemCounterRef.current + 1
    } else {
      problemCounterRef.current = 0
    }

  }, 5000)


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
    let maxWordsPerSentence = userSettingsSync.curr.tts_max_words_per_sentence
    let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
    let sentencesLength = textChunks.length * sentencesPerPart
    let left = formatTime((6 * (sentencesLength - currChunk)) / (currRate * 60))
    let tot = formatTime((6 * sentencesLength) / (currRate * 60))
    let res = ` ${left} left of ${tot}`
    setEstimatedTime(res)
  }, [textChunks, currRate, currChunk])


  let formId = userSettingsSync.curr.tts_formId
  let formExtractLength = userSettingsSync.curr.tts_form_extract_length || 10

  return (
    <StyledDiv>
      <Popup
        title={`${strings.ttsPopup.title}`}
        disableBg={true}
        onClose={() => {
          controller.destroy()
          let currentText = textChunks[currChunk]
          if (currentText) currentText = currentText.split(/[.?!:]/)[0]
          p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying: false, currentText })
          p.onClose()
        }}
      >
        <span> SPEED : </span>
        <input className="speed-range" type="range" value={currRate} min="0.5" max="3" step="0.1"
          onChange={e => {
            // FIXED: parseFloat instead of string cast
            const nVal = parseFloat(e.target.value)
            setCurrRate(nVal)
            updateSpeedAudio(nVal)
          }}>
        </input> ({currRate})
        <br />

        <br />
        <b> PARTS : </b>
        <input type="number" className="text-pos" value={currChunk} min="0" max={textChunks.length}
          onChange={e => {
            let val = parseInt(e.target.value)
            playChunkDebounced(val)
          }}>
        </input> / {textChunks.length}
        <br />
        <input type="range" value={currChunk} className="range-pos" min="0" max={textChunks.length}
          onChange={e => {
            let val = parseInt(e.target.value)
            playChunkDebounced(val)
          }}>
        </input>
        <div className="estimated-time"><b>Reading Time</b> :{estimatedTime}</div>



        <div className="buttons">
          <button onClick={e => { prev() }}>
            <Icon name="faFastBackward" color="black" />
          </button>
          <button onClick={e => {
            togglePlay()
          }}>
            <Icon name={!isPlaying ? "faPlay" : "faPause"} color="black" />
          </button>
          <button onClick={e => { next() }}>
            <Icon name="faFastForward" color="black" />
          </button>

          {
            deviceType() !== "desktop" && <button onClick={e => { lockBgScreen(true) }}>
              <Icon name="faLock" color="black" />
            </button>
          }
        </div>
        <div
          onClick={e => setShowLog(!showLog)}
          className='log-button'> details </div>
        {
          showLog && typeof wordStat === 'number' &&
          <div className='stats'>
            API Words sent: {wordStat}<br />
            Estimated time spoken: {wordStat / 10 / 60 / 2 < 60 ?
              `${Math.round(wordStat / 10 / 60 / 2)} minutes` :
              `${Math.round(wordStat / 10 / 60 / 2 / 60 * 10) / 10} hours (${Math.round(wordStat / 10 / 60 / 2)} mins)`}<br />
            Estimated price : {Math.round(wordStat * userSettingsSync.curr.tts_price_per_word * 100000) / 100000}<br />
            {/* Cached Audio Parts : {cachedAudioUrls.filter(n => n !== null).length} / { textChunks.length }<br/> */}
            {/* <button onClick={()=> {setWordStat(0);wordStatRef.current = 0}}> reset stats</button> */}
            {/* <button onClick={()=> {clearAudioCache()}}> clear audio cache</button> */}
          </div>
        }
        {
          showLog &&
          // one checkbox to toggle between categories log "text log"
          <label className='log-toggler'>
            Toggle log: <input type="checkbox" checked={logCategory === "text"} onChange={e => setLogCategory(e.target.checked ? "text" : "processus")} />:
            {logCategory === "text" ? "Text Log" : "Processus Log"}
          </label>

        }
        {
          // form button
          formId !== "" &&
          <>
            | form: <button onClick={() => { getApi(api => { api.popup.form.open(formId, () => { }) }) }}>
              Open
            </button>
            <button onClick={() => {
              getApi(api => {

                let lastSentencesSpoken: any = logSaidRef.current.split("<br>")
                let limit = formExtractLength
                if (lastSentencesSpoken.length > limit) {
                  lastSentencesSpoken = lastSentencesSpoken.slice(-limit)
                }
                lastSentencesSpoken = lastSentencesSpoken.join(".") + " "
                api.popup.form.open(formId, () => { }, { text: lastSentencesSpoken, file: `tts insert from ${p.id}` }, { autosubmit: 1000 })
              })
            }}>
              Insert
            </button>
          </>
        }
        {
          showLog &&
          <div className='log-wrapper'>
            <div dangerouslySetInnerHTML={{ __html: logToShow }}></div>
          </div>
        }

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
.log-toggler {
	font-size: 10px;
	margin-right: 10px;
}
.stats {
	font-size: 10px;
	padding: 10px;
}
.log-button {
		cursor: pointer;
		color: #0000ff;
		margin-top: 10px;
		text-align: center;
		font-size: 12px;
}
.log-wrapper {
	min-width: 300px;
	height: 200px;
	overflow:scroll;
	background: #ececec;
	padding: 10px;
	margin-top: 10px;
	font-size: 10px;
}
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
