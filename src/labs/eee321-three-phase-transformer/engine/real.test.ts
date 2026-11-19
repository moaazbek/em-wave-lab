import { describe, expect, it } from 'vitest'
import { C, abs, add, c, mul, sub } from '../../../physics/complex'
import {
  Circuit, Connection, NETLISTS, Rating, Sequence, argDeg, bases, circuitFrom, circuitFromTests, openCircuitTest, ratingFromBank, ratingFromUnit,
  readingProblem, realParams, shortCircuitTest, solve, sweepLoad, toOneTransformer, wrapDeg,
} from './index'

/** Relative tolerance 1e-5 for the brief's printed values (the problem data have 3–4 digits). */
function near(actual: number, expected: number, rel = 1e-5) {
  if (expected === 0) expect(Math.abs(actual)).toBeLessThan(1e-9)
  else expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(rel)
}
const nearDeg = (actual: number, expected: number, tol = 1e-4) => expect(Math.abs(wrapDeg(actual - expected))).toBeLessThan(tol)

const run = (conn: Connection, rating: Rating, circuit: Circuit, frac: number, pf: number, lagging: boolean, hold: 'sec' | 'pri' = 'sec', seq: Sequence = 'abc') =>
  solve({ netlist: NETLISTS[conn], VLL: rating.VLL, a: rating.a, S3: frac * rating.S, pf, lagging, seq, f: 60, real: realParams(rating, circuit, hold) })

describe('Chapman Example 2-9: 50 kVA, 13 800/208 V Δ–Y, 0.01 + j0.07 pu', () => {
  const R = ratingFromBank(NETLISTS.DY, 50e3, 13800, 208)
  const b = bases(R)
  const C9 = circuitFrom({ Req: 0.01, Xeq: 0.07, RC: null, XM: null }, 'pu', R)
  const s = run('DY', R, C9, 1, 0.8, true)
  it('bases and impedance', () => {
    near(b.ZbaseP, 11426.4)
    near(C9.P.Req, 114.264); near(C9.P.Xeq, 799.848)
    near(b.IphiBaseP, 1.20773)
  })
  it('V_φP, V_P in per-unit and VR', () => {
    near(abs(s.real!.VphiP), 14506.4); nearDeg(argDeg(s.real!.VphiP), 2.7263)
    near(abs(s.real!.VphiP) / R.VphiP, 1.05119)
    near(s.real!.VR, 5.11898)
  })
  it('shift readout = connection shift − δ', () => {
    nearDeg(s.shiftDeg, -30 - s.real!.deltaDeg, 1e-9)
    nearDeg(s.real!.deltaDeg, 2.7263)
  })
})

describe('Problem 2-10: 500 kVA bank, 34.5/11 kV — unit ratings', () => {
  it('all four connections', () => {
    const cases: [Connection, number, number, number][] = [['YY', 19918.6, 6350.85, 3.13636], ['YD', 19918.6, 11000, 1.81078], ['DY', 34500, 6350.85, 5.43234], ['DD', 34500, 11000, 3.13636]]
    for (const [conn, VP, VS, a] of cases) {
      const r = ratingFromBank(NETLISTS[conn], 500e3, 34.5e3, 11e3)
      near(r.Sphi, 166666.7); near(r.VphiP, VP); near(r.VphiS, VS); near(r.a, a)
      // and back: from the unit rating to the bank rating
      const u = ratingFromUnit(NETLISTS[conn], r.Sphi, r.VphiP, r.VphiS)
      near(u.S, 500e3, 1e-12); near(u.VLL, 34.5e3, 1e-12); near(u.Vll, 11e3, 1e-12)
    }
  })
})

describe('Problem 2-11: 100 MVA, 230/115 kV Δ–Y, 80 MVA at 0.8 lagging', () => {
  const R = ratingFromBank(NETLISTS.DY, 100e6, 230e3, 115e3)
  const b = bases(R)
  const C11 = circuitFrom({ Req: 0.015, Xeq: 0.06, RC: 100, XM: 20 }, 'pu', R)
  const s = run('DY', R, C11, 0.8, 0.8, true)
  it('currents, bases, LV ohms', () => {
    near(s.sec.IL, 401.635); near(b.ILbaseS, 502.044)
    near(b.ZbaseS, 132.25)
    near(C11.S.Req, 1.98375); near(C11.S.Xeq, 7.935); near(C11.S.RC!, 13225); near(C11.S.XM!, 2645)
  })
  it('V_P, VR, losses, efficiency', () => {
    near(abs(s.real!.VphiP) / R.VphiP, 1.03887); nearDeg(argDeg(s.real!.VphiP), 1.7210)
    near(s.real!.VR, 3.88686)
    near(s.real!.Pcu, 0.96e6); near(s.real!.Pcore, 1.07925e6); near(s.real!.Pout, 64e6); near(s.real!.eta, 96.9121)
  })
})

describe('Problem 2-12: three 20 kVA, 24 000/277 V, Δ–Y, OC + SC tests', () => {
  const R = ratingFromUnit(NETLISTS.DY, 20e3, 24000, 277)
  const b = bases(R)
  const t = circuitFromTests(NETLISTS.DY, R, { side: 'S', form: 'bank', reading: { V: 480, I: 4.1, P: 945 } }, { side: 'P', form: 'bank', reading: { V: 1400, I: 1.8, P: 912 } })
  if (!t.ok) throw new Error(t.reason)
  const { oc, sc, circuit } = t.value
  it('OC test on the LV (Y) side', () => {
    near(oc!.perPhase.V, 277.128); near(oc!.perPhase.I, 4.1); near(oc!.perPhase.P, 315)
    near(oc!.result.Ymag, 0.0147946); near((oc!.result.theta * 180) / Math.PI, 73.9048)
    near(oc!.result.GC, 0.00410156); near(oc!.result.BM, 0.0142147)
    near(circuit.S.RC!, 243.810); near(circuit.S.XM!, 70.3498)
    near(circuit.pu.RC!, 63.5508); near(circuit.pu.XM!, 18.3372)
  })
  it('SC test on the HV (Δ) side', () => {
    near(sc!.perPhase.V, 1400); near(sc!.perPhase.I, 1.03923); near(sc!.perPhase.P, 304)
    near(sc!.result.Zmag, 1347.15); near((sc!.result.theta * 180) / Math.PI, 77.9394)
    near(circuit.P.Req, 281.481); near(circuit.P.Xeq, 1317.42)
    near(circuit.pu.Req, 0.00977366); near(circuit.pu.Xeq, 0.0457436)
    near(b.ZbaseP, 28800); near(b.ZbaseS, 3.83645)
  })
  it('0.9 lagging', () => {
    const s = run('DY', R, circuit, 1, 0.9, true)
    near(abs(s.real!.VPa), 285.143); nearDeg(argDeg(s.real!.VPa), 2.0548); near(abs(s.real!.VPa) / R.VphiS, 1.02940)
    near(s.real!.VR, 2.93974); near(s.real!.Pout, 54e3); near(s.real!.Pcu, 586.42); near(s.real!.Pcore, 1000.45); near(s.real!.eta, 97.1452)
    near(s.pri.VLLmag, 24705.5)
  })
  it('unity PF, 0.9 leading, half load', () => {
    const u = run('DY', R, circuit, 1, 1, true)
    near(u.real!.VR, 1.08092); near(u.real!.eta, 97.4800)
    const l = run('DY', R, circuit, 1, 0.9, false)
    near(l.real!.VR, -1.00999); near(l.real!.eta, 97.2770)
    const h = run('DY', R, circuit, 0.5, 0.9, true)
    near(h.real!.Pcu, 146.605); near(h.real!.Pcore, 971.773); near(h.real!.eta, 96.0226)
  })
})

describe('Problem 2-13: Y–Δ, three 100 kVA, 8314/480 V, SC test on one transformer', () => {
  const R = ratingFromUnit(NETLISTS.YD, 100e3, 8314, 480)
  const t = circuitFromTests(NETLISTS.YD, R, null, { side: 'P', form: 'unit', reading: { V: 510, I: 12.6, P: 3000 } })
  if (!t.ok) throw new Error(t.reason)
  const { sc, circuit } = t.value
  it('SC test and per-unit', () => {
    near(sc!.result.Zmag, 40.4762); near((sc!.result.theta * 180) / Math.PI, 62.1698)
    near(circuit.P.Req, 18.8964); near(circuit.P.Xeq, 35.7945)
    near(bases(R).ZbaseP, 691.226); near(circuit.pu.Req, 0.0273376); near(circuit.pu.Xeq, 0.0517841)
    expect(circuit.YeS).toBeNull()
  })
  it('rated load, 0.8 lagging, secondary at rated voltage', () => {
    const s = run('YD', R, circuit, 1, 0.8, true)
    near(s.pri.Ip, 12.0279)
    near(abs(s.real!.VphiP), 8756.62); nearDeg(argDeg(s.real!.VphiP), 1.3615)
    near(s.pri.VLLmag, 15166.9); near(s.real!.VR, 5.32378)
    expect(s.real!.Pcore).toBe(0)
  })
  it('primary at rated voltage (solved from Eq. 2-64)', () => {
    const s = run('YD', R, circuit, 1, 0.8, true, 'pri')
    near(abs(s.real!.VphiP), 8314, 1e-12)
    near(abs(s.real!.VphiS), 454.438); near(s.real!.VR, 5.62492)
  })
})

describe('midterm-style bank: three 10 MVA, 33/11 kV units, Δ–Y, 0.002 + j0.083 pu, shunt neglected', () => {
  const R = ratingFromUnit(NETLISTS.DY, 10e6, 33e3, 11e3)
  const Cm = circuitFrom({ Req: 0.002, Xeq: 0.083, RC: null, XM: null }, 'pu', R)
  const s = run('DY', R, Cm, 1, 0.9, true)
  it('values', () => {
    near(R.VLL, 33e3); near(R.Vll, 19052.6)
    near(bases(R).ZbaseS, 12.1); near(Cm.S.Req, 0.0242); near(Cm.S.Xeq, 1.0043)
    near(abs(s.real!.VphiP) / R.VphiP, 1.04060); nearDeg(argDeg(s.real!.VphiP), 4.0684)
    near(s.real!.VR, 4.06011)
    near(s.real!.Pout, 27e6); near(s.real!.Pcu, 60e3); near(s.real!.eta, 99.7783)
    near(s.sec.IL, 909.091); near(s.pri.Ip, 303.030); near(s.pri.IL, 524.864)
  })
})

describe('test-data validation', () => {
  it('a wattmeter reading above V·I is refused', () => {
    expect(readingProblem({ V: 100, I: 1, P: 101 })).toMatch(/cannot exceed/)
    const R = ratingFromUnit(NETLISTS.YY, 10e3, 1000, 100)
    const t = circuitFromTests(NETLISTS.YY, R, { side: 'S', form: 'unit', reading: { V: 100, I: 1, P: 120 } }, null)
    expect(t.ok).toBe(false)
    if (!t.ok) expect(t.test).toBe('OC')
  })
  it('sweep helper: VR and η against load', () => {
    const R = ratingFromUnit(NETLISTS.DY, 10e6, 33e3, 11e3)
    const Cm = circuitFrom({ Req: 0.002, Xeq: 0.083, RC: null, XM: null }, 'pu', R)
    const pts = sweepLoad({ netlist: NETLISTS.DY, VLL: R.VLL, a: R.a, S3: 0, pf: 0.9, lagging: true, seq: 'abc', f: 50, real: realParams(R, Cm, 'sec') }, R.S, [0, 0.5, 1, 1.25])
    expect(pts[0].VR).toBe(0)
    near(pts[2].VR, 4.06011)
    expect(pts[3].VR).toBeGreaterThan(pts[2].VR)
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

describe('invariants on 2000 random real banks', () => {
  it('power balance, side, data form, connection, ideal limit, KCL and KVL', () => {
    const rnd = mulberry32(2064)
    const logU = (lo: number, hi: number) => Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo)))
    const conns: Connection[] = ['YY', 'YD', 'DY', 'DD']
    const rel = (x: number, y: number, scale: number) => expect(Math.abs(x - y) / scale).toBeLessThan(1e-9)
    let pri = 0
    for (let k = 0; k < 2000; k++) {
      const conn = conns[k % 4]
      const n = NETLISTS[conn]
      const seq: Sequence = rnd() < 0.5 ? 'abc' : 'acb'
      const R = ratingFromUnit(n, logU(1e3, 1e8), logU(200, 400e3), logU(100, 50e3))
      // random per-transformer values: series 0.001–0.15 pu, shunt present or not
      const puR = logU(1e-3, 0.05), puX = logU(5e-3, 0.15)
      const shunt = rnd() < 0.7
      const pu = { Req: puR, Xeq: puX, RC: shunt ? logU(20, 1000) : null, XM: shunt ? logU(5, 200) : null }
      const frac = rnd() * 1.25, pf = rnd(), lagging = rnd() < 0.5
      const hold: 'sec' | 'pri' = rnd() < 0.3 ? 'pri' : 'sec'
      if (hold === 'pri') pri++
      const cPu = circuitFrom(pu, 'pu', R)
      const s = run(conn, R, cPu, frac, pf, lagging, hold, seq)
      const r = s.real!
      const Ss = Math.max(abs(r.Sin), 1e-30)
      // 1. power balance at the primary terminals, computed independently
      rel(r.Sin.re, r.Pout + r.Pcu + r.Pcore, Ss)
      rel(r.Sin.im, r.Qout + r.Qwind + r.Qcore, Ss)
      rel(s.pri.Sline.re, r.Sin.re, Ss); rel(s.pri.Sline.im, r.Sin.im, Ss)
      // 2. the side does not matter: the same circuit given in HV ohms, LV ohms or per-unit
      for (const [vals, side] of [[cPu.P, 'P'], [cPu.S, 'S']] as const) {
        const t = run(conn, R, circuitFrom(vals, side, R), frac, pf, lagging, hold, seq).real!
        rel(t.VR, r.VR, Math.max(1, Math.abs(r.VR))); rel(t.eta, r.eta, 100); rel(t.Pcu, r.Pcu, Ss); rel(t.Pcore, r.Pcore, Ss)
      }
      // 3. the data form does not matter: bank line readings, or the same readings converted by hand
      const side: 'P' | 'S' = rnd() < 0.5 ? 'P' : 'S'
      const star = (side === 'P' ? n.primary : n.secondary).some((x) => x.other === 'N' || x.other === 'n')
      const unitOC = { V: logU(10, 1e5), I: logU(0.01, 100), P: 0 }; unitOC.P = rnd() * unitOC.V * unitOC.I
      const unitSC = { V: logU(10, 1e4), I: logU(0.01, 1000), P: 0 }; unitSC.P = rnd() * unitSC.V * unitSC.I
      const bank = (u: typeof unitOC) => (star ? { V: u.V * Math.sqrt(3), I: u.I, P: 3 * u.P } : { V: u.V, I: u.I * Math.sqrt(3), P: 3 * u.P })
      const A = circuitFromTests(n, R, { side, form: 'bank', reading: bank(unitOC) }, { side, form: 'bank', reading: bank(unitSC) })
      const B = circuitFromTests(n, R, { side, form: 'unit', reading: unitOC }, { side, form: 'unit', reading: unitSC })
      if (!A.ok || !B.ok) throw new Error('readings refused')
      for (const key of ['Req', 'Xeq', 'RC', 'XM'] as const) {
        const x = A.value.circuit.S[key]!, y = B.value.circuit.S[key]!
        if (Number.isFinite(y)) rel(x, y, Math.abs(y)); else expect(Number.isFinite(x)).toBe(false)
      }
      expect(toOneTransformer(bank(unitOC), 'bank', star).V / unitOC.V).toBeCloseTo(1, 12)
      // 4. the connection does not matter for VR and η (same unit ratings, same per-unit values)
      const other = conns[(k + 1 + Math.floor(rnd() * 3)) % 4]
      const R2 = ratingFromUnit(NETLISTS[other], R.Sphi, R.VphiP, R.VphiS)
      const t2 = run(other, R2, circuitFrom(pu, 'pu', R2), frac, pf, lagging, hold, seq).real!
      rel(t2.VR, r.VR, Math.max(1, Math.abs(r.VR))); rel(t2.eta, r.eta, 100)
      // 5. the ideal limit: every phasor equals the ideal engine's
      const z = circuitFrom({ Req: 0, Xeq: 0, RC: null, XM: null }, 'S', R)
      const re = run(conn, R, z, frac, pf, lagging, 'sec', seq)
      const id = solve({ netlist: n, VLL: R.VLL, a: R.a, S3: frac * R.S, pf, lagging, seq, f: 60 })
      expect(Math.abs(re.real!.VR)).toBeLessThan(1e-9)
      if (frac > 0) rel(re.real!.eta, 100, 100)
      const close = (x: C, y: C, sc: number) => expect(abs(sub(x, y)) / sc).toBeLessThan(1e-9)
      for (let j = 0; j < 3; j++) {
        close(re.pri.Vll[j], id.pri.Vll[j], R.VLL); close(re.sec.Vll[j], id.sec.Vll[j], R.Vll)
        close(re.pri.Vw[j], id.pri.Vw[j], R.VphiP); close(re.sec.Vw[j], id.sec.Vw[j], R.VphiS)
        if (frac > 0) {
          close(re.pri.Iline[j], id.pri.Iline[j], id.pri.IL); close(re.sec.Iline[j], id.sec.Iline[j], id.sec.IL)
          close(re.pri.Iw[j], id.pri.Iw[j], id.pri.Ip); close(re.sec.Iw[j], id.sec.Iw[j], id.sec.Ip)
        }
      }
      // 6. KCL and KVL in the real bank
      for (const sd of [s.pri, s.sec]) {
        if (!sd.star) expect(abs(sd.deltaLoopV) / sd.Vp).toBeLessThan(1e-9)
        if (sd.IL > 0) {
          expect(abs(sd.Iline.reduce((x, y) => add(x, y), c(0))) / sd.IL).toBeLessThan(1e-9)
          expect(abs(sd.Ineutral) / sd.IL).toBeLessThan(1e-9)
        }
      }
      for (const [ws, I, Iw, nodes] of [[n.primary, s.pri.Iline, s.pri.Iw, ['A', 'B', 'C']], [n.secondary, s.sec.Iline, s.sec.Iw, ['a', 'b', 'c']]] as const) {
        nodes.forEach((x, j) => {
          const sum = ws.reduce((acc, wd, q) => add(acc, mul(Iw[q], c((wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0)))), c(0))
          if (abs(I[j]) > 0) expect(abs(sub(sum, I[j])) / abs(I[j])).toBeLessThan(1e-9)
        })
      }
      // the shift readout is the connection shift minus δ
      const conShift = conn === 'YY' || conn === 'DD' ? 0 : seq === 'abc' ? -30 : 30
      nearDeg(s.shiftDeg, conShift - r.deltaDeg, 1e-9)
    }
    expect(pri).toBeGreaterThan(400)
  })
})

describe('OC / SC formulas', () => {
  it('Y_E and Z_SE angles', () => {
    const o = openCircuitTest({ V: 100, I: 2, P: 100 })
    near(o.Ymag, 0.02, 1e-12); near((o.theta * 180) / Math.PI, 60, 1e-12)
    const z = shortCircuitTest({ V: 10, I: 2, P: 10 })
    near(z.Req, 2.5, 1e-12); near(z.Xeq, 2.5 * Math.sqrt(3), 1e-12)
  })
})
