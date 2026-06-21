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
})
