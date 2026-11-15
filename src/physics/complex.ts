/** Minimal complex-number module. Pure functions on immutable {re, im} pairs. */

export interface C {
  readonly re: number
  readonly im: number
}

export const c = (re: number, im = 0): C => ({ re, im })
export const ZERO: C = c(0, 0)
export const ONE: C = c(1, 0)
export const J: C = c(0, 1)

export const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im)
export const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im)
export const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
export const scale = (a: C, k: number): C => c(a.re * k, a.im * k)
export const neg = (a: C): C => c(-a.re, -a.im)
export const conj = (a: C): C => c(a.re, -a.im)
export const abs = (a: C): number => Math.hypot(a.re, a.im)
export const abs2 = (a: C): number => a.re * a.re + a.im * a.im
/** Argument in (-pi, pi]. */
export const arg = (a: C): number => Math.atan2(a.im, a.re)

/** Smith's algorithm: avoids overflow when |b| is very large or very small. */
export function div(a: C, b: C): C {
  if (Math.abs(b.re) >= Math.abs(b.im)) {
    const r = b.im / b.re
    const d = b.re + b.im * r
    return c((a.re + a.im * r) / d, (a.im - a.re * r) / d)
  }
  const r = b.re / b.im
  const d = b.re * r + b.im
  return c((a.re * r + a.im) / d, (a.im * r - a.re) / d)
}

/**
 * Principal square root (Re >= 0; for negative real input the result is +j*sqrt|x|).
 * Written to avoid cancellation, so a tiny real or imaginary part keeps full precision.
 */
export function sqrt(a: C): C {
  if (a.re === 0 && a.im === 0) return ZERO
  const m = abs(a)
  if (a.re >= 0) {
    const t = Math.sqrt((m + a.re) / 2)
    return c(t, a.im / (2 * t))
  }
  const t = Math.sqrt((m - a.re) / 2)
  return c(Math.abs(a.im) / (2 * t), a.im < 0 ? -t : t)
}

export const exp = (a: C): C => {
  const m = Math.exp(a.re)
  return c(m * Math.cos(a.im), m * Math.sin(a.im))
}

/** e^{j*phi} */
export const cis = (phi: number): C => c(Math.cos(phi), Math.sin(phi))

/** Instantaneous value Re[phasor * e^{j*wt}]. */
export const instantaneous = (phasor: C, wt: number): number =>
  phasor.re * Math.cos(wt) - phasor.im * Math.sin(wt)
