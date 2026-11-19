import { arg } from '../../physics/complex'
import { texNum } from '../../ui/format'
import type { WorkStep } from '../../ui/teaching'
import type { Model } from './derive'
import { realWorkSteps } from './workReal'

const tn = (x: number) => {
  if (x === 0) return '0'
  const a = Math.abs(x)
  return a >= 1e6 || a < 1e-3 ? texNum(x, 6) : String(Number(x.toPrecision(6)))
}
const q = (x: number, u: string) => `${tn(x)}\\ \\text{${u}}`
const d = (rad: number) => `${((rad * 180) / Math.PI).toFixed(2)}^\\circ`

/** Exam-style steps for the current connection: equation, numbers with units, result. */
export function workSteps(m: Model): WorkStep[] {
  if (m.real) return realWorkSteps(m)
  const { sol } = m
  const { pri, sec } = sol
  const a = m.a, S = sol.params.S3
  const steps: WorkStep[] = []
  // primary winding voltage
  if (pri.star) {
    steps.push({ title: 'Primary winding voltage (Y)', section: '2.10', lines: ['V_{LN} = \\dfrac{V_{LL}}{\\sqrt3}', `V_{LN} = \\dfrac{${q(m.VLL, 'V')}}{\\sqrt3}`, `V_{LN} = V_{\\phi P} = ${q(pri.Vp, 'V')}`] })
  } else {
    steps.push({ title: 'Primary winding voltage (Δ)', section: '2.10', lines: ['V_{\\phi P} = V_{LL}', `V_{\\phi P} = ${q(m.VLL, 'V')}`, `V_{\\phi P} = ${q(pri.Vp, 'V')}`] })
  }
  const vin = pri.star ? 'V_{LN}' : 'V_{LL}'
  steps.push({ title: 'Secondary winding voltage', section: '2.10', lines: [`V_{\\phi S} = \\dfrac{${vin}}{a}`, `V_{\\phi S} = \\dfrac{${q(pri.Vp, 'V')}}{${tn(a)}}`, `V_{\\phi S} = ${q(sec.Vp, 'V')}`] })
  steps.push(sec.star
    ? { title: 'Secondary line voltage (Y)', section: '2.10', lines: ['V_{ll} = \\sqrt3\\, V_{\\phi S}', `V_{ll} = \\sqrt3\\,(${q(sec.Vp, 'V')})`, `V_{ll} = ${q(sec.VLLmag, 'V')}`] }
    : { title: 'Secondary line voltage (Δ)', section: '2.10', lines: ['V_{ll} = V_{\\phi S}', `V_{ll} = ${q(sec.Vp, 'V')}`, `V_{ll} = ${q(sec.VLLmag, 'V')}`] })
  steps.push({
    title: 'Check the line-voltage ratio', section: '2.10', tag: `Eq. ${m.formula.eq}`,
    lines: [`\\dfrac{V_{LL}}{V_{ll}} = ${m.formula.tex}`, `\\dfrac{${q(m.VLL, 'V')}}{${q(sec.VLLmag, 'V')}} = ${m.formula.tex.replace('a', `(${tn(a)})`)}`, `\\dfrac{V_{LL}}{V_{ll}} = ${tn(sol.ratio)}${m.formula.factor === 1 ? '' : ` \\ne a = ${tn(a)}`}`],
  })
  if (S > 0) {
    steps.push({ title: 'Secondary line current', section: '2.10', lines: ['I_{LS} = \\dfrac{S}{\\sqrt3\\, V_{ll}}', `I_{LS} = \\dfrac{${q(S, 'VA')}}{\\sqrt3\\,(${q(sec.VLLmag, 'V')})}`, `I_{LS} = ${q(sec.IL, 'A')}`] })
    steps.push(sec.star
      ? { title: 'Secondary winding current (Y)', section: '2.10', lines: ['I_{\\phi S} = I_{LS}', `I_{\\phi S} = ${q(sec.IL, 'A')}`, `I_{\\phi S} = ${q(sec.Ip, 'A')}`] }
      : { title: 'Secondary winding current (Δ)', section: '2.10', lines: ['I_{\\phi S} = \\dfrac{I_{LS}}{\\sqrt3}', `I_{\\phi S} = \\dfrac{${q(sec.IL, 'A')}}{\\sqrt3}`, `I_{\\phi S} = ${q(sec.Ip, 'A')}`] })
    steps.push({ title: 'Primary winding current', section: '2.10', lines: ['I_{\\phi P} = \\dfrac{I_{\\phi S}}{a}', `I_{\\phi P} = \\dfrac{${q(sec.Ip, 'A')}}{${tn(a)}}`, `I_{\\phi P} = ${q(pri.Ip, 'A')}`] })
    steps.push(pri.star
      ? { title: 'Primary line current (Y)', section: '2.10', lines: ['I_{LP} = I_{\\phi P}', `I_{LP} = ${q(pri.Ip, 'A')}`, `I_{LP} = ${q(pri.IL, 'A')}`] }
      : { title: 'Primary line current (Δ)', section: '2.10', lines: ['I_{LP} = \\sqrt3\\, I_{\\phi P}', `I_{LP} = \\sqrt3\\,(${q(pri.Ip, 'A')})`, `I_{LP} = ${q(pri.IL, 'A')}`] })
    steps.push({
      title: 'Power check', section: '2.10',
      lines: ['S = \\sqrt3\\, V_{LL} I_{LP} = \\sqrt3\\, V_{ll} I_{LS}', `S = \\sqrt3\\,(${q(m.VLL, 'V')})(${q(pri.IL, 'A')}) = \\sqrt3\\,(${q(sec.VLLmag, 'V')})(${q(sec.IL, 'A')})`,
        `S = ${q(S, 'VA')}, \\quad P = ${q(sol.Sload.re, 'W')}, \\quad Q = ${q(sol.Sload.im, 'var')}`],
    })
  }
  // phase shift with its reason, from the computed phasors
  const AB = arg(pri.Vll[0]), ab = arg(sec.Vll[0]), w1p = arg(pri.Vw[0])
  const n = sol.params.netlist
  const wp = `V_{${n.primary[0].dot}${n.primary[0].other}}`
  /** An angle as inline maths for the plain-text note. */
  const dd = (rad: number) => '$' + d(rad) + '$'
  const reason = m.conn === 'YY' || m.conn === 'DD'
    ? 'Each secondary winding voltage is in phase with its primary winding voltage, and both sides form their line voltages the same way, so there is no shift.'
    : m.conn === 'YD'
      ? `$V_{ab}$ is the winding voltage of T1, $V_{AN}/a$, in phase with $V_{AN}$ at ${dd(0)}. $V_{AB}$ is at ${dd(AB)}, so $V_{ab}$ ${ab < AB ? 'lags' : 'leads'} $V_{AB}$ by 30°.`
      : `T1's primary is connected A→C, so $V_{an} = V_{AC}/a$ is at ${dd(w1p)}. On the Y side $V_{ab}$ is 30° from $V_{an}$, at ${dd(ab)}; $V_{AB}$ is at ${dd(AB)}.`
  steps.push({
    title: 'Phase shift', section: '2.10',
    lines: ['\\angle V_{ab} - \\angle V_{AB}', `${d(ab)} - (${d(AB)})${m.conn === 'DY' ? `, \\qquad ${wp} = V_{\\phi P}\\angle ${d(w1p)}` : ''}`,
      `\\angle V_{ab} - \\angle V_{AB} = ${sol.shiftDeg.toFixed(2)}^\\circ \\ \\Rightarrow\\ \\text{${Math.abs(sol.shiftDeg) < 1e-6 ? 'no shift' : sol.shiftDeg < 0 ? '30° lag' : '30° lead'}}`],
    note: reason + (m.conn === 'DY'
      ? ' Wiring used: T1 A→C, T2 B→A, T3 C→B (course convention). Chapman\'s Fig. 2-37c as printed (A→B, B→C, C→A) gives a 30° lead with abc, while the text says lag; the voltage ratio is the same.'
      : ''),
  })
  return steps
}
