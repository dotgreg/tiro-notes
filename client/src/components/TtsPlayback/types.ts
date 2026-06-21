/** Playback states for the state machine */
export enum TtsState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

/** Callback signature for chunk download completion */
export type DownloadCallback = (url: string) => void

/** Options for the playback controller */
export interface TtsPlaybackOptions {
  /** Log function to write messages */
  log: (message: string, category?: string) => void
  /** Called when audio ends and next chunk should play */
  onChunkEnd: () => void
  /** Called to download a chunk and get its audio URL */
  downloadChunk: (chunkId: number, cb: DownloadCallback) => void
  /** Total number of text chunks */
  totalChunks: number
  /** Current chunk index */
  currentChunk: number
  /** Playback rate */
  playbackRate: number
  /** Headers for authenticated fetch */
  ttsHeaders: Record<string, string>
  /** Preload N chunks ahead */
  preloadCount: number
  /** Called to set isPlaying state in parent */
  setIsPlaying: (playing: boolean) => void
}

/** Public API exposed by the playback controller */
export interface TtsPlaybackController {
  /** Current state */
  state: TtsState
  /** Abort flag — checked by all async callbacks */
  cancelledRef: { current: boolean }
  /** Current Audio element */
  audioRef: { current: HTMLAudioElement | null }
  /** Whether the popup is closed */
  isPopupClosedRef: { current: boolean }

  /** Start playing a specific chunk */
  playChunk: (chunkNb: number, isUserAction?: boolean) => void
  /** Pause current playback */
  pause: () => void
  /** Resume paused playback */
  resume: () => void
  /** Destroy all state, reset refs, cleanup resources */
  destroy: () => void
}
