import { useRef, useCallback } from 'react'
import { getApi } from '../../hooks/api/api.hook'
import { transformString } from '../../managers/string.manager'
import { DownloadCallback } from './types'

const pre = '[TtsCustomPopup]'

/**
 * Chunk downloader — rewritten 0.52.9 (same contract as 0.52.7, whose
 * behavior the 0.52.7/0.52.8 logs proved sound: dedup + callback queue +
 * single word count).
 *
 * - Dedup: one in-flight API request per chunk; later callers are queued
 *   and fired when the request completes.
 * - Word count: added exactly once per chunk, on the fresh download
 *   (cache hits and queued callers do not re-count).
 * - URL cache: audioUrls[chunkId] = the API http URL. Blob wrapping (when
 *   the TTS engine needs headers) happens in the controller, deduped there.
 */
export interface ChunkDownloaderOptions {
  /** Text chunks array */
  textChunks: string[]
  /** Log function */
  log: (message: string, category?: string) => void
  /** Word stat setter */
  setWordStat: (value: number) => void
  /** Live getter for the selected engine's command template
   *  ({{input}}, {{input_simple}}, {{speed}} placeholders) */
  getEngineCommand: () => string
  /** Live getter for the playback rate ({{speed}} placeholder) */
  getRate?: () => number
}

export interface ChunkDownloader {
  /** Download a chunk and call callback with URL */
  downloadChunk: (chunkId: number, cb: DownloadCallback) => void
  /** Set of chunks currently downloading */
  downloadInProgress: { current: Set<number> }
  /** URL cache */
  audioUrls: { current: string[] }
  /** Cleanup: clear in-flight state and URL cache */
  cleanup: () => void
}

export function useChunkDownloader(options: ChunkDownloaderOptions): ChunkDownloader {
  const { textChunks, log, setWordStat, getEngineCommand, getRate } = options

  // In-flight guard (one API request per chunk)
  const downloadInProgress = useRef<Set<number>>(new Set())
  // Pending callbacks for chunks still downloading
  const pendingCallbacks = useRef<Map<number, Array<DownloadCallback>>>(new Map())
  // URL cache
  const audioUrls = useRef<string[]>([])
  // Word stat tracking
  const wordStatRef = useRef<number>(0)
  // Generation: bumped on cleanup() (engine switch). In-flight responses from
  // a previous engine must not fire callbacks or repopulate the URL cache.
  const epochRef = useRef<number>(0)

  const downloadChunk = useCallback((chunkId: number, cb: DownloadCallback) => {
    const textToSent = textChunks[chunkId]

    if (!textToSent || textToSent.length === 0) {
      log(`${pre}: ⚠️ chunk ${chunkId} is empty, do not download`)
      return
    }

    log(`${pre}: 📥 starting download for chunk ${chunkId}`)

    // Already cached → callback immediately, no re-count
    if (audioUrls.current[chunkId]) {
      cb(audioUrls.current[chunkId])
      return
    }

    // Already downloading → queue the callback (dedup)
    if (downloadInProgress.current.has(chunkId)) {
      log(`${pre}: ⏳ chunk ${chunkId} already downloading, queuing callback`)
      if (!pendingCallbacks.current.has(chunkId)) {
        pendingCallbacks.current.set(chunkId, [])
      }
      pendingCallbacks.current.get(chunkId)!.push(cb)
      return
    }

    // Build the engine command (live getter: the selected engine can change mid-session)
    const stringCmd = getEngineCommand()
    // Simplify text for {{input_simple}}
    const textToSentSimple = transformString(textToSent, {
      accents: true,
      specialChars: false,
      escapeChars: true,
    })
    let stringCmdProcessed = stringCmd.replace('{{input}}', textToSent)
    stringCmdProcessed = stringCmdProcessed.replace('{{input_simple}}', textToSentSimple)
    stringCmdProcessed = stringCmdProcessed.replace('{{speed}}', String(getRate ? getRate() : 1))

    // Word count — only on the fresh download
    const wordsNb = textToSent.split(' ').length || 0
    wordStatRef.current = wordStatRef.current + wordsNb
    setWordStat(wordStatRef.current)
    const wordLog = `[${wordsNb} words]`

    const start = Date.now()
    downloadInProgress.current.add(chunkId)
    log(`${pre}: 🚀 requesting chunk ${chunkId} ${wordLog}`)
    const epoch = epochRef.current

    let isCbCalled = false // guard: the API callback must fire at most once
    const cbOnce = (res: string) => {
      if (isCbCalled) return
      cb(res)
      isCbCalled = true
    }

    getApi(api => {
      api.command.exec(stringCmdProcessed, (apiAnswer: string) => {
        if (epoch !== epochRef.current) {
          // Engine switched while this request was in flight: discard the
          // response so the previous engine's URL cannot poison the cache.
          log(`${pre}: 🗑️ stale response for chunk ${chunkId} discarded (engine switched)`)
          return
        }
        log(`${pre}: 📨 API response received for chunk ${chunkId} [${apiAnswer.substring(0, 80)}${apiAnswer.length > 80 ? '...' : ''}]`)
        if (isCbCalled) return

        // Clear in-flight flag
        downloadInProgress.current.delete(chunkId)

        // Extract URL from the response (regex first, JSON fallback)
        let url = ''
        const regexMatch = apiAnswer.match(/https?:\/\/[\S]+\.(mp3|wav|ogg|m4a)/i)
        if (regexMatch) {
          url = regexMatch[0]
        } else {
          try {
            const apiObj = JSON.parse(apiAnswer)
            url = apiObj['output'] || apiObj['url'] || apiObj['audio_url'] || apiObj['data'] || ''
          } catch {
            // Not JSON — regex already tried
          }
        }

        if (url && url.length > 0) {
          const timeLog = `[${Date.now() - start}ms]`
          log(`${pre}: 📥 [ok] API done for chunk ${chunkId} ${wordLog} ${timeLog}`)
          log(`${pre}: 🔗 chunk ${chunkId} audio: ${url}`)
          audioUrls.current[chunkId] = url
        } else {
          let message = apiAnswer
          try {
            const apiObj = JSON.parse(apiAnswer)
            message = `${apiObj['stderr']} - ${apiObj['shortMessage']}`
            log(`${pre}: 📥❌ [!! error] chunk ${chunkId}: API answer error: ${message} ${wordLog}`)
          } catch {
            log(`${pre}: ❌ [!! error] chunk ${chunkId}: API answer error: ${apiAnswer} ${wordLog}`)
          }
          url = 'ERROR: API'
        }

        // Fire queued callbacks, then our own
        const queuedCbs = pendingCallbacks.current.get(chunkId)
        if (queuedCbs) {
          for (const qCb of queuedCbs) qCb(url)
          pendingCallbacks.current.delete(chunkId)
        }
        cbOnce(url)
      })
    })
  }, [textChunks, log, setWordStat, getEngineCommand, getRate])

  /** Cleanup: clear in-flight state and URL cache (engine switch) */
  const cleanup = useCallback(() => {
    epochRef.current += 1 // invalidate in-flight responses from the previous engine
    downloadInProgress.current.clear()
    pendingCallbacks.current.clear()
    audioUrls.current = []
  }, [])

  return {
    downloadChunk,
    downloadInProgress,
    audioUrls,
    cleanup,
  }
}
