import { describe, expect, it } from 'vitest'
import { derive, niceAbove, slowDown } from './derive'
import { DEFAULT_STATE, PRESETS, decodeState, encodeState, fromPreset, isCustomized } from './state'

describe('rotating-loop lab state', () => {
  it('round-trips every preset through the URL', () => {
    for (const p of PRESETS) {
      const s = { ...fromPreset(p.id), poleArc: 0.85 }
      expect(decodeState(encodeState(s))).toEqual(s)
    }
    expect(decodeState('')).toEqual(DEFAULT_STATE)
    expect(decodeState('VB=1e9&R=-3').VB).toBe(500)
  })
  it('customized only when a value of the case changes', () => {
    const s = fromPreset('ex71c')
    expect(isCustomized(s)).toBe(false)
    expect(isCustomized({ ...s, poleArc: 0.6 })).toBe(false)
    expect(isCustomized({ ...s, R: 0.6 })).toBe(true)
    expect(isCustomized({ ...s, omega: 1 })).toBe(false) // omega is not an input in Mode A
  })
  it('clamps the load torque below the starting torque and warns', () => {
    const m = derive({ ...fromPreset('ex71b'), tau: 150 })
    expect(m.stallWarning).toBe(true)
    expect(m.op.tauLoad).toBeCloseTo(99.8, 12)
    expect(m.op.omega).toBeGreaterThan(0)
    expect(derive({ ...fromPreset('ex71b'), tau: 10 }).stallWarning).toBe(false)
    const b = derive({ ...fromPreset('p71-500'), omega: -20 })
    expect(b.negativeSpeedWarning).toBe(true)
    expect(b.op.omega).toBe(0)
  })
  it('display slow-down is a 1-2-5 number independent of the load', () => {
    expect(niceAbove(152.8)).toBe(200)
    expect(niceAbove(200)).toBe(200)
    const a = derive(fromPreset('ex71b')), c = derive(fromPreset('ex71c'))
    expect(slowDown(a.c, 0.5)).toBe(slowDown(c.c, 0.5))
    expect(slowDown(a.c, 0.5)).toBe(200)
    expect(slowDown({ ...a.c, omegaNl: 1 }, 1)).toBe(1)
  })
})
