import { C, c, div, sqrt } from './complex'
import { EPS0, GOOD_CONDUCTOR_MIN, LOW_LOSS_MAX, MU0 } from './constants'

export interface Medium {
  /** Relative permittivity. */
  epsR: number
  /** Relative permeability. */
  muR: number
  /** Conductivity (S/m). */
  sigma: number
  /** Perfect electric conductor: an explicit choice, never a large finite sigma. */
  pec: boolean
}

export type MediumClass = 'lossless' | 'low-loss' | 'lossy' | 'good-conductor' | 'pec'

export interface MediumParams {
  medium: Medium
  f: number
  omega: number
  eps: number
  mu: number
  /** sigma / (omega * eps) */
  lossTangent: number
  /** Propagation constant gamma = alpha + j beta (1/m). */
  gamma: C
  /** Attenuation constant (Np/m). */
  alpha: number
  /** Phase constant (rad/m). */
  beta: number
  /** Intrinsic impedance (ohm). */
  eta: C
  /** Phase velocity (m/s). */
  up: number
  /** Wavelength (m). */
  lambda: number
  /** Skin depth 1/alpha (m); Infinity when lossless. */
  delta: number
  kind: MediumClass
}

export function classify(m: Medium, f: number): MediumClass {
  if (m.pec) return 'pec'
  if (m.sigma === 0) return 'lossless'
  const t = lossTangent(m, f)
  if (t < LOW_LOSS_MAX) return 'low-loss'
  if (t > GOOD_CONDUCTOR_MIN) return 'good-conductor'
  return 'lossy'
}

export function lossTangent(m: Medium, f: number): number {
  if (m.pec) return Infinity
  return m.sigma / (2 * Math.PI * f * m.epsR * EPS0)
}

/**
 * Frequencies at which the loss tangent crosses the two thresholds.
 * Below `goodConductorBelow` the medium is a good conductor,
 * above `lowLossAbove` it is a low-loss dielectric.
 */
export function classBoundaryFrequencies(m: Medium): { goodConductorBelow: number; lowLossAbove: number } {
  const k = m.sigma / (2 * Math.PI * m.epsR * EPS0)
  return { goodConductorBelow: k / GOOD_CONDUCTOR_MIN, lowLossAbove: k / LOW_LOSS_MAX }
}

/** Exact parameters from gamma = sqrt(j w mu (sigma + j w eps)), eta = j w mu / gamma. */
export function mediumParams(m: Medium, f: number): MediumParams {
  const omega = 2 * Math.PI * f
  const eps = m.epsR * EPS0
  const mu = m.muR * MU0
  if (m.pec) {
    return {
      medium: m, f, omega, eps, mu,
      lossTangent: Infinity,
      gamma: c(Infinity, Infinity), alpha: Infinity, beta: Infinity,
      eta: c(0, 0), up: 0, lambda: 0, delta: 0, kind: 'pec',
    }
  }
  // j w mu (sigma + j w eps) = -w^2 mu eps + j w mu sigma  (second quadrant -> alpha >= 0, beta > 0)
  const gamma = sqrt(c(-omega * omega * mu * eps, omega * mu * m.sigma))
  const alpha = gamma.re
  const beta = gamma.im
  const eta = div(c(0, omega * mu), gamma)
  return {
    medium: m, f, omega, eps, mu,
    lossTangent: m.sigma / (omega * eps),
    gamma, alpha, beta, eta,
    up: omega / beta,
    lambda: (2 * Math.PI) / beta,
    delta: alpha > 0 ? 1 / alpha : Infinity,
    kind: classify(m, f),
  }
}

export interface ApproxParams {
  alpha: number
  beta: number
  eta: C
  delta: number
}

/** Cheng 8-3.1, low-loss dielectric. */
export function lowLossApprox(m: Medium, f: number): ApproxParams {
  const omega = 2 * Math.PI * f
  const eps = m.epsR * EPS0
  const mu = m.muR * MU0
  const t = m.sigma / (omega * eps)
  const eta0 = Math.sqrt(mu / eps)
  const alpha = (m.sigma / 2) * eta0
  return {
    alpha,
    beta: omega * Math.sqrt(mu * eps) * (1 + (t * t) / 8),
    eta: c(eta0, (eta0 * t) / 2),
    delta: 1 / alpha,
  }
}

/** Cheng 8-3.2, good conductor. */
export function goodConductorApprox(m: Medium, f: number): ApproxParams {
  const mu = m.muR * MU0
  const a = Math.sqrt(Math.PI * f * mu * m.sigma)
  return { alpha: a, beta: a, eta: c(a / m.sigma, a / m.sigma), delta: 1 / a }
}

/** Percentage error of an approximation against the exact value. */
export const pctError = (approx: number, exact: number): number =>
  exact === 0 ? (approx === 0 ? 0 : Infinity) : (100 * (approx - exact)) / exact
