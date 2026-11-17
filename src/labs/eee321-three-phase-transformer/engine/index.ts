/**
 * Three-phase transformer connections — Chapman, Electric Machinery Fundamentals, 5th ed., § 2.10.
 * Pure TypeScript: no UI imports. Every number, phasor, waveform and moving dot of the lab reads from here.
 *
 * Model: a bank of three ideal single-phase transformers (no winding impedance, no magnetizing current).
 * Everything is computed from the wiring netlist; the 30° shift is a result, never a rule.
 *
 * Phasors are RMS. Reference: the supply's line-to-neutral voltage V_AN = (V_LL/√3)∠0°.
 * Sequence abc: V_BN at -120°, V_CN at +120°; sequence acb: the two angles swapped.
 * For a Δ primary, V_AN is the voltage of the supply to its own neutral.
 * Winding k: secondary voltage (dot to undotted) = primary voltage (dot to undotted) / a;
 * I_Pk flows into the primary dot, I_Sk flows out of the secondary dot, I_Pk = I_Sk / a.
 */
import { C, ZERO, abs, add, arg, c, conj, div, mul, scale, sub } from '../../../physics/complex'

export type Connection = 'YY' | 'YD' | 'DY' | 'DD'
export type Sequence = 'abc' | 'acb'
export type PriNode = 'A' | 'B' | 'C' | 'N'
export type SecNode = 'a' | 'b' | 'c' | 'n'

export interface Winding<N extends string> {
  /** Dotted end. */
  dot: N
  /** Undotted end. */
  other: N
}

export interface Netlist {
  name: string
  primary: [Winding<PriNode>, Winding<PriNode>, Winding<PriNode>]
  secondary: [Winding<SecNode>, Winding<SecNode>, Winding<SecNode>]
}

const w = <N extends string>(dot: N, other: N): Winding<N> => ({ dot, other })

/** The four connections. Δ–Y uses the course wiring (see FIG_2_37C_AS_PRINTED). */
export const NETLISTS: Record<Connection, Netlist> = {
  YY: { name: 'Y–Y', primary: [w('A', 'N'), w('B', 'N'), w('C', 'N')], secondary: [w('a', 'n'), w('b', 'n'), w('c', 'n')] },
  YD: { name: 'Y–Δ', primary: [w('A', 'N'), w('B', 'N'), w('C', 'N')], secondary: [w('a', 'b'), w('b', 'c'), w('c', 'a')] },
  DY: { name: 'Δ–Y', primary: [w('A', 'C'), w('B', 'A'), w('C', 'B')], secondary: [w('a', 'n'), w('b', 'n'), w('c', 'n')] },
  DD: { name: 'Δ–Δ', primary: [w('A', 'B'), w('B', 'C'), w('C', 'A')], secondary: [w('a', 'b'), w('b', 'c'), w('c', 'a')] },
}

/**
 * Chapman Fig. 2-37c as printed: primary A→B, B→C, C→A. With abc this wiring makes the secondary LEAD
 * by 30°, while the text and the course slides say it lags. Kept only for the test that proves this;
 * it is not offered in the lab.
 */
export const FIG_2_37C_AS_PRINTED: Netlist = {
  name: 'Δ–Y (Fig. 2-37c as printed)',
  primary: [w('A', 'B'), w('B', 'C'), w('C', 'A')],
  secondary: [w('a', 'n'), w('b', 'n'), w('c', 'n')],
}

export const isStar = (ws: readonly Winding<string>[]): boolean => ws.some((x) => x.other === 'N' || x.other === 'n' || x.dot === 'N' || x.dot === 'n')

export interface Params {
  netlist: Netlist
  /** Primary line-to-line voltage (V rms). */
  VLL: number
  /** Turns ratio of each transformer N_P / N_S. */
  a: number
  /** Load apparent power S_3φ (VA). */
  S3: number
  /** Power factor 0…1. */
  pf: number
  /** Lagging (inductive) load when true. */
  lagging: boolean
  seq: Sequence
  /** Supply frequency (Hz); affects only the time axis. */
  f: number
}

type Tri = [C, C, C]

export interface Side {
  star: boolean
  /** Winding voltages, dot minus undotted end. */
  Vw: Tri
  /** Winding currents: into the primary dot / out of the secondary dot. */
  Iw: Tri
  /** Line-to-neutral (equivalent-Y for a Δ) voltages of the three terminals. */
  Vln: Tri
  /** Line-to-line voltages: AB, BC, CA (or ab, bc, ca). */
  Vll: Tri
  /** Line currents: into the primary terminals from the supply / out of the secondary terminals to the load. */
  Iline: Tri
  /** Neutral current (star side only; zero for a balanced load). */
  Ineutral: C
  /** Σ V_w I_w* over the windings. */
  Swind: C
  /** Σ V_xn I_x* over the lines. */
  Sline: C
  /** Magnitudes, as the slides name them. */
  VLLmag: number
  VLNmag: number
  Vp: number
  IL: number
  Ip: number
  /** Sum of the three winding voltages around the delta (Δ side); zero by KVL. */
  deltaLoopV: C
}

export interface Solution {
  params: Params
  pri: Side
  sec: Side
  /** Load angle θ (rad): +acos(PF) lagging, -acos(PF) leading. */
  theta: number
  /** |V_LL| / |V_ll|. */
  ratio: number
  /** ∠V_ab - ∠V_AB in degrees, in (-180, 180]. */
  shiftDeg: number
  /** Load S = P + jQ (VA). */
  Sload: C
}

const DEG = Math.PI / 180
export const polar = (mag: number, deg: number): C => c(mag * Math.cos(deg * DEG), mag * Math.sin(deg * DEG))
export const argDeg = (z: C): number => arg(z) / DEG

/** Wrap an angle in degrees to (-180, 180]. */
export function wrapDeg(d: number): number {
  let x = d % 360
  if (x <= -180) x += 360
  if (x > 180) x -= 360
  return x
}

/** Formula the connection follows for V_LL / V_ll. */
export function ratioFormula(n: Netlist): { factor: number; tex: string; eq: string } {
  const p = isStar(n.primary), s = isStar(n.secondary)
  if (p && !s) return { factor: Math.sqrt(3), tex: '\\sqrt{3}\\,a', eq: '(2-89)' }
  if (!p && s) return { factor: 1 / Math.sqrt(3), tex: 'a/\\sqrt{3}', eq: '(2-90)' }
  return { factor: 1, tex: 'a', eq: p ? '(2-88)' : '(2-91)' }
}

/** Assign node potentials from winding voltages: V(dot) - V(other) = Vw. Reference: neutral = 0, or a+b+c = 0. */
function potentials<N extends string>(ws: readonly Winding<N>[], Vw: Tri, neutral: N, lines: readonly N[]): Map<N, C> {
  const V = new Map<N, C>()
  V.set(ws[0].dot, ZERO)
  for (let pass = 0; pass < 3; pass++)
    ws.forEach((x, k) => {
      if (V.has(x.dot) && !V.has(x.other)) V.set(x.other, sub(V.get(x.dot)!, Vw[k]))
      else if (V.has(x.other) && !V.has(x.dot)) V.set(x.dot, add(V.get(x.other)!, Vw[k]))
    })
  const ref = V.has(neutral) ? V.get(neutral)! : scale(lines.reduce((s, x) => add(s, V.get(x)!), ZERO), 1 / 3)
  for (const [k, v] of V) V.set(k, sub(v, ref))
  return V
}

/** Orientation (+1 / -1) of each winding when the delta loop is walked from the first winding's dot. */
function loopOrientation<N extends string>(ws: readonly Winding<N>[]): [number, number, number] {
  const o: [number, number, number] = [1, 0, 0]
  let node = ws[0].other
  const used = new Set([0])
  while (used.size < 3) {
    const k = ws.findIndex((x, j) => !used.has(j) && (x.dot === node || x.other === node))
    if (k < 0) break
    o[k] = ws[k].dot === node ? 1 : -1
    node = ws[k].dot === node ? ws[k].other : ws[k].dot
    used.add(k)
  }
  return o
}

/** Solve A x = b in the least-squares sense (A real m×3, b complex), via the normal equations. */
function solve3(A: number[][], b: C[]): Tri {
  const M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => A.reduce((s, row) => s + row[i] * row[j], 0)))
  const r: C[] = [0, 1, 2].map((i) => A.reduce((s, row, m) => add(s, scale(b[m], row[i])), ZERO))
  for (let col = 0; col < 3; col++) {
    let piv = col
    for (let i = col + 1; i < 3; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i
    ;[M[col], M[piv]] = [M[piv], M[col]];[r[col], r[piv]] = [r[piv], r[col]]
    for (let i = 0; i < 3; i++) {
      if (i === col) continue
      const f = M[i][col] / M[col][col]
      for (let j = col; j < 3; j++) M[i][j] -= f * M[col][j]
      r[i] = sub(r[i], scale(r[col], f))
    }
  }
  return [scale(r[0], 1 / M[0][0]), scale(r[1], 1 / M[1][1]), scale(r[2], 1 / M[2][2])]
}

/**
 * Winding currents from line currents by KCL at every node of one side:
 *   Σ_{dot at x} I_w − Σ_{undotted end at x} I_w = (current from the node into the line at x),
 * plus, for a delta, "no circulating current": the loop sum of the winding currents is zero.
 */
function windingCurrents<N extends string>(ws: readonly Winding<N>[], nodes: readonly N[], lineOut: Map<N, C>, star: boolean): Tri {
  const A: number[][] = []
  const b: C[] = []
  for (const x of nodes) {
    A.push(ws.map((wd) => (wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0)))
    b.push(lineOut.get(x) ?? ZERO)
  }
  if (!star) {
    A.push(loopOrientation(ws))
    b.push(ZERO)
  }
  return solve3(A, b)
}

function lineLine(V: Tri): Tri {
  return [sub(V[0], V[1]), sub(V[1], V[2]), sub(V[2], V[0])]
}

export function solve(p: Params): Solution {
  const n = p.netlist
  const priStar = isStar(n.primary), secStar = isStar(n.secondary)
  const VLN = p.VLL / Math.sqrt(3)
  const sB = p.seq === 'abc' ? -120 : 120
  // supply line-to-neutral voltages; the supply neutral is the reference (0 V)
  const sup: Tri = [polar(VLN, 0), polar(VLN, sB), polar(VLN, -sB)]
  const Vpri = new Map<PriNode, C>([['A', sup[0]], ['B', sup[1]], ['C', sup[2]], ['N', ZERO]])
  const VwP = n.primary.map((x) => sub(Vpri.get(x.dot)!, Vpri.get(x.other)!)) as Tri
  const VwS = VwP.map((v) => scale(v, 1 / p.a)) as Tri
  const Vsec = potentials<SecNode>(n.secondary, VwS, 'n', ['a', 'b', 'c'])
  const VlnS: Tri = [Vsec.get('a')!, Vsec.get('b')!, Vsec.get('c')!]

  // balanced load: I_x = ((S/3)∠θ / V_xn)*
  const theta = (p.lagging ? 1 : -1) * Math.acos(Math.min(1, Math.max(0, p.pf)))
  const Sph = polar(p.S3 / 3, theta / DEG)
  const IlineS = VlnS.map((v) => (p.S3 === 0 ? ZERO : conj(div(Sph, v)))) as Tri
  const IwS = windingCurrents<SecNode>(
    n.secondary, secStar ? ['a', 'b', 'c', 'n'] : ['a', 'b', 'c'],
    new Map<SecNode, C>([['a', IlineS[0]], ['b', IlineS[1]], ['c', IlineS[2]], ['n', ZERO]]), secStar,
  )
  const IwP = IwS.map((i) => scale(i, 1 / p.a)) as Tri
  // primary line currents by KCL at each primary node (current from the supply into the node)
  const into = (x: PriNode) => n.primary.reduce((s, wd, k) => add(s, scale(IwP[k], (wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0))), ZERO)
  const IlineP: Tri = [into('A'), into('B'), into('C')]

  const sumS = (V: Tri, I: Tri) => V.reduce((s, v, k) => add(s, mul(v, conj(I[k]))), ZERO)
  const loopSum = (ws: readonly Winding<string>[], Vw: Tri) => {
    const o = loopOrientation(ws)
    return Vw.reduce((s, v, k) => add(s, scale(v, o[k])), ZERO)
  }
  const side = (star: boolean, Vw: Tri, Iw: Tri, Vln: Tri, Iline: Tri, ws: readonly Winding<string>[], In: C): Side => {
    const VllT = lineLine(Vln)
    return {
      star, Vw, Iw, Vln, Vll: VllT, Iline, Ineutral: In,
      Swind: sumS(Vw, Iw), Sline: sumS(Vln, Iline),
      VLLmag: abs(VllT[0]), VLNmag: abs(Vln[0]), Vp: abs(Vw[0]), IL: abs(Iline[0]), Ip: abs(Iw[0]),
      deltaLoopV: star ? ZERO : loopSum(ws, Vw),
    }
  }
  const pri = side(priStar, VwP, IwP, sup, IlineP, n.primary, priStar ? scale(into('N'), -1) : ZERO)
  const sec = side(secStar, VwS, IwS, VlnS, IlineS, n.secondary, ZERO)
  return {
    params: p, pri, sec, theta,
    ratio: pri.VLLmag / sec.VLLmag,
    shiftDeg: wrapDeg(argDeg(sec.Vll[0]) - argDeg(pri.Vll[0])),
    Sload: polar(p.S3, theta / DEG),
  }
}

/** Bank of three identical single-phase units: derive a, V_LL and the rated S_3φ. */
export function fromUnitRating(n: Netlist, unitVpri: number, unitVsec: number, Sunit: number): { a: number; VLL: number; Srated: number } {
  return {
    a: unitVpri / unitVsec,
    VLL: isStar(n.primary) ? Math.sqrt(3) * unitVpri : unitVpri,
    Srated: 3 * Sunit,
  }
}

/* ------------------------------------------------------------------ */
/* Time domain                                                          */
/* ------------------------------------------------------------------ */

/** v(t) = √2 Re[V e^{jωt}] for an RMS phasor, at the angle wt = ωt (rad). */
export const atPhase = (z: C, wt: number): number => Math.SQRT2 * (z.re * Math.cos(wt) - z.im * Math.sin(wt))

export interface Instant {
  pri: { Vln: number[]; Vll: number[]; Vw: number[]; Iw: number[]; Iline: number[] }
  sec: { Vln: number[]; Vll: number[]; Vw: number[]; Iw: number[]; Iline: number[] }
  /** Third-harmonic view (illustrative): supply phase voltages with amplitude h of third harmonic. */
  harmonic: {
    /** v_kN(t) = √2 V_LN [cos(ωt+ψ_k) + h cos 3(ωt+ψ_k)], k = A, B, C. */
    phase: number[]
    /** The third-harmonic part of each phase voltage (identical for the three phases). */
    third: number[]
    /** v_AB, v_BC, v_CA formed from the distorted phase voltages: no third harmonic. */
    lineLine: number[]
    /** Third-harmonic part of each line-to-line voltage (zero). */
    lineLineThird: number[]
    /** Sum of the three third-harmonic parts around a delta: 3 × one of them. */
    deltaThirdSum: number
  }
}

/** Every voltage and current at the angle ωt (rad), plus the third-harmonic view with amplitude h. */
export function instantaneousAtPhase(s: Solution, wt: number, h = 0): Instant {
  const side = (x: Side) => ({
    Vln: x.Vln.map((z) => atPhase(z, wt)), Vll: x.Vll.map((z) => atPhase(z, wt)), Vw: x.Vw.map((z) => atPhase(z, wt)),
    Iw: x.Iw.map((z) => atPhase(z, wt)), Iline: x.Iline.map((z) => atPhase(z, wt)),
  })
  const psi = s.params.seq === 'abc' ? [0, -120, 120] : [0, 120, -120]
  const amp = Math.SQRT2 * s.pri.VLNmag
  const fund = psi.map((d) => amp * Math.cos(wt + d * DEG))
  const third = psi.map((d) => amp * h * Math.cos(3 * (wt + d * DEG)))
  const phase = fund.map((v, k) => v + third[k])
  const ll = (x: number[]) => [x[0] - x[1], x[1] - x[2], x[2] - x[0]]
  return {
    pri: side(s.pri), sec: side(s.sec),
    harmonic: {
      phase, third, lineLine: ll(phase), lineLineThird: ll(third),
      deltaThirdSum: third[0] + third[1] + third[2],
    },
  }
}

/** Every voltage and current at time t (s). */
export function instantaneous(s: Solution, t: number, h = 0): Instant {
  return instantaneousAtPhase(s, 2 * Math.PI * s.params.f * t, h)
}
