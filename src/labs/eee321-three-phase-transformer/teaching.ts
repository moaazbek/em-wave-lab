import { abs, arg } from '../../physics/complex'
import { si, sig } from '../../ui/format'
import { CONN_TEXT, Model, sideTag } from './derive'
import type { ChangeKind, PresetId } from './state'

/** Plain sentences, maths between dollar signs. Short sentences, no idioms. */

const V = (x: number) => si(x, 'V', 4)
const A = (x: number) => si(x, 'A', 4)
const deg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(1)}°`

/** How the secondary line voltage follows from the winding voltage. */
const secLine = (m: Model) => (m.sol.sec.star
  ? `On the Y side the line voltage is $\\sqrt3$ times the winding voltage, so $V_{ll}$ = ${V(m.sol.sec.VLLmag)}.`
  : `On the $\\Delta$ side the winding voltage is the line voltage, so $V_{ll}$ = ${V(m.sol.sec.VLLmag)}.`)

const pct = (x: number, n = 4) => `${sig(x, n)} %`
const W = (x: number) => si(x, 'W', 4)

/** Notes on known errors in the solutions manual, shown with the matching preset. */
export const MANUAL_NOTE: Partial<Record<PresetId, string>> = {
  r210: 'The solutions manual gives the turns ratios 2.50, 1.44 and 4.33. They belong to a 34.5/13.8 kV bank. For 34.5/11 kV the ratios are 3.136 (Y–Y), 1.811 (Y–$\Delta$), 5.432 ($\Delta$–Y) and 3.136 ($\Delta$–$\Delta$). The problem gives no impedances, so the circuit here is ideal.',
  r211: 'The solutions manual uses $P_{out}$ = 80 MW in (d). A load of 80 MVA at PF 0.8 is 64 MW, so $\eta$ = 96.91 %, not 97.5 %.',
  r212: 'The solutions manual gives VR = 3.8 % and $\eta$ = 96.9 %. It computes $Z_{base}$ with 25 kVA instead of 20 kVA, and in (b) it uses yet another impedance. The book\'s equations give VR = 2.94 % and $\eta$ = 97.15 %.',
  r213: 'The solutions manual writes 8413 V instead of 8314 V, so it gets $V_{\phi P}$ = 8856 V and VR = 6.52 %. With 8314 V the values are 8757 V and 5.32 %. In (e) it uses $V_\phi^2/S$ with the bank $S$ (230 Ω); Eq. (2-94b) gives $3V_\phi^2/S$ = 691 Ω, so $Z$ = 0.0273 + j0.0518 pu.',
}

function realSituation(m: Model): string[] {
  const r = m.real!, R = r.rating, o = m.sol.real, s = m.state
  const out: string[] = []
  out.push(`This is a ${CONN_TEXT[m.conn]} bank of three ${si(R.Sphi, 'VA', 4)} transformers, ${V(R.VphiP)} / ${V(R.VphiS)} each, so $a$ = ${sig(R.a, 5)}. The bank is rated ${si(R.S, 'VA', 4)}, ${V(R.VLL)} / ${V(R.Vll)}.`)
  if (r.error) { out.push(`Nothing is computed: ${r.error.text.replace('V·I', '$V\\cdot I$')}`); return out }
  const src = s.zFrom === 'test'
    ? `The equivalent circuit comes from the test data${s.ocOn ? '' : ' (no OC test)'}${s.scOn ? '' : ' (no SC test)'}.`
    : `The equivalent circuit is given ${s.zFrom === 'pu' ? 'in per-unit' : `in ohms on the ${s.zFrom === 'ohmP' ? 'primary' : 'secondary'} side`}.`
  out.push(`${src} Referred to the ${sideTag(m, 'S')} side: $R_{eq,S}$ = ${si(r.circuit!.S.Req, 'Ω', 4)}, $X_{eq,S}$ = ${si(r.circuit!.S.Xeq, 'Ω', 4)}.${r.noShunt ? ' The shunt branch is neglected, so there is no core loss.' : ''}`)
  if (o) {
    const pf = s.pf >= 1 ? 'unity PF' : `PF ${sig(s.pf, 3)} ${s.lagging ? 'lagging' : 'leading'}`
    out.push(s.hold === 'sec'
      ? `The secondary is held at its rated ${V(R.VphiS)} per winding. At ${pct(r.frac * 100, 3)} of rated load, ${pf}, Eq. (2-64) gives $V_{\phi P}/a$ = ${V(abs(o.VPa))}, ahead by $\delta$ = ${sig(o.deltaDeg, 3)}°. The primary needs $V_{LL}$ = ${V(m.sol.pri.VLLmag)}, and VR = ${pct(o.VR)}.${o.VR < 0 ? ' VR is negative: with a leading load the secondary voltage rises.' : ''}`
      : `The primary is held at its rated ${V(R.VphiP)} per winding. At ${pct(r.frac * 100, 3)} of rated current, ${pf}, the secondary falls to ${V(abs(o.VphiS))} (solved from Eq. 2-64), so VR = ${pct(o.VR)}.`)
    out.push(`Losses: $P_{Cu}$ = ${W(o.Pcu)} and $P_{core}$ = ${W(o.Pcore)}. With $P_{out}$ = ${W(o.Pout)}, $\eta$ = ${pct(o.eta, 5)}.`)
  }
  const note = MANUAL_NOTE[s.preset]
  if (note) out.push(`Note: ${note}`)
  return out
}

export function situation(m: Model): string[] {
  if (m.real) return realSituation(m)
  const { sol, formula } = m
  const out: string[] = []
  out.push(`This is a ${CONN_TEXT[m.conn]} bank. Each primary winding has ${V(sol.pri.Vp)} (${sol.pri.star ? '$V_{LN}$' : '$V_{LL}$'}), so each secondary winding has ${V(sol.pri.Vp)}$/a$ = ${V(sol.sec.Vp)}. ${secLine(m)} The ratio is $V_{LL}/V_{ll} = ${formula.tex}$ = ${sig(sol.ratio, 5)} ${formula.eq}.`)
  out.push(Math.abs(sol.shiftDeg) < 1e-6
    ? `There is no phase shift: $V_{ab}$ is in phase with $V_{AB}$.`
    : `$V_{ab}$ ${sol.shiftDeg < 0 ? 'lags' : 'leads'} $V_{AB}$ by 30° (sequence ${sol.params.seq}).`)
  if (sol.params.S3 > 0) {
    const priTxt = sol.pri.star ? `the current in each primary winding is the same` : `the current in each primary winding is ${A(sol.pri.Ip)}, $\\sqrt3$ times smaller, because the primary is a $\\Delta$`
    out.push(`At $S$ = ${si(sol.params.S3, 'VA', 4)} the primary line current is ${A(sol.pri.IL)}; ${priTxt}. On the secondary, $I_{LS}$ = ${A(sol.sec.IL)} and $I_{\\phi S}$ = ${A(sol.sec.Ip)}.`)
  } else {
    out.push('There is no load, so no current flows.')
  }
  if (m.state.harmonic) {
    out.push(m.conn === 'YY'
      ? 'Third-harmonic view: the phase voltages carry the third harmonic, but the line voltages do not. A Y–Y bank has no delta to circulate it. The slides\' remedies: a solidly grounded neutral, or a $\\Delta$ tertiary winding.'
      : 'Third-harmonic view: the three third harmonics are in phase. They cancel in every line voltage, and around the delta they add up and drive a circulating current (not computed here), so the phase voltages stay sinusoidal.')
  }
  return out
}

export function reaction(a: Model, b: Model, change: ChangeKind): string | null {
  const s0 = a.state, s1 = b.state
  const shiftTail = () => {
    if (Math.abs(a.sol.shiftDeg - b.sol.shiftDeg) < 1e-6) return ''
    if (Math.abs(b.sol.shiftDeg) < 1e-6) return ' Now there is no phase shift.'
    return ` The secondary moved 30° ${b.sol.shiftDeg < 0 ? 'behind' : 'ahead'}.`
  }
  const o = b.sol.real
  const realNow = () => (o ? `VR = ${pct(o.VR)}, $P_{Cu}$ = ${W(o.Pcu)}, $P_{core}$ = ${W(o.Pcore)}, $\eta$ = ${pct(o.eta, 5)}.` : b.real?.error ? b.real.error.text.replace('V·I', '$V\\cdot I$') : '')
  if (b.real && (change === 'S3' || change === 'pf' || change === 'lag' || change === 'rated'))
    return `${change === 'rated' ? 'Rated load. ' : ''}Load ${pct(b.real.frac * 100, 3)} of rated: ${realNow()}${a.sol.real && o ? ` (VR was ${pct(a.sol.real.VR)}).` : ''}`
  if (b.real && change === 'conn' && s0.conn !== s1.conn && a.real)
    return `${CONN_TEXT[s0.conn]} → ${CONN_TEXT[s1.conn]}: the line voltages and currents change, but VR and $\eta$ belong to one transformer${b.state.rBy === 'unit' ? ', so they stay the same' : ' (with the bank rating fixed, the winding ratings change too)'}. ${realNow()}`
  switch (change) {
    case 'model':
      return s1.model === 'real'
        ? 'Real bank: each transformer now has its series impedance and, if given, an excitation branch. The ratings carry over from the ideal settings.'
        : 'Ideal transformers: no impedance, no losses, no voltage drop. The ratings carry over.'
    case 'rating':
      return b.real ? `Rating: $S_\phi$ = ${si(b.real.rating.Sphi, 'VA', 4)}, $V_{\phi P}$ = ${V(b.real.rating.VphiP)}, $V_{\phi S}$ = ${V(b.real.rating.VphiS)}, $a$ = ${sig(b.real.rating.a, 5)}. ${realNow()}` : null
    case 'zFrom': case 'test': case 'z':
      return b.real?.circuit ? `$R_{eq,S}$ = ${si(b.real.circuit.S.Req, 'Ω', 4)}, $X_{eq,S}$ = ${si(b.real.circuit.S.Xeq, 'Ω', 4)}. ${realNow()}` : realNow() || null
    case 'hold':
      return s1.hold === 'pri'
        ? `Now $|V_{\phi P}|$ is fixed at its rating and the secondary voltage is solved from Eq. (2-64). ${realNow()}`
        : `Now the secondary is held at its rated voltage, as in Chapman's definition of VR. ${realNow()}`
    case 'loadBy':
      return null
    case 'conn': {
      if (s0.conn === s1.conn) return null
      const same = Math.abs(a.sol.sec.Vp - b.sol.sec.Vp) <= 1e-9 * a.sol.sec.Vp
      const head = `${CONN_TEXT[s0.conn]} → ${CONN_TEXT[s1.conn]} with the same $a$:`
      const wind = same
        ? ` each secondary winding has the same voltage, ${V(b.sol.sec.Vp)},`
        : ` each secondary winding now has ${V(b.sol.sec.Vp)} (it was ${V(a.sol.sec.Vp)}), because the primary windings now see ${b.sol.pri.star ? '$V_{LN}$' : '$V_{LL}$'},`
      const line = a.sol.sec.star === b.sol.sec.star
        ? ' and the secondary is connected the same way.'
        : b.sol.sec.star ? ' but now the line voltage is $\\sqrt3$ times it.' : ' but now it *is* the line voltage.'
      const fell = b.sol.sec.VLLmag < a.sol.sec.VLLmag ? 'fell' : b.sol.sec.VLLmag > a.sol.sec.VLLmag ? 'rose' : 'stayed'
      return `${head}${wind}${line} So $V_{ll}$ ${fell}${fell === 'stayed' ? ` at ${V(b.sol.sec.VLLmag)}` : ` from ${V(a.sol.sec.VLLmag)} to ${V(b.sol.sec.VLLmag)}`}.${shiftTail()}`
    }
    case 'seq':
      if (Math.abs(b.sol.shiftDeg) < 1e-6) return `You switched to ${s1.seq}. A ${CONN_TEXT[s1.conn]} bank has no phase shift with either sequence.`
      return `You switched to ${s1.seq}: the same wiring now gives a 30° ${b.sol.shiftDeg > 0 ? 'lead' : 'lag'}.`
    case 'a': case 'VLL': case 'unit': {
      if (Math.abs(a.sol.sec.VLLmag - b.sol.sec.VLLmag) < 1e-9 * a.sol.sec.VLLmag && Math.abs(a.VLL - b.VLL) < 1e-9 * a.VLL) return null
      return `$V_{LL}$ = ${V(b.VLL)} and $a$ = ${sig(b.a, 5)} give $V_{ll}$ = ${V(b.sol.sec.VLLmag)} (it was ${V(a.sol.sec.VLLmag)}). The line-voltage ratio is ${sig(b.sol.ratio, 5)}, not $a$${b.formula.factor === 1 ? ' — here they are equal' : ''}.`
    }
    case 'S3': case 'pf': case 'lag': case 'rated':
      if (b.sol.params.S3 === 0) return 'No load: all currents are zero.'
      return `${change === 'rated' ? 'You set the load to the bank rating, $3S_\\phi$. ' : ''}The line currents are now ${A(b.sol.pri.IL)} (primary) and ${A(b.sol.sec.IL)} (secondary); $I_A$ is at ${deg(arg(b.sol.pri.Iline[0]))}.`
    case 'f':
      return `The frequency changes only the time axis: 30° is now $T/12$ = ${si(1 / s1.f / 12, 's', 4)}.`
    case 'harmonic':
      return s1.harmonic ? 'The third-harmonic view is on. It is illustrative: the amplitude $h$ is a display value.' : 'The third-harmonic view is off.'
    case 'h':
      return null
    case 'spec':
      return s1.spec === 'unit'
        ? 'You now describe the bank by one unit\'s rating. The lab derives $a$, $V_{LL}$ and the rated $S = 3S_\\phi$.'
        : 'You now set the line voltage and $a$ directly.'
    case 'preset':
      return 'You loaded a preset. Compare the numbers with the book.'
    case 'experiment':
      return 'A guided experiment is loaded. Read its question and predict the answer before you look at the numbers.'
    case 'reveal':
      return `The lab now shows the answer. Compare it with your prediction.${shiftTail()}`
    case 'view': case 'init':
      return null
    default:
      return null
  }
}
