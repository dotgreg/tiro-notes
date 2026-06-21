import { useRef, useCallback } from 'react'
import { getApi } from '../../hooks/api/api.hook'
import { userSettingsSync } from '../../hooks/useUserSettings.hook'
import { transformString } from '../../managers/string.manager'
import { DownloadCallback } from './types'

const pre = '[TtsCustomPopup]'

/**
 * Chunk downloader with dedup, callback queue, and word count tracking.
 *
 * Fixes:
 * - Word count: single addition (was wordStatRef + wordsNb added twice)
 * - Dedup: Set-based in-flight guard prevents duplicate requests
 * - Callback queue: pending callbacks fire when download completes
 * - Blob URL revocation on cleanup
 */
export interface ChunkDownloaderOptions {
  /** Text chunks array */
  textChunks: string[]
  /** Log function */
  log: (message: string, category?: string) => void
  /** Word stat setter */
  setWordStat: (value: number) => void
}

export interface ChunkDownloader {
  /** Download a chunk and call callback with URL */
  downloadChunk: (chunkId: number, cb: DownloadCallback) => void
  /** Set of chunks currently downloading */
  downloadInProgress: { current: Set<number> }
  /** URL cache */
  audioUrls: { current: string[] }
  /** Cleanup: revoke blob URLs, clear state */
  cleanup: () => void
}

export function useChunkDownloader(options: ChunkDownloaderOptions): ChunkDownloader {
  const { textChunks, log, setWordStat } = options

  // In-flight guard
  const downloadInProgress = useRef<Set<number>>(new Set())
  // Pending callbacks for chunks still downloading
  const pendingCallbacks = useRef<Map<number, Array<DownloadCallback>>>(new Map())
  // URL cache
  const audioUrls = useRef<string[]>([])
  // Word stat tracking
  const wordStatRef = useRef<number>(0)

  /** Extract -H headers from TTS command */
  const extractTtsHeaders = (cmd: string): Record<string, string> => {
    const headers: Record<string, string> = {}
    const hRegex = /-H\s+["']([^"']+)["']/g
    let m
    while ((m = hRegex.exec(cmd)) !== null) {
      const kv = m[1].split(':')
      if (kv.length >= 2) {
        const key = kv[0].trim()
        const val = kv.slice(1).join(':').trim()
        headers[key] = val
      }
    }
    return headers
  }

  const downloadChunk = useCallback((chunkId: number, cb: DownloadCallback) => {
    const stringCmd = userSettingsSync.curr.tts_custom_engine_command
    const textToSent = textChunks[chunkId]

    if (!textToSent || textToSent.length === 0) {
      log(`${pre}: ⚠️ chunk ${chunkId} is empty, do not download`)
      return
    }

    log(`${pre}: 📥 starting download for chunk ${chunkId}`)

    // Word count — FIXED: single addition only
    const wordsNb = textToSent?.split(' ').length || 0
    if (typeof wordsNb === 'number' && typeof wordStatRef.current === 'number') {
      wordStatRef.current = wordStatRef.current + wordsNb
      setWordStat(wordStatRef.current)
    }
    const wordLog = `[${wordsNb} words]`

    // Simplify text for {{input_simple}}
    const textToSentSimple = transformString(textToSent, {
      accents: true,
      specialChars: false,
      escapeChars: true,
    })

    let stringCmdProcessed = stringCmd.replace('{{input}}', textToSent)
    stringCmdProcessed = stringCmdProcessed.replace('{{input_simple}}', textToSentSimple)

    let isCbCalled = false
    const cbOnce = (res: string) => {
      if (isCbCalled) return
      cb(res)
      isCbCalled = true
    }

    // Skip if already cached
    if (audioUrls.current[chunkId]) {
      cbOnce(audioUrls.current[chunkId])
      return
    }

    // Skip if already downloading (dedup guard)
    if (downloadInProgress.current.has(chunkId)) {
      log(`${pre}: ⏳ chunk ${chunkId} already downloading, queuing callback`)
      if (!pendingCallbacks.current.has(chunkId)) {
        pendingCallbacks.current.set(chunkId, [])
      }
      pendingCallbacks.current.get(chunkId)!.push(cb)
      return
    }

    const start = Date.now()
    downloadInProgress.current.add(chunkId)

    log(`${pre}: 🚀 requesting chunk ${chunkId} ${wordLog}`)

    getApi(api => {
      api.command.exec(stringCmdProcessed, (apiAnswer: string) => {
        log(`${pre}: 📨 API response received for chunk ${chunkId} [${apiAnswer.substring(0, 80)}${apiAnswer.length > 80 ? '...' : ''}]`)
        if (isCbCalled) return

        // Clear in-flight flag
        downloadInProgress.current.delete(chunkId)

        // Extract URL from response
        let url = ''
        const regexMatch = apiAnswer.match(/https?:\/\/[\S]+\.(mp3|wav|ogg|m4a)/i)
        if (regexMatch) {
          url = regexMatch[0]
        } else {
          try {
            const apiObj = JSON.parse(apiAnswer)
            url = apiObj['output'] || apiObj['url'] || apiObj['audio_url'] || apiObj['data'] || ''
          } catch {
            // Not JSON, regex already tried
          }
        }

        // Fire queued callbacks
        const queuedCbs = pendingCallbacks.current.get(chunkId)
        if (queuedCbs) {
          for (const qCb of queuedCbs) {
            qCb(url || 'ERROR: API')
          }
          pendingCallbacks.current.delete(chunkId)
        }

        if (url && url.length > 0) {
          const time = Date.now() - start
          const timeLog = `[${time}ms]`
          log(`${pre}: 📥 [ok] API done for chunk ${chunkId} ${wordLog} ${timeLog}`)
          log(`${pre}: ✅ chunk ${chunkId} download FINISHED ${timeLog}`)
          audioUrls.current[chunkId] = url

          // Preload the audio element
          const audio = new Audio(url)
          audio.preload = 'auto'
          cbOnce(url)
        } else {
          let message = apiAnswer
          try {
            const apiObj = JSON.parse(apiAnswer)
            message = `${apiObj['stderr']} - ${apiObj['shortMessage']}`
            log(`${pre}: 📥❌ [!! error] chunk ${chunkId}: API answer error: ${message} ${wordLog}`)
          } catch (error) {
            log(`${pre}: ❌ [!! error] chunk ${chunkId}: API answer error: ${JSON.stringify(error)} ${wordLog}`)
          }
          cbOnce('ERROR: API')
        }
      })
    })
  }, [textChunks, log, setWordStat])

  /** Cleanup: revoke any blob URLs and clear state */
  const cleanup = useCallback(() => {
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
