import { useRef, useCallback, useEffect } from 'react'
import { TtsState, TtsPlaybackOptions, TtsPlaybackController } from './types'

const pre = '[TtsCustomPopup]'

/**
 * Core playback controller.
 *
 * SINGLE race guard: playIdRef (generation token). Every async boundary
 * (download callback, post-fetch, oncanplay, 3s timeout, onended) captures
 * the id at creation time and no-ops if playIdRef.current moved on.
 * playChunk / pause / destroy bump the token, so ALL in-flight async work
 * from a previous generation is dead. This replaces the old
 * cancelledRef / activePlayChunkRef / playCallbacksQueuedRef / aborted
 * flag zoo, whose gaps let the same chunk play twice.
 *
 * Invariants:
 * - at most one live Audio element at any time (stopAudio before every start)
 * - onended advances chunks only if its audio is still the current generation
 * - destroy() resets everything so reopening the popup works
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
    audioUrls: audioUrlsRefDown = { current: [] },
  } = options

  // Public state (contract: state, refs, cleanup semantics)
  const stateRef = useRef<TtsState>(TtsState.IDLE)
  const cancelledRef = useRef<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPopupClosedRef = useRef<boolean>(false)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The race guard: generation token
  const playIdRef = useRef(0)

  // Refs for changing options — closures always read .current (live value)
  const playbackRateRef = useRef(playbackRate)
  const ttsHeadersRef = useRef(ttsHeaders)
  const preloadCountRef = useRef(preloadCount)
  playbackRateRef.current = playbackRate
  ttsHeadersRef.current = ttsHeaders
  preloadCountRef.current = preloadCount

  // Blob cache: httpUrl -> objectUrl, each object URL created once
  // (old code stored Blobs and made a NEW object URL on every play = leak)
  const blobUrlsRef = useRef<Map<string, string>>(new Map())
  const MAX_BLOB_CACHE_SIZE = 3 // current + 2 preloaded

  const evictBlobs = () => {
    while (blobUrlsRef.current.size > MAX_BLOB_CACHE_SIZE) {
      const oldest = blobUrlsRef.current.keys().next().value
      if (oldest === undefined) break
      URL.revokeObjectURL(blobUrlsRef.current.get(oldest)!)
      blobUrlsRef.current.delete(oldest)
      log(`${pre}: 🗑️ evicted blob cache, size now ${blobUrlsRef.current.size}`)
    }
  }

  const setState = (state: TtsState) => {
    stateRef.current = state
  }

  /** Add audio to global window array for pause-all */
  const addAudioWindow = (audio: HTMLAudioElement) => {
    if (typeof window === 'undefined') return
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) {
      // @ts-ignore
      window.tiro_tts_allAudiosRef = []
    }
    // @ts-ignore
    window.tiro_tts_allAudiosRef.push(audio)
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

  /** Resolve audio source: cached object URL → fetch with headers → direct URL */
  const resolveAudioSrc = async (urlAudio: string): Promise<string> => {
    const headers = ttsHeadersRef.current
    if (Object.keys(headers).length === 0) return urlAudio

    const cached = blobUrlsRef.current.get(urlAudio)
    if (cached) {
      log(`${pre}: 📦 audio from cache`)
      return cached
    }

    log(`${pre}: 🌐 fetching audio with headers: ${urlAudio}`)
    try {
      const resp = await fetch(urlAudio, { headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const objUrl = URL.createObjectURL(blob)
      blobUrlsRef.current.set(urlAudio, objUrl)
      evictBlobs()
      log(`${pre}: 📦 audio fetched as blob (${blob.size} bytes)`)
      return objUrl
    } catch (e: any) {
      log(`${pre}: ❌ fetch audio ERROR: ${e.message}, fallback to direct URL`)
      return urlAudio
    }
  }

  /** Preload next N chunks (URL cache + blob for the immediate next) */
  const preloadNext = (chunkNb: number) => {
    const toPreload = preloadCountRef.current || 1
    const headers = ttsHeadersRef.current
    for (let i = 1; i <= toPreload; i++) {
      const nextIdx = chunkNb + i
      if (nextIdx >= totalChunks) continue
      downloadChunk(nextIdx, (url) => {
        if (i === 1 && url && !url.includes('ERROR') && Object.keys(headers).length > 0) {
          fetch(url, { headers })
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('not ok')))
            .then(blob => {
              if (blobUrlsRef.current.has(url)) return // already fetched
              blobUrlsRef.current.set(url, URL.createObjectURL(blob))
              evictBlobs()
              log(`${pre}: 📦 preloaded blob chunk ${nextIdx} (${blob.size} bytes)`)
            })
            .catch(() => { /* ignore */ })
        }
      })
    }
  }

  /** Create and start an Audio element for a URL. `id` kills every stale version. */
  const startAudio = (urlAudio: string, chunkNb: number, id: number) => {
    resolveAudioSrc(urlAudio).then(src => {
      if (id !== playIdRef.current) return // superseded while resolving

      const audio = new Audio(src)
      audioRef.current = audio
      audio.preload = 'auto'
      log(`${pre}: 🎵 starting audio load for chunk ${chunkNb}`)
      addAudioWindow(audio)

      let started = false
      const startPlay = () => {
        if (started || id !== playIdRef.current || isPopupClosedRef.current) return
        started = true
        if (startTimeoutRef.current) {
          clearTimeout(startTimeoutRef.current)
          startTimeoutRef.current = null
        }
        log(`${pre}: ✅ mp3 ready for chunk ${chunkNb}, starting playback`)
        setState(TtsState.PLAYING)
        audio.playbackRate = playbackRateRef.current
        audio.play().catch(e => {
          if (id === playIdRef.current) log(`${pre}: ❌ play() rejected: ${e.message}`)
        })
        preloadNext(chunkNb)
      }

      audio.oncanplay = startPlay
      startTimeoutRef.current = setTimeout(startPlay, 3000)

      audio.onerror = () => {
        if (id !== playIdRef.current) return
        log(`${pre}: ❌ audio LOAD ERROR for ${urlAudio}`)
        setState(TtsState.ERROR)
        setIsPlaying(false)
      }

      audio.onended = () => {
        // Advance only if this audio is still the current generation —
        // pause / new chunk / destroy all bumped the id, so stale onended dies
        if (id !== playIdRef.current) return

        log(`${pre}: audio ENDED`)

        // Free this chunk's blob (re-fetched if user seeks back)
        const cachedUrl = blobUrlsRef.current.get(urlAudio)
        if (cachedUrl) {
          blobUrlsRef.current.delete(urlAudio)
          URL.revokeObjectURL(cachedUrl)
        }
        evictBlobs()

        // Remove from window array (memory leak fix) + destroy element
        removeAudioWindow(audio)
        audio.remove()
        audioRef.current = null
        log(`${pre}: 🗑️ audio chunk ${chunkNb} destroyed (memory freed)`)

        setState(TtsState.ENDED)
        setIsPlaying(false)
        onChunkEnd()
      }
    })
  }

  /** Central teardown: kills the current audio and any pending start */
  const stopAudio = () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }
    const audio = audioRef.current
    if (audio) {
      // Null handlers first: kills queued events (mobile can fire oncanplay late)
      audio.oncanplay = null
      audio.onerror = null
      audio.onended = null
      audio.pause()
      audio.remove()
      removeAudioWindow(audio)
      audioRef.current = null
    }
  }

  /** Play a specific chunk. Bumps the generation: kills all in-flight work. */
  const playChunk = useCallback((chunkNb: number, _isUserAction: boolean = false) => {
    playIdRef.current += 1
    const id = playIdRef.current
    cancelledRef.current = false

    stopAudio()
    pauseAllAudioWindow(false)

    setState(TtsState.LOADING)
    setIsPlaying(true)

    // Already downloaded → play immediately
    const cachedUrl = audioUrlsRefDown.current[chunkNb]
    if (cachedUrl) {
      log(`${pre}: ▶️ playing chunk ${chunkNb} (cached)`)
      startAudio(cachedUrl, chunkNb, id)
      return
    }

    log(`${pre}: ⏳ downloading chunk ${chunkNb}`)
    downloadChunk(chunkNb, (urlAudio) => {
      if (id !== playIdRef.current) return // superseded (pause / new chunk / close)
      if (!urlAudio || urlAudio.includes('ERROR')) {
        log(`${pre}: ❌ chunk ${chunkNb} download failed: ${urlAudio}`)
        setState(TtsState.ERROR)
        setIsPlaying(false)
        return
      }
      log(`${pre}: ▶️ playing chunk ${chunkNb}`)
      startAudio(urlAudio, chunkNb, id)
    })
  }, [log])

  /** Pause current playback. Bumps the generation: kills all in-flight work. */
  const pause = useCallback(() => {
    playIdRef.current += 1
    cancelledRef.current = true
    stopAudio()
    pauseAllAudioWindow(false)
    setState(TtsState.PAUSED)
    setIsPlaying(false)
    log(`${pre}: ⏸️ paused`)
  }, [log])

  /** Resume paused playback (pause always destroys audio → replay the chunk) */
  const resume = useCallback(() => {
    playChunk(currentChunk, false)
  }, [currentChunk, playChunk])

  /** Destroy ALL state, reset refs, cleanup resources */
  const destroy = useCallback(() => {
    playIdRef.current += 1
    cancelledRef.current = false
    isPopupClosedRef.current = false
    stopAudio()
    pauseAllAudioWindow(true)
    blobUrlsRef.current.forEach(objUrl => URL.revokeObjectURL(objUrl))
    blobUrlsRef.current.clear()
    setState(TtsState.IDLE)
    setIsPlaying(false)
    log(`${pre}: audio DESTROYED`)
  }, [log])

  // Cleanup on unmount — ref avoids re-running destroy() on every render when `log` changes
  const destroyRef = useRef(destroy)
  destroyRef.current = destroy
  useEffect(() => () => destroyRef.current(), [])

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
