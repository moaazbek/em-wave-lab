import { C, C0, DEG, EPS0, ETA0, GOOD_CONDUCTOR_MIN, LOW_LOSS_MAX, abs, arg, goodConductorApprox, incidentPowerDensity, lowLossApprox, pctError } from '../../physics'
import { texNum as n, texPolar, texRect } from '../../ui/format'
import type { Model } from './derive'

export interface WorkStep {
  title: string
  section: string
  /** Display maths: governing equation, then the numbers substituted, then the result. */
  lines: string[]
  note?: string
}

const p = (z: C) => `(${texRect(z)})`
const both = (z: C) => (Math.abs(z.im) <= 1e-9 * abs(z) ? texRect(z) : `${texRect(z)} = ${texPolar(z)}`)
const degT = (rad: number, d = 2) => `${(rad / DEG).toFixed(d)}^\\circ`
const U = (u: string) => `\\ \\text{${u}}`

/** "Show the work": every step is written the way a student writes it in an exam. */
export function workSteps(m: Model): WorkStep[] {
  const { sol, state } = m
  const { p1, p2 } = m
  const steps: WorkStep[] = []
  const f = state.f
  const th = sol.thetaI
  const pec = sol.regime === 'pec'
  const lossy2 = state.m2.sigma > 0 && !pec
  const cosI = Math.cos(th)

  steps.push({
    title: 'Medium 1 (lossless)',
    section: '8-2',
    lines: [
      `\\beta_1 = \\omega\\sqrt{\\mu_1\\epsilon_1} = \\frac{2\\pi f}{c}\\sqrt{\\mu_{r1}\\epsilon_{r1}} = \\frac{2\\pi(${n(f)})}{${n(C0)}}\\sqrt{(${n(state.m1.muR)})(${n(state.m1.epsR)})} = ${n(p1.beta)}${U('rad/m')}`,
      `\\eta_1 = \\eta_0\\sqrt{\\frac{\\mu_{r1}}{\\epsilon_{r1}}} = ${n(ETA0)}\\sqrt{\\frac{${n(state.m1.muR)}}{${n(state.m1.epsR)}}} = ${n(p1.eta.re)}${U('Ω')}`,
      `\\lambda_1 = \\frac{2\\pi}{\\beta_1} = ${n(p1.lambda)}${U('m')}, \\qquad u_{p1} = \\frac{\\omega}{\\beta_1} = ${n(p1.up)}${U('m/s')}`,
    ],
  })

  if (pec) {
    steps.push({ title: 'Medium 2 (perfect conductor)', section: '8-6', lines: [`\\sigma_2 \\to \\infty: \\qquad \\eta_2 = 0, \\qquad \\delta_2 = 0, \\qquad \\mathbf{E}_2 = \\mathbf{H}_2 = 0`] })
  } else if (!lossy2) {
    steps.push({
      title: 'Medium 2 (lossless)',
      section: '8-2',
      lines: [
        `\\beta_2 = \\frac{2\\pi f}{c}\\sqrt{\\mu_{r2}\\epsilon_{r2}} = \\frac{2\\pi(${n(f)})}{${n(C0)}}\\sqrt{(${n(state.m2.muR)})(${n(state.m2.epsR)})} = ${n(p2.beta)}${U('rad/m')}`,
        `\\eta_2 = \\eta_0\\sqrt{\\frac{\\mu_{r2}}{\\epsilon_{r2}}} = ${n(ETA0)}\\sqrt{\\frac{${n(state.m2.muR)}}{${n(state.m2.epsR)}}} = ${n(p2.eta.re)}${U('Ω')}`,
        `\\lambda_2 = \\frac{2\\pi}{\\beta_2} = ${n(p2.lambda)}${U('m')}`,
      ],
    })
  } else {
    const cls = m.cls2
    const verdict = cls === 'good-conductor' ? `> ${GOOD_CONDUCTOR_MIN} \\ \\Rightarrow\\ \\text{good conductor}`
      : cls === 'low-loss' ? `< ${LOW_LOSS_MAX} \\ \\Rightarrow\\ \\text{low-loss dielectric}` : `\\ \\Rightarrow\\ \\text{general lossy medium (use the exact formulas)}`
    const lines = [
      `\\frac{\\sigma_2}{\\omega\\epsilon_2} = \\frac{${n(state.m2.sigma)}}{2\\pi(${n(f)})(${n(state.m2.epsR)})(${n(EPS0)})} = ${n(p2.lossTangent)} ${verdict}`,
      `\\gamma_2 = \\sqrt{j\\omega\\mu_2(\\sigma_2 + j\\omega\\epsilon_2)} = \\alpha_2 + j\\beta_2 = ${texRect(p2.gamma)}${U('m⁻¹')}`,
      `\\eta_2 = \\sqrt{\\frac{j\\omega\\mu_2}{\\sigma_2 + j\\omega\\epsilon_2}} = ${both(p2.eta)}${U('Ω')}`,
      `\\delta_2 = \\frac{1}{\\alpha_2} = ${n(p2.delta)}${U('m')}, \\qquad \\lambda_2 = \\frac{2\\pi}{\\beta_2} = ${n(p2.lambda)}${U('m')}`,
    ]
    if (cls === 'good-conductor') {
      const g = goodConductorApprox(state.m2, f)
      lines.push(`\\text{Approximation: } \\alpha_2 = \\beta_2 \\approx \\sqrt{\\pi f\\mu_2\\sigma_2} = \\sqrt{\\pi(${n(f)})(${n(p2.mu)})(${n(state.m2.sigma)})} = ${n(g.alpha)} \\quad (\\text{error in } \\alpha_2\\!: ${n(Math.abs(pctError(g.alpha, p2.alpha)), 2)}\\,\\%)`)
      lines.push(`\\eta_2 \\approx (1+j)\\frac{\\alpha_2}{\\sigma_2} = ${texRect(g.eta)}${U('Ω')}, \\qquad \\delta_2 \\approx \\frac{1}{\\sqrt{\\pi f\\mu_2\\sigma_2}} = ${n(g.delta)}${U('m')}`)
    }
    if (cls === 'low-loss') {
      const l = lowLossApprox(state.m2, f)
      lines.push(`\\text{Approximation: } \\alpha_2 \\approx \\frac{\\sigma_2}{2}\\sqrt{\\frac{\\mu_2}{\\epsilon_2}} = \\frac{${n(state.m2.sigma)}}{2}(${n(Math.sqrt(p2.mu / p2.eps))}) = ${n(l.alpha)}${U('Np/m')}`)
      lines.push(`\\beta_2 \\approx \\omega\\sqrt{\\mu_2\\epsilon_2}\\left[1 + \\frac{1}{8}\\left(\\frac{\\sigma_2}{\\omega\\epsilon_2}\\right)^2\\right] = ${n(l.beta)}${U('rad/m')}, \\qquad \\eta_2 \\approx \\sqrt{\\frac{\\mu_2}{\\epsilon_2}}\\left(1 + j\\frac{\\sigma_2}{2\\omega\\epsilon_2}\\right) = ${texRect(l.eta)}${U('Ω')}`)
    }
    steps.push({ title: 'Medium 2 (lossy)', section: cls === 'good-conductor' ? '8-3.2' : cls === 'low-loss' ? '8-3.1' : '8-3', lines })
  }

  if (!pec && !m.normal) {
    if (!lossy2) {
      const sinT = (sol.kx / p2.beta)
      const lines = [
        `\\sin\\theta_t = \\sin\\theta_i\\sqrt{\\frac{\\mu_1\\epsilon_1}{\\mu_2\\epsilon_2}} = \\sin(${degT(th)})\\sqrt{\\frac{(${n(state.m1.muR)})(${n(state.m1.epsR)})}{(${n(state.m2.muR)})(${n(state.m2.epsR)})}} = ${n(sinT)}`,
      ]
      if (sol.regime === 'refraction') lines.push(`\\theta_t = ${degT(sol.thetaT ?? 0, 3)}, \\qquad \\cos\\theta_t = ${n(sol.cosThetaT.re)}`)
      else {
        lines.push(`\\sin\\theta_t > 1 \\ \\Rightarrow\\ \\text{total reflection}, \\qquad \\cos\\theta_t = -j\\sqrt{\\sin^2\\theta_t - 1} = ${texRect(sol.cosThetaT)}`)
        lines.push(`\\alpha_{2z} = \\beta_2\\sqrt{\\sin^2\\theta_t - 1} = ${n(-sol.k2z.im)}${U('Np/m')} \\qquad (\\text{field in Medium 2} \\propto e^{-\\alpha_{2z} z}\\,e^{-j\\beta_1 x\\sin\\theta_i})`)
      }
      steps.push({ title: "Snell's law", section: sol.regime === 'refraction' ? '8-10' : '8-10.1', lines })
    } else {
      steps.push({
        title: 'Complex angle of refraction',
        section: 'beyond the textbook',
        lines: [
          `k_x = \\beta_1\\sin\\theta_i = ${n(sol.kx)}, \\qquad k_{2z} = \\sqrt{\\omega^2\\mu_2\\epsilon_{c2} - k_x^2} = ${texRect(sol.k2z)}${U('m⁻¹')}`,
          `\\cos\\theta_t = \\frac{k_{2z}}{k_2} = ${texRect(sol.cosThetaT)}`,
        ],
        note: 'Cheng does not treat oblique incidence on a lossy medium. The same formulas for Γ and τ hold with this complex cos θt.',
      })
    }
  }

  // Reflection and transmission coefficients
  if (pec) {
    const along = state.pol === 'perp' ? 'y' : 'x'
    const js = abs(m.js.x) + abs(m.js.y)
    steps.push({
      title: 'Reflection from a perfect conductor',
      section: m.normal ? '8-6' : state.pol === 'perp' ? '8-7.1' : '8-7.2',
      lines: [
        `E_{\\text{tan}} = 0 \\text{ at } z = 0 \\ \\Rightarrow\\ \\Gamma = -1, \\qquad \\tau = 0`,
        `\\mathbf{J}_s = \\mathbf{a}_n\\times\\mathbf{H}_1\\big|_{z=0} = \\mathbf{a}_${along}\\,\\frac{2E_{i0}}{\\eta_1}${state.pol === 'perp' && !m.normal ? '\\cos\\theta_i' : ''}\\,e^{-j\\beta_1 x\\sin\\theta_i} \\ \\Rightarrow\\ |\\mathbf{J}_s| = \\frac{2(${n(state.e0)})}{${n(p1.eta.re)}}${state.pol === 'perp' && !m.normal ? `\\cos(${degT(th)})` : ''} = ${n(js)}${U('A/m')}`,
      ],
    })
  } else if (m.normal) {
    steps.push({
      title: 'Reflection and transmission coefficients',
      section: '8-8',
      lines: [
        `\\Gamma = \\frac{\\eta_2 - \\eta_1}{\\eta_2 + \\eta_1} = \\frac{${p(p2.eta)} - ${n(p1.eta.re)}}{${p(p2.eta)} + ${n(p1.eta.re)}} = ${both(sol.Gamma)}`,
        `\\tau = \\frac{2\\eta_2}{\\eta_2 + \\eta_1} = \\frac{2${p(p2.eta)}}{${p(p2.eta)} + ${n(p1.eta.re)}} = ${both(sol.tau)}`,
        `\\text{Check: } 1 + \\Gamma = \\tau`,
      ],
    })
  } else {
    const ci = n(cosI), ct = p(sol.cosThetaT), e1 = n(p1.eta.re), e2 = p(p2.eta)
    steps.push(state.pol === 'perp' ? {
      title: 'Reflection and transmission, perpendicular polarization',
      section: '8-10.2',
      lines: [
        `\\Gamma_\\perp = \\frac{\\eta_2\\cos\\theta_i - \\eta_1\\cos\\theta_t}{\\eta_2\\cos\\theta_i + \\eta_1\\cos\\theta_t} = \\frac{${e2}(${ci}) - (${e1})${ct}}{${e2}(${ci}) + (${e1})${ct}} = ${both(sol.Gamma)}`,
        `\\tau_\\perp = \\frac{2\\eta_2\\cos\\theta_i}{\\eta_2\\cos\\theta_i + \\eta_1\\cos\\theta_t} = ${both(sol.tau)}`,
        `\\text{Check: } 1 + \\Gamma_\\perp = \\tau_\\perp`,
      ],
    } : {
      title: 'Reflection and transmission, parallel polarization',
      section: '8-10.3',
      lines: [
        `\\Gamma_\\parallel = \\frac{\\eta_2\\cos\\theta_t - \\eta_1\\cos\\theta_i}{\\eta_2\\cos\\theta_t + \\eta_1\\cos\\theta_i} = \\frac{${e2}${ct} - (${e1})(${ci})}{${e2}${ct} + (${e1})(${ci})} = ${both(sol.Gamma)}`,
        `\\tau_\\parallel = \\frac{2\\eta_2\\cos\\theta_i}{\\eta_2\\cos\\theta_t + \\eta_1\\cos\\theta_i} = ${both(sol.tau)}`,
        `\\text{Check: } 1 + \\Gamma_\\parallel = \\tau_\\parallel\\,\\frac{\\cos\\theta_t}{\\cos\\theta_i}`,
      ],
    })
  }

  // Power
  {
    const lines = [
      `\\mathscr{P}_{av,i} = \\frac{E_{i0}^2}{2\\eta_1} = \\frac{(${n(state.e0)})^2}{2(${n(p1.eta.re)})} = ${n(incidentPowerDensity(sol))}${U('W/m²')}`,
      `\\frac{\\text{reflected}}{\\text{incident}} = |\\Gamma|^2 = (${n(abs(sol.Gamma))})^2 = ${n(sol.R)}`,
      `\\frac{\\text{entering Medium 2}}{\\text{incident}} = 1 - |\\Gamma|^2 = ${n(sol.T)}`,
    ]
    if (sol.regime === 'refraction') lines.push(`\\text{Check: } \\frac{\\eta_1\\cos\\theta_t}{\\eta_2\\cos\\theta_i}|\\tau|^2 = \\frac{(${n(p1.eta.re)})(${n(sol.cosThetaT.re)})}{(${n(p2.eta.re)})(${n(cosI)})}(${n(abs(sol.tau))})^2 = ${n(sol.T)} \\qquad (|\\tau|^2 = ${n(abs(sol.tau) ** 2)} \\text{ is not the power fraction})`)
    steps.push({
      title: 'Average power across the boundary', section: '8-5', lines,
      note: sol.regime === 'lossy' ? 'The power that enters Medium 2 is absorbed there; the power density falls as exp(−2 α₂ z).'
        : sol.regime === 'total-reflection' ? 'Beyond the critical angle no average power crosses the boundary.' : undefined,
    })
  }

  if (m.normal && !(sol.R < 1e-12)) {
    const g = abs(sol.Gamma)
    steps.push({
      title: 'Standing wave in Medium 1',
      section: pec ? '8-6' : '8-8',
      lines: [
        pec ? `S = \\frac{1 + |\\Gamma|}{1 - |\\Gamma|} \\to \\infty` : `S = \\frac{1 + |\\Gamma|}{1 - |\\Gamma|} = \\frac{1 + ${n(g)}}{1 - ${n(g)}} = ${n(m.sw.S)}`,
        `|E_1(z)| = E_{i0}\\left|1 + \\Gamma e^{j2\\beta_1 z}\\right|: \\qquad z_{\\max} = ${n(m.sw.zMax[0])}${U('m')}, \\qquad z_{\\min} = ${n(m.sw.zMin[0])}${U('m')}, \\qquad \\text{spacing } \\frac{\\lambda_1}{2} = ${n(p1.lambda / 2)}${U('m')}`,
      ],
    })
  }

  if (m.thetaC !== null) {
    steps.push({
      title: 'Critical angle', section: '8-10.1',
      lines: [`\\sin\\theta_c = \\sqrt{\\frac{\\mu_2\\epsilon_2}{\\mu_1\\epsilon_1}} = \\sqrt{\\frac{(${n(state.m2.muR)})(${n(state.m2.epsR)})}{(${n(state.m1.muR)})(${n(state.m1.epsR)})}} = ${n(Math.sin(m.thetaC))} \\ \\Rightarrow\\ \\theta_c = ${degT(m.thetaC, 3)}`],
    })
  }
  if (m.thetaB.par !== null) {
    const simple = state.m1.muR === state.m2.muR
    steps.push({
      title: 'Brewster angle, parallel polarization', section: '8-10.3',
      lines: [simple
        ? `\\tan\\theta_{B\\parallel} = \\sqrt{\\frac{\\epsilon_2}{\\epsilon_1}} = \\sqrt{\\frac{${n(state.m2.epsR)}}{${n(state.m1.epsR)}}} = ${n(Math.tan(m.thetaB.par))} \\ \\Rightarrow\\ \\theta_{B\\parallel} = ${degT(m.thetaB.par, 3)}`
        : `\\sin^2\\theta_{B\\parallel} = \\frac{1 - \\mu_2\\epsilon_1/\\mu_1\\epsilon_2}{1 - (\\epsilon_1/\\epsilon_2)^2} = ${n(Math.sin(m.thetaB.par) ** 2)} \\ \\Rightarrow\\ \\theta_{B\\parallel} = ${degT(m.thetaB.par, 3)}`],
    })
  }
  if (m.thetaB.perp !== null) {
    steps.push({
      title: 'Brewster angle, perpendicular polarization', section: '8-10.2',
      lines: [`\\sin^2\\theta_{B\\perp} = \\frac{1 - \\mu_1\\epsilon_2/\\mu_2\\epsilon_1}{1 - (\\mu_1/\\mu_2)^2} = ${n(Math.sin(m.thetaB.perp) ** 2)} \\ \\Rightarrow\\ \\theta_{B\\perp} = ${degT(m.thetaB.perp, 3)}`],
    })
  }

  // Instantaneous fields in cosine form (the component along a_y)
  {
    const q = state.pol === 'perp' ? 'E' : 'H'
    const unit = q === 'E' ? 'V/m' : 'A/m'
    const ph = (a: number) => {
      const d = a / DEG
      return Math.abs(d) < 0.005 ? '' : ` ${d < 0 ? '-' : '+'} ${Math.abs(d).toFixed(2)}^\\circ`
    }
    const term = (v: number, s: string) => (Math.abs(v) < 1e-12 ? '' : ` ${v < 0 ? '+' : '-'} ${n(Math.abs(v))}${s}`)
    const wt = `2\\pi(${n(f)})t`
    const ai = sol.amp.inc[q].y, ar = sol.amp.ref[q].y, at = sol.amp.trans[q].y
    const lines = [
      `\\mathbf{${q}}_i(x,z;t) = \\mathbf{a}_y\\,${q === 'E' ? 'E_{i0}' : '\\frac{E_{i0}}{\\eta_1}'}\\cos(\\omega t - \\beta_1 x\\sin\\theta_i - \\beta_1 z\\cos\\theta_i) = \\mathbf{a}_y\\,${n(abs(ai))}\\cos(${wt}${term(sol.kx, 'x')}${term(sol.k1z, 'z')})${U(unit)}`,
    ]
    if (abs(ar) > 1e-12 * abs(ai)) lines.push(`\\mathbf{${q}}_r(x,z;t) = \\mathbf{a}_y\\,${n(abs(ar))}\\cos(${wt}${term(sol.kx, 'x')}${term(-sol.k1z, 'z')}${ph(arg(ar))})${U(unit)}`)
    if (!pec) {
      const a2 = -sol.k2z.im
      lines.push(`\\mathbf{${q}}_t(x,z;t) = \\mathbf{a}_y\\,${n(abs(at))}${a2 > 1e-12 * Math.max(1, sol.k2z.re) ? `\\,e^{-${n(a2)}z}` : ''}\\cos(${wt}${term(sol.kx, 'x')}${term(sol.k2z.re, 'z')}${ph(arg(at))})${U(unit)}`)
    }
    steps.push({
      title: `Instantaneous ${q} (the component along a_y)`, section: '8-2', lines,
      note: 'Instantaneous field = Re[phasor · e^{jωt}]. x and z are in metres, t in seconds.',
    })
  }
  return steps
}
