import { abs, arg } from '../../physics/complex'
import { texNum } from '../../ui/format'
import type { WorkStep } from '../../ui/teaching'
import { Model, sideTag } from './derive'

const tn = (x: number) => {
  if (x === 0) return '0'
  if (!Number.isFinite(x)) return '\\infty'
  const a = Math.abs(x)
  return a >= 1e6 || a < 1e-3 ? texNum(x, 6) : String(Number(x.toPrecision(6)))
}
const q = (x: number, u: string) => `${tn(x)}\\ \\text{${u}}`
const ang = (rad: number) => `${tn((rad * 180) / Math.PI)}^\\circ`
const R3 = '\\sqrt3'

/** Exam-style steps for the real bank, in the order of the course. */
export function realWorkSteps(m: Model): WorkStep[] {
  const r = m.real!, R = r.rating, b = r.bases, s = m.state, o = m.sol.real
  const priStar = m.sol.pri.star, secStar = m.sol.sec.star
  const steps: WorkStep[] = []
  const hv = (x: 'P' | 'S') => sideTag(m, x)

  // 1. ratings
  steps.push({
    title: 'Per-transformer ratings', section: '2.10', tag: 'Eq. (2-92)',
    lines: s.rBy === 'bank'
      ? [`S_\\phi = \\dfrac{S}{3}, \\quad V_{\\phi P} = ${priStar ? `\\dfrac{V_{LL}}{${R3}}` : 'V_{LL}'}, \\quad V_{\\phi S} = ${secStar ? `\\dfrac{V_{ll}}{${R3}}` : 'V_{ll}'}`,
        `S_\\phi = \\dfrac{${q(R.S, 'VA')}}{3}, \\quad V_{\\phi P} = ${priStar ? `\\dfrac{${q(R.VLL, 'V')}}{${R3}}` : q(R.VLL, 'V')}, \\quad V_{\\phi S} = ${secStar ? `\\dfrac{${q(R.Vll, 'V')}}{${R3}}` : q(R.Vll, 'V')}`,
        `S_\\phi = ${q(R.Sphi, 'VA')}, \\quad V_{\\phi P} = ${q(R.VphiP, 'V')}, \\quad V_{\\phi S} = ${q(R.VphiS, 'V')}, \\quad a = ${tn(R.a)}`]
      : [`S = 3S_\\phi, \\quad V_{LL} = ${priStar ? `${R3}\\,V_{\\phi P}` : 'V_{\\phi P}'}, \\quad V_{ll} = ${secStar ? `${R3}\\,V_{\\phi S}` : 'V_{\\phi S}'}, \\quad a = \\dfrac{V_{\\phi P}}{V_{\\phi S}}`,
        `S = 3(${q(R.Sphi, 'VA')}), \\quad a = \\dfrac{${q(R.VphiP, 'V')}}{${q(R.VphiS, 'V')}}`,
        `S = ${q(R.S, 'VA')}, \\quad V_{LL} = ${q(R.VLL, 'V')}, \\quad V_{ll} = ${q(R.Vll, 'V')}, \\quad a = ${tn(R.a)}`],
    note: `Primary ${priStar ? 'Y' : 'Δ'} (${hv('P')}), secondary ${secStar ? 'Y' : 'Δ'} (${hv('S')}).`,
  })
  if (r.error) {
    steps.push({ title: 'Data refused', section: '2.5', lines: ['\\text{Nothing is computed}'], note: r.error.text })
    return steps
  }
  const t = r.tests
  // 2–4. tests
  for (const [k, T] of [['oc', 'OC'], ['sc', 'SC']] as const) {
    const res = t?.[k]
    if (!res) continue
    const side = k === 'oc' ? s.ocSide : s.scSide
    const form = k === 'oc' ? s.ocForm : s.scForm
    const raw = k === 'oc' ? { V: s.ocV, I: s.ocI, P: s.ocP } : { V: s.scV, I: s.scI, P: s.scP }
    const star = side === 'P' ? priStar : secStar
    if (form === 'bank')
      steps.push({
        title: `${T} readings to one transformer (${star ? 'Y' : 'Δ'} side)`, section: '2.10',
        lines: [star ? `V_\\phi = \\dfrac{V_{line}}{${R3}}, \\quad I_\\phi = I_{line}, \\quad P_\\phi = \\dfrac{P_{3\\phi}}{3}` : `V_\\phi = V_{line}, \\quad I_\\phi = \\dfrac{I_{line}}{${R3}}, \\quad P_\\phi = \\dfrac{P_{3\\phi}}{3}`,
          star ? `V_\\phi = \\dfrac{${q(raw.V, 'V')}}{${R3}}, \\quad I_\\phi = ${q(raw.I, 'A')}, \\quad P_\\phi = \\dfrac{${q(raw.P, 'W')}}{3}` : `V_\\phi = ${q(raw.V, 'V')}, \\quad I_\\phi = \\dfrac{${q(raw.I, 'A')}}{${R3}}, \\quad P_\\phi = \\dfrac{${q(raw.P, 'W')}}{3}`,
          `V_{${T}} = ${q(res.perPhase.V, 'V')}, \\quad I_{${T}} = ${q(res.perPhase.I, 'A')}, \\quad P_{${T}} = ${q(res.perPhase.P, 'W')}`],
      })
    const sub = side === 'P' ? 'P' : 'S'
    const pp = res.perPhase
    if (k === 'oc') {
      const oc = t!.oc!.result
      steps.push({
        title: `Open-circuit test (on the ${side === 'P' ? 'primary' : 'secondary'})`, section: '2.5', tag: 'Eqs. (2-44), (2-46), (2-47)',
        lines: ['|Y_E| = \\dfrac{I_{OC}}{V_{OC}}, \\quad \\theta = \\cos^{-1}\\dfrac{P_{OC}}{V_{OC}I_{OC}}, \\quad Y_E = |Y_E|\\angle{-\\theta} = G_C - jB_M',
          `|Y_E| = \\dfrac{${q(pp.I, 'A')}}{${q(pp.V, 'V')}} = ${q(oc.Ymag, 'S')}, \\quad \\theta = \\cos^{-1}\\dfrac{${q(pp.P, 'W')}}{(${q(pp.V, 'V')})(${q(pp.I, 'A')})} = ${ang(oc.theta)}`,
          `G_C = ${q(oc.GC, 'S')}, \\quad B_M = ${q(oc.BM, 'S')} \;\\Rightarrow\; R_{C,${sub}} = \\dfrac{1}{G_C} = ${q(oc.RC, '\\Omega')}, \\quad X_{M,${sub}} = \\dfrac{1}{B_M} = ${q(oc.XM, '\\Omega')}`],
        note: `Eqs. (2-40), (2-41). The values are referred to the side where the test was done (${hv(side)}).`,
      })
    } else {
      const sc = t!.sc!.result
      steps.push({
        title: `Short-circuit test (on the ${side === 'P' ? 'primary' : 'secondary'})`, section: '2.5', tag: 'Eqs. (2-48), (2-50) to (2-52)',
        lines: ['|Z_{SE}| = \\dfrac{V_{SC}}{I_{SC}}, \\quad \\theta = \\cos^{-1}\\dfrac{P_{SC}}{V_{SC}I_{SC}}, \\quad Z_{SE} = |Z_{SE}|\\angle\\theta = R_{eq} + jX_{eq}',
          `|Z_{SE}| = \\dfrac{${q(pp.V, 'V')}}{${q(pp.I, 'A')}} = ${q(sc.Zmag, '\\Omega')}, \\quad \\theta = \\cos^{-1}\\dfrac{${q(pp.P, 'W')}}{(${q(pp.V, 'V')})(${q(pp.I, 'A')})} = ${ang(sc.theta)}`,
          `R_{eq,${sub}} = ${q(sc.Req, '\\Omega')}, \\quad X_{eq,${sub}} = ${q(sc.Xeq, '\\Omega')}`],
        note: `The values are referred to the side where the test was done (${hv(side)}).`,
      })
    }
  }
  // 5. referral and bases
  const c = r.circuit!
  steps.push({
    title: 'Per-unit bases', section: '2.10', tag: 'Eqs. (2-92) to (2-95)',
    lines: ['Z_{base} = \\dfrac{(V_{\\phi,base})^2}{S_{\\phi,base}} = \\dfrac{3(V_{\\phi,base})^2}{S_{base}}',
      `Z_{base,P} = \\dfrac{(${q(R.VphiP, 'V')})^2}{${q(b.SphiBase, 'VA')}}, \\quad Z_{base,S} = \\dfrac{(${q(R.VphiS, 'V')})^2}{${q(b.SphiBase, 'VA')}}`,
      `Z_{base,P} = ${q(b.ZbaseP, '\\Omega')}, \\quad Z_{base,S} = ${q(b.ZbaseS, '\\Omega')}`],
  })
  steps.push({
    title: `Refer the circuit to the secondary (${hv('S')}) side`, section: '2.5',
    lines: ['Z_S = \\dfrac{Z_P}{a^2} = Z_{pu}\\,Z_{base,S}',
      `R_{eq,S} = ${q(c.S.Req, '\\Omega')}, \\quad X_{eq,S} = ${q(c.S.Xeq, '\\Omega')}${r.noShunt ? '' : `, \\quad R_{C,S} = ${q(c.S.RC!, '\\Omega')}, \\quad X_{M,S} = ${q(c.S.XM!, '\\Omega')}`}`,
      `\\text{per-unit: } R_{eq} = ${tn(c.pu.Req)}, \\quad X_{eq} = ${tn(c.pu.Xeq)}${r.noShunt ? '' : `, \\quad R_C = ${tn(c.pu.RC!)}, \\quad X_M = ${tn(c.pu.XM!)}`}`],
    note: r.noShunt ? 'Shunt branch neglected (no core data): $P_{core} = 0$.' : undefined,
  })
  if (!o) return steps
  // 6. secondary current
  const th = m.sol.theta
  const Imag = abs(o.IphiS)
  steps.push({
    title: 'Secondary winding current', section: '2.7',
    lines: [`I_{\\phi S} = \\dfrac{S_{load}/3}{V_{\\phi S,rated}}\\angle{-\\theta}, \\quad \\theta = ${s.lagging ? '+' : '-'}\\cos^{-1}\\text{PF}`,
      `I_{\\phi S} = \\dfrac{${q(s.S3, 'VA')}/3}{${q(R.VphiS, 'V')}}\\angle{${ang(-th)}}`,
      `I_{\\phi S} = ${q(Imag, 'A')}\\angle{${ang(arg(o.IphiS))}}`],
  })
  // 7. Eq. 2-64
  if (s.hold === 'sec') {
    steps.push({
      title: 'Primary voltage referred to the secondary', section: '2.7', tag: 'Eq. (2-64)',
      lines: ['\\dfrac{V_{\\phi P}}{a} = V_{\\phi S} + R_{eq,S}I_{\\phi S} + jX_{eq,S}I_{\\phi S}',
        `\\dfrac{V_{\\phi P}}{a} = ${q(R.VphiS, 'V')}\\angle 0^\\circ + (${q(c.S.Req, '\\Omega')})(${q(Imag, 'A')}\\angle{${ang(arg(o.IphiS))}}) + j(${q(c.S.Xeq, '\\Omega')})(${q(Imag, 'A')}\\angle{${ang(arg(o.IphiS))}})`,
        `\\dfrac{V_{\\phi P}}{a} = ${q(abs(o.VPa), 'V')}\\angle{${ang(arg(o.VPa))}}, \\quad V_{\\phi P} = ${q(abs(o.VphiP), 'V')}, \\quad V_P = ${tn(abs(o.VphiP) / R.VphiP)}\\angle{${ang(arg(o.VphiP))}}\\ \\text{pu}`],
    })
  } else {
    steps.push({
      title: 'Secondary voltage, solved from Eq. (2-64)', section: '2.7', tag: 'Eq. (2-64)',
      lines: ['|V_{\\phi S}| = -\\mathrm{Re}(u) + \\sqrt{\\left(\\dfrac{|V_{\\phi P}|}{a}\\right)^2 - \\mathrm{Im}(u)^2}, \\quad u = Z_{SE,S}\\,|I_{\\phi S}|\\angle{-\\theta}',
        `\\dfrac{|V_{\\phi P}|}{a} = \\dfrac{${q(R.VphiP, 'V')}}{${tn(R.a)}} = ${q(R.VphiS, 'V')}`,
        `|V_{\\phi S}| = ${q(abs(o.VphiS), 'V')}`],
      note: 'Primary held at its rated voltage; $V_{\\phi S}$ is the angle reference.',
    })
  }
  // 8. VR
  steps.push({
    title: 'Voltage regulation', section: '2.7', tag: 'Eq. (2-62)',
    lines: ['VR = \\dfrac{|V_{\\phi P}|/a - |V_{\\phi S}|}{|V_{\\phi S}|}\\times 100\\%',
      `VR = \\dfrac{${q(abs(o.VPa), 'V')} - ${q(abs(o.VphiS), 'V')}}{${q(abs(o.VphiS), 'V')}}\\times 100\\%`,
      `VR = ${tn(o.VR)}\\ \\%`],
    note: o.VR < 0 ? 'Negative: with a leading load the secondary voltage rises with load.' : undefined,
  })
  // 9. losses
  const VPa = abs(o.VPa)
  steps.push({
    title: 'Losses and output (bank)', section: '2.7', tag: 'Eqs. (2-65), (2-66)',
    lines: [`P_{Cu} = 3|I_{\\phi S}|^2R_{eq,S}, \\quad P_{core} = 3\\dfrac{|V_{\\phi P}/a|^2}{R_{C,S}}, \\quad P_{out} = 3V_{\\phi S}I_{\\phi S}\\cos\\theta`,
      `P_{Cu} = 3(${q(Imag, 'A')})^2(${q(c.S.Req, '\\Omega')}), \\quad P_{core} = ${r.noShunt ? '0' : `3\\dfrac{(${q(VPa, 'V')})^2}{${q(c.S.RC!, '\\Omega')}}`}, \\quad P_{out} = 3(${q(abs(o.VphiS), 'V')})(${q(Imag, 'A')})(${tn(Math.cos(th))})`,
      `P_{Cu} = ${q(o.Pcu, 'W')}, \\quad P_{core} = ${q(o.Pcore, 'W')}, \\quad P_{out} = ${q(o.Pout, 'W')}`],
    note: r.noShunt ? 'Shunt branch neglected: $P_{core} = 0$.' : 'The excitation branch sits at the primary terminals, so its voltage is $V_{\\phi P}/a$ on the secondary side.',
  })
  // 10. efficiency
  steps.push({
    title: 'Efficiency', section: '2.7', tag: 'Eq. (2-67)',
    lines: ['\\eta = \\dfrac{P_{out}}{P_{out} + P_{Cu} + P_{core}}\\times 100\\%',
      `\\eta = \\dfrac{${q(o.Pout, 'W')}}{${q(o.Pout, 'W')} + ${q(o.Pcu, 'W')} + ${q(o.Pcore, 'W')}}\\times 100\\%`,
      `\\eta = ${tn(o.eta)}\\ \\%`],
  })
  // 11. V_LL needed
  steps.push({
    title: s.hold === 'sec' ? 'Primary line voltage needed' : 'Primary line voltage (held)', section: '2.10',
    lines: [priStar ? `V_{LL} = ${R3}\\,|V_{\\phi P}|` : 'V_{LL} = |V_{\\phi P}|',
      priStar ? `V_{LL} = ${R3}\\,(${q(abs(o.VphiP), 'V')})` : `V_{LL} = ${q(abs(o.VphiP), 'V')}`,
      `V_{LL} = ${q(m.sol.pri.VLLmag, 'V')}`],
  })
  return steps
}
