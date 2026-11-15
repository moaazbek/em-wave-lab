import { C, ZERO, abs2, add, c, div, mul, scale, sqrt, sub } from './complex'
import { Medium, MediumParams, mediumParams } from './medium'

export type Polarization = 'perp' | 'par'

export type Regime =
  /** Medium 2 is a perfect conductor. */
  | 'pec'
  /** Both media lossless, real refraction angle. */
  | 'refraction'
  /** Both media lossless, theta_i beyond the critical angle. */
  | 'total-reflection'
  /** Medium 2 has finite conductivity. */
  | 'lossy'

export interface Vec3C {
  x: C
  y: C
  z: C
}

export interface WaveAmplitude {
  E: Vec3C
  H: Vec3C
}

export interface InterfaceSolution {
  pol: Polarization
  f: number
  omega: number
  /** Angle of incidence (rad). */
  thetaI: number
  /** Incident amplitude E_i0 (V/m), real and positive. */
  e0: number
  p1: MediumParams
  p2: MediumParams
  regime: Regime
  /** Tangential wavenumber k_x = beta_1 sin(theta_i), shared by all three waves. */
  kx: number
  /** k_1z = beta_1 cos(theta_i). */
  k1z: number
  /** Complex wavenumber of Medium 2 (= -j gamma_2). */
  k2: C
  /** k_2z, root with Re >= 0 and Im <= 0. */
  k2z: C
  cosThetaT: C
  sinThetaT: C
  /** Reflection coefficient (field ratio E_r0 / E_i0). */
  Gamma: C
  /** Transmission coefficient (field ratio E_t0 / E_i0). */
  tau: C
  /** Real angle of refraction (rad); null unless regime is 'refraction'. */
  thetaT: number | null
  /** Fraction of the z-directed incident power that is reflected, |Gamma|^2. */
  R: number
  /** Fraction that enters Medium 2, 1 - |Gamma|^2. */
  T: number
  /** Complex vector amplitudes at the origin, in Cheng's reference directions. */
  amp: { inc: WaveAmplitude; ref: WaveAmplitude; trans: WaveAmplitude }
}

const vec = (x: C, y: C, z: C): Vec3C => ({ x, y, z })
const ZERO_WAVE: WaveAmplitude = { E: vec(ZERO, ZERO, ZERO), H: vec(ZERO, ZERO, ZERO) }

/** Root of k_2z^2 with Re >= 0, Im <= 0, so that e^{-j k_2z z} decays for z > 0. */
function k2zRoot(k2zSquared: C): C {
  const s = sqrt(k2zSquared)
  // The principal root of a negative real number is +j|.|; the decaying wave needs -j|.|.
  return s.im > 0 ? c(Math.abs(s.re), -s.im) : s
}

/**
 * Uniform plane wave from lossless Medium 1 (z < 0) onto Medium 2 (z > 0).
 * One formulation covers refraction, total reflection, lossy media and (as a limit) PEC.
 */
export function solveInterface(
  m1: Medium,
  m2: Medium,
  f: number,
  thetaI: number,
  pol: Polarization,
  e0 = 1,
): InterfaceSolution {
  if (m1.sigma !== 0 || m1.pec) throw new Error('Medium 1 must be lossless')
  const p1 = mediumParams(m1, f)
  const p2 = mediumParams(m2, f)
  const omega = p1.omega
  const eta1 = p1.eta
  const cosI = Math.cos(thetaI)
  const sinI = Math.sin(thetaI)
  const kx = p1.beta * sinI
  const k1z = p1.beta * cosI
  const E0 = c(e0)
  const h0 = e0 / eta1.re

  const inc: WaveAmplitude =
    pol === 'perp'
      ? { E: vec(ZERO, E0, ZERO), H: vec(c(-h0 * cosI), ZERO, c(h0 * sinI)) }
      : { E: vec(c(e0 * cosI), ZERO, c(-e0 * sinI)), H: vec(ZERO, c(h0), ZERO) }

  const reflected = (Gamma: C): WaveAmplitude =>
    pol === 'perp'
      ? { E: vec(ZERO, scale(Gamma, e0), ZERO), H: vec(scale(Gamma, h0 * cosI), ZERO, scale(Gamma, h0 * sinI)) }
      : { E: vec(scale(Gamma, e0 * cosI), ZERO, scale(Gamma, e0 * sinI)), H: vec(ZERO, scale(Gamma, -h0), ZERO) }

  if (m2.pec) {
    const Gamma = c(-1)
    return {
      pol, f, omega, thetaI, e0, p1, p2, regime: 'pec', kx, k1z,
      k2: c(Infinity, -Infinity), k2z: c(Infinity, -Infinity), cosThetaT: c(1), sinThetaT: ZERO,
      Gamma, tau: ZERO, thetaT: null, R: 1, T: 0,
      amp: { inc, ref: reflected(Gamma), trans: ZERO_WAVE },
    }
  }

  const eta2 = p2.eta
  // k_2^2 = omega^2 mu_2 eps_c2 with eps_c2 = eps_2 - j sigma_2 / omega
  const k2sq = c(omega * omega * p2.mu * p2.eps, -omega * p2.mu * m2.sigma)
  const k2 = c(p2.beta, -p2.alpha)
  const k2z = k2zRoot(sub(k2sq, c(kx * kx)))
  const cosT = div(k2z, k2)
  const sinT = div(c(kx), k2)

  const a = scale(eta2, cosI) // eta_2 cos(theta_i)
  const b = scale(cosT, eta1.re) // eta_1 cos(theta_t)
  const d = mul(eta2, cosT) // eta_2 cos(theta_t)
  const e = c(eta1.re * cosI) // eta_1 cos(theta_i)
  let Gamma: C
  let tau: C
  if (pol === 'perp') {
    Gamma = div(sub(a, b), add(a, b))
    tau = div(scale(a, 2), add(a, b))
  } else {
    Gamma = div(sub(d, e), add(d, e))
    tau = div(scale(a, 2), add(d, e))
  }

  const Et = scale(tau, e0)
  const Ht = div(Et, eta2)
  const trans: WaveAmplitude =
    pol === 'perp'
      ? { E: vec(ZERO, Et, ZERO), H: vec(scale(mul(Ht, cosT), -1), ZERO, mul(Ht, sinT)) }
      : { E: vec(mul(Et, cosT), ZERO, scale(mul(Et, sinT), -1)), H: vec(ZERO, Ht, ZERO) }

  const lossless2 = m2.sigma === 0
  const sinTReal = kx / p2.beta
  const regime: Regime = !lossless2 ? 'lossy' : sinTReal > 1 ? 'total-reflection' : 'refraction'
  const R = Math.min(1, abs2(Gamma))

  return {
    pol, f, omega, thetaI, e0, p1, p2, regime, kx, k1z, k2, k2z,
    cosThetaT: cosT, sinThetaT: sinT, Gamma, tau,
    thetaT: regime === 'refraction' ? Math.asin(Math.min(1, sinTReal)) : null,
    R, T: regime === 'total-reflection' ? 0 : 1 - R,
    amp: { inc, ref: reflected(Gamma), trans },
  }
}

const lossless = (m: Medium) => m.sigma === 0 && !m.pec

/** Snell's law for lossless media: sin(theta_t) (may exceed 1 beyond the critical angle). */
export function snellSinThetaT(m1: Medium, m2: Medium, thetaI: number): number {
  return Math.sin(thetaI) * Math.sqrt((m1.muR * m1.epsR) / (m2.muR * m2.epsR))
}

/** Critical angle (rad), or null when total reflection cannot occur. Lossless media only. */
export function criticalAngle(m1: Medium, m2: Medium): number | null {
  if (!lossless(m1) || !lossless(m2)) return null
  const s = Math.sqrt((m2.muR * m2.epsR) / (m1.muR * m1.epsR))
  return s < 1 ? Math.asin(s) : null
}

/** Brewster angle (rad) for the given polarization, or null when none exists. Lossless media only. */
export function brewsterAngle(m1: Medium, m2: Medium, pol: Polarization): number | null {
  if (!lossless(m1) || !lossless(m2)) return null
  const e = m1.epsR / m2.epsR // eps_1 / eps_2
  const u = m1.muR / m2.muR // mu_1 / mu_2
  const s2 = pol === 'par' ? (1 - e / u) / (1 - e * e) : (1 - u / e) / (1 - u * u)
  if (!Number.isFinite(s2) || s2 < 0 || s2 > 1) return null
  return Math.asin(Math.sqrt(s2))
}
