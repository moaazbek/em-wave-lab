import type { InterfaceSolution } from '../../physics'

/**
 * Mapping between physical coordinates (metres) and screen pixels.
 * z runs to the right, x runs upward, the boundary z = 0 is a vertical line.
 * Medium 1 is drawn to scale. Medium 2 shares that scale unless its fields vary so
 * fast in z that nothing would be visible; then its z axis alone is magnified.
 */
export interface Viewport {
  W: number
  H: number
  /** Screen x of the boundary. */
  bx: number
  /** Screen y of x = 0. */
  cy: number
  /** Pixels per metre in Medium 1 (both axes) and along x in Medium 2. */
  ppm: number
  /** Pixels per metre along z in Medium 2. */
  ppm2z: number
  magnified: boolean
  /** ppm2z / ppm */
  mag: number
  /** Number of lambda_1 across the Medium 1 panel. */
  n1: number
}

export const BOUNDARY_FRACTION = 0.56
/** Magnify Medium 2 when its z-variation length is below lambda_1 / this. */
const MAGNIFY_BELOW = 14

export function makeViewport(W: number, H: number, sol: InterfaceSolution): Viewport {
  const bx = Math.round(W * BOUNDARY_FRACTION)
  const n1 = Math.min(3.4, Math.max(1.6, bx / 125))
  const ppm = bx / (n1 * sol.p1.lambda)
  let ppm2z = ppm
  let magnified = false
  if (sol.regime !== 'pec') {
    const kmag = Math.hypot(sol.k2z.re, sol.k2z.im)
    const len = (2 * Math.PI) / kmag // length of one "cycle" of variation along z in Medium 2
    if (len < sol.p1.lambda / MAGNIFY_BELOW) {
      magnified = true
      const lossiness = Math.min(1, Math.abs(sol.k2z.im) / Math.max(sol.k2z.re, 1e-300))
      const span = len * (3 - 1.85 * lossiness)
      ppm2z = (W - bx) / span
    }
  }
  return { W, H, bx, cy: H / 2, ppm, ppm2z, magnified, mag: ppm2z / ppm, n1 }
}

export const zToPx = (v: Viewport, z: number): number => v.bx + z * (z < 0 ? v.ppm : v.ppm2z)
export const pxToZ = (v: Viewport, px: number): number => (px - v.bx) / (px < v.bx ? v.ppm : v.ppm2z)
export const xToPx = (v: Viewport, x: number): number => v.cy - x * v.ppm
export const pxToX = (v: Viewport, py: number): number => (v.cy - py) / v.ppm
