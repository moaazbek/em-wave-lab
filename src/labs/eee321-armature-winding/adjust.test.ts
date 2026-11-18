import { describe, expect, it } from 'vitest'
import { nearbyDrawable, smartAdjust, stepTargets } from './adjust'
import { derive } from './derive'
import { ArmState, fromPreset } from './state'

const base = (over: Partial<ArmState>): ArmState => ({ ...fromPreset('lap16'), ...over })
const press = (s: ArmState, patch: Partial<ArmState>) => {
  const r = smartAdjust(s, patch)
  return { s: { ...s, ...r.patch }, notes: r.notes }
}

describe('smart adjust: the pressed choice is kept, the fewest other settings change', () => {
  it('1. lap, progressive, P = 2, C = 14; press Wave → P = 4, C = 13 (y_c = 7)', () => {
    const { s, notes } = press(base({ type: 'lap', P: 2, C: 14 }), { type: 'wave' })
    expect([s.type, s.P, s.C]).toEqual(['wave', 4, 13])
    expect(derive(s).f.yc).toBe(7)
    expect(derive(s).build.ok).toBe(true)
    expect(notes[0]).toBe('Wave windings need at least 4 poles, so $P$ changed from 2 to 4.')
    expect(notes[1]).toBe('$C$ changed from 14 to 13, so that $y_c = 2(C + 1)/P$ is an integer.')
  })
  it('2. the same, retrogressive → P = 4, C = 13 (y_c = 6)', () => {
    const { s } = press(base({ type: 'lap', P: 2, C: 14, progressive: false }), { type: 'wave' })
    expect([s.P, s.C, derive(s).f.yc]).toEqual([4, 13, 6])
  })
  it('3. wave, P = 4, C = 13; press duplex → C = 12 (y_c = 7)', () => {
    const { s } = press(base({ type: 'wave', P: 4, C: 13 }), { m: 2 })
    expect([s.m, s.C, derive(s).f.yc]).toEqual([2, 12, 7])
  })
  it('4. wave, P = 4, C = 13; press triplex → C = 15 (C = 13 would put one segment under both brushes)', () => {
    const { s, notes } = press(base({ type: 'wave', P: 4, C: 13 }), { m: 3 })
    expect([s.m, s.C, derive(s).f.yc]).toEqual([3, 15, 9])
    expect(notes[0]).toMatch(/never touch the same segment/)
  })
  it('5. wave, progressive, P = 10, C = 24; press Retrogressive → C = 26', () => {
    const { s } = press(base({ type: 'wave', P: 10, C: 24 }), { progressive: false })
    expect(s.C).toBe(26)
    expect(derive(s).build.ok).toBe(true)
  })
  it('6. wave, m = 3, P = 4, C = 24; press P = 12 → C = 45 (drawable list: 45)', () => {
    const { s } = press(base({ type: 'wave', m: 3, P: 4, C: 24 }), { P: 12 })
    expect(s.C).toBe(45)
    expect(nearbyDrawable(s)).toEqual([45])
  })
  it('7. lap, P = 6, C = 24; press P = 10 → C = 20 (drawable list: 20, 30, 40)', () => {
    const { s } = press(base({ type: 'lap', P: 6, C: 24 }), { P: 10 })
    expect(s.C).toBe(20)
    expect(nearbyDrawable(s)).toEqual([20, 30, 40])
  })
  it('8. wave duplex, P = 4, C = 12; press Lap → lap m = 2, C = 16 (C = 8 would short a + and a − brush)', () => {
    const { s } = press(base({ type: 'wave', m: 2, P: 4, C: 12 }), { type: 'lap' })
    expect([s.type, s.m, s.C]).toEqual(['lap', 2, 16])
  })
  it('9. wave, P = 12, C = 144; press Retrogressive → C = 144 is kept (large machine)', () => {
    const { s, notes } = press(base({ type: 'wave', P: 12, C: 144, NC: 10 }), { progressive: false })
    expect(s.C).toBe(144)
    expect(notes).toEqual([])
    const m = derive(s)
    expect(m.build.ok).toBe(false)
    // Example 7-4: the book's reason (y_c not an integer) comes first
    if (!m.build.ok) expect(m.build.reason).toMatch(/not an integer/)
    expect(derive({ ...s, progressive: true, C: 145 }).build.ok).toBe(false)
  })
  it('10. lap, P = 10, typed C = 25 → C stays 25; the nearest drawable is 20', () => {
    const m = derive(base({ type: 'lap', P: 10, C: 25 }))
    expect(m.state.C).toBe(25)
    expect(m.build.ok).toBe(false)
    expect(m.nearest).toBe(20)
  })
  it('triplex lap with 12 poles cannot be drawn with C ≤ 48 → P changes to 8', () => {
    const { s, notes } = press(base({ type: 'lap', m: 1, P: 12, C: 24 }), { m: 3 })
    expect([s.m, s.P, s.C]).toEqual([3, 8, 48])
    expect(notes[0]).toMatch(/\$P\$ changed from 12 to 8/)
  })
  it('frog-leg keeps the numbers; Lap again returns to a drawable winding', () => {
    const s0 = base({ type: 'lap', P: 4, C: 16 })
    const { s } = press(s0, { type: 'frog' })
    expect([s.P, s.C]).toEqual([4, 16])
    const back = press({ ...s, P: 6 }, { type: 'lap' }).s
    expect(derive(back).build.ok).toBe(true)
  })
  it('a chorded coil span goes back to full pitch, and the note says so', () => {
    const { s, notes } = press(base({ type: 'lap', P: 4, C: 16, chord: 1 }), { P: 6 })
    expect(s.chord).toBe(0)
    expect(s.C).toBe(18)
    expect(notes.at(-1)).toMatch(/full pitch, 3 slots/)
  })
})

describe('every choice button, in any order, leads to a drawable winding', () => {
  it('2000 random presses from random drawable states (C ≤ 48)', () => {
    let seed = 99
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    let s = base({})
    for (let i = 0; i < 2000; i++) {
      const k = Math.floor(rnd() * 4)
      const patch: Partial<ArmState> =
        k === 0 ? { type: (['lap', 'wave', 'frog'] as const)[Math.floor(rnd() * 3)] }
          : k === 1 ? { m: 1 + Math.floor(rnd() * 3) }
            : k === 2 ? { progressive: rnd() < 0.5 }
              : { P: [2, 4, 6, 8, 10, 12][Math.floor(rnd() * 6)] }
      // the UI disables P buttons that cannot be drawn; skip those presses
      if (k === 3 && s.type !== 'frog' && nearbyDrawable({ ...s, ...patch }).length === 0) continue
      s = press(s, patch).s
      if (s.type !== 'frog') expect(derive(s).build.ok).toBe(true)
    }
  })
})

describe('C stepper', () => {
  it('steps to the previous and next drawable value', () => {
    expect(stepTargets(base({ type: 'lap', P: 10, C: 20 }))).toEqual({ prev: null, next: 30 })
    expect(stepTargets(base({ type: 'lap', P: 10, C: 25 }))).toEqual({ prev: 20, next: 30 })
    expect(stepTargets(base({ type: 'wave', m: 1, P: 12, C: 144 }))).toEqual({ prev: 47, next: null })
  })
  it('shows at most 8 drawable values, the ones nearest C', () => {
    const v = nearbyDrawable(base({ type: 'lap', P: 2, C: 20 }))
    expect(v).toEqual([12, 14, 16, 18, 20, 22, 24, 26]) // 12 and 28 tie: the smaller one
  })
})
