/**
 * Three-phase transformer connections — Chapman, Electric Machinery Fundamentals, 5th ed., § 2.10.
 * Pure TypeScript: no UI imports. Every number, phasor, waveform and moving dot of the lab reads from here.
 *
 * Model: a bank of three identical single-phase transformers. Ideal (no winding impedance, no magnetizing
 * current), or "real bank": Chapman's approximate per-phase equivalent circuit of each transformer (excitation
 * branch at the primary terminals, then R_eq + jX_eq), with every value referred to the LV (secondary) side.
 * The ideal model is the real one with Z_SE = 0 and no excitation branch.
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
  /**
   * Real bank (absent: ideal). V_LL and a are then the rated values. S3 is the load at rated secondary voltage,
   * so each winding carries |I_φS| = (S3/3)/V_φS,rated.
   */
  real?: RealParams
}

export interface RealParams {
  /** Series impedance of one transformer referred to the LV (secondary) side, Z_SE,S = R_eq,S + jX_eq,S (Ω). */
  ZseS: C
  /** Excitation admittance referred to the secondary side, Y_E,S = G_C,S − jB_M,S (S); null = shunt branch neglected. */
  YeS: C | null
  /** Rated winding voltages of one transformer (V). */
  VphiP: number
  VphiS: number
  /** 'sec': V_φS held at its rated value (Chapman's VR definition); 'pri': |V_φP| held at its rated value. */
  hold: 'sec' | 'pri'
}

/** Per-phase quantities of one transformer (T1), in its own frame: V_φS (ideal-netlist angle) at 0°. */
export interface RealOut {
  VphiS: C
  IphiS: C
  VphiP: C
  IphiP: C
  /** V_φP / a: the primary voltage referred to the secondary side (Eq. 2-64). */
  VPa: C
  /** Excitation current, referred to the primary (HV) side: V_φP · Y_E,P. */
  Iex: C
  /** Load angle: V_φP leads aV_φS by δ (degrees). */
  deltaDeg: number
  /** Voltage regulation (%), Eq. (2-62). */
  VR: number
  /** Bank powers (×3): copper and core losses, reactive power of windings and core, output and input (W, var). */
  Pcu: number
  Pcore: number
  Qwind: number
  Qcore: number
  Pout: number
  Qout: number
  /** S_in = Σ V_Pk I_Pk* at the primary terminals (computed independently of the losses). */
  Sin: C
  /** Efficiency (%), Eq. (2-67), and the input power factor. */
  eta: number
  pfIn: number
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
  /** Real bank only. */
  real?: RealOut
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

const sumS = (V: Tri, I: Tri) => V.reduce((s, v, k) => add(s, mul(v, conj(I[k]))), ZERO)
const loopSum = (ws: readonly Winding<string>[], Vw: Tri) => {
  const o = loopOrientation(ws)
  return Vw.reduce((s, v, k) => add(s, scale(v, o[k])), ZERO)
}
function makeSide(star: boolean, Vw: Tri, Iw: Tri, Vln: Tri, Iline: Tri, ws: readonly Winding<string>[], In: C): Side {
  const VllT = lineLine(Vln)
  return {
    star, Vw, Iw, Vln, Vll: VllT, Iline, Ineutral: In,
    Swind: sumS(Vw, Iw), Sline: sumS(Vln, Iline),
    VLLmag: abs(VllT[0]), VLNmag: abs(Vln[0]), Vp: abs(Vw[0]), IL: abs(Iline[0]), Ip: abs(Iw[0]),
    deltaLoopV: star ? ZERO : loopSum(ws, Vw),
  }
}

/** Secondary line currents of a balanced load S_3φ∠θ and the winding currents that carry them (KCL). */
function secondaryCurrents(n: Netlist, VlnS: Tri, S3: number, theta: number): { IlineS: Tri; IwS: Tri } {
  const secStar = isStar(n.secondary)
  const Sph = polar(S3 / 3, theta / DEG)
  const IlineS = VlnS.map((v) => (S3 === 0 ? ZERO : conj(div(Sph, v)))) as Tri
  const IwS = windingCurrents<SecNode>(
    n.secondary, secStar ? ['a', 'b', 'c', 'n'] : ['a', 'b', 'c'],
    new Map<SecNode, C>([['a', IlineS[0]], ['b', IlineS[1]], ['c', IlineS[2]], ['n', ZERO]]), secStar,
  )
  return { IlineS, IwS }
}

/** Load angle θ (rad): +acos(PF) lagging, −acos(PF) leading. */
export const loadAngle = (pf: number, lagging: boolean) => (lagging ? 1 : -1) * Math.acos(Math.min(1, Math.max(0, pf)))

/**
 * Mode "primary at rated voltage": |V_φS| from Eq. (2-64) with |V_φP| fixed and V_φS as the angle reference.
 * With u = Z_SE,S |I_φS| ∠−θ: |V_φS| = −Re u + √((|V_φP|/a)² − Im(u)²). Null when no real solution exists.
 */
export function secondaryVoltageForPrimary(VphiPmag: number, a: number, ZseS: C, Imag: number, theta: number): number | null {
  const u = mul(ZseS, polar(Imag, -theta / DEG))
  const disc = (VphiPmag / a) ** 2 - u.im ** 2
  if (disc < 0) return null
  const v = -u.re + Math.sqrt(disc)
  return v > 0 ? v : null
}

export function solve(p: Params): Solution {
  if (p.real) return solveReal(p, p.real)
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
  const theta = loadAngle(p.pf, p.lagging)
  const { IlineS, IwS } = secondaryCurrents(n, VlnS, p.S3, theta)
  const IwP = IwS.map((i) => scale(i, 1 / p.a)) as Tri
  // primary line currents by KCL at each primary node (current from the supply into the node)
  const into = (x: PriNode) => n.primary.reduce((s, wd, k) => add(s, scale(IwP[k], (wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0))), ZERO)
  const IlineP: Tri = [into('A'), into('B'), into('C')]

  const pri = makeSide(priStar, VwP, IwP, sup, IlineP, n.primary, priStar ? scale(into('N'), -1) : ZERO)
  const sec = makeSide(secStar, VwS, IwS, VlnS, IlineS, n.secondary, ZERO)
  return {
    params: p, pri, sec, theta,
    ratio: pri.VLLmag / sec.VLLmag,
    shiftDeg: wrapDeg(argDeg(sec.Vll[0]) - argDeg(pri.Vll[0])),
    Sload: polar(p.S3, theta / DEG),
  }
}

/**
 * Real bank. The secondary windings sit at the angles the ideal netlist gives them (supply V_AN at 0°), with
 * |V_φS| = rated ('sec') or from Eq. (2-64) ('pri'). Each transformer k: V_Pk = a(V_Sk + Z_SE,S I_Sk) and
 * a I_Pk = I_Sk + (V_Pk/a) Y_E,S. Node voltages and line currents then come from the same netlist code.
 */
function solveReal(p: Params, r: RealParams): Solution {
  const n = p.netlist
  const priStar = isStar(n.primary), secStar = isStar(n.secondary)
  const theta = loadAngle(p.pf, p.lagging)
  // the ideal netlist's secondary winding angles
  const VLN = p.VLL / Math.sqrt(3)
  const sB = p.seq === 'abc' ? -120 : 120
  const sup: Tri = [polar(VLN, 0), polar(VLN, sB), polar(VLN, -sB)]
  const Vsup = new Map<PriNode, C>([['A', sup[0]], ['B', sup[1]], ['C', sup[2]], ['N', ZERO]])
  const dirS = n.primary.map((x) => { const v = sub(Vsup.get(x.dot)!, Vsup.get(x.other)!); return scale(v, 1 / abs(v)) }) as Tri
  const Imag = p.S3 / 3 / r.VphiS
  const Vmag = r.hold === 'sec' ? r.VphiS : secondaryVoltageForPrimary(r.VphiP, p.a, r.ZseS, Imag, theta)
  if (Vmag === null) throw new Error('No secondary voltage satisfies Eq. (2-64) with this primary voltage and load.')
  const VwS = dirS.map((u) => scale(u, Vmag)) as Tri
  const Vsec = potentials<SecNode>(n.secondary, VwS, 'n', ['a', 'b', 'c'])
  const VlnS: Tri = [Vsec.get('a')!, Vsec.get('b')!, Vsec.get('c')!]
  const { IlineS, IwS } = secondaryCurrents(n, VlnS, 3 * Vmag * Imag, theta)
  // each transformer from its own winding quantities
  const VwP = VwS.map((v, k) => scale(add(v, mul(r.ZseS, IwS[k])), p.a)) as Tri
  const IwP = IwS.map((i, k) => scale(r.YeS ? add(i, mul(scale(VwP[k], 1 / p.a), r.YeS)) : i, 1 / p.a)) as Tri
  const Vpri = potentials<PriNode>(n.primary, VwP, 'N', ['A', 'B', 'C'])
  const VlnP: Tri = [Vpri.get('A')!, Vpri.get('B')!, Vpri.get('C')!]
  const into = (x: PriNode) => n.primary.reduce((s, wd, k) => add(s, scale(IwP[k], (wd.dot === x ? 1 : 0) - (wd.other === x ? 1 : 0))), ZERO)
  const IlineP: Tri = [into('A'), into('B'), into('C')]
  const pri = makeSide(priStar, VwP, IwP, VlnP, IlineP, n.primary, priStar ? scale(into('N'), -1) : ZERO)
  const sec = makeSide(secStar, VwS, IwS, VlnS, IlineS, n.secondary, ZERO)

  // per-phase quantities of T1 in its own frame (V_φS at 0°)
  const rot = polar(1, -argDeg(VwS[0]))
  const fr = (z: C) => mul(z, rot)
  const VPa = scale(VwP[0], 1 / p.a)
  const I1 = abs(IwS[0]), V1 = abs(VPa)
  const G = r.YeS ? r.YeS.re : 0, Bm = r.YeS ? -r.YeS.im : 0
  const Pcu = 3 * I1 * I1 * r.ZseS.re, Qwind = 3 * I1 * I1 * r.ZseS.im
  const Pcore = 3 * V1 * V1 * G, Qcore = 3 * V1 * V1 * Bm
  const Sout = scale(sumS(VwS, IwS), 1)
  const Sin = pri.Swind
  return {
    params: p, pri, sec, theta,
    ratio: pri.VLLmag / sec.VLLmag,
    shiftDeg: wrapDeg(argDeg(sec.Vll[0]) - argDeg(pri.Vll[0])),
    Sload: Sout,
    real: {
      VphiS: fr(VwS[0]), IphiS: fr(IwS[0]), VphiP: fr(VwP[0]), IphiP: fr(IwP[0]), VPa: fr(VPa),
      Iex: fr(r.YeS ? mul(VwP[0], scale(r.YeS, 1 / (p.a * p.a))) : ZERO),
      deltaDeg: wrapDeg(argDeg(VwP[0]) - argDeg(VwS[0])),
      VR: ((V1 - Vmag) / Vmag) * 100,
      Pcu, Pcore, Qwind, Qcore, Pout: Sout.re, Qout: Sout.im, Sin,
      eta: Sout.re + Pcu + Pcore > 0 ? (Sout.re / (Sout.re + Pcu + Pcore)) * 100 : 100,
      pfIn: abs(Sin) > 0 ? Sin.re / abs(Sin) : 1,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Real bank: ratings, test data, per-unit, referral                     */
/* ------------------------------------------------------------------ */

/** Ratings of the bank and of one transformer (section "bank rating to unit rating", Problem 2-10). */
export interface Rating {
  /** Bank S and one transformer's S_φ = S/3 (VA). */
  S: number
  Sphi: number
  /** Line-to-line voltages of the primary and secondary sides (V). */
  VLL: number
  Vll: number
  /** Rated winding voltages of one transformer (V) and its turns ratio a = V_φP / V_φS. */
  VphiP: number
  VphiS: number
  a: number
}

/** From the bank rating (S, V_LL, V_ll) and the connection: V_φ = V_line on a Δ side, V_line/√3 on a Y side. */
export function ratingFromBank(n: Netlist, S: number, VLL: number, Vll: number): Rating {
  const VphiP = isStar(n.primary) ? VLL / Math.sqrt(3) : VLL
  const VphiS = isStar(n.secondary) ? Vll / Math.sqrt(3) : Vll
  return { S, Sphi: S / 3, VLL, Vll, VphiP, VphiS, a: VphiP / VphiS }
}

/** From one transformer's rating (S_φ, V_φP, V_φS) and the connection. */
export function ratingFromUnit(n: Netlist, Sphi: number, VphiP: number, VphiS: number): Rating {
  const VLL = isStar(n.primary) ? Math.sqrt(3) * VphiP : VphiP
  const Vll = isStar(n.secondary) ? Math.sqrt(3) * VphiS : VphiS
  return { S: 3 * Sphi, Sphi, VLL, Vll, VphiP, VphiS, a: VphiP / VphiS }
}

/** Per-unit bases of each side (Chapman Eqs. 2-92 to 2-95): the transformer's own ratings. */
export interface Bases {
  SphiBase: number
  /** Winding (phase) voltage, impedance, winding current and line current bases of the primary and secondary. */
  VphiBaseP: number
  VphiBaseS: number
  ZbaseP: number
  ZbaseS: number
  IphiBaseP: number
  IphiBaseS: number
  ILbaseP: number
  ILbaseS: number
}
export function bases(r: Rating): Bases {
  const SphiBase = r.S / 3 // (2-92)
  return {
    SphiBase, VphiBaseP: r.VphiP, VphiBaseS: r.VphiS,
    ZbaseP: (r.VphiP * r.VphiP) / SphiBase, ZbaseS: (r.VphiS * r.VphiS) / SphiBase, // (2-94a)
    IphiBaseP: SphiBase / r.VphiP, IphiBaseS: SphiBase / r.VphiS, // (2-93a)
    ILbaseP: r.S / (Math.sqrt(3) * r.VLL), ILbaseS: r.S / (Math.sqrt(3) * r.Vll), // (2-95)
  }
}

export interface Reading {
  V: number
  I: number
  P: number
}

/**
 * Test readings to one transformer's values. Bank line readings use the connection of the side where the test
 * was done: Y side V_φ = V_line/√3, I_φ = I_line; Δ side V_φ = V_line, I_φ = I_line/√3; P_φ = P_3φ/3 on both.
 */
export function toOneTransformer(r: Reading, form: 'bank' | 'unit', star: boolean): Reading {
  if (form === 'unit') return { ...r }
  const R3 = Math.sqrt(3)
  return star ? { V: r.V / R3, I: r.I, P: r.P / 3 } : { V: r.V, I: r.I / R3, P: r.P / 3 }
}

export interface OcResult {
  /** |Y_E| = I_OC/V_OC (2-44), θ = acos(P/VI) (2-46, rad), Y_E = |Y_E|∠−θ (2-47). */
  Ymag: number
  theta: number
  Y: C
  GC: number
  BM: number
  RC: number
  XM: number
}
export interface ScResult {
  /** |Z_SE| = V_SC/I_SC (2-48), θ = acos(P/VI) (2-50, rad), Z_SE = |Z_SE|∠θ = R_eq + jX_eq (2-51, 2-52). */
  Zmag: number
  theta: number
  Z: C
  Req: number
  Xeq: number
}

/** Why the readings cannot be used, or null. */
export function readingProblem(r: Reading): string | null {
  if (!(r.V > 0) || !(r.I > 0)) return 'V and I must be positive.'
  if (r.P < 0) return 'The wattmeter reading cannot be negative.'
  if (r.P > r.V * r.I * (1 + 1e-12)) return 'The wattmeter reading cannot exceed V·I.'
  return null
}

/** Open-circuit test on one transformer: results referred to the side where the test was done. */
export function openCircuitTest(r: Reading): OcResult {
  const Ymag = r.I / r.V // (2-44)
  const theta = Math.acos(Math.min(1, r.P / (r.V * r.I))) // (2-46)
  const Y = polar(Ymag, -theta / DEG) // (2-47)
  const GC = Y.re, BM = -Y.im
  return { Ymag, theta, Y, GC, BM, RC: GC > 0 ? 1 / GC : Infinity, XM: BM > 0 ? 1 / BM : Infinity } // (2-40), (2-41)
}

/** Short-circuit test on one transformer: results referred to the side where the test was done. */
export function shortCircuitTest(r: Reading): ScResult {
  const Zmag = r.V / r.I // (2-48)
  const theta = Math.acos(Math.min(1, r.P / (r.V * r.I))) // (2-50)
  const Z = polar(Zmag, theta / DEG) // (2-51), (2-52)
  return { Zmag, theta, Z, Req: Z.re, Xeq: Z.im }
}

/** One transformer's equivalent-circuit values on one side (Ω), or in per-unit. R_C / X_M are null when neglected. */
export interface CircuitValues {
  Req: number
  Xeq: number
  RC: number | null
  XM: number | null
}
export interface Circuit {
  /** Working values, referred to the secondary side. */
  ZseS: C
  YeS: C | null
  /** The same circuit referred to the primary, to the secondary, and in per-unit. */
  P: CircuitValues
  S: CircuitValues
  pu: CircuitValues
}

/** Build the working circuit from values referred to one side ('P', 'S') or given in per-unit ('pu'). */
export function circuitFrom(v: CircuitValues, side: 'P' | 'S' | 'pu', rating: Rating): Circuit {
  const b = bases(rating)
  const toS = side === 'S' ? 1 : side === 'P' ? 1 / (rating.a * rating.a) : b.ZbaseS // Z_S = Z_P/a², Z_S = Z_pu Z_base,S
  const sh = (x: number | null) => (x === null ? null : x * toS)
  const S: CircuitValues = { Req: v.Req * toS, Xeq: v.Xeq * toS, RC: sh(v.RC), XM: sh(v.XM) }
  const map = (k: number): CircuitValues => ({ Req: S.Req * k, Xeq: S.Xeq * k, RC: S.RC === null ? null : S.RC * k, XM: S.XM === null ? null : S.XM * k })
  const shunt = S.RC !== null || S.XM !== null
  const YeS = shunt ? c(S.RC !== null && Number.isFinite(S.RC) ? 1 / S.RC : 0, -(S.XM !== null && Number.isFinite(S.XM) ? 1 / S.XM : 0)) : null
  return { ZseS: c(S.Req, S.Xeq), YeS, S, P: map(rating.a * rating.a), pu: map(1 / b.ZbaseS) }
}

/** One test as the student enters it. */
export interface TestInput {
  /** Side where the test was done. */
  side: 'P' | 'S'
  form: 'bank' | 'unit'
  reading: Reading
}

export interface FromTests {
  oc: { perPhase: Reading; result: OcResult } | null
  sc: { perPhase: Reading; result: ScResult } | null
  circuit: Circuit
}

/** Equivalent circuit from the OC and SC tests (either may be absent: shunt branch neglected, or Z_SE = 0). */
export function circuitFromTests(n: Netlist, rating: Rating, oc: TestInput | null, sc: TestInput | null): { ok: true; value: FromTests } | { ok: false; reason: string; test: 'OC' | 'SC' } {
  const starOf = (side: 'P' | 'S') => isStar(side === 'P' ? n.primary : n.secondary)
  let ocOut: FromTests['oc'] = null, scOut: FromTests['sc'] = null
  const toS = (side: 'P' | 'S') => (side === 'P' ? 1 / (rating.a * rating.a) : 1)
  let RC: number | null = null, XM: number | null = null, Req = 0, Xeq = 0
  if (oc) {
    const perPhase = toOneTransformer(oc.reading, oc.form, starOf(oc.side))
    const bad = readingProblem(perPhase)
    if (bad) return { ok: false, reason: bad, test: 'OC' }
    const result = openCircuitTest(perPhase)
    ocOut = { perPhase, result }
    RC = result.RC * toS(oc.side); XM = result.XM * toS(oc.side)
  }
  if (sc) {
    const perPhase = toOneTransformer(sc.reading, sc.form, starOf(sc.side))
    const bad = readingProblem(perPhase)
    if (bad) return { ok: false, reason: bad, test: 'SC' }
    const result = shortCircuitTest(perPhase)
    scOut = { perPhase, result }
    Req = result.Req * toS(sc.side); Xeq = result.Xeq * toS(sc.side)
  }
  return { ok: true, value: { oc: ocOut, sc: scOut, circuit: circuitFrom({ Req, Xeq, RC, XM }, 'S', rating) } }
}

/** Real-bank parameters for the solver from a rating and a circuit. */
export const realParams = (rating: Rating, circuit: Circuit, hold: 'sec' | 'pri'): RealParams => ({
  ZseS: circuit.ZseS, YeS: circuit.YeS, VphiP: rating.VphiP, VphiS: rating.VphiS, hold,
})

/** VR and η against the load fraction of rated (0 … 1.25), for the plots. */
export function sweepLoad(base: Params, Srated: number, fractions: readonly number[]): { x: number; VR: number; eta: number }[] {
  return fractions.map((x) => {
    const s = solve({ ...base, S3: x * Srated })
    return { x, VR: s.real!.VR, eta: s.real!.eta }
  })
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
