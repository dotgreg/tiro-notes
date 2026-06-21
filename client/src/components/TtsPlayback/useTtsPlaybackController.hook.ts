import { useRef, useCallback } from 'react'
import { TtsState, TtsPlaybackOptions, TtsPlaybackController } from './types'

const pre = '[TtsCustomPopup]'

/**
 * Core playback state machine.
 *
 * Key invariants:
 * - cancelledRef.current = true blocks ALL async callbacks (oncanplay, onended, timeout)
 * - destroy() resets ALL refs so reopening the popup works
 * - onended only calls onChunkEnd if state is PLAYING (not after pause)
 * - audio is removed from window.tiro_tts_allAudiosRef on ended
 */
export function useTtsPlaybackController(options: TtsPlaybackOptions): TtsPlaybackController {
  const {
    log,
    onChunkEnd,
    downloadChunk,
    totalChunks,
    currentChunk,
    playbackRate,
    ttsHeaders,
    preloadCount,
    setIsPlaying,
  } = options

  // State machine
  const stateRef = useRef<TtsState>(TtsState.IDLE)
  const cancelledRef = useRef<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPopupClosedRef = useRef<boolean>(false)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Blob cache for preloaded audio
  const audioBlobsRef = useRef<Map<string, Blob>>(new Map())
  // URL cache for downloaded chunks
  const audioUrlsRef = useRef<string[]>([])

  const setState = (state: TtsState) => {
    stateRef.current = state
  }

  /** Add audio to global window array for pause-all */
  const addAudioWindow = (audio: HTMLAudioElement) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.tiro_tts_allAudiosRef === undefined) {
        // @ts-ignore
        window.tiro_tts_allAudiosRef = []
      }
      // @ts-ignore
      window.tiro_tts_allAudiosRef.push(audio)
    }
  }

  /** Pause ALL audio in window array */
  const pauseAllAudioWindow = (remove: boolean = false) => {
    if (typeof window === 'undefined') return
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) {
      // @ts-ignore
      window.tiro_tts_allAudiosRef = []
    }
    // @ts-ignore
    const all = window.tiro_tts_allAudiosRef
    for (let i = 0; i < all.length; i++) {
      try {
        all[i].pause()
      } catch { /* ignore */ }
    }
    if (remove) {
      // @ts-ignore
      window.tiro_tts_allAudiosRef = []
    }
  }

  /** Remove a specific audio from the global window array */
  const removeAudioWindow = (audio: HTMLAudioElement) => {
    if (typeof window === 'undefined') return
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) return
    // @ts-ignore
    const all = window.tiro_tts_allAudiosRef
    const idx = all.indexOf(audio)
    if (idx !== -1) all.splice(idx, 1)
  }

  /** Resolve audio source: blob cache → fetch with headers → direct URL */
  const resolveAudioSrc = async (urlAudio: string): Promise<string> => {
    const headers = ttsHeaders
    if (Object.keys(headers).length === 0) {
      return urlAudio
    }

    // Check blob cache
    const cachedBlob = audioBlobsRef.current.get(urlAudio)
    if (cachedBlob) {
      const blobUrl = URL.createObjectURL(cachedBlob)
      log(`${pre}: 📦 audio from cache (${cachedBlob.size} bytes)`)
      return blobUrl
    }

    // Fetch with headers
    log(`${pre}: 🌐 fetching audio with headers: ${urlAudio}`)
    try {
      const resp = await fetch(urlAudio, { headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      log(`${pre}: 📦 audio fetched as blob (${blob.size} bytes)`)
      return blobUrl
    } catch (e: any) {
      log(`${pre}: ❌ fetch audio ERROR: ${e.message}, fallback to direct URL`)
      return urlAudio
    }
  }

  /** Start playing from a URL — sets up audio object, events, preload */
  const startPlayAudio = async (urlAudio: string, chunkNb: number) => {
    // Guard: cancelled or popup closed
    if (cancelledRef.current || isPopupClosedRef.current) return

    let audioSrc = await resolveAudioSrc(urlAudio)

    // Create NEW Audio object
    const audio = new Audio(audioSrc)
    audioRef.current = audio
    audio.preload = 'auto'

    log(`${pre}: 🎵 starting audio load for chunk ${chunkNb}`)

    addAudioWindow(audio)

    // Guard to prevent double-fire of startPlay
    let alreadyStarted = false

    const startPlay = () => {
      // CRITICAL: check cancelledRef — blocks if user paused/destroyed
      if (cancelledRef.current) return
      if (isPopupClosedRef.current) return
      if (alreadyStarted) return
      alreadyStarted = true

      // Clear safety timeout since we're starting
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }

      log(`${pre}: ✅ mp3 ready for chunk ${chunkNb}, starting playback`)

      audio.play().catch(e => {
        if (cancelledRef.current) return
        log(`${pre}: ❌ play() rejected: ${e.message}`)
      })

      // Set playback rate
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate
      }

      // Preload next chunks
      const toPreload = preloadCount || 1
      for (let i = 1; i <= toPreload; i++) {
        const nextIdx = chunkNb + i
        if (nextIdx < totalChunks) {
          downloadChunk(nextIdx, (url) => {
            // Preload blob for immediate next chunk
            if (i === 1 && url && !url.includes('ERROR') && Object.keys(ttsHeaders).length > 0) {
              fetch(url, { headers: ttsHeaders })
                .then(r => r.ok ? r.blob() : Promise.reject(new Error('not ok')))
                .then(blob => {
                  audioBlobsRef.current.set(url, blob)
                  log(`${pre}: 📦 preloaded blob chunk ${nextIdx} (${blob.size} bytes)`)
                })
                .catch(() => { /* ignore */ })
            }
          })
        }
      }
    }

    // Set up audio events
    audio.oncanplay = startPlay
    startTimeoutRef.current = setTimeout(startPlay, 3000)

    audio.onerror = () => {
      if (cancelledRef.current) return
      log(`${pre}: ❌ audio LOAD ERROR for ${urlAudio}`)
      setState(TtsState.ERROR)
      setIsPlaying(false)
    }

    audio.onended = () => {
      // CRITICAL: only advance if still in PLAYING state (not after pause)
      if (stateRef.current !== TtsState.PLAYING) return
      if (cancelledRef.current) return

      log(`${pre}: audio ENDED`)

      // Revoke blob URL to free memory
      if (audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc)
      }

      // Evict current chunk's blob from cache
      audioBlobsRef.current.delete(urlAudio)

      // Remove from window array (memory leak fix)
      removeAudioWindow(audio)

      // Destroy audio object
      audioRef.current = null
      audio.remove()

      setState(TtsState.ENDED)
      setIsPlaying(false)

      // Advance to next chunk
      onChunkEnd()
    }
  }

  /** Play a specific chunk */
  const playChunk = useCallback((chunkNb: number, isUserAction: boolean = false) => {
    // If user action or switching chunk, stop current audio first
    if (isUserAction || chunkNb !== currentChunk || audioRef.current?.src) {
      pause()
      // Reset cancelled flag so new playback can proceed
      cancelledRef.current = false
    }

    downloadChunk(chunkNb, (urlAudio) => {
      // Guard: cancelled or popup closed
      if (cancelledRef.current || isPopupClosedRef.current) return
      if (!urlAudio || urlAudio.includes('ERROR')) return

      log(`${pre}: ▶️ playing chunk ${chunkNb}`)

      setState(TtsState.LOADING)
      setIsPlaying(true)

      startPlayAudio(urlAudio, chunkNb)
    })
  }, [currentChunk, log])

  /** Pause current playback — cancels all pending async callbacks */
  const pause = useCallback(() => {
    // Set cancelled flag — blocks oncanplay, onended, timeout
    cancelledRef.current = true

    // Pause current audio
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Also pause all window audios
    pauseAllAudioWindow(false)

    // Clear safety timeout
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }

    setState(TtsState.PAUSED)
    setIsPlaying(false)
  }, [log])

  /** Resume paused playback */
  const resume = useCallback(() => {
    // Reset cancelled flag
    cancelledRef.current = false

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(e => {
        log(`${pre}: ❌ resume play ERROR: ${e.message}`)
        // Fallback: restart chunk if resume fails
        cancelledRef.current = false
        playChunk(currentChunk, false)
      })
      setState(TtsState.PLAYING)
      setIsPlaying(true)
      log(`${pre}: ▶️ resumed`)
    } else {
      // No audio object, start fresh (isUserAction=false to avoid re-pause)
      cancelledRef.current = false
      playChunk(currentChunk, false)
    }
  }, [currentChunk, log, playChunk])

  /** Destroy ALL state, reset refs, cleanup resources */
  const destroy = useCallback(() => {
    // Pause everything first
    pauseAllAudioWindow(true)

    // Reset cancelled flag so new playback can start
    cancelledRef.current = false

    // Clear safety timeout
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }

    // Destroy current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.remove()
      audioRef.current = null
    }

    // Revoke all blob URLs
    audioBlobsRef.current.forEach((blob, url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    audioBlobsRef.current.clear()

    // Reset popup closed flag — CRITICAL for reopen
    isPopupClosedRef.current = false

    setState(TtsState.IDLE)
    setIsPlaying(false)

    log(`${pre}: audio DESTROYED`)
  }, [log])

  return {
    get state() { return stateRef.current },
    get cancelledRef() { return cancelledRef },
    get audioRef() { return audioRef },
    get isPopupClosedRef() { return isPopupClosedRef },
    playChunk,
    pause,
    resume,
    destroy,
  }
}
