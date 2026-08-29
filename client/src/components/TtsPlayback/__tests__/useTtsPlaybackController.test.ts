import { renderHook, act } from '@testing-library/react'
import { TtsState } from '../types'
import { useTtsPlaybackController } from '../useTtsPlaybackController.hook'

// Mock the window.tiro_tts_allAudiosRef
beforeEach(() => {
  // @ts-ignore
  window.tiro_tts_allAudiosRef = []
})

describe('useTtsPlaybackController', () => {
  const mockLog = jest.fn()
  const mockOnChunkEnd = jest.fn()
  const mockDownloadChunk = jest.fn()
  const mockSetIsPlaying = jest.fn()

  const baseOptions = {
    log: mockLog,
    onChunkEnd: mockOnChunkEnd,
    downloadChunk: mockDownloadChunk,
    totalChunks: 10,
    currentChunk: 0,
    playbackRate: 1,
    ttsHeaders: {} as Record<string, string>,
    preloadCount: 1,
    setIsPlaying: mockSetIsPlaying,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('State machine transitions', () => {
    it('starts in IDLE state', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))
      expect(result.current.state).toBe(TtsState.IDLE)
    })

    it('transitions to LOADING when playChunk is called', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      // Mock downloadChunk to call callback synchronously
      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      act(() => {
        result.current.playChunk(0, true)
      })

      expect(result.current.state).toBe(TtsState.LOADING)
      expect(mockSetIsPlaying).toHaveBeenCalledWith(true)
    })

    it('transitions to PAUSED when pause is called', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.pause()
      })

      expect(result.current.state).toBe(TtsState.PAUSED)
      expect(mockSetIsPlaying).toHaveBeenCalledWith(false)
    })

    it('transitions to IDLE when destroy is called', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.destroy()
      })

      expect(result.current.state).toBe(TtsState.IDLE)
      expect(mockSetIsPlaying).toHaveBeenCalledWith(false)
    })
  })

  describe('cancelledRef guard', () => {
    it('cancelledRef is true after pause', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.pause()
      })

      expect(result.current.cancelledRef.current).toBe(true)
    })

    it('cancelledRef is false after resume', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.pause()
        result.current.resume()
      })

      expect(result.current.cancelledRef.current).toBe(false)
    })

    it('cancelledRef is false after destroy', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.destroy()
      })

      expect(result.current.cancelledRef.current).toBe(false)
    })
  })

  describe('destroy cleanup', () => {
    it('resets isPopupClosedRef to false', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      // Simulate popup closing
      act(() => {
        result.current.isPopupClosedRef.current = true
      })

      act(() => {
        result.current.destroy()
      })

      expect(result.current.isPopupClosedRef.current).toBe(false)
    })

    it('clears audioRef', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.destroy()
      })

      expect(result.current.audioRef.current).toBeNull()
    })

    it('logs DESTROYED message', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        result.current.destroy()
      })

      expect(mockLog).toHaveBeenCalledWith('[TtsCustomPopup]: audio DESTROYED')
    })
  })

  describe('PLAYING → PAUSED → PLAYING cycle', () => {
    it('allows pause then resume cycle', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      // Pause
      act(() => {
        result.current.pause()
      })
      expect(result.current.state).toBe(TtsState.PAUSED)
      expect(result.current.cancelledRef.current).toBe(true)

      // Resume
      act(() => {
        result.current.resume()
      })
      expect(result.current.cancelledRef.current).toBe(false)
    })
  })

  describe('playChunk with isUserAction', () => {
    it('pauses current audio when isUserAction is true', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      act(() => {
        result.current.playChunk(0, true)
      })

      // Should have called downloadChunk
      expect(mockDownloadChunk).toHaveBeenCalledWith(0, expect.any(Function))
    })
  })

  describe('stale closure race (double-play fix) — Solution C (0.52.10): one session element', () => {
    it('playChunk reuses the single session element (no second element is ever created)', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      // Play chunk 0 — wait for async audio creation
      await act(async () => {
        result.current.playChunk(0, true)
      })
      await Promise.resolve() // flush microtask from resolveAudioSrc

      const firstAudio = result.current.audioRef.current
      expect(firstAudio).not.toBeNull()

      // Play chunk 1 — same element is reused, old generation is killed by
      // the playId token (not by destroying the element)
      await act(async () => {
        result.current.playChunk(1, true)
      })

      expect(result.current.audioRef.current).toBe(firstAudio)
      // @ts-ignore
      expect(window.tiro_tts_allAudiosRef.length).toBe(1)
    })

    it('pause keeps the element alive but nulls its handlers', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => {
        result.current.playChunk(0, true)
      })
      await Promise.resolve()

      const audio = result.current.audioRef.current
      expect(audio).not.toBeNull()

      act(() => {
        result.current.pause()
      })

      // Solution C: the element survives pause — only destroy() kills it
      expect(result.current.audioRef.current).toBe(audio)
      expect(audio!.oncanplay).toBeNull()
      expect(audio!.onended).toBeNull()
      expect(audio!.onerror).toBeNull()
    })
  })

  describe('memory leak prevention', () => {
    it('unmount cleanup calls destroy', () => {
      const { result, unmount } = renderHook(() => useTtsPlaybackController(baseOptions))

      act(() => {
        unmount()
      })

      expect(mockLog).toHaveBeenCalledWith('[TtsCustomPopup]: audio DESTROYED')
      expect(result.current.state).toBe(TtsState.IDLE)
    })

    it('destroy clears audioRef and window array', () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      act(() => {
        result.current.playChunk(0, true)
      })

      act(() => {
        result.current.destroy()
      })

      expect(result.current.audioRef.current).toBeNull()
      // @ts-ignore
      expect(window.tiro_tts_allAudiosRef.length).toBe(0)
    })
  })

  describe('event-driven underrun recovery (s2_t4 Task 1)', () => {
    const clearPlay = (audio: HTMLAudioElement) => (audio.play as jest.Mock).mockClear()

    /** Play chunk 0 up to PLAYING (fire oncanplay like the browser would). */
    const startPlaying = async () => {
      const hook = renderHook(() => useTtsPlaybackController(baseOptions))
      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => {
        hook.result.current.playChunk(0, true)
      })
      await Promise.resolve() // flush the resolveAudioSrc microtask

      const audio = hook.result.current.audioRef.current
      expect(audio).not.toBeNull()

      act(() => {
        audio!.oncanplay!(new Event('canplay'))
      })
      expect(hook.result.current.state).toBe(TtsState.PLAYING)
      return { hook, audio: audio! }
    }

    it('unexpected pause while PLAYING → recovery play() called once + logged', async () => {
      const { audio } = await startPlaying()
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(audio.play).toHaveBeenCalledTimes(1)
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('unexpected pause (underrun?)'))
    })

    it('no recovery play() after controller.pause() (pause event arrives after state=PAUSED)', async () => {
      const { hook, audio } = await startPlaying()
      act(() => {
        hook.result.current.pause()
      })
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(audio.play).not.toHaveBeenCalled()
    })

    it('no recovery play() after playChunk() (state=LOADING)', async () => {
      const { hook, audio } = await startPlaying()
      await act(async () => {
        hook.result.current.playChunk(1, true)
      })
      await Promise.resolve()
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(hook.result.current.state).toBe(TtsState.LOADING)
      expect(audio.play).not.toHaveBeenCalled()
    })

    it('no recovery play() after destroy() (state=IDLE)', async () => {
      const { hook, audio } = await startPlaying()
      act(() => {
        hook.result.current.destroy()
      })
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(audio.play).not.toHaveBeenCalled()
    })

    it('no recovery play() when audio.ended = true (never replay from 0)', async () => {
      const { audio } = await startPlaying()
      ;(audio as any).ended = true
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(audio.play).not.toHaveBeenCalled()
    })

    it('no recovery play() while readyState < 2 (src swap in progress)', async () => {
      const { audio } = await startPlaying()
      ;(audio as any).readyState = 1
      clearPlay(audio)

      act(() => {
        ;(audio as any).dispatch('pause')
      })

      expect(audio.play).not.toHaveBeenCalled()
    })
  })

  describe('play() rejection handling (s2_t4 Task 2)', () => {
    /** Play chunk 0 with play() rejecting `err`, fire oncanplay, flush the rejection microtask. */
    const startWithRejectingPlay = async (err: Error) => {
      const hook = renderHook(() => useTtsPlaybackController(baseOptions))
      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => {
        hook.result.current.playChunk(0, true)
      })
      await Promise.resolve() // flush the resolveAudioSrc microtask

      const audio = hook.result.current.audioRef.current
      expect(audio).not.toBeNull()

      ;(audio!.play as jest.Mock).mockImplementation(() => Promise.reject(err))

      act(() => {
        audio!.oncanplay!(new Event('canplay'))
      })
      await act(async () => { /* let the rejected play() promise settle */ })

      return { hook, audio: audio! }
    }

    it('NotAllowedError → PAUSED + setIsPlaying(false) + log BLOCKED, no retry scheduled', async () => {
      const blocked = Object.assign(new Error('play() not allowed'), { name: 'NotAllowedError' })
      const { hook, audio } = await startWithRejectingPlay(blocked)

      expect(hook.result.current.state).toBe(TtsState.PAUSED)
      expect(mockSetIsPlaying).toHaveBeenLastCalledWith(false)
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('BLOCKED'))

      // a gesture requirement cannot be fixed by a timer/listener: the initial
      // play() is the only call, and a later canplay stays silent
      expect(audio.play).toHaveBeenCalledTimes(1)
      act(() => {
        ;(audio as any).dispatch('canplay')
      })
      expect(audio.play).toHaveBeenCalledTimes(1)
    })

    it('other rejection → state stays PLAYING, one canplay retry, then silence (no loop)', async () => {
      const other = Object.assign(new Error('element not ready'), { name: 'AbortError' })
      const { hook, audio } = await startWithRejectingPlay(other)

      // only NotAllowedError surfaces a pause
      expect(hook.result.current.state).toBe(TtsState.PLAYING)
      expect(mockSetIsPlaying).not.toHaveBeenCalledWith(false)
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('retrying on canplay'))

      // first canplay → the one-shot retry plays (this attempt succeeds)
      ;(audio.play as jest.Mock).mockImplementation(() => Promise.resolve())
      act(() => {
        ;(audio as any).dispatch('canplay')
      })
      expect(audio.play).toHaveBeenCalledTimes(2)

      // listener removed after firing — a second canplay stays silent
      act(() => {
        ;(audio as any).dispatch('canplay')
      })
      expect(audio.play).toHaveBeenCalledTimes(2)
    })

    it('generation change (pause) → pending canplay retry never fires', async () => {
      const other = Object.assign(new Error('element not ready'), { name: 'AbortError' })
      const { hook, audio } = await startWithRejectingPlay(other)

      act(() => {
        hook.result.current.pause()
      })

      act(() => {
        ;(audio as any).dispatch('canplay')
      })
      // only the original (rejected) play() call — the retry went with the generation
      expect(audio.play).toHaveBeenCalledTimes(1)
    })
  })

  describe('seek (0.52.12 — seekable progress bar)', () => {
    it('applies the seek immediately when the audio is ready', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => {
        result.current.playChunk(0, true)
      })
      await Promise.resolve()
      const audio = result.current.audioRef.current
      expect(audio).not.toBeNull()
      // global Audio mock: readyState=4, duration=10

      let applied = false
      act(() => {
        applied = result.current.seek(0.5)
      })
      expect(applied).toBe(true)
      expect(audio!.currentTime).toBe(5)
      // immediate path: no deferred-seek bookkeeping
      expect(mockLog).not.toHaveBeenCalledWith(expect.stringContaining('deferred'))
    })

    it('defers the seek until the audio is ready (applied on canplay)', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))

      mockDownloadChunk.mockImplementation((_chunkId: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => {
        result.current.playChunk(0, true)
      })
      await Promise.resolve()
      const audio = result.current.audioRef.current
      expect(audio).not.toBeNull()

      // simulate a freshly set src that is not ready yet
      // @ts-ignore the test Audio mock allows assignment (DOM type is read-only)
      audio!.readyState = 0
      let applied = false
      act(() => {
        applied = result.current.seek(0.25)
      })
      expect(applied).toBe(false)
      expect(audio!.currentTime).toBe(0)

      // audio becomes ready → deferred seek is applied in the oncanplay handler
      // @ts-ignore the test Audio mock allows assignment (DOM type is read-only)
      audio!.readyState = 4
      act(() => {
        audio!.oncanplay!(new Event('canplay'))
      })
      expect(audio!.currentTime).toBe(2.5) // 0.25 × duration 10
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('deferred'))
    })
  })

  describe('retry budget for download + media errors (s2_t4 Task 4)', () => {
    beforeEach(() => { jest.useFakeTimers() })
    afterEach(() => { jest.useRealTimers() })

    it('download ERROR ×2 then success → chunk plays after 2s + 5s', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))
      let calls = 0
      mockDownloadChunk.mockImplementation((_c: number, cb: (url: string) => void) => {
        calls += 1
        cb(calls < 3 ? 'ERROR: API' : 'http://example.com/audio.mp3')
      })

      act(() => { result.current.playChunk(0, true) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(1)
      expect(result.current.state).toBe(TtsState.LOADING) // retrying, not ERROR yet

      await act(async () => { jest.advanceTimersByTime(2000) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(2)

      await act(async () => { jest.advanceTimersByTime(5000) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(3)

      // 3rd download returned a URL → startAudio ran → canplay starts playback
      const audio = result.current.audioRef.current
      expect(audio).not.toBeNull()
      act(() => { audio!.oncanplay!(new Event('canplay')) })
      expect(result.current.state).toBe(TtsState.PLAYING)
    })

    it('download ERROR ×3 → ERROR state, isPlaying false, no further retries or timers', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))
      mockDownloadChunk.mockImplementation((_c: number, cb: (url: string) => void) => cb('ERROR: API'))

      act(() => { result.current.playChunk(0, true) })
      await act(async () => { jest.advanceTimersByTime(2000) }) // retry 1 fails
      await act(async () => { jest.advanceTimersByTime(5000) }) // retry 2 fails → budget exhausted

      expect(mockDownloadChunk).toHaveBeenCalledTimes(3)
      expect(result.current.state).toBe(TtsState.ERROR)
      expect(mockSetIsPlaying).toHaveBeenLastCalledWith(false)

      await act(async () => { jest.advanceTimersByTime(120000) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(3) // no 4th attempt
      expect(jest.getTimerCount()).toBe(0) // nothing left scheduled
    })

    it('pause during a pending retry → retry cancelled (generation guard)', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))
      mockDownloadChunk.mockImplementation((_c: number, cb: (url: string) => void) => cb('ERROR: API'))

      act(() => { result.current.playChunk(0, true) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(1)

      act(() => { result.current.pause() })
      expect(result.current.state).toBe(TtsState.PAUSED)

      await act(async () => { jest.advanceTimersByTime(120000) })
      expect(mockDownloadChunk).toHaveBeenCalledTimes(1) // retry never ran
      expect(result.current.state).toBe(TtsState.PAUSED)
    })

    it('onerror → startAudio re-runs until budget exhausted, then ERROR', async () => {
      const { result } = renderHook(() => useTtsPlaybackController(baseOptions))
      mockDownloadChunk.mockImplementation((_c: number, cb: (url: string) => void) => {
        cb('http://example.com/audio.mp3')
      })

      await act(async () => { result.current.playChunk(0, true) })
      await Promise.resolve() // flush the resolveAudioSrc microtask
      const audio = result.current.audioRef.current
      expect(audio).not.toBeNull()

      // onerror #1 → retry 1 (state stays LOADING, not ERROR yet)
      act(() => { audio!.onerror!(new Event('error')) })
      expect(result.current.state).toBe(TtsState.LOADING)
      await act(async () => { jest.advanceTimersByTime(2000) })
      expect(audio!.load).toHaveBeenCalledTimes(1) // startAudio re-ran (same src → load())

      // onerror #2 → retry 2
      act(() => { audio!.onerror!(new Event('error')) })
      expect(result.current.state).toBe(TtsState.LOADING)
      await act(async () => { jest.advanceTimersByTime(5000) })
      expect(audio!.load).toHaveBeenCalledTimes(2)

      // onerror #3 → budget exhausted → ERROR, no further re-runs
      act(() => { audio!.onerror!(new Event('error')) })
      expect(result.current.state).toBe(TtsState.ERROR)
      expect(mockSetIsPlaying).toHaveBeenLastCalledWith(false)
      await act(async () => { jest.advanceTimersByTime(120000) })
      expect(audio!.load).toHaveBeenCalledTimes(2)
    })
  })
})
