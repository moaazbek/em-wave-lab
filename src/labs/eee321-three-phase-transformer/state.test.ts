import { describe, expect, it } from 'vitest'
import { derive } from './derive'
import { DEFAULT_STATE, PRESETS, decodeState, encodeState, fromPreset, isCustomized } from './state'

describe('three-phase transformer lab state', () => {
  it('round-trips every preset through the URL at full precision', () => {
    for (const p of PRESETS) {
      const s = { ...fromPreset(p.id), harmonic: true, h: 0.3, overlay: true, rotate: false }
      const back = decodeState(encodeState(s))
      expect(back).toEqual(s)
      expect(isCustomized(back)).toBe(false) // a = 13800·√3/208 survives exactly
    }
    expect(decodeState('')).toEqual(DEFAULT_STATE)
    expect(decodeState('c=XX&VLL=1e12').conn).toBe(DEFAULT_STATE.conn)
  })
  it('unit-rating mode derives a, V_LL and the rated load from the unit', () => {
    const m = derive(fromPreset('bank'))
    expect(m.a).toBe(3)
    expect(m.VLL).toBe(33e3)
    expect(m.Srated).toBe(30e6)
    expect(m.sol.sec.VLLmag).toBeCloseTo(11e3 * Math.sqrt(3), 6)
  })
  it('view switches do not mark a preset as customized', () => {
    const s = fromPreset('yd')
    expect(isCustomized({ ...s, overlay: true, harmonic: true })).toBe(false)
    expect(isCustomized({ ...s, a: 11 })).toBe(true)
    expect(isCustomized({ ...s, seq: 'acb' })).toBe(true)
  })
})
