import { texNum } from '../../ui/format'
import type { WorkStep } from '../../ui/teaching'
import type { Model } from './derive'

const tn = (x: number) => {
  if (x === 0) return '0'
  const a = Math.abs(x)
  return a >= 1e6 || a < 1e-3 ? texNum(x, 6) : String(Number(x.toPrecision(6)))
}
const q = (x: number, u: string) => `${tn(x)}\\ \\text{${u}}`

/** Exam-style steps: equation, numbers with units, result — with the equation numbers. */
export function workSteps(m: Model): WorkStep[] {
  const { f, state: s } = m
  const steps: WorkStep[] = []
  steps.push({ title: 'Conductors', section: '7.3', tag: 'Eq. (7-22)', lines: ['Z = 2CN_C', `Z = 2(${s.C})(${s.NC})`, `Z = ${f.Z}`] })
  if (s.type === 'lap') steps.push({ title: 'Parallel paths (lap)', section: '7.3', tag: 'Eq. (7-26)', lines: ['a = mP', `a = (${s.m})(${s.P})`, `a = ${f.a}`] })
  else if (s.type === 'wave') steps.push({ title: 'Parallel paths (wave)', section: '7.3', tag: 'Eq. (7-28)', lines: ['a = 2m', `a = 2(${s.m})`, `a = ${f.a}`] })
  else steps.push({ title: 'Parallel paths (frog-leg)', section: '7.3', tag: 'Eq. (7-29)', lines: ['a = 2Pm_{lap}', `a = 2(${s.P})(${s.m})`, `a = ${f.a}`] })
  if (s.type === 'lap') {
    steps.push({ title: 'Commutator pitch (lap)', section: '7.3', tag: 'Eq. (7-25)', lines: ['y_c = \\pm m', `y_c = ${s.progressive ? '+' : '-'}${s.m}`, `y_c = ${f.yc}\\ \\ (\\text{${s.progressive ? 'progressive' : 'retrogressive'}})`] })
  } else if (s.type === 'wave' && f.waveYc) {
    const v = s.progressive ? f.waveYc.prog : f.waveYc.retro
    steps.push({
      title: 'Commutator pitch (wave)', section: '7.3', tag: 'Eq. (7-27)',
      lines: ['y_c = \\dfrac{2(C \\pm 1)}{P}', `y_c = \\dfrac{2(${s.C} ${s.progressive ? '+' : '-'} 1)}{${s.P}}`, `y_c = ${tn(v)}${Number.isInteger(v) ? '' : '\\ \\ (\\text{not an integer: cannot be built})'}`],
      note: s.m > 1 ? 'The course gives (7-27) for a simplex wave only.' : undefined,
    })
  }
  steps.push({ title: 'Machine constants', section: '7.5', tag: 'Eqs. (7-39), (7-42)', lines: ["K = \\dfrac{ZP}{2\\pi a}, \\qquad K' = \\dfrac{ZP}{60a}", `K = \\dfrac{(${f.Z})(${s.P})}{2\\pi(${f.a})}, \\qquad K' = \\dfrac{(${f.Z})(${s.P})}{60(${f.a})}`, `K = ${tn(f.K)}, \\qquad K' = ${tn(f.Kp)}`] })
  steps.push({ title: 'Speed', section: '7.5', tag: 'Eq. (7-40)', lines: ['\\omega = \\dfrac{2\\pi}{60}\\,n', `\\omega = \\dfrac{2\\pi}{60}(${q(s.n, 'r/min')})`, `\\omega = ${q(f.omega, 'rad/s')}`] })
  steps.push({ title: 'Internal generated voltage', section: '7.5', tag: 'Eqs. (7-38), (7-41)', lines: ["E_A = K\\phi\\omega = K'\\phi n", `E_A = (${tn(f.K)})(${q(s.phi, 'Wb')})(${q(f.omega, 'rad/s')}) = (${tn(f.Kp)})(${q(s.phi, 'Wb')})(${q(s.n, 'r/min')})`, `E_A = ${q(f.EA, 'V')}`] })
  const el = s.Rper === 'conductor' ? 'Z/a' : s.Rper === 'turn' ? 'Z/(2a)' : 'C/a'
  steps.push({
    title: 'Armature resistance (series–parallel rule)', section: '7.5', tag: 'Ex. 7-4(c)',
    lines: [`R_{path} = (${el})\\,R_{${s.Rper}}, \\qquad R_A = \\dfrac{R_{path}}{a}`, `R_{path} = (${tn(f.elementsPerPath)})(${q(s.R, '\\Omega')}) = ${q(f.Rpath, '\\Omega')}, \\qquad R_A = \\dfrac{${q(f.Rpath, '\\Omega')}}{${f.a}}`, `R_A = ${q(f.RA, '\\Omega')}`],
  })
  if (s.load) {
    const ra = s.ignoreRA ? '0' : q(f.RA, '\\Omega')
    steps.push({ title: 'Armature current', section: '7.5', lines: [s.ignoreRA ? 'I_A = \\dfrac{E_A}{R_L}\\ \\ (R_A\\ \\text{ignored})' : 'I_A = \\dfrac{E_A}{R_A + R_L}', `I_A = \\dfrac{${q(f.EA, 'V')}}{${ra} + ${q(s.RL, '\\Omega')}}`, `I_A = ${q(f.IA, 'A')}, \\qquad I_A/a = ${q(f.Ipath, 'A')}\\ \\text{per path (7-44)}`] })
    steps.push({ title: 'Terminal voltage', section: '7.5', lines: ['V_T = I_A R_L = E_A - I_A R_A', `V_T = (${q(f.IA, 'A')})(${q(s.RL, '\\Omega')})`, `V_T = ${q(f.VT, 'V')}`] })
    steps.push({ title: 'Induced torque (countertorque)', section: '7.5', tag: 'Eq. (7-49)', lines: ['\\tau_{ind} = K\\phi I_A', `\\tau_{ind} = (${tn(f.K)})(${q(s.phi, 'Wb')})(${q(f.IA, 'A')})`, `\\tau_{ind} = ${q(f.tau, 'N·m')}`] })
  } else {
    steps.push({ title: 'Armature current', section: '7.5', lines: ['I_A = 0\\ \\ (\\text{open circuit})', 'V_T = E_A', `V_T = ${q(f.EA, 'V')}, \\qquad \\tau_{ind} = 0`] })
  }
  return steps
}
