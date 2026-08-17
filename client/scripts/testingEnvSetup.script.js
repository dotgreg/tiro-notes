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
  preload = ''
  src = ''
  load = jest.fn()
  remove = jest.fn()
  addEventListener = jest.fn()
}
