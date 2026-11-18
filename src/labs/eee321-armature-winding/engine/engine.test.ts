import { describe, expect, it } from 'vitest'
import {
  MachineInputs, WindingSpec, WindingType, analyze, averageBrushVoltage, buildWinding, cleanAngle, cycleCount, drawRule, drawableCoilCounts,
  expectedCycles, fluxFor, fluxFromField, formula, fullPitch, nearestDrawable, parallelPaths, poleGeometry, randomExamWinding,
} from './index'

function near(actual: number, expected: number, rel = 1e-9) {
  if (expected === 0) expect(Math.abs(actual)).toBeLessThan(1e-12)
  else expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(rel)
}
const digits = (x: number, printed: string) => {
  const d = printed.includes('.') ? printed.split('.')[1].length : 0
  expect(x.toFixed(d)).toBe(printed)
}
const X = (over: Partial<MachineInputs> = {}): MachineInputs => ({ phi: 0.01, n: 1000, R: 0, Rper: 'turn', load: false, RL: 1000, ignoreRA: false, ...over })
const spec = (over: Partial<WindingSpec>): WindingSpec => ({ type: 'lap', m: 1, progressive: true, P: 4, C: 16, NC: 1, ...over })

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('formula part', () => {
  it('Example 7-3: duplex lap, P = 6, C = 72, N_C = 12, φ = 0.039 Wb, 400 r/min', () => {
    const f = formula(spec({ m: 2, P: 6, C: 72, NC: 12 }), X({ phi: 0.039, n: 400 }))
    expect(f.a).toBe(12)
    expect(f.Z).toBe(1728)
    near(f.Kp, 14.4)
    near(f.K, (1728 * 6) / (2 * Math.PI * 12)); digits(f.K, '137.510')
    near(f.omega, (2 * Math.PI * 400) / 60); digits(f.omega, '41.8879')
    near(f.EA, 224.64)
    near(f.K * 0.039 * f.omega, f.Kp * 0.039 * 400)
    near((f.Z / f.a) * f.econd, f.EA)
  })
  it('Example 7-4: simplex wave, P = 12, C = 144, N_C = 10, 0.011 Ω per turn', () => {
    const s = spec({ type: 'wave', P: 12, C: 144, NC: 10 })
    const f = formula(s, X({ phi: 0.05, n: 200, R: 0.011, Rper: 'turn', load: true, RL: 1000, ignoreRA: true }))
    expect(f.a).toBe(2)
    expect(f.Z).toBe(2880)
    near(f.Kp, 288)
    near(f.K, (2880 * 12) / (2 * Math.PI * 2)); digits(f.K, '2750.20')
    near(f.EA, 2880)
    near(f.RA, 3.96)
    near(f.IA, 2.88)
    near(f.tau, f.K * 0.05 * 2.88); digits(f.tau, '396.028')
    expect(f.ycInteger).toBe(false)
    digits(f.waveYc!.prog, '24.1667'); digits(f.waveYc!.retro, '23.8333')
    const b = buildWinding(s)
    expect(b.ok).toBe(false)
    if (!b.ok) expect(b.reason).toMatch(/Not realizable/)
    // with R_A included the current is a little smaller
    const g = formula(s, X({ phi: 0.05, n: 200, R: 0.011, Rper: 'turn', load: true, RL: 1000 }))
    near(g.IA, 2880 / (1000 + 3.96))
    near(g.VT, g.EA - g.IA * g.RA)
  })
  it('Problem 7-7: duplex lap, P = 8, C = 64, N_C = 10, 3600 r/min, 120 V', () => {
    const s = spec({ m: 2, P: 8, C: 64, NC: 10 })
    const phi = fluxFor(120, s, 3600)
    near(phi, 0.003125)
    const f = formula(s, X({ phi, n: 3600, R: 0.011, Rper: 'turn' }))
    expect(f.a).toBe(16)
    expect(f.Z).toBe(1280)
    near(f.Kp, 1280 * 8 / (60 * 16)); digits(f.Kp, '10.6667')
    near(f.EA, 120)
    expect(f.turnsPerPath).toBe(40)
    near(f.Rpath, 0.44)
    near(f.RA, 0.0275)
  })
  it('Problem 7-4: P = 8, I_A = 120 A, current per path', () => {
    expect(120 / parallelPaths('lap', 1, 8)).toBe(15)
    expect(120 / parallelPaths('lap', 2, 8)).toBe(7.5)
    expect(120 / parallelPaths('wave', 1, 8)).toBe(60)
  })
  it('Problem 7-5: P = 20', () => {
    expect(parallelPaths('lap', 1, 20)).toBe(20)
    expect(parallelPaths('wave', 2, 20)).toBe(4)
    expect(parallelPaths('lap', 3, 20)).toBe(60)
    expect(parallelPaths('wave', 4, 20)).toBe(8)
  })
  it('frog-leg: P = 4, m_lap = 1 gives a = 8', () => {
    expect(parallelPaths('frog', 1, 4)).toBe(8)
    expect(formula(spec({ type: 'frog', P: 4 }), X()).yc).toBeNull()
  })
  it('wave pitch: Eq. (7-27) for simplex, the general 2(C ± m)/P (beyond the course) for multiplex', () => {
    const f1 = formula(spec({ type: 'wave', P: 4, C: 9 }), X())
    expect(f1.yc).toBe(5); expect(f1.ycBeyondCourse).toBe(false)
    const f2 = formula(spec({ type: 'wave', m: 2, P: 4, C: 18 }), X())
    expect(f2.yc).toBe(10); expect(f2.ycBeyondCourse).toBe(true); expect(f2.a).toBe(4)
    expect(formula(spec({ type: 'wave', m: 2, P: 4, C: 20, progressive: false }), X()).yc).toBe(9)
    expect(formula(spec({ type: 'lap', m: 2 }), X()).ycBeyondCourse).toBe(false)
  })
  it('pitch factor', () => {
    near(formula(spec({ C: 16, P: 4, ys: 3 }), X()).p, 75)
    digits(formula(spec({ C: 9, P: 4, ys: 2 }), X()).p, '88.89')
    expect(fullPitch(9, 4)).toBe(2)
  })
  it('resistance per conductor, turn or coil gives the same R_A for consistent element values', () => {
    const s = spec({ m: 1, P: 4, C: 16, NC: 3 })
    const perCond = formula(s, X({ R: 0.01, Rper: 'conductor' })).RA
    near(formula(s, X({ R: 0.02, Rper: 'turn' })).RA, perCond)
    near(formula(s, X({ R: 0.06, Rper: 'coil' })).RA, perCond)
  })
})

describe('constructive part', () => {
  const build = (s: WindingSpec) => {
    const b = buildWinding(s)
    if (!b.ok) throw new Error(b.reason)
    return b.winding
  }
  const econd = 1
  it('simplex lap, P = 4, C = 16', () => {
    const w = build(spec({}))
    expect(w.yc).toBe(1)
    expect(cycleCount(w)).toBe(1)
    expect(w.brushAngles.length).toBe(4)
    const snap = analyze(w, 0.123, 0.9, econd)
    expect(snap.paths.length).toBe(4)
    for (const p of snap.paths) expect(p.coils.length).toBeGreaterThanOrEqual(3)
    expect(build(spec({ progressive: false })).yc).toBe(-1)
    // at an angle with no commutation every path has exactly C/a = 4 coils
    const clean = analyze(w, Math.PI / 16, 1, econd) // segment centres on the brushes: each brush touches one segment
    expect(clean.noCommutation).toBe(true)
    for (const p of clean.paths) expect(p.coils.length).toBe(4)
  })
  it('Example 7-2 / § 7.2 machine: simplex lap, P = 2, C = 4', () => {
    const w = build(spec({ P: 2, C: 4 }))
    const f = formula(w.spec, X())
    expect(f.Z).toBe(8)
    expect(w.yc).toBe(1)
    expect(analyze(w, 0.05, 1, econd).paths.length).toBe(2)
  })
  it('duplex lap, P = 6, C = 72 (not drawn, C > 48) and P = 6, C = 36', () => {
    const big = buildWinding(spec({ m: 2, P: 6, C: 72 }))
    expect(big.ok).toBe(false)
    if (!big.ok) expect(big.reason).toMatch(/C ≤ 48/)
    // the same winding type below the drawing limit
    const w = build(spec({ m: 2, P: 6, C: 36 }))
    expect(Math.abs(w.yc)).toBe(2)
    expect(cycleCount(w)).toBe(2)
    expect(analyze(w, 0.2, 0.9, econd).paths.length).toBe(12)
  })
  it('duplex lap, P = 6, C = 72 traced without the drawing limit', () => {
    // the tracing itself has no size limit; only the drawing does
    for (const progressive of [true, false]) {
      const b = buildWinding(spec({ m: 2, P: 6, C: 72, progressive }), Infinity)
      if (!b.ok) throw new Error(b.reason)
      expect(b.winding.yc).toBe(progressive ? 2 : -2)
      expect(cycleCount(b.winding)).toBe(2)
      for (const alpha of [0, 0.3, 1.1, 4.4]) expect(analyze(b.winding, alpha, 0.9, econd).paths.length).toBe(12)
    }
  })
  it('triplex lap, P = 4, C = 24', () => {
    const w = build(spec({ m: 3, P: 4, C: 24 }))
    expect(cycleCount(w)).toBe(3)
    expect(analyze(w, 0.4, 0.8, econd).paths.length).toBe(12)
  })
  it('simplex wave, P = 4, C = 9 (book Fig. 7-20)', () => {
    const w = build(spec({ type: 'wave', P: 4, C: 9 }))
    expect(w.yc).toBe(5)
    expect(build(spec({ type: 'wave', P: 4, C: 9, progressive: false })).yc).toBe(4)
    expect(cycleCount(w)).toBe(1)
    expect(analyze(w, 0.3, 0.9, econd).paths.length).toBe(2)
    expect(w.ys).toBe(2)
    digits(formula(w.spec, X()).p, '88.89')
  })
  it('simplex wave, P = 4, C = 21 and C = 10', () => {
    expect(build(spec({ type: 'wave', P: 4, C: 21 })).yc).toBe(11)
    expect(build(spec({ type: 'wave', P: 4, C: 21, progressive: false })).yc).toBe(10)
    for (const progressive of [true, false]) {
      const b = buildWinding(spec({ type: 'wave', P: 4, C: 10, progressive }))
      expect(b.ok).toBe(false)
      if (!b.ok) expect(b.reason).toMatch(/5\.5|4\.5/)
    }
  })
  it('multiplex lap needs two coils per path, so adjacent brushes never touch the same segment', () => {
    for (const s of [spec({ m: 2, P: 4, C: 8 }), spec({ m: 3, P: 6, C: 18 }), spec({ m: 2, P: 12, C: 24 })]) {
      const b = buildWinding(s)
      expect(b.ok).toBe(false)
      if (!b.ok) expect(b.reason).toMatch(/same segment/)
    }
    expect(buildWinding(spec({ m: 2, P: 4, C: 16 })).ok).toBe(true)
  })
  it('unsupported windings say why', () => {
    const fr = buildWinding(spec({ type: 'frog' }))
    expect(fr.ok).toBe(false)
    if (!fr.ok) expect(fr.reason).toMatch(/Frog-leg windings are shown as numbers only/)
    const w2 = buildWinding(spec({ type: 'wave', P: 2, C: 9 }))
    expect(w2.ok).toBe(false)
    if (!w2.ok) expect(w2.reason).toMatch(/P ≥ 4/)
  })
  it('polarity of brush 1 relative to brush 2 reverses for a retrogressive winding', () => {
    const alpha = 0.07
    const pr = analyze(build(spec({})), alpha, 0.9, econd)
    const re = analyze(build(spec({ progressive: false })), alpha, 0.9, econd)
    expect(Math.sign(pr.brushPotential[0] - pr.brushPotential[1])).toBe(-Math.sign(re.brushPotential[0] - re.brushPotential[1]))
    expect(pr.polarity[0]).toBe(-re.polarity[0])
  })
})

/** Random drawable configuration (lap m = 1–3, wave m = 1–3). `multiplexWave` = false keeps wave simplex. */
function randomValid(rnd: () => number, multiplexWave = true): WindingSpec {
  for (;;) {
    const lap = rnd() < 0.6
    const P = lap ? 2 * (1 + Math.floor(rnd() * 6)) : 2 * (2 + Math.floor(rnd() * 5))
    const m = lap || multiplexWave ? 1 + Math.floor(rnd() * 3) : 1
    const C = lap ? m * P * (1 + Math.floor(rnd() * 8)) : 2 * P + 1 + Math.floor(rnd() * (48 - 2 * P))
    const s: WindingSpec = { type: lap ? 'lap' : 'wave', m, progressive: rnd() < 0.5, P, C, NC: 1 + Math.floor(rnd() * 5) }
    const fp = fullPitch(C, P)
    s.ys = rnd() < 0.5 ? fp : Math.max(1, fp - Math.floor(rnd() * Math.min(3, fp)))
    if (buildWinding(s).ok) return s
  }
}

describe('invariants on 2000 random configurations', () => {
  it('path count, KVL, ideal path voltage', () => {
    const rnd = mulberry32(7022)
    let idealChecked = 0, wave = 0, lap = 0, multiWave = 0
    for (let t = 0; t < 2000; t++) {
      const s = randomValid(rnd)
      const b = buildWinding(s)
      if (!b.ok) throw new Error(b.reason)
      const w = b.winding
      const f = formula(w.spec, X({ phi: 0.001 + rnd(), n: 10 + rnd() * 3000 }))
      if (s.type === 'wave') wave++; else lap++
      expect(cycleCount(w)).toBe(expectedCycles(w))
      if (s.type === 'lap' || s.m === 1) expect(cycleCount(w)).toBe(s.type === 'lap' ? s.m : 1)
      else multiWave++
      const beta = 0.6 + 0.4 * rnd()
      const snap = analyze(w, rnd() * 2 * Math.PI, beta, f.econd)
      // 1. paths traced through the built winding = formula (lap mP, wave 2m)
      expect(snap.paths.length).toBe(f.a)
      // no segment is ever under two brushes (that would short a + brush to a − brush)
      const touched = snap.tapped.flat()
      expect(new Set(touched).size).toBe(touched.length)
      // every path really runs between brushes of opposite polarity, rising towards the + brush
      for (const p of snap.paths) {
        expect(snap.polarity[p.fromBrush]).toBe(-snap.polarity[p.toBrush] as 1 | -1)
        if (Math.abs(p.voltage) > 1e-9 * f.econd) expect(Math.sign(p.voltage)).toBe(snap.polarity[p.toBrush])
      }
      // 2. KVL around the winding
      const scale = Math.max(...snap.coilEmf.map(Math.abs), f.econd)
      expect(Math.abs(snap.kvlSum) / (scale * s.C)).toBeLessThan(1e-12)
      // 3. lap, full pitch, β = 1, no coil commutated: every path voltage = (Z/a) e_cond = K φ ω
      if (s.type === 'lap' && w.ys === s.C / s.P) {
        let snap1 = analyze(w, rnd() * 2 * Math.PI, 1, f.econd)
        for (let tries = 0; tries < 50 && !snap1.noCommutation; tries++) snap1 = analyze(w, rnd() * 2 * Math.PI, 1, f.econd)
        if (snap1.noCommutation) {
          idealChecked++
          for (const p of snap1.paths) near(Math.abs(p.voltage), (f.Z / f.a) * f.econd, 1e-12)
          near(Math.abs(snap1.brushVoltage), f.EA, 1e-12)
        }
      }
    }
    // the clean angle used for drawing really has no commutation, for every lap and simplex wave winding
    // (for some multiplex wave windings the two brushes never touch m segments at the same time)
    const rnd2 = mulberry32(5)
    for (let t = 0; t < 500; t++) {
      const b = buildWinding(randomValid(rnd2, false))
      if (!b.ok) throw new Error(b.reason)
      expect(analyze(b.winding, cleanAngle(b.winding), 0.8, 1).noCommutation).toBe(true)
    }
    expect(wave).toBeGreaterThan(300)
    expect(lap).toBeGreaterThan(300)
    expect(multiWave).toBeGreaterThan(150)
    expect(idealChecked).toBeGreaterThan(200)
  })
})

describe('drawable rules: drawableCoilCounts', () => {
  const POLES = [2, 4, 6, 8, 10, 12]
  it('lap: C a multiple of mP, C ≥ 2mP, C ≤ 48', () => {
    expect(drawableCoilCounts('lap', 1, 10, true)).toEqual([20, 30, 40])
    expect(drawableCoilCounts('lap', 1, 4, true)).toEqual([8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48])
    expect(drawableCoilCounts('lap', 2, 8, true)).toEqual([32, 48])
    expect(drawableCoilCounts('lap', 3, 12, true)).toEqual([])
  })
  it('wave: P ≥ 4, C ≥ 2P + 1, C ≥ (m + ½)P, 2(C ± m)/P an integer', () => {
    expect(drawableCoilCounts('wave', 1, 12, true)).toEqual([29, 35, 41, 47])
    expect(drawableCoilCounts('wave', 2, 12, true)).toEqual([34, 40, 46])
    expect(drawableCoilCounts('wave', 3, 12, true)).toEqual([45])
    expect(drawableCoilCounts('wave', 1, 2, true)).toEqual([])
    expect(drawableCoilCounts('frog', 1, 4, true)).toEqual([])
    expect(drawRule('wave', 3, 4, true, 13)?.reason).toMatch(/same segment/)
    expect(drawRule('wave', 2, 12, true, 28)?.reason).toMatch(/same segment/)
  })
  it('with the brush rule no segment is ever under two brushes (every drawable winding, 600 rotor angles)', () => {
    for (const type of ['lap', 'wave'] as const) for (const m of [1, 2, 3]) for (const progressive of [true, false]) for (const P of POLES) {
      for (const C of drawableCoilCounts(type, m, P, progressive)) {
        const b = buildWinding({ type, m, P, C, NC: 1, progressive })
        if (!b.ok) throw new Error(b.reason)
        for (let i = 0; i < 600; i++) {
          const t = analyze(b.winding, ((i + 0.5) / 600) * 2 * Math.PI, 1, 1).tapped.flat()
          if (new Set(t).size !== t.length) throw new Error(`${type} m${m} P${P} C${C}: a segment under two brushes`)
        }
      }
    }
  }, 60000)
  it('nearest drawable value (tie: the smaller one)', () => {
    const near = (t: WindingType, m: number, P: number, prog: boolean, C: number) => nearestDrawable(drawableCoilCounts(t, m, P, prog), C)
    expect(near('lap', 1, 10, true, 26)).toBe(30)
    expect(near('lap', 1, 10, true, 25)).toBe(20)
    expect(near('lap', 2, 8, true, 24)).toBe(32)
    expect(near('wave', 1, 12, true, 24)).toBe(29)
    expect(near('wave', 2, 12, true, 24)).toBe(34)
    expect(near('wave', 1, 4, true, 14)).toBe(13)
    expect(nearestDrawable([], 10)).toBeNull()
  })
  it('every drawable C really builds, and every other C ≤ 48 does not', () => {
    for (const type of ['lap', 'wave'] as const) for (const m of [1, 2, 3]) for (const progressive of [true, false]) for (const P of POLES) {
      const list = drawableCoilCounts(type, m, P, progressive)
      for (let C = 2; C <= 48; C++) expect(buildWinding({ type, m, P, C, NC: 1, progressive }).ok).toBe(list.includes(C))
    }
  })
  it('coverage: every combination has a drawable C ≤ 48 except triplex lap with 10 or 12 poles (needs C ≥ 2mP = 60, 72)', () => {
    const empty: string[] = []
    for (const type of ['lap', 'wave'] as const) for (const m of [1, 2, 3]) for (const progressive of [true, false]) for (const P of POLES) {
      if (type === 'wave' && P < 4) continue
      if (drawableCoilCounts(type, m, P, progressive).length === 0) empty.push(`${type} m${m} P${P} ${progressive ? 'p' : 'r'}`)
    }
    expect(empty.sort()).toEqual(['lap m3 P10 p', 'lap m3 P10 r', 'lap m3 P12 p', 'lap m3 P12 r'])
  })
})

describe('multiplex wave windings (beyond the course): traced paths at 300 random angles', () => {
  const rnd = mulberry32(11)
  const cases: [string, WindingSpec, number, number][] = [
    ['duplex, progressive, P = 4, C = 18', spec({ type: 'wave', m: 2, P: 4, C: 18 }), 10, 2],
    ['duplex, progressive, P = 4, C = 20', spec({ type: 'wave', m: 2, P: 4, C: 20 }), 11, 1],
    ['duplex, retrogressive, P = 4, C = 20', spec({ type: 'wave', m: 2, P: 4, C: 20, progressive: false }), 9, 1],
    ['triplex, progressive, P = 4, C = 15', spec({ type: 'wave', m: 3, P: 4, C: 15 }), 9, 3],
    ['triplex, progressive, P = 4, C = 17', spec({ type: 'wave', m: 3, P: 4, C: 17 }), 10, 1],
  ]
  for (const [name, s, yc, cycles] of cases) {
    it(name, () => {
      const b = buildWinding(s)
      if (!b.ok) throw new Error(b.reason)
      expect(b.winding.yc).toBe(yc)
      expect(cycleCount(b.winding)).toBe(cycles)
      expect(b.winding.brushAngles.length).toBe(2)
      for (let i = 0; i < 300; i++) {
        const snap = analyze(b.winding, rnd() * 2 * Math.PI, 0.5 + 0.5 * rnd(), 1)
        expect(snap.paths.length).toBe(2 * s.m)
        expect(Math.abs(snap.kvlSum)).toBeLessThan(1e-12)
      }
    })
  }
  it('duplex, progressive, P = 6, C = 26 is not drawable: 2(26 + 2)/6 is not an integer', () => {
    const b = buildWinding(spec({ type: 'wave', m: 2, P: 6, C: 26 }))
    expect(b.ok).toBe(false)
    if (!b.ok) expect(b.reason).toMatch(/not an integer/)
  })
  it('triplex, P = 4, C = 13 (C/P = 3.25 < m + ½) is refused: its two brushes would share a segment', () => {
    const b = buildWinding(spec({ type: 'wave', m: 3, P: 4, C: 13 }))
    expect(b.ok).toBe(false)
    if (!b.ok) expect(b.reason).toMatch(/same segment/)
    expect(formula(spec({ type: 'wave', m: 3, P: 4, C: 13 }), X()).yc).toBe(8)
  })
})

describe('dead zone (Chapman p. 448; solutions manual Problems 7-2, 7-9)', () => {
  it('Problem 7-2: simplex lap, P = 2, C = 8, B = 1 T, r = 0.10 m, l = 0.3 m, 1800 r/min, β = 0.75', () => {
    const s = spec({ P: 2, C: 8 })
    const phi = fluxFromField(1.0, 0.1, 0.3, 2)
    // expected values as printed (six figures), and their exact closed forms
    digits(phi, '0.0942478'); near(phi, 0.03 * Math.PI, 1e-12)
    const f = formula(s, X({ phi, n: 1800, R: 0.04, Rper: 'coil', load: true, RL: 1, beta: 0.75 }))
    digits(f.omega, '188.496'); near(f.omega, 60 * Math.PI, 1e-12)
    digits(f.K, '2.54648'); near(f.K, 8 / Math.PI, 1e-12)
    near(f.econd, 0.1 * f.omega * 1.0 * 0.3, 1e-12) // e_cond = rωBl
    digits(f.EA, '45.2389'); near(f.EA, 14.4 * Math.PI, 1e-12)
    expect(f.Zunder).toBe(12)
    digits(f.EAdz, '33.9292'); near(f.EAdz, 10.8 * Math.PI, 1e-12)
    near(f.RA, 0.08, 1e-12)
    digits(f.IA, '31.4159'); near(f.IA, 10 * Math.PI, 1e-12)
    digits(f.tau, '5.65487'); near(f.tau, 0.75 * (8 / Math.PI) * 0.03 * Math.PI * 10 * Math.PI, 1e-12)
  })
  it('Problem 7-9(d): duplex lap, P = 2, C = 16, β = 14/16 gives E_A,dz = 7 e_cond', () => {
    const f = formula(spec({ m: 2, P: 2, C: 16 }), X({ beta: 14 / 16 }))
    expect(f.Zunder).toBe(28)
    near(f.EAdz, 7 * f.econd, 1e-12)
  })
  it('β = 1 gives the book: E_A,dz = E_A', () => {
    const f = formula(spec({}), X({ load: true, RL: 10 }))
    expect(f.EAdz).toBe(f.EA)
    near(f.tau, f.K * 0.01 * f.IA, 1e-12)
  })
  it('pole arc and dead zone angles', () => {
    const g = poleGeometry(4, 0.8)
    near(g.arcM, 72); near(g.arcE, 144); near(g.gapM, 18); near(g.gapE, 36); expect(g.pitchE).toBe(180)
    const h = poleGeometry(6, 0.7)
    near(h.gapM, 18); near(h.gapE, 54)
  })
  it('coil-level average brush voltage (units of N_C e_cond)', () => {
    const avg = (s: WindingSpec, beta: number) => {
      const b = buildWinding(s)
      if (!b.ok) throw new Error(b.reason)
      return averageBrushVoltage(b.winding, beta, 1)
    }
    near(avg(spec({ P: 4, C: 16 }), 0.7), 5.6, 2e-3)
    near(avg(spec({ P: 4, C: 40 }), 0.7), 14.0, 2e-3)
    near(avg(spec({ type: 'wave', P: 4, C: 21 }), 0.7), 14.7, 2e-3)
  })
  it('§ 7.2: with β = 0.7 a brush never shorts a coil that has voltage; near β = 1 it does', () => {
    const b = buildWinding(spec({ P: 4, C: 16 }))
    if (!b.ok) throw new Error(b.reason)
    const count = (beta: number) => Array.from({ length: 2000 }, (_, i) => analyze(b.winding, (i / 2000) * 2 * Math.PI, beta, 1)).filter((s) => s.shortedWithVoltage.length > 0).length
    expect(count(0.7)).toBe(0)
    expect(count(0.95)).toBeGreaterThan(0)
    expect(count(1)).toBeGreaterThan(0)
  })
  it('invariant: simplex lap, full pitch, C/P ≥ 4, β in [0.5, 0.8]: average = β Z e_cond / a', () => {
    const rnd = mulberry32(448)
    let n = 0
    while (n < 150) {
      const P = 2 * (1 + Math.floor(rnd() * 6))
      const C = P * (4 + Math.floor(rnd() * 21))
      if (C > 48) continue
      const NC = 1 + Math.floor(rnd() * 3)
      const s = spec({ P, C, NC, progressive: rnd() < 0.5 })
      const b = buildWinding(s)
      if (!b.ok) throw new Error(b.reason)
      const beta = 0.5 + 0.3 * rnd(), econd = 0.1 + rnd()
      const f = formula(b.winding.spec, X())
      near(Math.abs(averageBrushVoltage(b.winding, beta, econd)), (beta * f.Z * econd) / f.a, 2e-3)
      n++
    }
  })
})

describe('exam generator', () => {
  it('always returns a drawable winding in the exam range', () => {
    const rnd = mulberry32(3)
    for (let i = 0; i < 300; i++) {
      const s = randomExamWinding(rnd)
      expect(buildWinding(s).ok).toBe(true)
      expect([2, 4, 6]).toContain(s.P)
      expect(s.C).toBeLessThanOrEqual(24)
      expect(s.NC).toBeGreaterThanOrEqual(1)
      expect(s.NC).toBeLessThanOrEqual(3)
      expect(s.type === 'wave' ? s.m : 1).toBe(1)
    }
  })
})
