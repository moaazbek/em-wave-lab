import { describe, expect, it } from 'vitest'
import { randomExamWinding } from './engine'
import { ExamAnswer, grade } from './exam'

describe('exam grading', () => {
  it('a fully right answer is right in every field', () => {
    const ans: ExamAnswer = { type: 'lap', plex: '2', dir: 'r', coils: '16', conductors: '64', segments: '16', paths: '8', yc: '-2' }
    const g = grade({ type: 'lap', m: 2, progressive: false, P: 4, C: 16, NC: 2 }, ans)
    expect(g.every((x) => x.ok)).toBe(true)
    expect(g.find((x) => x.field === 'conductors')!.reason).toBe('Z = 2CN_C = 2(16)(2) = 64.')
  })
  it('simplex wave, 9 coils, 4 poles: y_c = 5 progressive, 2 paths', () => {
    const g = grade({ type: 'wave', m: 1, progressive: true, P: 4, C: 9, NC: 1 }, { type: 'lap', plex: '1', dir: 'p', coils: '9', conductors: '18', segments: '9', paths: '4', yc: '+5' })
    const by = Object.fromEntries(g.map((x) => [x.field, x]))
    expect(by.type.ok).toBe(false)
    expect(by.paths.ok).toBe(false)
    expect(by.paths.expected).toBe('2')
    expect(by.yc.ok).toBe(true)
    expect(by.dir.reason).toMatch(/2\(9 \+ 1\)\/4 = 5/)
  })
  it('the right answers derived from the engine always grade as right', () => {
    let seed = 11
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < 200; i++) {
      const s = randomExamWinding(rnd)
      const first = grade(s, { type: '', plex: '', dir: '', coils: '', conductors: '', segments: '', paths: '', yc: '' })
      const ans = Object.fromEntries(first.map((x) => [x.field, x.field === 'type' ? s.type : x.field === 'plex' ? String(s.m) : x.field === 'dir' ? (s.progressive ? 'p' : 'r') : x.expected])) as unknown as ExamAnswer
      expect(grade(s, ans).every((x) => x.ok)).toBe(true)
      expect(first.every((x) => !x.ok)).toBe(true)
    }
  })
})
