// Unit tests for parseTtsEngines (0.52.12 — multiple TTS engines per settings line)

jest.mock('../../hooks/useUserSettings.hook', () => ({
  userSettingsSync: { curr: { tts_max_words_per_sentence: 75 } },
}))
jest.mock('../markdown.manager', () => ({
  md2html: jest.fn(() => ''),
}))
jest.mock('lodash-es', () => ({
  each: jest.fn(),
  debounce: jest.fn(fn => fn),
}))

import { parseTtsEngines } from '../tts.manager'

describe('parseTtsEngines', () => {
  it('parses one engine per line: name | maxWords | command', () => {
    const raw = [
      'engine1 | 50 | curl -X POST --data "{{input}}" https://a.test',
      'engine2 | 100 | curl -X POST --data "{{input}}" https://b.test',
    ].join('\n')

    const engines = parseTtsEngines(raw, 75)
    expect(engines).toHaveLength(2)
    expect(engines[0].name).toBe('engine1')
    expect(engines[0].maxWords).toBe(50)
    expect(engines[0].command).toBe('curl -X POST --data "{{input}}" https://a.test')
    expect(engines[1].maxWords).toBe(100)
  })

  it('keeps pipes inside the command (splits on the first two delimiters only)', () => {
    const raw = 'shelly | 80 | curl -X POST -H "Authorization: Bearer a|b" --data "{{input}}" https://a.test | echo done'
    const engines = parseTtsEngines(raw, 75)
    expect(engines).toHaveLength(1)
    expect(engines[0].name).toBe('shelly')
    expect(engines[0].maxWords).toBe(80)
    expect(engines[0].command).toBe('curl -X POST -H "Authorization: Bearer a|b" --data "{{input}}" https://a.test | echo done')
  })

  it('treats a line without " | " as a legacy single command (global max words fallback)', () => {
    const raw = 'curl -X POST --data "{{input}}" https://a.test'
    const engines = parseTtsEngines(raw, 75)
    expect(engines).toHaveLength(1)
    expect(engines[0].name).toBe('default')
    expect(engines[0].maxWords).toBe(75)
    expect(engines[0].command).toBe('curl -X POST --data "{{input}}" https://a.test')
  })

  it('allows -1 as maxWords (send the whole text)', () => {
    const raw = 'whole | -1 | curl -X POST --data "{{input}}" https://a.test'
    const engines = parseTtsEngines(raw, 75)
    expect(engines[0].maxWords).toBe(-1)
  })

  it('skips blank lines', () => {
    const raw = '\n\ne1 | 50 | cmd-one\n\n  \ne2 | 60 | cmd-two\n'
    const engines = parseTtsEngines(raw, 75)
    expect(engines.map(e => e.name)).toEqual(['e1', 'e2'])
  })

  it('returns an empty list for an empty setting', () => {
    expect(parseTtsEngines('', 75)).toEqual([])
  })

  it('falls back to a generated name when the name part is empty', () => {
    const engines = parseTtsEngines('| 50 | cmd', 75)
    expect(engines[0].name).toBe('default')
    const two = parseTtsEngines('a | 50 | cmdA\n| 60 | cmdB', 75)
    expect(two[1].name).toBe('engine 2')
  })
})
