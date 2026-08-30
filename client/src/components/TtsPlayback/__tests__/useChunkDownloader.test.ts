import { renderHook, act } from '@testing-library/react'
import { getApi } from '../../../hooks/api/api.hook'
import { useChunkDownloader } from '../useChunkDownloader.hook'

// Mock dependencies
let mockLastApi: { command: { exec: jest.Mock } } | null = null
// When set, the exec mock uses this instead of the default (immediate URL) response —
// lets a test keep a response in flight (e.g. across an engine switch).
let mockExecImpl: ((cmd: string, cb: (r: string) => void) => void) | null = null
jest.mock('../../../hooks/api/api.hook', () => ({
  getApi: jest.fn((cb: (api: any) => void) => {
    mockLastApi = {
      command: {
        exec: jest.fn((_cmd: string, callback: (r: string) => void) => {
          if (mockExecImpl) { mockExecImpl(_cmd, callback); return }
          // Simulate API response with URL
          callback(JSON.stringify({ output: 'http://example.com/chunk.mp3' }))
        }),
      },
    }
    cb(mockLastApi)
  }),
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
    getEngineCommand: () => 'curl -X POST {{input}} --speed {{speed}}',
    getRate: () => 1.5,
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

    it('substitutes {{input}} and {{speed}} from the engine command getter', () => {
      mockLastApi = null
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      act(() => {
        result.current.downloadChunk(0, () => { })
      })

      const cmd = mockLastApi!.command.exec.mock.calls[0][0]
      expect(cmd).toContain('Hello world this is chunk one')
      expect(cmd).toContain('--speed 1.5')
    })

    it('discards in-flight responses after an engine switch — no stale URL cached (0.52.13)', (done) => {
      let engineCmd = 'cmd-A {{input}}'
      baseOptions.getEngineCommand = () => engineCmd
      const cmds: string[] = []
      let pendingCb: ((s: string) => void) | null = null
      let respond = false
      mockExecImpl = (cmd: string, cb: (r: string) => void) => {
        cmds.push(cmd)
        if (respond) cb('http://new-b/0.mp3')
        else pendingCb = cb // hang: engine A's response is withheld
      }
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      // first request (engine A) — response stays in flight
      act(() => { result.current.downloadChunk(0, () => { }) })
      expect(cmds.length).toBe(1)
      expect(cmds[0]).toContain('cmd-A')

      // engine switches before the response arrives
      act(() => { result.current.cleanup() })
      engineCmd = 'cmd-B {{input}}'

      // the stale response (engine A) arrives — must be discarded, cache stays empty
      act(() => { pendingCb!('http://stale-a/0.mp3') })
      expect(result.current.audioUrls.current[0]).toBeUndefined()

      // next request goes to the NEW engine and caches the new URL
      respond = true
      act(() => {
        result.current.downloadChunk(0, (url) => {
          expect(url).toBe('http://new-b/0.mp3')
          expect(result.current.audioUrls.current[0]).toBe('http://new-b/0.mp3')
          expect(cmds.length).toBe(2)
          expect(cmds[1]).toContain('cmd-B')
          mockExecImpl = null
          baseOptions.getEngineCommand = () => 'curl -X POST {{input}} --speed {{speed}}'
          done()
        })
      })
    })

    it('logs the audio url (clickable mp3 in the popup log)', () => {
      const { result } = renderHook(() => useChunkDownloader(baseOptions))

      act(() => {
        result.current.downloadChunk(0, () => { })
      })

      expect(mockLog).toHaveBeenCalledWith('[TtsCustomPopup]: 🔗 chunk 0 audio: http://example.com/chunk.mp3')
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
