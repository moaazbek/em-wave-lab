import { describe, expect, it } from 'vitest'
import { abs, fromPreset, zProfile } from '../../physics'
import { derive, medium2Gain } from './derive'
import { DEFAULT_STATE } from './state'

describe('Medium 2 colour gain', () => {
  const sea = derive({ ...DEFAULT_STATE, m2: fromPreset('seawater'), f: 5e6, thetaDeg: 0 })
  it('amplifies only weak fields, with a 1-2-5 factor', () => {
    expect(medium2Gain(sea.sol, 'total', 'E', 'y')).toBe(50)
    expect(medium2Gain(sea.sol, 'total', 'H', 'x')).toBe(1) // H at a conductor surface is about 2 H_i0
    expect(medium2Gain(sea.sol, 'ref', 'E', 'y')).toBe(1)
    expect(medium2Gain(derive(DEFAULT_STATE).sol, 'total', 'E', 'y')).toBe(1)
    expect(medium2Gain(derive({ ...DEFAULT_STATE, m2: fromPreset('pec') }).sol, 'total', 'E', 'y')).toBe(1)
  })
  it('is display-only: the engine values stay true', () => {
    medium2Gain(sea.sol, 'total', 'E', 'y')
    // transmitted E at z = 0+ is tau E_i0 (about 1.7 % of E_i0), not 50 times that
    const e = zProfile(sea.sol, 'total', 'E', 'y', 0, 2)
    expect(abs(e)).toBeCloseTo(abs(sea.sol.tau), 15)
    expect(abs(e)).toBeLessThan(0.02)
  })
})
