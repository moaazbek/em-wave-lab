import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, LabState, decodeState, encodeState, initSession, reduce, setMedium, setPreset } from './state'
import { fromPreset } from '../../physics'

describe('lab state', () => {
  it('round-trips through the URL', () => {
    const s: LabState = {
      ...DEFAULT_STATE, m1: { ...fromPreset('diel4'), muR: 2 }, m2: { ...fromPreset('seawater'), epsR: 60 },
      f: 5e6, thetaDeg: 41.8, e0: 2.5, pol: 'par', part: 'ref', quantity: 'H', comp: 'z', rays: false, advanced: true,
    }
    expect(decodeState(encodeState(s))).toEqual(s)
    expect(decodeState(encodeState({ ...s, m2: fromPreset('pec') })).m2.pec).toBe(true)
    expect(decodeState('')).toEqual(DEFAULT_STATE)
    expect(decodeState('f=1e99&th=abc&p1=copper').f).toBe(1e11)
    expect(decodeState('p1=copper').m1.preset).toBe('air') // Medium 1 must stay lossless
  })
  it('editing one value keeps the others and remembers the state before a drag', () => {
    let s = initSession(DEFAULT_STATE)
    s = reduce(s, setPreset(2, 'seawater'))
    s = reduce(s, setMedium(2, 'epsR', 50, s.state))
    s = reduce(s, setMedium(2, 'epsR', 40, s.state))
    expect(s.state.m2).toEqual({ preset: 'seawater', epsR: 40, muR: 1, sigma: 4, pec: false })
    expect(s.before.m2.epsR).toBe(72) // the two eps edits count as one change
    s = reduce(s, { type: 'physics', change: 'pol', patch: { pol: 'par' } })
    expect(s.state.quantity).toBe('H')
    expect(s.state.m2.epsR).toBe(40)
  })
})
