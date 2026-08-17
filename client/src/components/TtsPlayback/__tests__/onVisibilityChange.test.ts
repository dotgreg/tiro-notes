import { onVisibilityChange } from '..'

// index.ts re-exports hooks that pull api.hook (lodash-es, ESM) — mock the leaves
jest.mock('../../../hooks/api/api.hook', () => ({ getApi: jest.fn() }))
jest.mock('../../../hooks/useUserSettings.hook', () => ({ userSettingsSync: { curr: { tts: {} } } }))

const makeAudio = (overrides: Partial<HTMLAudioElement> = {}): any => ({
  play: jest.fn(() => Promise.resolve()),
  paused: true,
  ended: false,
  readyState: 4,
  ...overrides,
})

describe('onVisibilityChange (s2_t4 Task 3)', () => {
  const log = jest.fn()
  const startWakeLock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('is a no-op while the page is hidden', () => {
    const audio = makeAudio()
    onVisibilityChange(false, true, startWakeLock, audio, true, log)
    expect(startWakeLock).not.toHaveBeenCalled()
    expect(audio.play).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('re-acquires the wake lock when bgLock is on', () => {
    onVisibilityChange(true, true, startWakeLock, null, false, log)
    expect(startWakeLock).toHaveBeenCalledTimes(1)
  })

  it('does not re-acquire the wake lock when bgLock is off', () => {
    onVisibilityChange(true, false, startWakeLock, null, true, log)
    expect(startWakeLock).not.toHaveBeenCalled()
  })

  it('re-asserts playback when playing, paused and ready (and logs)', () => {
    const audio = makeAudio()
    onVisibilityChange(true, false, startWakeLock, audio, true, log)
    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('re-asserted playback'))
  })

  it('does not re-play when not playing (intentional pause)', () => {
    const audio = makeAudio()
    onVisibilityChange(true, false, startWakeLock, audio, false, log)
    expect(audio.play).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('does not re-play an ended audio (no replay from 0)', () => {
    const audio = makeAudio({ ended: true })
    onVisibilityChange(true, false, startWakeLock, audio, true, log)
    expect(audio.play).not.toHaveBeenCalled()
  })

  it('does not re-play when the audio is not ready (readyState < 2)', () => {
    const audio = makeAudio({ readyState: 1 })
    onVisibilityChange(true, false, startWakeLock, audio, true, log)
    expect(audio.play).not.toHaveBeenCalled()
  })

  it('does not re-play when the element is not paused (already playing)', () => {
    const audio = makeAudio({ paused: false })
    onVisibilityChange(true, false, startWakeLock, audio, true, log)
    expect(audio.play).not.toHaveBeenCalled()
  })

  it('does not re-play when there is no audio element yet', () => {
    onVisibilityChange(true, false, startWakeLock, null, true, log)
    expect(log).not.toHaveBeenCalled()
  })
})
