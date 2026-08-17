export { TtsState } from './types'
export type { TtsPlaybackOptions, TtsPlaybackController, DownloadCallback } from './types'
export { useTtsPlaybackController, getTtsTabId } from './useTtsPlaybackController.hook'
export { useChunkDownloader } from './useChunkDownloader.hook'
export type { ChunkDownloaderOptions, ChunkDownloader } from './useChunkDownloader.hook'

/** Page-visibility backstop (s2_t4 Task 3): the OS releases the wake lock and
 *  may pause audio (or queue the pause event) while the tab is hidden. Pure
 *  handler so it is unit-testable without rendering the popup. */
export const onVisibilityChange = (
  visible: boolean,
  bgLock: boolean,
  startWakeLock: () => void,
  audio: HTMLAudioElement | null,
  isPlaying: boolean,
  log: (msg: string) => void,
) => {
  if (!visible) return
  if (bgLock) startWakeLock() // lock is auto-released on hide — re-acquire
  if (isPlaying && audio && audio.paused && !audio.ended && audio.readyState >= 2) {
    audio.play().catch(() => { })
    log(`📱 visible again — re-asserted playback`)
  }
}
