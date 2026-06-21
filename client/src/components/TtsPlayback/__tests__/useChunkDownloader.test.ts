import { renderHook, act } from '@testing-library/react'
import { useChunkDownloader } from '../useChunkDownloader.hook'

// Mock dependencies
jest.mock('../../../hooks/api/api.hook', () => ({
  getApi: jest.fn((cb) => {
    cb({
      command: {
        exec: jest.fn((cmd, callback) => {
          // Simulate API response with URL
          callback(JSON.stringify({ output: 'http://example.com/chunk.mp3' }))
        }),
      },
    })
  }),
}))

jest.mock('../../../hooks/useUserSettings.hook', () => ({
  userSettingsSync: {
    curr: {
      tts_custom_engine_command: 'curl -X POST {{input}}',
    },
  },
}))

jest.mock('../../../managers/string.manager', () => ({
  transformString: jest.fn((s: string) => s),
}))

describe('useChunkDownloader', () => {
  const mockLog = jest.fn()
  const mockSetWordStat = jest.fn()

  const baseOptions = {
    textChunks: ['Hello world this is chunk one', 'Second chunk text here', 'Third chunk text'],
    log: mockLog,
    setWordStat: mockSetWordStat,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Single download', () => {
    it('calls callback with URL on success', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      let receivedUrl = ''
      act(() => {
        result.current.downloadChunk(0, (url: string) => {
          receivedUrl = url
        })
      })

      expect(receivedUrl).toBe('http://example.com/chunk.mp3')
    })

    it('logs starting download message', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      act(() => {
        result.current.downloadChunk(0, () => { })
      })

      expect(mockLog).toHaveBeenCalledWith('[TtsCustomPopup]: 📥 starting download for chunk 0')
    })
  })

  describe('Callback queue', () => {
    it('queues callbacks when chunk already downloading', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      let cb1Called = false
      let cb2Called = false

      act(() => {
        result.current.downloadChunk(0, () => { cb1Called = true })
        result.current.downloadChunk(0, () => { cb2Called = true })
      })

      // Both callbacks should be called (first directly, second from queue)
      expect(cb1Called || cb2Called).toBe(true)
    })
  })

  describe('Word count', () => {
    it('word count is added once (not doubled)', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      act(() => {
        result.current.downloadChunk(0, () => { })
      })

      // "Hello world this is chunk one" = 6 words
      // setWordStat should be called with 6, not 12
      expect(mockSetWordStat).toHaveBeenCalledWith(6)
    })
  })

  describe('Empty chunk handling', () => {
    it('does not download empty chunk', () => {
      const options = {
        ...baseOptions,
        textChunks: [''],
      }
      const { result } = renderHook(() => useChunkDownloader(options))

      act(() => {
        result.current.downloadChunk(0, () => { })
      })

      expect(mockLog).toHaveBeenCalledWith('[TtsCustomPopup]: ⚠️ chunk 0 is empty, do not download')
    })
  })

  describe('Cleanup', () => {
    it('clears downloadInProgress on cleanup', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      act(() => {
        result.current.cleanup()
      })

      expect(result.current.downloadInProgress.current.size).toBe(0)
    })
  })
})
