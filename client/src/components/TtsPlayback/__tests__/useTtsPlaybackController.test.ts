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
})
