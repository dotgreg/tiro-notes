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

import { parseTtsEngines, chunkTextInSentences2 } from '../tts.manager'

describe('chunkTextInSentences2 (max words per part)', () => {
  const sentence = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ') + '.'

  it('closes the part BEFORE the sentence that would exceed the cap', () => {
    // 23 sentences x 20 words; cap 450 → first part must hold 22 sentences (440w), not 23 (460w)
    const text = Array.from({ length: 23 }, () => sentence(20)).join(' ')
    const chunks = chunkTextInSentences2(text, 100, 450)
    const words = (c: string) => (c.match(/\S+/g) || []).length
    chunks.forEach(c => expect(words(c)).toBeLessThanOrEqual(450))
    expect(words(chunks[0])).toBe(440)
  })

  it('word cap is the only rule when sentencesPerPart is Infinity (engines with own max words)', () => {
    // 23 sentences x 20 words, cap 450, sentence cap off → 22 sentences (440w) in the first part
    const text = Array.from({ length: 23 }, () => sentence(20)).join(' ')
    const chunks = chunkTextInSentences2(text, Infinity, 450)
    const words = (c: string) => (c.match(/\S+/g) || []).length
    expect(words(chunks[0])).toBe(440)
    expect(words(chunks[1])).toBe(20)
  })

  it('sentencesPerPart acts as a cap (part closes when it holds that many sentences)', () => {
    // 30 sentences x 20 words; sentence cap 10 hits (200w) before the word cap (500)
    const text = Array.from({ length: 30 }, () => sentence(20)).join(' ')
    const chunks = chunkTextInSentences2(text, 10, 500)
    const words = (c: string) => (c.match(/\S+/g) || []).length
    expect(words(chunks[0])).toBe(200)
    expect(chunks).toHaveLength(3)
  })

  it('tiles a 48k-word text with a 20k cap: 3 exact parts, no overlap or loss', () => {
    let text = ''
    let n = 0
    for (let s = 0; s < 1999; s++) {
      const len = s % 50 === 0 ? 1 : s % 37 === 0 ? 2 : 25
      text += Array.from({ length: len }, () => `w${n++}`).join(' ') + '. '
    }
    text += Array.from({ length: 300 }, () => `w${n++}`).join(' ') + '.'
    const total = (text.match(/\S+/g) || []).length
    const chunks = chunkTextInSentences2(text, Infinity, 20000)
    const words = (c: string) => (c.match(/\S+/g) || []).length
    expect(chunks).toHaveLength(3)
    expect(chunks.reduce((a, c) => a + words(c), 0)).toBe(total)
    // part starts strictly advance through the text (no overlap, in order)
    const firsts = chunks.map(c => parseInt(c.trim().split(/\s+/)[0].slice(1)))
    for (let i = 1; i < firsts.length; i++) expect(firsts[i]).toBeGreaterThan(firsts[i - 1])
    expect(chunks[2].trim().endsWith(`w${n - 1}.`)).toBe(true)
  })

  it('keeps the final part (trailing sentences are not dropped)', () => {
    const chunks = chunkTextInSentences2(['a b c.', 'd e f.', 'g h i.'].join(' '), 1, 100)
    expect(chunks).toHaveLength(3)
    expect(chunks[2].trim()).toBe('g h i.')
  })
})

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
    expect(engines[0].hasOwnMaxWords).toBe(true)
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
    expect(engines[0].hasOwnMaxWords).toBe(false)
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
