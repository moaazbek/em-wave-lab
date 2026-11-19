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

describe('real-bank presets through the lab state', () => {
  const near = (x: number, y: number, rel = 1e-5) => expect(Math.abs(x - y) / Math.abs(y)).toBeLessThan(rel)
  it('round-trip through the URL, with the view switches', () => {
    for (const p of PRESETS.filter((x) => x.values.model === 'real')) {
      const s = { ...fromPreset(p.id), refSide: 'S' as const, hero: 'circuit' as const, gain: 5 as const }
      expect(decodeState(encodeState(s))).toEqual(s)
      expect(isCustomized(s)).toBe(false)
    }
  })
  it('every preset gives the book / brief values', () => {
    const vr = (id: Parameters<typeof fromPreset>[0]) => derive(fromPreset(id)).sol.real!
    near(vr('r29').VR, 5.11898)
    near(vr('r211').VR, 3.88686); near(vr('r211').eta, 96.9121)
    near(vr('r212').VR, 2.93974); near(vr('r212').eta, 97.1452); near(derive(fromPreset('r212')).sol.pri.VLLmag, 24705.5)
    near(vr('r213').VR, 5.32378); near(derive(fromPreset('r213')).sol.pri.VLLmag, 15166.9)
    near(vr('rmid').VR, 4.06011); near(vr('rmid').eta, 99.7783)
    const m10 = derive(fromPreset('r210'))
    near(m10.real!.rating.a, 3.13636); expect(Math.abs(m10.sol.real!.VR)).toBeLessThan(1e-12)
    const pri = derive({ ...fromPreset('r213'), hold: 'pri' })
    near(pri.sol.real!.VR, 5.62492)
  })
  it('a wattmeter reading above V·I is refused and nothing real is computed', () => {
    const m = derive({ ...fromPreset('r212'), scP: 5000 })
    expect(m.real!.error?.where).toBe('SC')
    expect(m.sol.real).toBeUndefined()
  })
})
