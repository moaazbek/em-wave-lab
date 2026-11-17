/**
 * Armature windings, parallel paths and E_A — Chapman, Electric Machinery Fundamentals, 5th ed.,
 * § 7.3 (Eqs. 7-22 … 7-29) and § 7.5 (Eqs. 7-31 … 7-49). Pure TypeScript, no UI imports.
 *
 * Part A (formula) works for any input, exactly as the book computes it.
 * Part B (constructive) builds the actual winding for drawing and path tracing, within the limits below.
 */

export type WindingType = 'lap' | 'wave' | 'frog'
export type ResistancePer = 'conductor' | 'turn' | 'coil'

export interface WindingSpec {
  type: WindingType
  /** Plex m (frog-leg: the plex of its lap part, m_lap). */
  m: number
  progressive: boolean
  P: number
  C: number
  NC: number
  /** Coil span in slots; default full pitch (C/P, or floor(C/P)). */
  ys?: number
}

export interface MachineInputs {
  /** Flux per pole (Wb). */
  phi: number
  /** Speed (r/min). */
  n: number
  /** Resistance of one element (Ω) and which element it is. */
  R: number
  Rper: ResistancePer
  /** Load resistor connected (generator), its value, and whether to ignore R_A (Example 7-4(d)). */
  load: boolean
  RL: number
  ignoreRA: boolean
}

/* ------------------------------------------------------------------ */
/* Part A: formula                                                      */
/* ------------------------------------------------------------------ */

export interface FormulaResult {
  Z: number
  a: number
  /** Commutator pitch; null when the course gives no formula (multiplex wave, frog-leg). */
  yc: number | null
  ycInteger: boolean
  /** Both wave values 2(C+1)/P and 2(C-1)/P (wave only), for the "not an integer" explanation. */
  waveYc: { prog: number; retro: number } | null
  brushes: number
  coilsPerPath: number
  condPerPath: number
  turnsPerPath: number
  /** Coil span used and pitch factor p (%), Eq. (7-24). */
  ys: number
  p: number
  omega: number
  K: number
  Kp: number
  /** Conductor voltage e_cond = P φ ω / (2π), from (7-31) and (7-36). */
  econd: number
  EA: number
  elementsPerPath: number
  Rpath: number
  RA: number
  IA: number
  VT: number
  tau: number
  Ipath: number
}

/** Default coil span: full pitch C/P when it is an integer, otherwise floor(C/P) (at least 1). */
export const fullPitch = (C: number, P: number): number => Math.max(1, Math.floor(C / P))

export function parallelPaths(type: WindingType, m: number, P: number): number {
  if (type === 'lap') return m * P // (7-26)
  if (type === 'wave') return 2 * m // (7-28); simplex: 2
  return 2 * P * m // frog-leg (7-29)
}

export function formula(s: WindingSpec, x: MachineInputs): FormulaResult {
  const { C, P, NC, m } = s
  const Z = 2 * C * NC // (7-22)
  const a = parallelPaths(s.type, m, P)
  let yc: number | null = null
  let waveYc: FormulaResult['waveYc'] = null
  if (s.type === 'lap') yc = s.progressive ? m : -m // (7-25)
  else if (s.type === 'wave') {
    waveYc = { prog: (2 * (C + 1)) / P, retro: (2 * (C - 1)) / P } // (7-27)
    if (m === 1) yc = s.progressive ? waveYc.prog : waveYc.retro
  }
  const ys = s.ys ?? fullPitch(C, P)
  const omega = (2 * Math.PI * x.n) / 60 // (7-40)
  const K = (Z * P) / (2 * Math.PI * a) // (7-39)
  const Kp = (Z * P) / (60 * a) // (7-42)
  const EA = K * x.phi * omega // (7-38)
  const elementsPerPath = x.Rper === 'conductor' ? Z / a : x.Rper === 'turn' ? Z / (2 * a) : C / a
  const Rpath = elementsPerPath * x.R
  const RA = Rpath / a
  const IA = x.load ? EA / ((x.ignoreRA ? 0 : RA) + x.RL) : 0
  return {
    Z, a, yc, ycInteger: yc !== null && Number.isInteger(yc), waveYc,
    brushes: s.type === 'wave' ? 2 : P,
    coilsPerPath: C / a, condPerPath: Z / a, turnsPerPath: Z / (2 * a),
    ys, p: ((ys * P) / C) * 100, // (7-24)
    omega, K, Kp, econd: (P * x.phi * omega) / (2 * Math.PI), EA,
    elementsPerPath, Rpath, RA, IA,
    VT: x.load ? IA * x.RL : EA,
    tau: K * x.phi * IA, // (7-49)
    Ipath: IA / a, // (7-44)
  }
}

/** Flux per pole needed for a given E_A at speed n: φ = E_A / (K' n). */
export const fluxFor = (EA: number, s: WindingSpec, n: number): number => EA / (((2 * s.C * s.NC) * s.P) / (60 * parallelPaths(s.type, s.m, s.P)) * n)

/* ------------------------------------------------------------------ */
/* Part B: constructive winding                                          */
/* ------------------------------------------------------------------ */

export const MAX_DRAWN_COILS = 48

export interface Coil {
  k: number
  /** Slots of the top-layer and bottom-layer sides. */
  top: number
  bottom: number
  /** Start and end commutator segments. */
  start: number
  end: number
}

export interface Winding {
  spec: WindingSpec
  yc: number
  ys: number
  coils: Coil[]
  /** Closed sequences of segments obtained by following coils start -> end. Count = gcd(|y_c|, C). */
  cycles: number[][]
  /** Fixed brush angles (mechanical, rad): the pole centres 2πi/P (lap) or two, one pole pitch apart (wave). */
  brushAngles: number[]
  /** Brush angular width: (m - 0.5) segment pitches. */
  brushWidth: number
  /** Slot (= segment) pitch Δ = 2π / C. */
  delta: number
}

export type BuildResult = { ok: true; winding: Winding } | { ok: false; reason: string }

const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y))
const mod = (x: number, n: number) => ((x % n) + n) % n

/**
 * Build the winding. `maxCoils` is the drawing limit (C ≤ 48); path tracing itself has no size limit,
 * so tests may pass Infinity.
 */
export function buildWinding(s: WindingSpec, maxCoils = MAX_DRAWN_COILS): BuildResult {
  const { type, m, P, C } = s
  if (type === 'frog' || (type === 'wave' && m > 1))
    return { ok: false, reason: 'The course gives no commutator-pitch formula for this winding, so it is not drawn.' }
  if (type === 'wave' && P < 4)
    return { ok: false, reason: 'With 2 poles a wave winding is the same as a lap winding, so it is not offered.' }
  if (type === 'lap') {
    if (C % (m * P) !== 0) return { ok: false, reason: `A lap winding needs C to be a multiple of mP = ${m * P}; C = ${C} is not.` }
    if (C < 2 * P) return { ok: false, reason: `A lap winding needs at least 2P = ${2 * P} coils.` }
    // Brushes are (m - 0.5) segments wide and C/P segments apart. If C/P <= m, a + brush and a - brush reach
    // the same segment and short each other: the winding needs at least two coils per path, C >= 2mP.
    if (C < 2 * m * P)
      return { ok: false, reason: `With ${m === 2 ? 'duplex' : 'triplex'} brushes (${m} segments wide) and only ${C / P} segments per pole, a + and a − brush would touch the same segment. Drawn for C ≥ 2mP = ${2 * m * P}.` }
  } else {
    if (C < 2 * P + 1) return { ok: false, reason: `A simplex wave winding needs at least 2P + 1 = ${2 * P + 1} coils.` }
    const yp = (2 * (C + 1)) / P, yr = (2 * (C - 1)) / P
    const need = s.progressive ? yp : yr
    if (!Number.isInteger(need)) {
      const show = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/0+$/, ''))
      return { ok: false, reason: `Not realizable as a ${s.progressive ? 'progressive' : 'retrogressive'} simplex wave: y_c = 2(C ${s.progressive ? '+' : '−'} 1)/P = ${show(need)} is not an integer (the other sign gives ${show(s.progressive ? yr : yp)}).` }
    }
  }
  if (C > maxCoils) return { ok: false, reason: `Diagram drawn only for C ≤ ${MAX_DRAWN_COILS}; the numbers are still exact.` }
  const yc = type === 'lap' ? (s.progressive ? m : -m) : s.progressive ? (2 * (C + 1)) / P : (2 * (C - 1)) / P
  const ys = Math.min(Math.max(1, s.ys ?? fullPitch(C, P)), C - 1)
  const coils: Coil[] = Array.from({ length: C }, (_, k) => ({ k, top: k, bottom: mod(k + ys, C), start: k, end: mod(k + yc, C) }))
  // cycles: segment -> coil starting there -> its end segment -> ...
  const seen = new Set<number>()
  const cycles: number[][] = []
  for (let s0 = 0; s0 < C; s0++) {
    if (seen.has(s0)) continue
    const cyc: number[] = []
    let j = s0
    while (!seen.has(j)) { seen.add(j); cyc.push(j); j = mod(j + yc, C) }
    cycles.push(cyc)
  }
  const delta = (2 * Math.PI) / C
  const brushAngles = type === 'lap'
    ? Array.from({ length: P }, (_, i) => (2 * Math.PI * i) / P)
    : [0, (2 * Math.PI) / P]
  return { ok: true, winding: { spec: { ...s, ys }, yc, ys, coils, cycles, brushAngles, brushWidth: (m - 0.5) * delta, delta } }
}

export const cycleCount = (w: Winding) => w.cycles.length
export const expectedCycles = (w: Winding) => gcd(Math.abs(w.yc), w.spec.C)

/** Wrap an angle to (-π, π]. */
export function wrapPi(x: number): number {
  let y = x % (2 * Math.PI)
  if (y <= -Math.PI) y += 2 * Math.PI
  if (y > Math.PI) y -= 2 * Math.PI
  return y
}

/** Mechanical angle of slot k (its centre) at rotor angle α. */
export const slotAngle = (w: Winding, k: number, alpha: number) => k * w.delta + alpha
/** Centre of segment j: (j + (y_s - y_c)/2) Δ + α — each coil's centre line midway between its two segments. */
export const segmentAngle = (w: Winding, j: number, alpha: number) => (j + (w.ys - w.yc) / 2) * w.delta + alpha

/**
 * Field sign at a mechanical angle: N-pole centres at electrical 0, S at 180°; pole-arc fraction β.
 * +1 within ±β·90° (electrical) of an N centre, −1 near an S centre, 0 in the dead zone between.
 */
export function fieldSign(thetaM: number, P: number, beta: number): -1 | 0 | 1 {
  const e = wrapPi((P / 2) * thetaM)
  const half = (beta * Math.PI) / 2
  if (Math.abs(e) < half) return 1
  if (Math.PI - Math.abs(e) < half) return -1
  return 0
}

export interface Chain {
  /** Brush index at each end (walking the cycle in the start -> end direction of the coils). */
  fromBrush: number
  toBrush: number
  fromSeg: number
  toSeg: number
  /** Coils in walking order. */
  coils: number[]
  /** Potential of toSeg minus potential of fromSeg = sum of the coil voltages. */
  voltage: number
  kind: 'path' | 'commutated'
}

export interface Snapshot {
  alpha: number
  beta: number
  /** Field sign of the top-layer and bottom-layer conductors of each slot's coil sides, by coil. */
  topSign: (-1 | 0 | 1)[]
  bottomSign: (-1 | 0 | 1)[]
  /** Coil voltage (start -> end) = N_C (e_top - e_bottom). */
  coilEmf: number[]
  /** Segment potential: running sum along its cycle from the cycle's first segment. */
  segPotential: number[]
  /** Segments touched by each brush. */
  tapped: number[][]
  /** Brush potentials (least squares over the paths, brush 0 = 0) and polarity (+1 / -1). */
  brushPotential: number[]
  polarity: (1 | -1)[]
  /** Parallel paths (brush to brush of opposite polarity) and commutated chains (same brush). */
  paths: Chain[]
  commutated: Chain[]
  /** Coil-level brush voltage: mean potential of + brushes minus mean of − brushes. */
  brushVoltage: number
  /** True when every brush touches exactly m segments (no coil is being commutated). */
  noCommutation: boolean
  /** Sum of all coil voltages (KVL around the winding: zero). */
  kvlSum: number
}

/** Solve the small least-squares problem for brush potentials: V_to - V_from = voltage, with V_0 = 0. */
function brushPotentials(B: number, chains: Chain[]): number[] {
  const n = B - 1
  if (n <= 0) return [0]
  const M = Array.from({ length: n }, () => new Array(n).fill(0))
  const r = new Array(n).fill(0)
  for (const c of chains) {
    const row = new Array(B).fill(0)
    row[c.toBrush] += 1
    row[c.fromBrush] -= 1
    for (let i = 1; i < B; i++) {
      if (row[i] === 0) continue
      r[i - 1] += row[i] * c.voltage
      for (let j = 1; j < B; j++) M[i - 1][j - 1] += row[i] * row[j]
    }
  }
  // Gauss-Jordan with partial pivoting; tiny ridge keeps an unconnected brush at 0
  for (let i = 0; i < n; i++) M[i][i] += 1e-30
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let i = col + 1; i < n; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i
    ;[M[col], M[piv]] = [M[piv], M[col]];[r[col], r[piv]] = [r[piv], r[col]]
    for (let i = 0; i < n; i++) {
      if (i === col) continue
      const f = M[i][col] / M[col][col]
      if (f === 0) continue
      for (let j = col; j < n; j++) M[i][j] -= f * M[col][j]
      r[i] -= f * r[col]
    }
  }
  return [0, ...r.map((v, i) => v / M[i][i])]
}

/**
 * State of the winding at rotor angle α (brushes and poles fixed in space).
 * econd is the voltage of one conductor under a pole face, P φ ω / (2π).
 */
export function analyze(w: Winding, alpha: number, beta: number, econd: number): Snapshot {
  const { C, P, NC, m } = w.spec
  const topSign = w.coils.map((c) => fieldSign(slotAngle(w, c.top, alpha), P, beta))
  const bottomSign = w.coils.map((c) => fieldSign(slotAngle(w, c.bottom, alpha), P, beta))
  const coilEmf = w.coils.map((_, k) => NC * (topSign[k] - bottomSign[k]) * econd)
  const kvlSum = coilEmf.reduce((s, e) => s + e, 0)
  // segment potentials along each cycle
  const segPotential = new Array<number>(C).fill(0)
  for (const cyc of w.cycles) {
    let v = 0
    for (const j of cyc) { segPotential[j] = v; v += coilEmf[j] }
  }
  // brushes touch segments whose arc overlaps the brush arc
  const reach = w.delta / 2 + w.brushWidth / 2
  const tapped = w.brushAngles.map((b) => {
    const out: number[] = []
    for (let j = 0; j < C; j++) if (Math.abs(wrapPi(segmentAngle(w, j, alpha) - b)) < reach) out.push(j)
    return out
  })
  const brushOf = new Map<number, number>()
  tapped.forEach((segs, i) => segs.forEach((j) => brushOf.set(j, i)))
  // cut every cycle at the tapped segments
  const chains: Chain[] = []
  for (const cyc of w.cycles) {
    const idx = cyc.map((j, i) => (brushOf.has(j) ? i : -1)).filter((i) => i >= 0)
    if (idx.length === 0) continue
    for (let t = 0; t < idx.length; t++) {
      const i0 = idx[t], i1 = idx[(t + 1) % idx.length]
      const len = mod(i1 - i0, cyc.length) || cyc.length
      const coils: number[] = []
      let v = 0
      for (let q = 0; q < len; q++) { const j = cyc[(i0 + q) % cyc.length]; coils.push(j); v += coilEmf[j] }
      const fromSeg = cyc[i0], toSeg = cyc[i1]
      const fb = brushOf.get(fromSeg)!, tb = brushOf.get(toSeg)!
      chains.push({ fromBrush: fb, toBrush: tb, fromSeg, toSeg, coils, voltage: v, kind: fb === tb ? 'commutated' : 'path' })
    }
  }
  const betweenBrushes = chains.filter((c) => c.kind === 'path')
  const Vb = brushPotentials(w.brushAngles.length, betweenBrushes)
  const mean = Vb.reduce((s, v) => s + v, 0) / Vb.length
  const polarity = Vb.map((v) => (v >= mean ? 1 : -1)) as (1 | -1)[]
  const plus = Vb.filter((_, i) => polarity[i] === 1), minus = Vb.filter((_, i) => polarity[i] === -1)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0)
  // a path joins brushes of opposite polarity; a chain between two brushes of the same polarity is not a path
  const paths = betweenBrushes.filter((c) => polarity[c.fromBrush] !== polarity[c.toBrush])
  return {
    alpha, beta, topSign, bottomSign, coilEmf, segPotential, tapped, brushPotential: Vb, polarity,
    paths, commutated: chains.filter((c) => c.kind === 'commutated'),
    brushVoltage: avg(plus) - avg(minus),
    noCommutation: tapped.every((t) => t.length === m),
    kvlSum,
  }
}

/**
 * A rotor angle at which every brush touches exactly m segments (no coil is being commutated).
 * The pattern repeats every segment pitch, so one pitch is scanned and the middle of the longest stretch
 * without commutation is returned (for a wave winding the second brush is not a whole number of segments
 * from the first, so a single closed-form offset cannot centre both).
 */
export function cleanAngle(w: Winding): number {
  const N = 240
  const ok = Array.from({ length: N }, (_, i) => analyze(w, (i / N) * w.delta, 1, 1).noCommutation)
  let best = -1, bestLen = 0
  for (let i = 0; i < N; i++) {
    if (!ok[i] || ok[(i - 1 + N) % N]) continue // start of a run
    let len = 0
    while (len < N && ok[(i + len) % N]) len++
    if (len > bestLen) { bestLen = len; best = i }
  }
  if (best < 0) return ok[0] ? 0 : 0.5 * w.delta
  return (((best + (bestLen - 1) / 2) / N) % 1) * w.delta
}

/* ------------------------------------------------------------------ */
/* Exam mode: random drawable winding                                    */
/* ------------------------------------------------------------------ */

/** A random drawable winding in the exam's range: lap simplex/duplex or simplex wave, P ∈ {2,4,6}, C ≤ 24, N_C 1–3. */
export function randomExamWinding(rnd: () => number): WindingSpec {
  for (let tries = 0; tries < 1000; tries++) {
    const type: WindingType = rnd() < 0.6 ? 'lap' : 'wave'
    const m = type === 'lap' && rnd() < 0.4 ? 2 : 1
    const P = [2, 4, 6][Math.floor(rnd() * 3)]
    const C = 4 + Math.floor(rnd() * 21)
    const spec: WindingSpec = { type, m, progressive: rnd() < 0.5, P, C, NC: 1 + Math.floor(rnd() * 3) }
    if (buildWinding(spec).ok) return spec
  }
  return { type: 'lap', m: 1, progressive: true, P: 4, C: 16, NC: 1 }
}
