import { describe, expect, it } from 'vitest'
import {
  C, DEG, EPS0, MU0, Medium, Polarization, abs, arg, avgPoyntingZ, brewsterAngle, classify, criticalAngle,
  div, editMedium, fieldAt, fieldComponent, fromPreset, getPreset, goodConductorApprox, isCustomized, lossTangent,
  lowLossApprox, mediumParams, mul, pctError, sampleZProfile, solveInterface, sqrt, c, standingWave,
  surfaceCurrent, transmittedFractionFromFields, xFactor, zProfile, LOSSLESS_PRESET_IDS, PRESETS,
} from './index'

const med = (epsR: number, sigma = 0, muR = 1): Medium => ({ epsR, muR, sigma, pec: false })
const AIR = med(1)
const PEC: Medium = { epsR: 1, muR: 1, sigma: 0, pec: true }
const POLS: Polarization[] = ['perp', 'par']
const F = 3e8

/** Deterministic PRNG so the random tests are reproducible. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('complex', () => {
  it('sqrt keeps precision for tiny parts and picks the principal root', () => {
    const s = sqrt(c(-1, 1e-12))
    expect(s.re).toBeCloseTo(5e-13, 20)
    expect(s.im).toBeCloseTo(1, 12)
    expect(sqrt(c(-4, 0))).toEqual(c(0, 2))
    const z = c(3, -4)
    const r = sqrt(z)
    expect(mul(r, r).re).toBeCloseTo(3, 12)
    expect(mul(r, r).im).toBeCloseTo(-4, 12)
  })
})

describe('identical lossless media', () => {
  it('Gamma = 0 and tau = 1 at every angle and both polarizations', () => {
    for (const pol of POLS)
      for (const m of [med(1), med(4), med(2.25, 0, 3)])
        for (let d = 0; d < 90; d += 7.5) {
          const s = solveInterface(m, m, F, d * DEG, pol)
          expect(abs(s.Gamma)).toBeLessThan(1e-12)
          expect(s.tau.re).toBeCloseTo(1, 12)
          expect(s.tau.im).toBeCloseTo(0, 12)
        }
  })
})

describe('air to eps_r = 4', () => {
  it('normal incidence: Gamma = -1/3, tau = 2/3, S = 2, reflected power 1/9', () => {
    for (const pol of POLS) {
      const s = solveInterface(AIR, med(4), F, 0, pol)
      expect(s.Gamma.re).toBeCloseTo(-1 / 3, 12)
      expect(s.Gamma.im).toBeCloseTo(0, 12)
      expect(s.tau.re).toBeCloseTo(2 / 3, 12)
      expect(s.R).toBeCloseTo(1 / 9, 12)
      const sw = standingWave(s)
      expect(sw.S).toBeCloseTo(2, 12)
      expect(sw.atInterface).toBe('min')
      expect(sw.zMin[0]).toBe(0)
      expect(sw.zMax[0]).toBeCloseTo(-s.p1.lambda / 4, 12)
    }
  })
  it('interface is a maximum when Gamma > 0', () => {
    const s = solveInterface(med(4), AIR, F, 0, 'perp')
    expect(s.Gamma.re).toBeCloseTo(1 / 3, 12)
    const sw = standingWave(s)
    expect(sw.atInterface).toBe('max')
    expect(sw.zMax[0]).toBe(0)
    expect(sw.zMin[0]).toBeCloseTo(-s.p1.lambda / 4, 12)
  })
  it('theta_i = 30 deg', () => {
    const perp = solveInterface(AIR, med(4), F, 30 * DEG, 'perp')
    const par = solveInterface(AIR, med(4), F, 30 * DEG, 'par')
    expect(perp.thetaT! / DEG).toBeCloseTo(14.478, 3)
    expect(perp.Gamma.re).toBeCloseTo(-0.38197, 5)
    expect(perp.tau.re).toBeCloseTo(0.61803, 5)
    expect(par.Gamma.re).toBeCloseTo(-0.28286, 5)
    expect(par.tau.re).toBeCloseTo(0.64143, 5)
    for (const s of [perp, par]) {
      expect(s.R + transmittedFractionFromFields(s)).toBeCloseTo(1, 12)
      // lossless closed form: (eta1 cos t / eta2 cos i) |tau|^2
      const closed = ((s.p1.eta.re * Math.cos(s.thetaT!)) / (s.p2.eta.re * Math.cos(s.thetaI))) * abs(s.tau) ** 2
      expect(closed).toBeCloseTo(s.T, 12)
    }
  })
})

describe('Brewster and critical angles', () => {
  it('air to 2.25: theta_B = 56.310 deg with Gamma_par = 0 there', () => {
    const tb = brewsterAngle(AIR, med(2.25), 'par')!
    expect(tb / DEG).toBeCloseTo(56.31, 3)
    expect(Math.tan(tb)).toBeCloseTo(1.5, 12)
    expect(abs(solveInterface(AIR, med(2.25), F, tb, 'par').Gamma)).toBeLessThan(1e-12)
    expect(brewsterAngle(AIR, med(2.25), 'perp')).toBeNull()
  })
  it('magnetic media can have a perpendicular Brewster angle', () => {
    const m2 = med(1, 0, 4)
    const tb = brewsterAngle(AIR, m2, 'perp')!
    expect(tb).not.toBeNull()
    expect(abs(solveInterface(AIR, m2, F, tb, 'perp').Gamma)).toBeLessThan(1e-12)
    const m3 = med(3, 0, 5)
    for (const pol of POLS) {
      const t = brewsterAngle(AIR, m3, pol)
      if (t !== null) expect(abs(solveInterface(AIR, m3, F, t, pol).Gamma)).toBeLessThan(1e-12)
    }
  })
  it('critical angles', () => {
    expect(criticalAngle(med(2.25), AIR)! / DEG).toBeCloseTo(41.81, 3)
    expect(criticalAngle(med(81), AIR)! / DEG).toBeCloseTo(6.379, 3)
    expect(criticalAngle(AIR, med(4))).toBeNull()
    expect(criticalAngle(med(4), med(1, 1))).toBeNull()
  })
})

describe('total reflection: eps_r = 4 to air at 45 deg', () => {
  const s = solveInterface(med(4), AIR, F, 45 * DEG, 'perp')
  it('|Gamma| = 1 with phase 70.529 deg', () => {
    expect(s.regime).toBe('total-reflection')
    expect(abs(s.Gamma)).toBeCloseTo(1, 12)
    expect(arg(s.Gamma) / DEG).toBeCloseTo(70.529, 3)
  })
  it('evanescent decay constant equals beta_0, no average power into Medium 2', () => {
    const beta0 = (2 * Math.PI * F) * Math.sqrt(MU0 * EPS0)
    expect(-s.k2z.im).toBeCloseTo(beta0, 9)
    expect(s.k2z.re).toBe(0)
    expect(Math.abs(transmittedFractionFromFields(s))).toBeLessThan(1e-12)
    expect(s.T).toBe(0)
    // decays in z, travels along x
    const a = abs(fieldComponent(s, 'trans', 'E', 'y', 0, 0.1))
    const b = abs(fieldComponent(s, 'trans', 'E', 'y', 0.3, 0.2))
    expect(b / a).toBeCloseTo(Math.exp(-beta0 * 0.1), 10)
  })
  it('parallel polarization is also totally reflected', () => {
    const p = solveInterface(med(4), AIR, F, 45 * DEG, 'par')
    expect(abs(p.Gamma)).toBeCloseTo(1, 12)
    expect(Math.abs(transmittedFractionFromFields(p))).toBeLessThan(1e-12)
  })
})

describe('lossy media', () => {
  it('seawater at 5 MHz', () => {
    const m = med(72, 4)
    const p = mediumParams(m, 5e6)
    expect(p.lossTangent).toBeCloseTo(199.7, 1)
    expect(p.alpha).toBeCloseTo(8.864, 3)
    expect(p.beta).toBeCloseTo(8.908, 3)
    expect(p.eta.re).toBeCloseTo(2.227, 3)
    expect(p.eta.im).toBeCloseTo(2.216, 3)
    expect(p.lambda).toBeCloseTo(0.705, 3)
    expect(p.delta).toBeCloseTo(0.1128, 4)
    expect(p.kind).toBe('good-conductor')
    const g = goodConductorApprox(m, 5e6)
    expect(g.alpha).toBeCloseTo(8.886, 3)
    expect(g.beta).toBe(g.alpha)
  })
  it('copper at 3 MHz: exact Gamma, exact extrema, minimum reported at the interface', () => {
    const f = 3e6
    const s = solveInterface(AIR, med(1, 5.8e7), f, 0, 'perp')
    // Independent reference: Gamma = (eta2 - eta1) / (eta2 + eta1) with eta2 = sqrt(j w mu / (sigma + j w eps))
    const w = 2 * Math.PI * f
    const eta2 = sqrt(div(c(0, w * MU0), c(5.8e7, w * EPS0)))
    const eta1 = Math.sqrt(MU0 / EPS0)
    const ref = div(c(eta2.re - eta1, eta2.im), c(eta2.re + eta1, eta2.im))
    expect(Math.abs(s.Gamma.re - ref.re)).toBeLessThan(1e-15)
    expect(Math.abs(s.Gamma.im - ref.im) / ref.im).toBeLessThan(1e-9)
    // The phase is not rounded to 180 degrees: it is 180 deg minus about 1.4e-4 deg.
    const th = arg(s.Gamma)
    expect(th).toBeLessThan(Math.PI)
    expect((Math.PI - th) / DEG).toBeGreaterThan(1e-4)
    expect((Math.PI - th) / DEG).toBeLessThan(2e-4)
    // Minima from theta_Gamma - 2 beta z' = -pi (mod 2 pi): the first one is behind the interface
    // by a tiny distance, so it is reported at the interface.
    const sw = standingWave(s)
    const beta1 = s.p1.beta
    const lam = s.p1.lambda
    expect(sw.tolerance).toBe(lam / 1000)
    const zpBehind = (th - Math.PI) / (2 * beta1) // z' of the k = -1 minimum (negative: inside Medium 2)
    expect(zpBehind).toBeLessThan(0)
    expect(-zpBehind).toBeLessThan(lam / 1000)
    expect(sw.zMinExact[0]).toBe(0 - zpBehind)
    expect(sw.zMin[0]).toBe(0)
    expect(sw.atInterface).toBe('min')
    // The other extrema are exact and unrounded.
    expect(sw.zMin[1]).toBe(0 - (th + Math.PI) / (2 * beta1))
    expect(sw.zMin[1]).not.toBe(-lam / 2)
    expect(sw.zMax[0]).toBe(0 - th / (2 * beta1))
    for (const z of sw.zMin) expect(abs(zProfile(s, 'total', 'E', 'y', Math.min(z, -1e-300), 1)))
      .toBeLessThan(abs(zProfile(s, 'total', 'E', 'y', z - lam / 50, 1)))
    // The field map uses the same exact Gamma: total E at z = 0- is (1 + Gamma) E_i0 = tau E_i0, not zero.
    const e0 = zProfile(s, 'total', 'E', 'y', 0, 1)
    expect(e0.re).toBe(1 + s.Gamma.re)
    expect(e0.im).toBe(s.Gamma.im)
    expect(abs(e0)).toBeGreaterThan(0)
    expect(abs(e0)).toBeCloseTo(abs(s.tau), 15)
  })
  it('a minimum behind the interface by more than lambda_1/1000 is not moved to the interface', () => {
    // Seawater at 1 GHz: Gamma has a phase well away from 180 degrees.
    const s = solveInterface(AIR, med(72, 4), 1e9, 0, 'perp')
    const th = arg(s.Gamma)
    const zpBehind = (th - Math.PI) / (2 * s.p1.beta)
    expect(-zpBehind).toBeGreaterThan(s.p1.lambda / 1000)
    const sw = standingWave(s)
    expect(sw.atInterface).toBe('neither')
    expect(sw.zMin[0]).toBe(0 - (th + Math.PI) / (2 * s.p1.beta))
    expect(sw.zMin[0]).toBeLessThan(0)
  })
  it('copper at 3 MHz: delta = 0.03815 mm', () => {
    const m = med(1, 5.8e7)
    expect(mediumParams(m, 3e6).delta * 1e3).toBeCloseTo(0.03815, 5)
    expect(goodConductorApprox(m, 3e6).delta * 1e3).toBeCloseTo(0.03815, 5)
  })
  it('low-loss dielectric at 1 GHz', () => {
    const m = med(2.25, 1e-4)
    const p = mediumParams(m, 1e9)
    expect(p.alpha).toBeCloseTo(0.012558, 6)
    expect(p.beta).toBeCloseTo(31.438, 3)
    expect(p.kind).toBe('low-loss')
    const a = lowLossApprox(m, 1e9)
    expect(Math.abs(pctError(a.alpha, p.alpha))).toBeLessThan(0.01)
    expect(Math.abs(pctError(a.beta, p.beta))).toBeLessThan(0.01)
    expect(Math.abs(pctError(a.eta.re, p.eta.re))).toBeLessThan(0.01)
  })
  it('lossless medium: alpha = 0 exactly and eta real', () => {
    const p = mediumParams(med(4), 1e9)
    expect(p.alpha).toBe(0)
    expect(p.eta.im).toBe(0)
    expect(p.eta.re).toBeCloseTo(Math.sqrt(MU0 / EPS0) / 2, 9)
    expect(p.delta).toBe(Infinity)
  })
})

describe('perfect conductor', () => {
  it('Gamma = -1 for both polarizations and all angles; fields vanish correctly', () => {
    for (const pol of POLS)
      for (let d = 0; d < 90; d += 10) {
        const s = solveInterface(AIR, PEC, F, d * DEG, pol)
        expect(s.Gamma).toEqual(c(-1))
        expect(s.tau).toEqual(c(0))
        const b = fieldAt(s, 0.37, 0, 1).total
        expect(abs(b.E.x)).toBeLessThan(1e-12)
        expect(abs(b.E.y)).toBeLessThan(1e-12)
        expect(abs(b.H.z)).toBeLessThan(1e-12) // normal B is zero as well
        for (const z of [0, 1e-9, 0.4, 3]) {
          const t = fieldAt(s, 0.2, z).total
          for (const v of [t.E.x, t.E.y, t.E.z, t.H.x, t.H.y, t.H.z]) expect(abs(v)).toBe(0)
        }
      }
  })
  it('normal incidence: |E| zeros at z = -n lambda/2, |H| zeros a quarter wavelength away', () => {
    const s = solveInterface(AIR, PEC, F, 0, 'perp', 2)
    const lam = s.p1.lambda
    for (let n = 0; n < 4; n++) {
      expect(abs(zProfile(s, 'total', 'E', 'y', -n * lam / 2, 1))).toBeLessThan(1e-12)
      expect(abs(zProfile(s, 'total', 'H', 'x', -(2 * n + 1) * lam / 4, 1))).toBeLessThan(1e-12)
      expect(abs(zProfile(s, 'total', 'E', 'y', -(2 * n + 1) * lam / 4, 1))).toBeCloseTo(4, 10)
      expect(standingWave(s).zMin[n]).toBeCloseTo(-n * lam / 2, 12)
    }
    expect(standingWave(s).S).toBe(Infinity)
  })
  it('surface current J_s = a_n x H', () => {
    const perp = solveInterface(AIR, PEC, F, 30 * DEG, 'perp', 1)
    const par = solveInterface(AIR, PEC, F, 30 * DEG, 'par', 1)
    const eta1 = perp.p1.eta.re
    expect(surfaceCurrent(perp).y.re).toBeCloseTo((2 * Math.cos(30 * DEG)) / eta1, 12)
    expect(abs(surfaceCurrent(perp).x)).toBe(0)
    expect(surfaceCurrent(par).x.re).toBeCloseTo(2 / eta1, 12)
    expect(abs(surfaceCurrent(par).y)).toBe(0)
  })
})

describe('boundary conditions (random media, angles, polarizations)', () => {
  const rnd = mulberry32(361)
  const logU = (lo: number, hi: number) => Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo)))
  it('tangential E and H are continuous and the power fractions sum to 1', () => {
    let lossy = 0, tir = 0
    for (let i = 0; i < 600; i++) {
      const m1 = med(logU(1, 100), 0, rnd() < 0.5 ? 1 : logU(1, 100))
      const kind = Math.floor(rnd() * 4)
      const m2 = med(logU(1, 100), kind === 0 ? 0 : logU(1e-6, 1e8), rnd() < 0.5 ? 1 : logU(1, 100))
      const f = logU(1e3, 1e11)
      const theta = rnd() < 0.1 ? 0 : rnd() * 89.9 * DEG
      const pol: Polarization = rnd() < 0.5 ? 'perp' : 'par'
      const e0 = logU(0.1, 100)
      const s = solveInterface(m1, m2, f, theta, pol, e0)
      if (s.regime === 'lossy') lossy++
      if (s.regime === 'total-reflection') tir++
      const x = (rnd() - 0.5) * 4 * s.p1.lambda
      const a = fieldAt(s, x, 0, 1).total
      const b = fieldAt(s, x, 0, 2).total
      const h0 = e0 / s.p1.eta.re
      const near = (u: C, v: C, ref: number) =>
        expect(Math.hypot(u.re - v.re, u.im - v.im) / ref).toBeLessThan(1e-9)
      near(a.E.x, b.E.x, e0)
      near(a.E.y, b.E.y, e0)
      near(a.H.x, b.H.x, h0)
      near(a.H.y, b.H.y, h0)
      // normal B is continuous too
      near(c(a.H.z.re * s.p1.mu, a.H.z.im * s.p1.mu), c(b.H.z.re * s.p2.mu, b.H.z.im * s.p2.mu), h0 * s.p1.mu)
      // power: reflected + entering = incident, with the entering part taken from the fields
      const entering = transmittedFractionFromFields(s)
      expect(Math.abs(s.R + entering - 1)).toBeLessThan(1e-9)
      expect(Math.abs(entering - s.T)).toBeLessThan(1e-9)
      expect(s.R).toBeLessThanOrEqual(1)
      // net flux on the Medium 1 side equals the flux on the Medium 2 side
      const net1 = avgPoyntingZ(s, 'total', 0, 1) / avgPoyntingZ(s, 'inc', 0, 1)
      expect(Math.abs(net1 - entering)).toBeLessThan(1e-9)
      // transmitted field never grows with depth
      expect(s.k2z.im).toBeLessThanOrEqual(0)
      expect(s.k2z.re).toBeGreaterThanOrEqual(0)
    }
    expect(lossy).toBeGreaterThan(100)
    expect(tir).toBeGreaterThan(10)
  })
  it('Cheng identities: 1 + Gamma_perp = tau_perp and 1 + Gamma_par = tau_par cos(t)/cos(i)', () => {
    for (let i = 0; i < 100; i++) {
      const m1 = med(logU(1, 100))
      const m2 = med(logU(1, 100), rnd() < 0.5 ? 0 : logU(1e-6, 1e8))
      const th = rnd() * 89 * DEG
      const p = solveInterface(m1, m2, 1e9, th, 'perp')
      expect(abs(c(1 + p.Gamma.re - p.tau.re, p.Gamma.im - p.tau.im))).toBeLessThan(1e-10)
      const q = solveInterface(m1, m2, 1e9, th, 'par')
      const rhs = mul(q.tau, c(q.cosThetaT.re / Math.cos(th), q.cosThetaT.im / Math.cos(th)))
      expect(abs(c(1 + q.Gamma.re - rhs.re, q.Gamma.im - rhs.im))).toBeLessThan(1e-10)
    }
  })
  it('the separable sampler agrees with fieldAt', () => {
    const s = solveInterface(med(2), med(9, 0.05), 1e9, 40 * DEG, 'par', 3)
    const zs = [-0.3, -0.1, 0.02, 0.2]
    const re = new Float64Array(4), im = new Float64Array(4)
    sampleZProfile(s, 'total', 'E', 'z', zs, re, im)
    zs.forEach((z, i) => {
      const v = mul(xFactor(s, 0.11), c(re[i], im[i]))
      const w = fieldAt(s, 0.11, z).total.E.z
      expect(v.re).toBeCloseTo(w.re, 12)
      expect(v.im).toBeCloseTo(w.im, 12)
    })
  })
})

describe('classification and presets', () => {
  it('sigma = 0 stays lossless for any eps_r', () => {
    for (const e of [1, 2.25, 50, 100]) for (const f of [1e3, 1e9, 1e11]) expect(classify(med(e), f)).toBe('lossless')
  })
  it('changing only f moves a medium across all three lossy classes', () => {
    const sea = med(72, 4)
    expect(classify(sea, 1e6)).toBe('good-conductor')
    expect(classify(sea, 1e9)).toBe('lossy')
    expect(classify(sea, 1e11)).toBe('low-loss')
    expect(lossTangent(sea, 5e6)).toBeCloseTo(199.7, 1)
  })
  it('PEC is its own class, never a large finite sigma', () => {
    expect(classify(PEC, 1e9)).toBe('pec')
    expect(classify(med(1, 1e8), 1e3)).toBe('good-conductor')
  })
  it('editing a preset never resets other values', () => {
    let m = fromPreset('seawater')
    expect(isCustomized(m)).toBe(false)
    m = editMedium(m, { epsR: 60 })
    expect(m).toEqual({ preset: 'seawater', epsR: 60, muR: 1, sigma: 4, pec: false })
    m = editMedium(m, { sigma: 1e-3 })
    expect(m.epsR).toBe(60)
    expect(m.muR).toBe(1)
    expect(isCustomized(m)).toBe(true)
    expect(classify(m, 1e9)).toBe('low-loss') // classified from current values, not from the preset
  })
  it('Medium 1 presets are all lossless', () => {
    for (const id of LOSSLESS_PRESET_IDS) {
      const p = getPreset(id)
      expect(p.sigma).toBe(0)
      expect(p.pec).toBe(false)
    }
    expect(PRESETS.length).toBe(9)
  })
})
