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
})
