import { C, ZERO, abs, add, arg, c, cis, conj, exp, mul, sub } from './complex'
import type { InterfaceSolution, Vec3C } from './interface'

export type Part = 'total' | 'inc' | 'ref' | 'trans'
export type Quantity = 'E' | 'H'
export type Axis = 'x' | 'y' | 'z'

/**
 * Every field has the form  F(x, z) = e^{-j k_x x} * g(z).
 * `xFactor` and `zProfile` are the two factors; all other field functions are built on them,
 * so the map, the plots and the numbers can never disagree.
 */
export const xFactor = (sol: InterfaceSolution, x: number): C => cis(-sol.kx * x)

/**
 * Phasor at x = 0 of one Cartesian component of one wave at depth z.
 * `side` forces the medium (1 or 2); by default z < 0 is Medium 1 and z >= 0 is Medium 2.
 * Incident and reflected waves exist only in Medium 1, the transmitted wave only in Medium 2.
 */
export function zProfile(
  sol: InterfaceSolution,
  part: Part,
  q: Quantity,
  axis: Axis,
  z: number,
  side: 1 | 2 = z < 0 ? 1 : 2,
): C {
  if (side === 1) {
    if (part === 'trans') return ZERO
    let v = ZERO
    if (part !== 'ref') v = mul(sol.amp.inc[q][axis], cis(-sol.k1z * z))
    if (part !== 'inc') v = add(v, mul(sol.amp.ref[q][axis], cis(sol.k1z * z)))
    return v
  }
  if (part === 'inc' || part === 'ref' || sol.regime === 'pec') return ZERO
  // e^{-j k_2z z} with k_2z = b - j a  ->  e^{-a z} e^{-j b z}
  return mul(sol.amp.trans[q][axis], exp(c(sol.k2z.im * z, -sol.k2z.re * z)))
}

export function fieldComponent(
  sol: InterfaceSolution, part: Part, q: Quantity, axis: Axis, x: number, z: number, side?: 1 | 2,
): C {
  return mul(xFactor(sol, x), zProfile(sol, part, q, axis, z, side))
}

export function fieldVector(
  sol: InterfaceSolution, part: Part, q: Quantity, x: number, z: number, side?: 1 | 2,
): Vec3C {
  return {
    x: fieldComponent(sol, part, q, 'x', x, z, side),
    y: fieldComponent(sol, part, q, 'y', x, z, side),
    z: fieldComponent(sol, part, q, 'z', x, z, side),
  }
}

export interface FieldPoint {
  inc: { E: Vec3C; H: Vec3C }
  ref: { E: Vec3C; H: Vec3C }
  trans: { E: Vec3C; H: Vec3C }
  total: { E: Vec3C; H: Vec3C }
}

/** Complex phasors of E and H (incident, reflected, transmitted, total) at the point (x, z). */
export function fieldAt(sol: InterfaceSolution, x: number, z: number, side?: 1 | 2): FieldPoint {
  const one = (part: Part) => ({
    E: fieldVector(sol, part, 'E', x, z, side),
    H: fieldVector(sol, part, 'H', x, z, side),
  })
  return { inc: one('inc'), ref: one('ref'), trans: one('trans'), total: one('total') }
}

/** Fill arrays with the z-profile at many depths (used by the field map and the 1-D plot). */
export function sampleZProfile(
  sol: InterfaceSolution, part: Part, q: Quantity, axis: Axis,
  zs: ArrayLike<number>, outRe: Float32Array | Float64Array, outIm: Float32Array | Float64Array,
): void {
  for (let i = 0; i < zs.length; i++) {
    const v = zProfile(sol, part, q, axis, zs[i])
    outRe[i] = v.re
    outIm[i] = v.im
  }
}

/** z-component of the time-average Poynting vector, (1/2) Re(E x H*) . a_z  (W/m^2). */
export function avgPoyntingZ(sol: InterfaceSolution, part: Part, z: number, side?: 1 | 2): number {
  const E = fieldVector(sol, part, 'E', 0, z, side)
  const H = fieldVector(sol, part, 'H', 0, z, side)
  return 0.5 * sub(mul(E.x, conj(H.y)), mul(E.y, conj(H.x))).re
}

/** x-component of the time-average Poynting vector (W/m^2). */
export function avgPoyntingX(sol: InterfaceSolution, part: Part, z: number, side?: 1 | 2): number {
  const E = fieldVector(sol, part, 'E', 0, z, side)
  const H = fieldVector(sol, part, 'H', 0, z, side)
  return 0.5 * sub(mul(E.y, conj(H.z)), mul(E.z, conj(H.y))).re
}

/** Time-average power density of the incident wave along its own direction, E_i0^2 / (2 eta_1). */
export const incidentPowerDensity = (sol: InterfaceSolution): number => (sol.e0 * sol.e0) / (2 * sol.p1.eta.re)

/** Fraction of the z-directed incident power found in Medium 2 at z = 0+, computed from the fields. */
export function transmittedFractionFromFields(sol: InterfaceSolution): number {
  return avgPoyntingZ(sol, 'trans', 0, 2) / avgPoyntingZ(sol, 'inc', 0, 1)
}

/**
 * Surface current on a perfect conductor, J_s = a_n x H with a_n = -a_z (pointing into Medium 1),
 * as a phasor at x = 0 (A/m). Zero vector when Medium 2 is not PEC.
 */
export function surfaceCurrent(sol: InterfaceSolution): { x: C; y: C } {
  if (sol.regime !== 'pec') return { x: ZERO, y: ZERO }
  const H = fieldVector(sol, 'total', 'H', 0, 0, 1)
  // -a_z x (a_x Hx + a_y Hy) = -a_y Hx + a_x Hy
  return { x: H.y, y: c(-H.x.re, -H.x.im) }
}

export interface StandingWave {
  /** Standing-wave ratio S = (1 + |Gamma|) / (1 - |Gamma|); Infinity when |Gamma| = 1. */
  S: number
  /** Positions (z <= 0, nearest the interface first) of the maxima of the y-directed field magnitude. */
  zMax: number[]
  zMin: number[]
  /** What the y-directed total field magnitude does at z = 0. */
  atInterface: 'max' | 'min' | 'neither'
}

/**
 * Standing-wave pattern in Medium 1 of the field that carries Gamma directly:
 * |1 + Gamma e^{j 2 k_1z z}|. For normal incidence this is |E| (Cheng 8-8).
 */
export function standingWave(sol: InterfaceSolution, count = 4): StandingWave {
  const mag = Math.min(1, abs(sol.Gamma))
  const S = mag >= 1 - 1e-12 ? Infinity : (1 + mag) / (1 - mag)
  const th = arg(sol.Gamma)
  // Phase tolerance: a good conductor gives Gamma = -1 + (tiny) j, whose minimum is at the interface for all purposes.
  const TOL = 1e-4
  // maxima: th + 2 k z = -2 n pi, with th taken in [0, 2 pi)
  let thMax = th < 0 ? th + 2 * Math.PI : th
  if (thMax > 2 * Math.PI - TOL || thMax < TOL) thMax = 0
  // minima: th + 2 k z = -(2n + 1) pi, with th taken in [-pi, pi)
  let thMin = th > Math.PI - TOL ? th - 2 * Math.PI : th
  if (Math.abs(thMin + Math.PI) < TOL) thMin = -Math.PI
  const zMax: number[] = []
  const zMin: number[] = []
  for (let n = 0; n < count; n++) {
    zMax.push(Math.min(0, -(thMax + 2 * n * Math.PI) / (2 * sol.k1z)) + 0)
    zMin.push(Math.min(0, -(thMin + (2 * n + 1) * Math.PI) / (2 * sol.k1z)) + 0)
  }
  const atInterface = mag < 1e-12 ? 'neither' : thMax === 0 ? 'max' : thMin === -Math.PI ? 'min' : 'neither'
  return { S, zMax, zMin, atInterface }
}
