import { DEG, abs, arg } from '../../physics'
import { deg, pct, si, sig } from '../../ui/format'
import { CLASS_LABEL, Model } from './derive'
import type { ChangeKind } from './state'

/**
 * Plain sentences for the explanation panel. Maths is written between dollar signs.
 * Style: short sentences, no idioms (many readers use English as a second language).
 */

const article = (label: string) => (label.startsWith('general') || label.startsWith('good') || label.startsWith('low') || label.startsWith('perfect') ? 'a' : 'a') + ' ' + label
const polName = (m: Model) => (m.state.pol === 'perp' ? 'perpendicular' : 'parallel')

/** Two or three sentences that describe the current situation. */
export function situation(m: Model): string[] {
  const { sol, state } = m
  const out: string[] = []
  const th = `$\\theta_i$ = ${deg(sol.thetaI, 1)}`
  switch (sol.regime) {
    case 'pec': {
      out.push(`Medium 2 is a perfect conductor, so the wave is totally reflected: $\\Gamma = -1$ and no field exists for $z > 0$.`)
      out.push(m.normal
        ? `The incident and reflected waves form a pure standing wave. The zeros of $E$ are fixed at $z = -n\\lambda_1/2$; they do not move in time.`
        : `The tangential $\\mathbf{E}$ is zero on the boundary. The pattern stands still along $z$ and travels along $x$.`)
      out.push(`A surface current of ${si(abs(m.js.x) + abs(m.js.y), 'A/m', 3)} flows on the boundary along $\\mathbf{a}_${state.pol === 'perp' ? 'y' : 'x'}$.`)
      break
    }
    case 'refraction': {
      if (sol.R < 1e-6) {
        const same = state.m1.epsR === state.m2.epsR && state.m1.muR === state.m2.muR
        out.push(same
          ? `The two media are identical, so there is no boundary for the wave: $\\Gamma = 0$ and $\\tau = 1$.`
          : `This is the Brewster angle for ${polName(m)} polarization. The reflected wave disappears and all the power is transmitted.`)
      } else {
        out.push(`At ${th}, ${pct(sol.R)} of the incident power is reflected and ${pct(sol.T)} is transmitted${m.normal ? '' : ` at $\\theta_t$ = ${deg(sol.thetaT ?? 0, 1)}`}.`)
      }
      const ratio = m.p1.lambda / m.p2.lambda
      if (ratio > 1.001) out.push(`The wave is slower in Medium 2. Its wavelength there is shorter ($\\lambda_2$ = ${si(m.p2.lambda, 'm', 3)}, against $\\lambda_1$ = ${si(m.p1.lambda, 'm', 3)})${m.normal ? '' : ' and the ray bends toward the normal'}.`)
      else if (ratio < 0.999) out.push(`The wave is faster in Medium 2. Its wavelength there is longer ($\\lambda_2$ = ${si(m.p2.lambda, 'm', 3)})${m.normal ? '' : ' and the ray bends away from the normal'}.${m.thetaC !== null ? ` Total reflection starts at $\\theta_c$ = ${deg(m.thetaC, 2)}.` : ''}`)
      if (m.normal && sol.R >= 1e-6) out.push(m.sw.atInterface === 'min'
        ? `$\\Gamma$ is negative, so $|E|$ has a minimum at the interface. The standing-wave ratio is $S$ = ${sig(m.sw.S, 3)}.`
        : `$\\Gamma$ is positive, so $|E|$ has a maximum at the interface. The standing-wave ratio is $S$ = ${sig(m.sw.S, 3)}.`)
      break
    }
    case 'total-reflection': {
      out.push(`${th} is larger than the critical angle $\\theta_c$ = ${deg(m.thetaC ?? 0, 2)}, so the reflection is total: $|\\Gamma| = 1$, with a phase of ${deg(arg(sol.Gamma), 1)}.`)
      out.push(`The field in Medium 2 is evanescent. It travels along $x$ and decays in $z$ as $e^{-\\alpha z}$ with $\\alpha$ = ${si(-sol.k2z.im, 'Np/m', 3)}. It carries no average power into Medium 2.`)
      break
    }
    case 'lossy': {
      out.push(`At $f$ = ${si(state.f, 'Hz', 3)}, Medium 2 has a loss tangent $\\sigma/\\omega\\epsilon$ = ${sig(m.p2.lossTangent, 3)}. It behaves as ${article(CLASS_LABEL[m.cls2])}.`)
      out.push(`${pct(sol.R, sol.R > 0.999 ? 3 : 1)} of the incident power is reflected. The rest enters Medium 2 and is absorbed; the field there falls to $1/e$ in ${si(1 / -sol.k2z.im, 'm', 3)}${m.normal ? ' (the skin depth $\\delta$)' : ''}.`)
      if (!m.normal) out.push(`Oblique incidence on a lossy medium is beyond the textbook. $\\theta_t$ is complex, so there is no single real angle of refraction.`)
      break
    }
  }
  return out
}

/** One sentence that reacts to the last change, or null when there is nothing useful to say. */
export function reaction(a: Model, b: Model, change: ChangeKind): string | null {
  const s0 = a.state, s1 = b.state
  const moved = (x: number, y: number, up = 'raised', down = 'lowered') => (y > x ? up : down)
  const classNote = () => (a.cls2 !== b.cls2
    ? `so Medium 2 now behaves as ${article(CLASS_LABEL[b.cls2])}, not as ${article(CLASS_LABEL[a.cls2])}.`
    : `so Medium 2 is still ${article(CLASS_LABEL[b.cls2])}.`)
  const tangent = () => `the loss tangent ${moved(a.p2.lossTangent, b.p2.lossTangent, 'rose', 'fell')} from ${sig(a.p2.lossTangent, 3)} to ${sig(b.p2.lossTangent, 3)}, ${classNote()}`
  const power = () => (Math.abs(a.sol.R - b.sol.R) < 5e-5
    ? `The reflected power did not change (${pct(b.sol.R)}).`
    : `The reflected power changed from ${pct(a.sol.R)} to ${pct(b.sol.R)}.`)
  const lossy2 = s1.m2.sigma > 0 && !s1.m2.pec

  switch (change) {
    case 'f': {
      if (s0.f === s1.f) return null
      const head = `You ${moved(s0.f, s1.f)} $f$ from ${si(s0.f, 'Hz', 3)} to ${si(s1.f, 'Hz', 3)}`
      if (lossy2) {
        const skin = b.cls2 === 'good-conductor' ? ` The skin depth is now ${si(b.p2.delta, 'm', 3)}.` : ''
        return `${head}; ${tangent()}${skin}`
      }
      return `${head}. The wavelength in Medium 1 changed from ${si(a.p1.lambda, 'm', 3)} to ${si(b.p1.lambda, 'm', 3)}. $\\Gamma$ and $\\tau$ did not change, because ${s1.m2.pec ? 'a perfect conductor reflects everything at any frequency' : 'both media are lossless'}.`
    }
    case 'sigma2': {
      if (s0.m2.sigma === s1.m2.sigma) return null
      if (s1.m2.sigma === 0) return `You set $\\sigma_2$ to zero. Medium 2 is now lossless: the wave is not attenuated there.`
      if (s0.m2.sigma === 0) return `You gave Medium 2 a conductivity of ${si(s1.m2.sigma, 'S/m', 3)}. Its loss tangent is now ${sig(b.p2.lossTangent, 3)}, so it behaves as ${article(CLASS_LABEL[b.cls2])}.`
      return `You ${moved(s0.m2.sigma, s1.m2.sigma)} $\\sigma_2$; ${tangent()}`
    }
    case 'eps2': {
      if (s0.m2.epsR === s1.m2.epsR) return null
      const head = `You ${moved(s0.m2.epsR, s1.m2.epsR)} $\\epsilon_{r2}$ from ${sig(s0.m2.epsR, 3)} to ${sig(s1.m2.epsR, 3)}`
      return lossy2 ? `${head}; ${tangent()}` : `${head}. ${power()}`
    }
    case 'mu2':
      if (s0.m2.muR === s1.m2.muR) return null
      return `You ${moved(s0.m2.muR, s1.m2.muR)} $\\mu_{r2}$ from ${sig(s0.m2.muR, 3)} to ${sig(s1.m2.muR, 3)}. $\\mu$ does not enter the loss tangent, but it changes $\\eta_2$. ${power()}`
    case 'eps1':
    case 'mu1': {
      const sym = change === 'eps1' ? '\\epsilon_{r1}' : '\\mu_{r1}'
      const v0 = change === 'eps1' ? s0.m1.epsR : s0.m1.muR, v1 = change === 'eps1' ? s1.m1.epsR : s1.m1.muR
      if (v0 === v1) return null
      const crit = a.thetaC === null && b.thetaC !== null ? ` Medium 1 is now the denser medium, so a critical angle exists: $\\theta_c$ = ${deg(b.thetaC, 2)}.`
        : a.thetaC !== null && b.thetaC === null ? ` There is no critical angle any more.` : ''
      return `You ${moved(v0, v1)} $${sym}$ from ${sig(v0, 3)} to ${sig(v1, 3)}. The wavelength in Medium 1 is now ${si(b.p1.lambda, 'm', 3)}. ${power()}${crit}`
    }
    case 'theta': {
      if (s0.thetaDeg === s1.thetaDeg) return null
      const tir0 = a.sol.regime === 'total-reflection', tir1 = b.sol.regime === 'total-reflection'
      if (!tir0 && tir1) return `You passed the critical angle $\\theta_c$ = ${deg(b.thetaC ?? 0, 2)}. All the power is now reflected.`
      if (tir0 && !tir1) return `You went below the critical angle $\\theta_c$ = ${deg(b.thetaC ?? 0, 2)}. Part of the power is transmitted again.`
      const tb = b.thetaB[s1.pol]
      if (tb !== null && Math.abs(s1.thetaDeg - tb / DEG) <= 0.25) return `You are at the Brewster angle $\\theta_B$ = ${deg(tb, 2)}. The reflected wave almost disappears for ${polName(b)} polarization (${pct(b.sol.R, 3)} reflected).`
      const head = `You ${moved(s0.thetaDeg, s1.thetaDeg, 'increased', 'decreased')} $\\theta_i$ from ${sig(s0.thetaDeg, 3)}° to ${sig(s1.thetaDeg, 3)}°.`
      if (b.sol.regime === 'pec') return `${head} The reflection is still total. The standing pattern along $z$ now repeats every $\\lambda_1/(2\\cos\\theta_i)$ = ${si(b.p1.lambda / (2 * Math.cos(b.sol.thetaI)), 'm', 3)}.`
      if (tir1) return `${head} The reflection is still total. The evanescent field now decays ${-b.sol.k2z.im > -a.sol.k2z.im ? 'faster' : 'more slowly'} ($\\alpha$ = ${si(-b.sol.k2z.im, 'Np/m', 3)}).`
      return `${head} ${power()}`
    }
    case 'pol': {
      if (s0.pol === s1.pol) return null
      const head = s1.pol === 'par'
        ? `You switched to parallel polarization. Now $\\mathbf{H}$ is along $\\mathbf{a}_y$ and $\\mathbf{E}$ lies in the plane of incidence.`
        : `You switched to perpendicular polarization. Now $\\mathbf{E}$ is along $\\mathbf{a}_y$ and $\\mathbf{H}$ lies in the plane of incidence.`
      return `${head} ${b.normal ? 'At normal incidence the two polarizations give the same reflection.' : power()}`
    }
    case 'e0':
      if (s0.e0 === s1.e0) return null
      return `You changed $E_{i0}$ from ${si(s0.e0, 'V/m', 3)} to ${si(s1.e0, 'V/m', 3)}. All fields scale in proportion. $\\Gamma$, $\\tau$ and the power fractions do not change.`
    case 'preset1':
      return `You selected ${b.name1.toLowerCase()} for Medium 1. ${power()}`
    case 'preset2':
      return lossy2
        ? `You selected ${b.name2.toLowerCase()} for Medium 2. At $f$ = ${si(s1.f, 'Hz', 3)} its loss tangent is ${sig(b.p2.lossTangent, 3)}, so it behaves as ${article(CLASS_LABEL[b.cls2])}.`
        : `You selected ${b.name2.toLowerCase()} for Medium 2. ${power()}`
    case 'reveal':
      return `The lab now shows the answer. Compare what you see with your prediction.`
    case 'experiment':
      return `A guided experiment is loaded. Read its question and predict the answer before you look at the numbers.`
    case 'init':
      return null
  }
}
