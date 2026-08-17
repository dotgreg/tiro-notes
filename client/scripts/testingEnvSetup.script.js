// Minimal testing environment setup
global.Audio = class {
  play = jest.fn(() => Promise.resolve())
  pause = jest.fn()
  oncanplay = null
  onended = null
  onerror = null
  currentTime = 0
  duration = 10
  readyState = 4
  paused = false
  ended = false
  preload = ''
  src = ''
  load = jest.fn()
  remove = jest.fn()
  // Capture event listeners so tests can fire them (e.g. 'pause' for
  // underrun-recovery tests). One listener per type is the only real usage.
  __listeners = {}
  addEventListener = jest.fn(function (type, fn) {
    this.__listeners[type] = fn
  })
  dispatch = function (type) {
    this.__listeners[type]?.()
  }
}
