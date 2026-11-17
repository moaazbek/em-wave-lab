import { describe, expect, it } from 'vitest'
import { C, abs, add, c, conj, mul, sub } from '../../../physics/complex'
import {
  Connection, FIG_2_37C_AS_PRINTED, NETLISTS, Params, Sequence, argDeg, atPhase, fromUnitRating, instantaneous,
  instantaneousAtPhase, polar, ratioFormula, solve, wrapDeg,
} from './index'

const R3 = Math.sqrt(3)
/** Relative tolerance 1e-9 (exact zero compared exactly). */
function near(actual: number, expected: number, rel = 1e-9) {
  if (expected === 0) expect(Math.abs(actual)).toBeLessThan(1e-9)
  else expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(rel)
}
/** Angles to 1e-9 degrees. */
const nearDeg = (actual: number, expected: number) => expect(Math.abs(wrapDeg(actual - expected))).toBeLessThan(1e-9)
/** The rounded reference value printed in the brief, to its own digits. */
const digits = (x: number, printed: string) => {
  const d = printed.includes('.') ? printed.split('.')[1].length : 0
  expect(x.toFixed(d)).toBe(printed)
}
const nearC = (z: C, w: C, scale: number) => expect(abs(sub(z, w)) / scale).toBeLessThan(1e-9)

const base = (conn: Connection, over: Partial<Params>): Params => ({
  netlist: NETLISTS[conn], VLL: 1000, a: 1, S3: 0, pf: 1, lagging: true, seq: 'abc', f: 60, ...over,
})

describe('complex helpers', () => {
  it('polar, arg and wrap', () => {
    nearC(polar(2, 90), c(0, 2), 2)
    nearDeg(argDeg(polar(1, -36.86989764584402)), -36.86989764584402)
    expect(wrapDeg(190)).toBe(-170)
    expect(wrapDeg(-180)).toBe(180)
    near(atPhase(c(1, 0), 0), Math.SQRT2)
    near(abs(mul(c(3, 4), conj(c(3, 4)))), 25)
  })
})

describe('T1 Chapman Example 2-9 ratings (Δ–Y)', () => {
  const a = 13800 / (208 / R3)
  const s = solve(base('DY', { VLL: 13800, a, S3: 50e3, pf: 0.8, lagging: true }))
  it('voltages', () => {
    digits(a, '114.9149')
    near(s.sec.VLLmag, 208)
    near(s.sec.Vp, 208 / R3)
    digits(s.sec.Vp, '120.089')
    near(s.ratio, a / R3)
  })
  it('currents', () => {
    near(s.pri.IL, 50e3 / (R3 * 13800)); digits(s.pri.IL, '2.09185')
    near(s.pri.Ip, 50e3 / (3 * 13800)); digits(s.pri.Ip, '1.20773')
    near(s.sec.IL, 50e3 / (R3 * 208)); digits(s.sec.IL, '138.786')
    near(s.sec.Ip, s.sec.IL)
  })
  it('phasors and shift', () => {
    nearDeg(s.shiftDeg, -30)
    near(s.pri.VLLmag, 13800); nearDeg(argDeg(s.pri.Vll[0]), 30)
    near(s.sec.VLLmag, 208); nearDeg(argDeg(s.sec.Vll[0]), 0)
    const th = (Math.acos(0.8) * 180) / Math.PI
    digits(th, '36.8699')
    nearDeg(argDeg(s.pri.Iline[0]), -th)
    nearDeg(argDeg(s.sec.Iline[0]), -30 - th)
    digits(-30 - th, '-66.8699')
  })
  it('power on both sides', () => {
    nearC(s.pri.Sline, c(40000, 30000), 50e3)
    nearC(s.sec.Sline, c(40000, 30000), 50e3)
    nearC(s.Sload, c(40000, 30000), 50e3)
  })
})

describe('T2 bank of three 10 MVA, 33 kV / 11 kV units, Δ–Y', () => {
  const u = fromUnitRating(NETLISTS.DY, 33e3, 11e3, 10e6)
  const s = solve(base('DY', { VLL: u.VLL, a: u.a, S3: u.Srated, pf: 0.9, lagging: true }))
  it('ratings and currents', () => {
    expect(u.a).toBe(3)
    expect(u.VLL).toBe(33e3)
    expect(u.Srated).toBe(30e6)
    near(s.sec.VLLmag, 11e3 * R3); digits(s.sec.VLLmag, '19052.6')
    near(s.pri.IL, 30e6 / (R3 * 33e3)); digits(s.pri.IL, '524.864')
    near(s.pri.Ip, 30e6 / (3 * 33e3)); digits(s.pri.Ip, '303.030')
    near(s.sec.IL, 30e6 / (3 * 11e3)); digits(s.sec.IL, '909.091')
    near(s.sec.Ip, s.sec.IL)
    nearDeg(s.shiftDeg, -30)
  })
  it('a Y primary bank uses √3 times the unit voltage', () => {
    expect(fromUnitRating(NETLISTS.YD, 10e3, 1e3, 1e6).VLL).toBeCloseTo(10e3 * R3, 9)
  })
})

describe('T3 Y–Δ, 13.8 kV, a = 10, 1 MVA, PF 0.8 lagging', () => {
  const p = base('YD', { VLL: 13800, a: 10, S3: 1e6, pf: 0.8, lagging: true })
  const s = solve(p)
  it('abc', () => {
    near(s.pri.VLNmag, 13800 / R3); digits(s.pri.VLNmag, '7967.43')
    near(s.sec.VLLmag, 13800 / R3 / 10); digits(s.sec.VLLmag, '796.743')
    near(s.pri.IL, 1e6 / (R3 * 13800)); digits(s.pri.IL, '41.8370')
    near(s.pri.Ip, s.pri.IL)
    near(s.sec.IL, 1e6 / (R3 * 13800 / R3 / 10)); digits(s.sec.IL, '724.638')
    near(s.sec.Ip, s.sec.IL / R3); digits(s.sec.Ip, '418.370')
    nearDeg(s.shiftDeg, -30)
  })
  it('T3b acb: +30°, V_AB = 13 800∠-30°', () => {
    const b = solve({ ...p, seq: 'acb' })
    nearDeg(b.shiftDeg, 30)
    near(b.pri.VLLmag, 13800)
    nearDeg(argDeg(b.pri.Vll[0]), -30)
  })
})

describe('T4 Y–Y 480 V, a = 2, 30 kVA, PF 1', () => {
  const s = solve(base('YY', { VLL: 480, a: 2, S3: 30e3, pf: 1 }))
  it('values', () => {
    near(s.sec.VLLmag, 240)
    near(s.pri.IL, 30e3 / (R3 * 480)); digits(s.pri.IL, '36.0844')
    near(s.sec.IL, 30e3 / (R3 * 240)); digits(s.sec.IL, '72.1688')
    nearDeg(s.shiftDeg, 0)
  })
})

describe('T5 Δ–Δ 4160 V / 480 V, 500 kVA, PF 0.85 leading', () => {
  const s = solve(base('DD', { VLL: 4160, a: 4160 / 480, S3: 500e3, pf: 0.85, lagging: false }))
  it('values', () => {
    near(s.sec.VLLmag, 480)
    near(s.pri.IL, 500e3 / (R3 * 4160)); digits(s.pri.IL, '69.3931')
    near(s.pri.Ip, 500e3 / (3 * 4160)); digits(s.pri.Ip, '40.0641')
    near(s.sec.IL, 500e3 / (R3 * 480)); digits(s.sec.IL, '601.407')
    near(s.sec.Ip, 500e3 / (3 * 480)); digits(s.sec.Ip, '347.222')
    nearDeg(s.shiftDeg, 0)
    const th = (Math.acos(0.85) * 180) / Math.PI
    nearDeg(argDeg(s.pri.Iline[0]), th)
    digits(th, '31.7883')
  })
})

describe('T6 Fig. 2-37c as printed gives a 30° LEAD with abc', () => {
  it('shift +30°, V_ab = 208∠60°', () => {
    const s = solve({ ...base('DY', { VLL: 13800, a: 13800 / (208 / R3), S3: 50e3, pf: 0.8 }), netlist: FIG_2_37C_AS_PRINTED })
    nearDeg(s.shiftDeg, 30)
    near(s.sec.VLLmag, 208)
    nearDeg(argDeg(s.sec.Vll[0]), 60)
  })
})

describe('T7 course Δ–Y with acb', () => {
  it('shift +30°', () => {
    nearDeg(solve(base('DY', { VLL: 13800, a: 13800 / (208 / R3), S3: 50e3, pf: 0.8, seq: 'acb' })).shiftDeg, 30)
  })
})

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('invariants on 2000 random cases', () => {
  it('power, KVL, KCL, ratio, shift, third harmonic', () => {
    const rnd = mulberry32(2010)
    const logU = (lo: number, hi: number) => Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo)))
    const conns: Connection[] = ['YY', 'YD', 'DY', 'DD']
    for (let n = 0; n < 2000; n++) {
      const conn = conns[n % 4]
      const seq: Sequence = rnd() < 0.5 ? 'abc' : 'acb'
      const p = base(conn, { VLL: logU(100, 765e3), a: logU(0.05, 200), S3: logU(1, 1e9), pf: rnd(), lagging: rnd() < 0.5, seq, f: rnd() < 0.5 ? 50 : 60 })
      const s = solve(p)
      const Ss = abs(s.Sload)
      // 1. power conservation: windings and lines on both sides equal the load
      for (const S of [s.pri.Swind, s.sec.Swind, s.pri.Sline, s.sec.Sline]) expect(abs(sub(S, s.Sload)) / Ss).toBeLessThan(1e-9)
      // 2. KVL around every delta
      for (const side of [s.pri, s.sec]) if (!side.star) expect(abs(side.deltaLoopV) / side.Vp).toBeLessThan(1e-9)
      // 3. KCL: line currents sum to zero; at every node of each side
      for (const side of [s.pri, s.sec]) {
        expect(abs(side.Iline.reduce((a, b) => add(a, b), c(0))) / side.IL).toBeLessThan(1e-9)
        expect(abs(side.Ineutral) / side.IL).toBeLessThan(1e-9)
      }
      for (const [ws, I, Iw, nodes] of [
        [p.netlist.primary, s.pri.Iline, s.pri.Iw, ['A', 'B', 'C']],
        [p.netlist.secondary, s.sec.Iline, s.sec.Iw, ['a', 'b', 'c']],
      ] as const) {
        nodes.forEach((x, j) => {
          const sum = ws.reduce((acc, wd, k) => add(acc, mul(Iw[k], c((wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0)))), c(0))
          expect(abs(sub(sum, I[j])) / abs(I[j])).toBeLessThan(1e-9)
        })
      }
      // 4. ratio formula (2-88)…(2-91)
      near(s.ratio, ratioFormula(p.netlist).factor * p.a)
      // 5. shift
      const expected = conn === 'YY' || conn === 'DD' ? 0 : seq === 'abc' ? -30 : 30
      nearDeg(s.shiftDeg, expected)
      // 6. third harmonic absent from every line-to-line voltage, present in each phase voltage
      const t = rnd() / p.f
      const h = rnd() * 0.5
      const ins = instantaneous(s, t, h)
      for (const v of ins.harmonic.lineLineThird) expect(Math.abs(v) / (Math.SQRT2 * s.pri.VLNmag)).toBeLessThan(1e-9)
      expect(Math.abs(ins.harmonic.third[0] - ins.harmonic.third[1]) / (Math.SQRT2 * s.pri.VLNmag + 1)).toBeLessThan(1e-9)
      expect(Math.abs(ins.harmonic.deltaThirdSum - 3 * ins.harmonic.third[0]) / (Math.SQRT2 * s.pri.VLNmag + 1)).toBeLessThan(1e-9)
    }
  })
})

describe('time domain', () => {
  it('the instantaneous values are √2 Re[V e^{jωt}]', () => {
    const s = solve(base('YD', { VLL: 13800, a: 10, S3: 1e6, pf: 0.8 }))
    const ins = instantaneousAtPhase(s, 0.7)
    near(ins.pri.Vll[0], Math.SQRT2 * (s.pri.Vll[0].re * Math.cos(0.7) - s.pri.Vll[0].im * Math.sin(0.7)))
    near(ins.sec.Iline[1], atPhase(s.sec.Iline[1], 0.7))
    // the 30° lag is T/12 in time: v_ab(t) scaled equals v_AB(t - T/12)
    const T = 1 / 60
    for (const t of [0.001, 0.0043, 0.011]) {
      const a = instantaneous(s, t).sec.Vll[0] * s.ratio
      const b = instantaneous(s, t - T / 12).pri.Vll[0]
      expect(Math.abs(a - b) / (Math.SQRT2 * 13800)).toBeLessThan(1e-9)
    }
  })
  it('no load gives zero currents', () => {
    const s = solve(base('DD', { VLL: 4160, a: 8, S3: 0 }))
    for (const i of [...s.pri.Iline, ...s.sec.Iw]) expect(abs(i)).toBe(0)
  })
})
