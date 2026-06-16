import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
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
import { url } from 'inspector';
import { transformString } from '../managers/string.manager';

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
  const [logCategory, setLogCategoryInt] = useState<string>("text")
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

    const limitLines = (log: string) => {
      // limit to 40 lines, cut the last ones
      let limitLines = 40
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



  const stopAudio = () => {
    pauseAllAudioWindow(false)
    setIsPlaying(false)
  }
  const endAudioRef = useRef(false)
  const destroyAudio = () => {
    console.log(`${pre}: audio DESTROYED`)
    pauseAllAudioWindow(true)
    setIsPlaying(false)
    endAudioRef.current = true
  }
  const playChunkInt = (chunkNb, preloadNext = true, replayIfError = true) => {
    stopAudio()
    downloadAudioFile(chunkNb, urlAudio => {
      // log(`${chunkNb} / ${textChunks.length} : got url audio: ${urlAudio}`)

      if (!urlAudio.includes("ERROR")) {
        if (audioUrls.current[chunkNb] !== urlAudio) return
        log(`${pre}: ▶️ playing chunk ${chunkNb}`)
        let textToPlay = textChunks[chunkNb]
        log(`${textToPlay}`, "text")

        playAudio(urlAudio, () => {
          next()
        })
      }
      // else if (replayIfError === true) {
      // 	let delay = 4
      // 	log(`${pre}: ❌▶️ ERROR could not play chunk ${chunkNb}, no audio url, retrying in ${delay}s`)
      // 	setTimeout(() => {
      // 		playChunkInt(chunkNb, false, true)
      // 	}, delay * 1000)
      // }
    })
  }
  const playChunkDebounced = useDebounce(playChunkInt, 500)
  const playChunk = playChunkDebounced


  const audioRef = useRef<any>(null)
  // const allAudiosRef = useRef<any>([])

  const addAudioWindow = (audio: any) => {
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) window.tiro_tts_allAudiosRef = []
    // @ts-ignore
    window.tiro_tts_allAudiosRef.push(audio)
  }
  // const pauseAllAudioWindow = (remove:boolean = false) => {}
  const pauseAllAudioWindow = (remove: boolean = false) => {
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) window.tiro_tts_allAudiosRef = []
    // @ts-ignore
    for (let i = 0; i < window.tiro_tts_allAudiosRef.length; i++) {
      // @ts-ignore
      window.tiro_tts_allAudiosRef[i].pause()
      // @ts-ignore
      // window.tiro_tts_allAudiosRef[i].currentTime = 0
    }
    if (remove === true) {
      // destroy each oject
      // @ts-ignore
      window.tiro_tts_allAudiosRef = []
    }
  }

  const currChunkRef = useRef<number>(currChunk)
  const setCurrChunk = (chunkNb) => {
    setCurrChunkInt(chunkNb)
    currChunkRef.current = chunkNb
  }

  const problemCounterRef = useRef<number>(0)

  // in-flight guard: prevent duplicate requests for the same chunk
  const downloadInProgress = useRef<Set<number>>(new Set())
  // store pending callbacks for chunks still downloading
  const pendingCallbacks = useRef<Map<number, Array<(url: string) => void>>>(new Map())


  useInterval(() => {
    let audio = audioRef.current
    if (!audio) return

    let positionAudio = Math.round(audio.currentTime)
    let timeAudio = audio.duration
    let statusAudio = audio.paused
    let roundTimeAudio = Math.round(timeAudio)
    log(`${pre}: audio status: ${positionAudio}s/${roundTimeAudio}s ${statusAudio ? "paused" : "playing"} ${isPlayingRef.current ? "isPlaying" : "isNotPlaying"} `)
    // skip check if audio hasn't loaded metadata yet (readyState < HAVE_CURRENT_DATA = 2)
    // this prevents false errors when a new Audio object is created and metadata hasn't arrived
    // also skip if current chunk still downloading (API slow response)
    if (audio.readyState < 2) {
      // still loading metadata, reset counter
      problemCounterRef.current = 0
      return
    }
    if (downloadInProgress.current.has(currChunkRef.current)) {
      // current chunk still downloading, don't error
      problemCounterRef.current = 0
      return
    }

    if (!isNumber(timeAudio) || isNaN(roundTimeAudio) || `${roundTimeAudio}` === "NaN") {
      log(`${pre}: ❌  audio ERROR detected ${problemCounterRef.current} times (timeAudio: ${timeAudio}, roundTimeAudio: ${roundTimeAudio})`)
      if (problemCounterRef.current >= 5) {
        log(`${pre}: ❌>> audio ERROR, stopping and restarting`)
        problemCounterRef.current = 0
        stopAudio()
        playChunk(currChunkRef.current, false, false)
      }
      problemCounterRef.current = problemCounterRef.current + 1
    } else {
      // healthy audio, reset counter
      problemCounterRef.current = 0
    }

  }, 5000)

  let currentAudioObj = useRef<any>(null)
  const playAudio = (urlAudio: string, onEnd: Function) => {
    // stop previous audio if any
    stopAudio()
    if (isPopupClosedRef.current === true) return
    setIsPlaying(true)

    // always create a NEW Audio object to ensure oncanplaythrough fires
    let audio: any = new Audio(urlAudio)
    currentAudioObj.current = audio

    addAudioWindow(audio)
    audioRef.current = audio
    audio.preload = "auto"

    audio.oncanplaythrough = () => {
      if (endAudioRef.current === true) return
      log(`${pre}: audio LOADED, start PLAY`)
      audio.play()
      updateSpeedAudio(currRateRef.current)

      // preload next chunks while this one plays
      let chunkIdx = currChunkRef.current
      let toPreload = userSettingsSync.curr.tts_preload_parts || 1
      for (let i = 1; i <= toPreload; i++) {
        let nextIdx = chunkIdx + i
        if (nextIdx < textChunks.length) {
          downloadAudioFile(nextIdx, () => { })
        }
      }
    }
    audio.onerror = () => {
      log(`${pre}: ❌ audio LOAD ERROR for ${urlAudio}`)
      setIsPlaying(false)
    }
    audio.onended = () => {
      log(`${pre}: audio ENDED`)
      // destroy audio to flush memory
      audioRef.current = null
      audio.remove()

      setIsPlaying(false)
      onEnd()
    }
  }
  const next = () => {
    if (currChunkRef.current < textChunks.length - 1) {
      let nChunk = currChunkRef.current + 1
      log(`${pre}: ️⏭ next chunk ${nChunk}`)
      playChunk(nChunk)
      setCurrChunk(nChunk)
    }
  }
  const prev = () => {
    if (currChunkRef.current !== 0) {
      let nChunk = currChunkRef.current - 1
      log(`${pre}:️⏮ prev chunk ${nChunk}`)
      playChunk(nChunk)
      setCurrChunk(nChunk)
    }
  }
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      audioRef.current.pause()
      log(`${pre}: ⏸️ paused`)
    } else {
      playChunk(currChunk)
    }
  }
  const updateSpeedAudio = (speed: number) => {
    audioRef.current.playbackRate = speed
  }

  // const cacheIdUrls = `tts-cached-audio-urls-parts${p.id}-${userSettingsSync.curr.tts_sentences_per_part}`
  // const [cachedAudioUrls, setCachedAudioUrls] = useLocalStorage<string[]>(cacheIdUrls,[])
  const audioUrls = useRef<string[]>([])
  // useEffect(() => {
  // 	if (cachedAudioUrls.length > 0) { audioUrls.current = cachedAudioUrls }
  // }, [cachedAudioUrls])	
  // const clearAudioCache = () => {
  // 	let before = audioUrls.current.filter(u => u !== null).length
  // 	setCachedAudioUrls([]);
  // 	audioUrls.current = []
  // 	let after = audioUrls.current.length
  // 	log(`${pre}: ⚠️ cleared audio cache (${before} -> ${after})`)
  // }



  // const currentLogTextRef = useRef<number>(0)

  const downloadAudioFile = (chunkId: number, cb: (urlAudio: string) => void) => {
    let stringCmd = userSettingsSync.curr.tts_custom_engine_command
    // replace {{input}} in txt by the chunk text
    let textToSent = textChunks[chunkId]
    if (!textToSent || textToSent.length === 0) return log(`${pre}: ⚠️ chunk ${chunkId} is empty, do not download`)
    let wordsNb = textToSent?.split(" ").length || 0
    if (typeof wordsNb === "number" && typeof wordStatRef.current === "number") {
      wordStatRef.current = wordStatRef.current + wordsNb
      setWordStat(wordStatRef.current + wordsNb)
    }
    let wordLog = `[${wordsNb} words]`


    // textToSent simplified, remove all punctuation, to only keep a-Z0-9,.-"'()
    let textToSentSimple = transformString(textToSent, { accents: true, specialChars: false, escapeChars: true })

    stringCmd = stringCmd.replace("{{input}}", textToSent)
    stringCmd = stringCmd.replace("{{input_simple}}", textToSentSimple)
    let isCbCalled = false
    const cbOnce = (res: any) => {
      if (isCbCalled) return
      cb(res)
      isCbCalled = true
    }

    // skip if already cached
    if (audioUrls.current[chunkId]) {
      cbOnce(audioUrls.current[chunkId])
      return
    }
    // skip if already downloading this chunk (prevents duplicate requests)
    if (downloadInProgress.current.has(chunkId)) {
      log(`${pre}: ⏳ chunk ${chunkId} already downloading, queuing callback`)
      // queue callback to fire when download finish
      if (!pendingCallbacks.current.has(chunkId)) {
        pendingCallbacks.current.set(chunkId, [])
      }
      pendingCallbacks.current.get(chunkId)!.push(cb)
      return
    }
    let start = Date.now()
    // mark as in-flight
    downloadInProgress.current.add(chunkId)
    getApi(api => {
      api.command.exec(stringCmd, (apiAnswer: string) => {
        if (isCbCalled) return
        // clear in-flight flag
        downloadInProgress.current.delete(chunkId)

        let url = ""
        // resolve any queued callbacks for this chunk
        const queuedCbs = pendingCallbacks.current.get(chunkId)
        if (queuedCbs) {
          for (const qCb of queuedCbs) {
            qCb(url || "ERROR: API")
          }
          pendingCallbacks.current.delete(chunkId)
        }
        // 1. try regex: find any .mp3/.wav/.ogg/.m4a URL in the response
        let regexMatch = apiAnswer.match(/https?:\/\/[\S]+\.(mp3|wav|ogg|m4a)/i)
        if (regexMatch) {
          url = regexMatch[0]
        } else {
          // 2. fallback: try JSON parsing with common key names
          try {
            let apiObj = JSON.parse(apiAnswer)
            url = apiObj["output"] || apiObj["url"] || apiObj["audio_url"] || apiObj["data"] || ""
          } catch (error) {
            // not JSON, regex already tried above
          }
        }

        if (url && url.length > 0) {
          console.log(`${pre}: found url ${url}`)
          let time = Date.now() - start
          let timeLog = `[${time}ms]`
          log(`${pre}: 📥 [ok] API done for chunk ${chunkId} ${wordLog} ${timeLog}`)
          audioUrls.current[chunkId] = url
          // preload the audio
          let audio = new Audio(url)
          audio.preload = "auto"
          cbOnce(url)
        } else {
          let message = apiAnswer
          try {
            let apiObj = JSON.parse(apiAnswer)
            message = `${apiObj["stderr"]} - ${apiObj["shortMessage"]}`
            log(`${pre}: 📥❌ [!! error] chunk ${chunkId}: API answer error: ${message} ${wordLog}`)

          } catch (error) {
            log(`${pre}: ❌ [!! error] chunk ${chunkId}: API answer error: ${JSON.stringify(error)} ${wordLog}`)
          }
          cbOnce("ERROR: API")
          // notifLog(`Text to Speech API answer error: <br>`+message )
        }
      })
    })
  }
  // START BY PLAYING
  useEffect(() => {
    log("=====================================================================")
  }, [])

  useEffect(() => {
    // only auto-play if we have chunks, nothing is playing, and no download in-flight
    // also skip if this chunk is already being downloaded (prevents double-play from next()/prev() + useEffect race)
    if (textChunks.length > 0 && !isPlaying && !downloadInProgress.current.has(currChunk)) {
      playChunk(currChunk)
    }
  }, [textChunks, currChunk])

  const initPos = useRef(false)
  useInterval(() => {
    // search for initial chunk
    if (p.startString && !initPos.current && !isPlaying && downloadInProgress.current.size === 0) {
      let nPos = -1
      // let refinedStartString = p.startString.trim()
      // // split by ,;.
      // let allSentences = refinedStartString.split(/[,;.:]+/).map(s => s.trim())
      // // keep longuest sentence
      // refinedStartString = allSentences.reduce((a, b) => a.length > b.length ? a : b)

      let chunkPos = extractToChunkPos(p.startString, textChunks, 1000)
      nPos = chunkPos
      initPos.current = true

      // search emoji =>  
      let startStringStr = p.startString.substring(0, 100)
      let logStr = `${pre}  🔎 found startString "${startStringStr}" at chunk ${chunkPos}`
      if (chunkPos === -1) logStr = `${pre}  🔎 NOT FOUND  startString "${startStringStr}" at chunk ${chunkPos}`
      log(logStr)
      if (nPos != -1) setCurrChunk(nPos)
    }

  }, 500)
  useInterval(() => {
    // if is playing, try resume (buffer underrun recovery)
    if (isPlayingRef.current === true) {
      if (!audioRef.current) return
      if (!audioRef.current.src) return
      // only resume if paused AND metadata loaded AND not currently downloading
      if (audioRef.current.paused && audioRef.current.readyState >= 2 && !downloadInProgress.current.has(currChunkRef.current)) {
        audioRef.current.play().catch(() => {}) // suppress play errors
      }
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


  const isPopupClosedRef = useRef(false)

  let formId = userSettingsSync.curr.tts_formId
  let formExtractLength = userSettingsSync.curr.tts_form_extract_length || 10

  return (
    <StyledDiv>
      <Popup
        title={`${strings.ttsPopup.title}`}
        disableBg={true}
        onClose={() => {
          destroyAudio()
          pauseAllAudioWindow(true)
          isPopupClosedRef.current = true
          let currentText = textChunks[currChunk]
          if (currentText) currentText = currentText.split(/[.?!:]/)[0]
          p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying: false, currentText })
          p.onClose()
        }}
      >
        <span> SPEED : </span>
        <input className="speed-range" type="range" value={currRate} min="0.5" max="3" step="0.1"
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
