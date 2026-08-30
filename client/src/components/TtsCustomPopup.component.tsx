import styled from '@emotion/styled';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { iTtsStatus } from '../hooks/app/useTtsPopup.hook';
import { useLocalStorage } from '../hooks/useLocalStorage.hook';
import { strings } from "../managers/strings.manager";
import { Icon } from './Icon.component';
import { Popup } from './Popup.component';
import { chunkTextInSentences2, cleanText2Speech, extractToChunkPos, parseTtsEngines, TtsEngine } from '../managers/tts.manager';
import { userSettingsSync } from '../hooks/useUserSettings.hook';
import { getApi } from '../hooks/api/api.hook';
import { useInterval } from '../hooks/interval.hook';
import { useBackendState } from '../hooks/useBackendState.hook';
import { useDebounce } from '../hooks/lodash.hooks';
import { startScreenWakeLock, stopScreenWakeLock } from '../managers/wakeLock.manager';
import { deviceType } from '../managers/device.manager';
import { isNumber } from 'lodash-es';
import { useTtsPlaybackController, useChunkDownloader, getTtsTabId, onVisibilityChange, TtsState } from './TtsPlayback';

const pre = "[TtsCustomPopup] "

// log lines are rendered with dangerouslySetInnerHTML — escape first
const escapeHtml = (s: string) => s
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')

// make audio file urls in log lines clickable (feature: clickable mp3 in log)
const linkifyAudioUrls = (s: string) => s.replace(/(https?:\/\/[^\s<]+?\.(?:mp3|wav|ogg|m4a)(?:\?[^\s<]*)?)/gi,
	'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')

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

  const [bgLock, setBgLock] = useState(false)
  const lockBgScreen = (status: boolean) => {
    status === true ? startScreenWakeLock() : stopScreenWakeLock()
    setBgLock(status)
  }

  const [currChunk, setCurrChunkInt] = useLocalStorage<number>(`tts-pos-${p.id}`, 0)
  const currChunkRef = useRef<number>(currChunk)
  const setCurrChunk = (chunkNb: number) => {
    setCurrChunkInt(chunkNb)
    currChunkRef.current = chunkNb
  }

  const [logTxtProcess, setLogTxtProcess] = useState<string>("")
  const [logTxtSaid, setLogTxtSaid] = useState<string>("")
  const logProcessRef = useRef<string>("")
  const logSaidRef = useRef<string>("")

  const [showLog, setShowLog] = useState<boolean>(true)
  const [logCategory, setLogCategoryInt] = useState<string>("processus")
  const logCategoryRef = useRef<string>(logCategory)
  const setLogCategory = (category: string) => {
    logCategoryRef.current = category
    setLogCategoryInt(category)
  }
  let logToShow = logCategoryRef.current === "processus" ? logTxtProcess : logTxtSaid
  const log = (messageText: string, category: string = "processus") => {
    if (category !== logCategoryRef.current) return

    let messageText2 = messageText.replaceAll(`${pre}:`, "")
    messageText2 = messageText2.replaceAll(pre, "")

    // prepend HH:SS + chunk number
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    messageText2 = `${timeStr} ${currChunkRef.current} ${escapeHtml(messageText2)}`
    messageText2 = linkifyAudioUrls(messageText2)

    const limitLines = (log: string) => {
      // limit to 200 lines, cut the last ones (processus keeps the beginning, text keeps the end)
      let limit = 200
      if (log.split("<br>").length > limit) {
        let allLines = log.split("<br>")
        if (category !== "text") {
          log = allLines.slice(0, limit).join("<br>")
          log = log + "<br>~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
        } else {
          log = allLines.slice(allLines.length - limit, allLines.length).join("<br>")
        }
      }
      return log
    }

    if (category === "processus") {
      logProcessRef.current = messageText2 + "<br>" + logProcessRef.current
      logProcessRef.current = limitLines(logProcessRef.current)
      setLogTxtProcess(logProcessRef.current)
    } else {
      logSaidRef.current = logSaidRef.current + "<br>" + messageText2
      logSaidRef.current = limitLines(logSaidRef.current)
      setLogTxtSaid(logSaidRef.current)
    }
  }

  // ── TTS engine backends (setting `tts_custom_engine_command`) ────────────
  // one engine per line: "name | max words per sentence (-1 = whole text) | command"
  // a line without " | " = legacy single command (one engine, global max words)
  const engines = useMemo(
    () => parseTtsEngines(userSettingsSync.curr.tts_custom_engine_command, userSettingsSync.curr.tts_max_words_per_sentence),
    [userSettingsSync.curr.tts_custom_engine_command, userSettingsSync.curr.tts_max_words_per_sentence],
  )
  const [selEngineName, setSelEngineName] = useLocalStorage<string>('tts-engine', '')
  const selectedEngine: TtsEngine | undefined = engines.find(e => e.name === selEngineName) || engines[0]
  const selectedEngineRef = useRef(selectedEngine)
  selectedEngineRef.current = selectedEngine
  const selMaxWords = selectedEngine ? selectedEngine.maxWords : userSettingsSync.curr.tts_max_words_per_sentence
  // stable getters reading refs → live values even from stale closures
  const getEngineCommand = useCallback(() => selectedEngineRef.current?.command || userSettingsSync.curr.tts_custom_engine_command || '', [])
  const getRate = useCallback(() => currRateRef.current, [])

  // Extract TTS headers from the engine command (-H "Key: Value" pairs)
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
  // headers follow the selected engine (recomputed per render, synced by the controller)
  const ttsHeaders = extractTtsHeaders(selectedEngine?.command || '')

  const [textChunks, setTextChunks] = useState<string[]>([])

  // ── Audio system (rewritten 0.52.9 — see _specs/_tts_double_play.md) ──────
  const downloader = useChunkDownloader({
    textChunks,
    log,
    setWordStat,
    getEngineCommand,
    getRate,
  })

  const controller = useTtsPlaybackController({
    log,
    onChunkEnd: () => next(),
    downloadChunk: downloader.downloadChunk,
    totalChunks: textChunks.length,
    currentChunk: currChunk,
    playbackRate: currRateRef.current,
    ttsHeaders,
    preloadCount: userSettingsSync.curr.tts_preload_parts || 1,
    setIsPlaying,
    audioUrls: downloader.audioUrls,
  })

  useEffect(() => {
    let currentText = textChunks[currChunk]
    if (currentText) currentText = currentText.split(/[.?!:]/)[0]
    p.onUpdate({ totalChunks: textChunks.length, currentChunk: currChunk, isPlaying, currentText })
  }, [textChunks, currChunk, isPlaying])

  const startStringAppliedRef = useRef(false)
  useEffect(() => {
    // split p.fileContent into sentences
    let cleanedText = cleanText2Speech(p.fileContent)
    let sentencesPerPart = userSettingsSync.curr.tts_sentences_per_part
    let chunkedText2: string[]
    if (selMaxWords === -1) {
      // this engine asks for the WHOLE text in a single part
      chunkedText2 = [cleanedText]
    } else {
      chunkedText2 = chunkTextInSentences2(cleanedText, sentencesPerPart, selMaxWords)
    }

    setTextChunks(chunkedText2)
    console.log(`${pre}: loading and chunking text in ${chunkedText2.length} parts (engine: ${selectedEngine ? selectedEngine.name : 'fallback'})`)
    // an engine switch may have shrunk the chunk list — keep the position valid
    if (currChunkRef.current > Math.max(0, chunkedText2.length - 1)) {
      setCurrChunk(Math.max(0, chunkedText2.length - 1))
    }

    // Search for start position on first run.
    // First run only — on engine switch the user's current position must be kept.
    if (p.startString && !startStringAppliedRef.current) {
      startStringAppliedRef.current = true
      let startStringCleaned = cleanText2Speech(p.startString)
      let chunkPos = extractToChunkPos(startStringCleaned, chunkedText2, 1000)
      if (chunkPos !== -1) {
        setCurrChunk(chunkPos)
        log(`${pre} 🔎 found at chunk ${chunkPos}`)
      } else {
        log(`${pre} 🔎 NOT FOUND`)
      }
    }
    // Re-runs on engine switch too (fresh re-chunked array). No auto-play:
    // the TTS API is only sent when the user presses play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fileContent, selMaxWords, selectedEngine ? selectedEngine.name : ''])
  // ── Progress bar (current chunk) — timeupdate-driven, no extra polling ───
  const [audioProgress, setAudioProgress] = useState(0)
  const draggingRef = useRef(false)
  useEffect(() => {
    const audio = controller.audioRef.current
    if (!audio) return
    const onTime = () => {
      if (draggingRef.current) return
      if (!isFinite(audio.duration) || audio.duration <= 0) return
      setAudioProgress(Math.min(1, audio.currentTime / audio.duration))
    }
    // new src on the same element → bar starts at 0
    const onCanplay = () => { if (!draggingRef.current) setAudioProgress(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('canplay', onCanplay)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('canplay', onCanplay)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller.audioRef.current])

  // Engine switch: bump the downloader generation (in-flight responses of the
  // previous engine are discarded) and clear its URL cache. If playing, pause —
  // the user must press play again to restart with the new engine (fresh request).
  const onEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    setSelEngineName(name)
    const en = engines.find(x => x.name === name)
    log(`${pre}: 🔊 engine → ${name}${en ? ` (max ${en.maxWords === -1 ? 'whole text' : `${en.maxWords} words/sentence`})` : ''}`)
    downloader.cleanup()
    if (isPlayingRef.current) {
      setIsPlaying(false)
      controller.pause()
    }
  }

  // Latest controller for stable listeners (storage lock, unmount cleanup)
  const controllerRef = useRef(controller)
  controllerRef.current = controller
  const { downloadInProgress } = downloader

  // Debounced playChunk for user inputs (range/number) to prevent race conditions
  const playChunkDebounced = useDebounce((chunkNb: number) => {
    setCurrChunk(chunkNb)
    controller.playChunk(chunkNb, true)
  }, 300)

  // Problem counter for audio error recovery
  const problemCounterRef = useRef<number>(0)

  // Detect the browser silently resetting the audio element to 0s
  // (0.52.7 log A: "0s/76s readyState=1" on an element that had played to 74s).
  // On reset we restart the chunk via playChunk (clean element) instead of
  // letting a recovery play() replay the chunk from 0 = double play.
  const lastAudioIdRef = useRef<number | undefined>(undefined)
  const lastAudioPosRef = useRef<number>(0)
  const checkAudioReset = (audio: HTMLAudioElement): boolean => {
    const aid = (audio as any).__ttsId
    if (aid !== lastAudioIdRef.current) {
      lastAudioIdRef.current = aid
      lastAudioPosRef.current = 0
      return false
    }
    if (lastAudioPosRef.current > 2 && audio.currentTime < 1) {
      log(`${pre}: ⚠️ audio#${aid} RESET detected (pos ${Math.round(audio.currentTime)}s, was ${Math.round(lastAudioPosRef.current)}s) — restarting chunk ${currChunkRef.current}`)
      lastAudioPosRef.current = 0
      return true
    }
    if (audio.currentTime >= lastAudioPosRef.current) lastAudioPosRef.current = audio.currentTime
    return false
  }

  // Auto-advance to next chunk
  const next = useCallback((isUserAction: boolean = false) => {
    if (currChunkRef.current < textChunks.length - 1) {
      let nChunk = currChunkRef.current + 1
      log(`${pre}: ️⏭ next chunk ${nChunk}`)
      setCurrChunk(nChunk)
      controller.playChunk(nChunk, true)
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
      // Prime the iOS autoplay unlock inside the user gesture (first play() attempt
      // must happen in the gesture stack; resume()'s play() arrives after async src
      // handling). No-op on the very first play (the element is created during the
      // download) — a blocked start then surfaces "tap ▶" and the second tap unlocks.
      controller.audioRef.current?.play().catch(() => { })
      controller.resume()
      log(`${pre}: ▶️ resumed`)
    }
  }, [isPlaying, controller, log])

  // Update audio speed
  const updateSpeedAudio = useCallback((speed: number) => {
    controller.audioRef.current?.playbackRate && (controller.audioRef.current!.playbackRate = speed)
  }, [controller])

  // ── 5s audio monitor: status log + reset detection + NaN counter.
  // (merged from two same-cadence intervals — same checks, one timer).
  // Underrun recovery is event-driven in the controller (pause listener,
  // s2_t4 Task 1) — the poll only keeps the checks that need a cadence.
  useInterval(() => {
    // Cross-tab claim (s2_t4 Task 6): the winner heartbeats so its claim stays
    // fresh; a tab paused by the lock takes over once the claim is stale
    // (>60s = winner tab closed or its JS suspended). Runs before the audio
    // checks: takeover may resume() on a tab whose element is already gone.
    if (claimKey) {
      if (!lockPausedRef.current) {
        writeClaim()
      } else {
        const cur = readClaim()
        if (cur && cur.tabId !== getTtsTabId() && Date.now() - cur.ts > 60000) {
          lockPausedRef.current = false
          writeClaim()
          controllerRef.current.resume()
          log(`${pre}🔓 TTS claim stale — re-claimed and resuming`)
        }
      }
    }

    const audio = controller.audioRef.current
    if (!audio) return

    const aid = (audio as any).__ttsId ?? '?'
    let positionAudio = Math.round(audio.currentTime)
    let timeAudio = audio.duration
    let roundTimeAudio = Math.round(timeAudio)
    let durationStr = (!isNumber(timeAudio) || isNaN(roundTimeAudio)) ? "loading" : `${roundTimeAudio}s`
    // @ts-ignore
    let winAudios = (window.tiro_tts_allAudiosRef || []).length
    log(`${pre}: audio status: #${aid} ${positionAudio}s/${durationStr} ${audio.paused ? "paused" : "playing"} ${isPlayingRef.current ? "isPlaying" : "isNotPlaying"} readyState=${audio.readyState} winAudios=${winAudios}`)

    if (audio.readyState < 2) {
      problemCounterRef.current = 0
      return
    }

    // Missed `ended` fallback (rare on Android): the element is at the end but we
    // never advanced. Only when state is still PLAYING — a normal onended sets
    // ENDED + isPlaying=false, and next() moves state to LOADING, so this fires
    // at most once.
    if (isPlayingRef.current && audio.ended && controller.state === TtsState.PLAYING) {
      log(`${pre}: ⚠️ ended not fired — advancing manually`)
      next()
    }

    // Reset detection (only while playing with a loaded src)
    if (isPlayingRef.current && audio.src) {
      if (checkAudioReset(audio)) {
        controller.playChunk(currChunkRef.current, true)
        return
      }
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

  // No auto-play (0.52.15): the TTS API is only sent when the user presses play
  useEffect(() => {
    log("=====================================================================")
    log(`${pre}: 🔊 engines: ${engines.length > 0 ? engines.map(x => x.name).join(', ') : 'NONE — set “Custom Text to Speech command” in settings'}`)
    log(`${pre}: 🚶 idle — press ▶ to start (no TTS API is sent until then)`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cross-tab session lock (report §9.4) ───────────────────────────────────
  // The 0.52.8 log proved the in-tab code is clean (one element per chunk, no
  // resets, no stale second element in this tab). The leading suspect for the
  // double play is a second tab/window of the app playing the same file.
  // One claim per file in localStorage: the NEWER claim wins, the other tab's
  // controller pauses (pause is safe/idempotent). When the winner releases
  // (closes), a tab that was paused by this lock re-claims and resumes.
  const claimKey = p.id ? `tts-claim-${p.id}` : ''
  const claimRef = useRef<{ tabId: string; ts: number }>({ tabId: '', ts: 0 })
  const lockPausedRef = useRef(false)
  const writeClaim = () => {
    if (!claimKey) return
    claimRef.current = { tabId: getTtsTabId(), ts: Date.now() }
    try { localStorage.setItem(claimKey, JSON.stringify(claimRef.current)) } catch { /* ignore */ }
  }
  const readClaim = (): { tabId: string; ts: number } | null => {
    try { return JSON.parse(localStorage.getItem(claimKey) || 'null') } catch { return null }
  }

  useEffect(() => {
    if (!claimKey) return
    writeClaim()

    const onStorage = (e: StorageEvent) => {
      if (e.key !== claimKey) return
      const myTab = getTtsTabId()

      if (!e.newValue) {
        // claim released: if THIS lock paused us, re-claim and resume
        if (lockPausedRef.current) {
          lockPausedRef.current = false
          writeClaim()
          controllerRef.current.resume()
          log(`${pre}🔓 TTS claim released — resuming`)
        }
        return
      }

      const other = readClaim()
      if (!other || other.tabId === myTab) return

      // lose if the other claim is newer (ts, tabId as deterministic tiebreak)
      const iLose = other.ts > claimRef.current.ts ||
        (other.ts === claimRef.current.ts && other.tabId > myTab)
      if (iLose) {
        if (lockPausedRef.current) return // already locked out (heartbeat re-fire) — idempotent
        const wasPlaying = isPlayingRef.current
        controllerRef.current.pause()
        lockPausedRef.current = wasPlaying
        log(`${pre}🛑 another tab claimed this file (tab ${other.tabId}) — ${wasPlaying ? 'paused' : 'staying paused'}`)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      // release the claim only if we still hold it
      const cur = readClaim()
      if (cur && cur.tabId === getTtsTabId()) {
        try { localStorage.removeItem(claimKey) } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimKey])

  // ── Page-visibility lifecycle (s2_t4 Task 3) ─────────────────────────────
  // The OS releases the wake lock when the page hides (Wake Lock API spec) and
  // may pause audio (or queue the pause event until resume). On visible:
  // re-acquire the lock if the user had it on, and re-assert playback if we
  // were playing but the element is now paused. isPlayingRef guards against
  // intentional pauses (the controller sets it false before pausing the element).
  useEffect(() => {
    const onVis = () => {
      onVisibilityChange(
        document.visibilityState === 'visible',
        bgLock,
        startScreenWakeLock,
        controllerRef.current.audioRef.current,
        isPlayingRef.current,
        (m) => log(`${pre}: ${m}`),
      )
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [bgLock])

  const [estimatedTime, setEstimatedTime] = useState<string>("")
  useEffect(() => {
    let formatTime = (mins: number): string => {
      let hours = 0
      let res = `${Math.ceil(mins)}m`
      if (mins > 60) {
        hours = Math.floor(mins / 60)
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
        {
          engines.length > 0 &&
          <>
            <span> ENGINE : </span>
            <select className="engine-select" value={selectedEngine ? selectedEngine.name : ''} onChange={onEngineChange}>
              {
                engines.map(en => (
                  <option key={en.name} value={en.name}>
                    {en.name} ({en.maxWords === -1 ? 'whole text' : `${en.maxWords} w/sentence`})
                  </option>
                ))
              }
            </select>
            <br /><br />
          </>
        }
        <span> SPEED : </span>
        <br />
        <input className="speed-range" type="range" value={currRate} min="0.5" max="3" step="0.1"
          onChange={e => {
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

        <div className="audio-progress">
          <span>PROGRESS : </span>
          <input type="range" className="progress-range" min="0" max="1" step="0.01" value={audioProgress}
            onPointerDown={() => { draggingRef.current = true }}
            onPointerUp={() => { draggingRef.current = false }}
            onChange={e => {
              const frac = parseFloat(e.target.value)
              setAudioProgress(frac)
              if (controller.seek(frac)) {
                log(`${pre}: 🔍 seeked to ${Math.round(frac * 100)}%`)
              } else {
                log(`${pre}: 🔍 seek to ${Math.round(frac * 100)}% (applies when the audio is loaded)`)
              }
            }}>
          </input> ({Math.round(audioProgress * 100)}%)
          <br />
        </div>



        <div className="buttons">
          <button onClick={e => { prev() }}>
            <Icon name="faFastBackward" color="black" />
          </button>
          <button onClick={e => {
            togglePlay()
          }}>
            <Icon name={!isPlaying ? "faPlay" : "faPause"} color="black" />
          </button>
          <button onClick={e => { next(true) }}>
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
		.progress-range {
				position: relative;
				top: 8px;
				width: 70%;
		}
		.engine-select {
				font-size: 12px;
				max-width: 60%;
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
