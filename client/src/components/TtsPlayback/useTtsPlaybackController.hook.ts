import { useRef, useCallback, useEffect } from 'react'
import { TtsState, TtsPlaybackOptions, TtsPlaybackController } from './types'

const pre = '[TtsCustomPopup]'

/**
 * TTS playback controller — rewritten 0.52.9 from the findings in
 * _specs/_tts_double_play.md (0.52.6 → 0.52.8).
 *
 * 0.52.10 (Solution C — _specs/_tts_single_audio.md): one Audio element for
 * the whole session. ensureAudio() creates it lazily once; startAudio() swaps
 * audio.src per chunk (pause + load() when the src is unchanged, since a
 * same-value src assignment does not reload). onended / stopAudio no longer
 * destroy the element — only destroy() does. No per-chunk element
 * create/destroy → there is never a second element to race.
 *
 * What changed vs 0.52.8 (the in-tab race logic was already proven sound by
 * the 16:32 log — report §2 — so it is kept, not re-invented):
 * 1. In-flight fetch dedup (§8.1): resolveAudioSrc and preloadNext share one
 *    promise per URL → one fetch, one object URL, no orphaned (leaking) URLs.
 * 2. No Error().stack (§8.2): undefined on the target device. Creation logs
 *    carry explicit context instead of a (empty) stack.
 * 3. First loadstart per element suppressed (§8.3) — it always fires on the
 *    normal initial load and was logged as "⚠️ re-load" (noise).
 * 4. Tab identity in creation logs (§9.2): tabId + top + href + sinceLoad,
 *    so two double-play logs can be compared across tabs/iframes.
 * 5. Cross-tab "single session per file" lock (§9.4) — implemented in the
 *    popup (localStorage claim + storage event, losers pause).
 *
 * Kept invariants (verified working by the 0.52.7/0.52.8 logs):
 * - playIdRef (generation token) is the ONLY race guard. playChunk / pause /
 *   destroy bump it; every async boundary (download callback, fetch, canplay,
 *   3s timeout, onended) captures the id and no-ops if it moved on.
 * - At most one live Audio element: stopAudio before every start, plus a
 *   cross-instance guard killing a stale `window.__tts_live_audio`.
 * - Blob cache httpUrl→objectUrl: max 3 entries, each object URL created
 *   exactly once, evicted and revoked.
 * - destroy() resets everything so reopening the popup works.
 */

// ── Per-tab identity (report §9.2) ───────────────────────────────────────────
// Random id per page load, shared tab-wide. Two double-play logs with
// different tabIds = cross-tab confirmed; top=false = iframe.
export const getTtsTabId = (): string => {
  if (typeof window === 'undefined') return 'node'
  const w = window as any
  if (!w.__tiro_tts_tabId) w.__tiro_tts_tabId = Math.random().toString(36).slice(2, 10)
  return w.__tiro_tts_tabId
}

const tabInfo = (): string => {
  if (typeof window === 'undefined') return ''
  return `tabId=${getTtsTabId()} top=${window === window.top} href=${window.location.pathname} sinceLoad=${Math.round(performance.now() / 1000)}s`
}

// Global per-tab Audio element ids — every lifecycle event is logged with #id,
// so a double-play log shows exactly which elements existed and who created each
let audioSeq = 0
let stackMissingLogged = false // Error.stack is undefined on the target device (§8.2) — say so once

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
  // Solution C: last src assigned to the single session element (null = none yet)
  const currentSrcRef = useRef<string | null>(null)
  // First loadstart after each src swap is the normal initial load — suppress (§8.3)
  const firstLoadstartRef = useRef(false)
  const isPopupClosedRef = useRef<boolean>(false)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The race guard: generation token (unchanged since 0.52.7 — proven by logs)
  const playIdRef = useRef(0)
  // true after destroy(): in-flight blob fetches must not repopulate the cache
  const destroyedRef = useRef(false)

  // Refs for changing options — closures always read .current (live value)
  const playbackRateRef = useRef(playbackRate)
  const ttsHeadersRef = useRef(ttsHeaders)
  const preloadCountRef = useRef(preloadCount)
  playbackRateRef.current = playbackRate
  ttsHeadersRef.current = ttsHeaders
  preloadCountRef.current = preloadCount

  // Blob cache: httpUrl -> objectUrl, each object URL created exactly once
  const blobUrlsRef = useRef<Map<string, string>>(new Map())
  const MAX_BLOB_CACHE_SIZE = 3 // current + 2 preloaded
  // In-flight dedup (§8.1): httpUrl -> shared promise, one fetch per URL
  const inflightRef = useRef<Map<string, Promise<string>>>(new Map())

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

  // ── window audio array (pause-all + leak tracking) ─────────────────────────
  const getWindowAudios = (): HTMLAudioElement[] => {
    if (typeof window === 'undefined') return []
    // @ts-ignore
    if (window.tiro_tts_allAudiosRef === undefined) window.tiro_tts_allAudiosRef = []
    // @ts-ignore
    return window.tiro_tts_allAudiosRef
  }

  const addAudioWindow = (audio: HTMLAudioElement) => {
    getWindowAudios().push(audio)
  }

  const removeAudioWindow = (audio: HTMLAudioElement) => {
    const all = getWindowAudios()
    const idx = all.indexOf(audio)
    if (idx !== -1) all.splice(idx, 1)
  }

  const pauseAllAudioWindow = (remove: boolean = false) => {
    const all = getWindowAudios()
    for (let i = 0; i < all.length; i++) {
      try {
        all[i].pause()
      } catch { /* ignore */ }
    }
    if (remove) all.length = 0
  }

  /** Resolve the playable src for a TTS URL: cache → shared in-flight fetch → direct URL */
  const resolveAudioSrc = (urlAudio: string): Promise<string> => {
    const headers = ttsHeadersRef.current
    if (Object.keys(headers).length === 0) return Promise.resolve(urlAudio)

    const cached = blobUrlsRef.current.get(urlAudio)
    if (cached) {
      log(`${pre}: 📦 audio from cache`)
      return Promise.resolve(cached)
    }

    const inflight = inflightRef.current.get(urlAudio)
    if (inflight) {
      log(`${pre}: 🔗 audio fetch already in flight — reusing (one fetch, one object URL)`)
      return inflight
    }

    const p = (async () => {
      log(`${pre}: 🌐 fetching audio with headers: ${urlAudio}`)
      try {
        const resp = await fetch(urlAudio, { headers })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const blob = await resp.blob()
        const objUrl = URL.createObjectURL(blob)
        if (destroyedRef.current) {
          // destroy() ran while fetching: do not repopulate the cache
          URL.revokeObjectURL(objUrl)
          return urlAudio
        }
        blobUrlsRef.current.set(urlAudio, objUrl)
        evictBlobs()
        log(`${pre}: 📦 audio fetched as blob (${blob.size} bytes)`)
        return objUrl
      } catch (e: any) {
        log(`${pre}: ❌ fetch audio ERROR: ${e.message}, fallback to direct URL`)
        return urlAudio
      } finally {
        inflightRef.current.delete(urlAudio)
      }
    })()
    inflightRef.current.set(urlAudio, p)
    return p
  }

  /** Preload next N chunks; the immediate next also gets its blob through
   *  resolveAudioSrc (deduped with startAudio — §8.1) */
  const preloadNext = (chunkNb: number) => {
    const toPreload = preloadCountRef.current || 1
    const headers = ttsHeadersRef.current
    for (let i = 1; i <= toPreload; i++) {
      const nextIdx = chunkNb + i
      if (nextIdx >= totalChunks) continue
      downloadChunk(nextIdx, (url) => {
        if (i === 1 && url && !url.includes('ERROR') && Object.keys(headers).length > 0) {
          resolveAudioSrc(url)
            .then(() => log(`${pre}: 📦 preloaded chunk ${nextIdx}`))
            .catch(() => { /* ignore */ })
        }
      })
    }
  }

  /** Lazily create the single Audio element for this session (Solution C).
   *  Created once, never destroyed until destroy() — there is never a second
   *  element to race. */
  const ensureAudio = (): HTMLAudioElement => {
    const existing = audioRef.current
    if (existing) return existing

    // Cross-instance guard: at most ONE live TTS audio in this tab.
    // A stale element (second component instance, missed teardown) is
    // structurally a double play — kill it before adopting.
    const prevLive = (window as any).__tts_live_audio
    if (prevLive) {
      log(`${pre}: ⚠️ DOUBLE-AUDIO GUARD: killing stale audio#${(prevLive as any).__ttsId} (chunk ${(prevLive as any).__ttsChunk})`)
      try {
        prevLive.oncanplay = null
        prevLive.onerror = null
        prevLive.onended = null
        prevLive.pause()
        prevLive.remove()
      } catch { /* ignore */ }
      removeAudioWindow(prevLive)
    }

    const audio = new Audio()
    const aid = ++audioSeq
    ;(audio as any).__ttsId = aid
    if (!stackMissingLogged && typeof (new Error().stack) === 'undefined') {
      stackMissingLogged = true
      log(`${pre}: ⚠️ Error.stack is undefined on this device — creation logs carry explicit context (no stack)`)
    }
    log(`${pre}: 🆕 audio#${aid} created | ${tabInfo()}`)

    audio.preload = 'auto'
    audioRef.current = audio
    currentSrcRef.current = null
    firstLoadstartRef.current = false
    addAudioWindow(audio)
    ;(window as any).__tts_live_audio = audio

    // Debug: catch the browser silently resetting the element
    // (0s + readyState=1 = a reset). Attached once per session, not per chunk.
    // The first loadstart after each src swap is the normal initial load —
    // suppress it (§8.3), log subsequent ones.
    audio.addEventListener('emptied', () => log(`${pre}: ⚠️ audio#${aid} EMPTIED (reset) pos=${Math.round(audio.currentTime)}s rs=${audio.readyState}`))
    audio.addEventListener('loadstart', () => {
      if (firstLoadstartRef.current) { firstLoadstartRef.current = false; return }
      log(`${pre}: ⚠️ audio#${aid} loadstart (RE-LOAD) pos=${Math.round(audio.currentTime)}s`)
    })
    audio.addEventListener('stalled', () => log(`${pre}: ⚠️ audio#${aid} stalled pos=${Math.round(audio.currentTime)}s rs=${audio.readyState}`))

    return audio
  }

  /** Start a chunk on the session's single element: swap src (or
   *  pause + load() when the src is unchanged — a same-value src assignment
   *  does NOT reload, and resume must restart the chunk from 0). `id` kills
   *  every stale version. */
  const startAudio = (urlAudio: string, chunkNb: number, id: number) => {
    resolveAudioSrc(urlAudio).then(src => {
      if (id !== playIdRef.current) return // superseded while resolving

      const audio = ensureAudio()
      const aid = (audio as any).__ttsId
      ;(audio as any).__ttsChunk = chunkNb

      firstLoadstartRef.current = true // first loadstart after this swap = normal load
      log(`${pre}: v2 singleton audio — chunk ${chunkNb}`)
      if (src !== currentSrcRef.current) {
        audio.src = src // browser auto-loads
        currentSrcRef.current = src
      } else {
        // Resume-after-pause: restart the chunk from 0 (old destroy-and-replay semantics)
        audio.pause()
        audio.currentTime = 0
        audio.load()
      }
      log(`${pre}: 🎵 starting audio load for chunk ${chunkNb}`)

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
        log(`${pre}: ▶️ audio#${aid}.play() called (chunk ${chunkNb})`)
        audio.play().catch(e => {
          if (id === playIdRef.current) log(`${pre}: ❌ audio#${aid} play() rejected: ${e.message}`)
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
        // pause / new chunk / destroy all bumped the id, so stale onended no-ops
        if (id !== playIdRef.current) return

        log(`${pre}: audio ENDED`)

        // Free this chunk's blob (re-fetched if the user seeks back)
        const cachedUrl = blobUrlsRef.current.get(urlAudio)
        if (cachedUrl) {
          blobUrlsRef.current.delete(urlAudio)
          URL.revokeObjectURL(cachedUrl)
        }
        evictBlobs()

        setState(TtsState.ENDED)
        setIsPlaying(false)
        onChunkEnd()
      }
    })
  }

  /** Pause the session audio (the element survives until destroy()). */
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
      log(`${pre}: 🛑 audio#${(audio as any).__ttsId} stopped`)
    }
  }

  /** Play a specific chunk. Bumps the generation: kills all in-flight work. */
  const playChunk = useCallback((chunkNb: number, _isUserAction: boolean = false) => {
    playIdRef.current += 1
    const id = playIdRef.current
    cancelledRef.current = false
    destroyedRef.current = false

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

  /** Destroy ALL state, reset refs, cleanup resources.
   *  The ONLY place the session's Audio element is killed. */
  const destroy = useCallback(() => {
    playIdRef.current += 1
    destroyedRef.current = true
    cancelledRef.current = false
    isPopupClosedRef.current = false
    stopAudio() // null handlers + pause — handlers nulled before remove: no destroy-time events
    const audio = audioRef.current
    if (audio) {
      audio.remove()
      removeAudioWindow(audio)
    }
    audioRef.current = null
    ;(window as any).__tts_live_audio = null
    currentSrcRef.current = null
    blobUrlsRef.current.forEach(objUrl => URL.revokeObjectURL(objUrl))
    blobUrlsRef.current.clear()
    inflightRef.current.clear()
    pauseAllAudioWindow(true)
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
