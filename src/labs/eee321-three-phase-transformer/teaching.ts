import { arg } from '../../physics/complex'
import { si, sig } from '../../ui/format'
import { CONN_TEXT, Model } from './derive'
import type { ChangeKind } from './state'

/** Plain sentences, maths between dollar signs. Short sentences, no idioms. */

const V = (x: number) => si(x, 'V', 4)
const A = (x: number) => si(x, 'A', 4)
const deg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(1)}°`

/** How the secondary line voltage follows from the winding voltage. */
const secLine = (m: Model) => (m.sol.sec.star
  ? `On the Y side the line voltage is $\\sqrt3$ times the winding voltage, so $V_{ll}$ = ${V(m.sol.sec.VLLmag)}.`
  : `On the $\\Delta$ side the winding voltage is the line voltage, so $V_{ll}$ = ${V(m.sol.sec.VLLmag)}.`)

export function situation(m: Model): string[] {
  const { sol, formula } = m
  const out: string[] = []
  out.push(`This is a ${CONN_TEXT[m.conn]} bank. Each primary winding has ${V(sol.pri.Vp)} (${sol.pri.star ? '$V_{LN}$' : '$V_{LL}$'}), so each secondary winding has ${V(sol.pri.Vp)}$/a$ = ${V(sol.sec.Vp)}. ${secLine(m)} The ratio is $V_{LL}/V_{ll} = ${formula.tex}$ = ${sig(sol.ratio, 5)} ${formula.eq}.`)
  out.push(Math.abs(sol.shiftDeg) < 1e-6
    ? `There is no phase shift: $V_{ab}$ is in phase with $V_{AB}$.`
    : `$V_{ab}$ ${sol.shiftDeg < 0 ? 'lags' : 'leads'} $V_{AB}$ by 30° (sequence ${sol.params.seq}).`)
  if (sol.params.S3 > 0) {
    const priTxt = sol.pri.star ? `the current in each primary winding is the same` : `the current in each primary winding is ${A(sol.pri.Ip)}, $\\sqrt3$ times smaller, because the primary is a $\\Delta$`
    out.push(`At $S$ = ${si(sol.params.S3, 'VA', 4)} the primary line current is ${A(sol.pri.IL)}; ${priTxt}. On the secondary, $I_{L\\text{-}sec}$ = ${A(sol.sec.IL)} and $I_{p\\text{-}sec}$ = ${A(sol.sec.Ip)}.`)
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
  switch (change) {
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
      return `${change === 'rated' ? 'You set the load to the bank rating, $3S_{unit}$. ' : ''}The line currents are now ${A(b.sol.pri.IL)} (primary) and ${A(b.sol.sec.IL)} (secondary); $I_A$ is at ${deg(arg(b.sol.pri.Iline[0]))}.`
    case 'f':
      return `The frequency changes only the time axis: 30° is now $T/12$ = ${si(1 / s1.f / 12, 's', 4)}.`
    case 'harmonic':
      return s1.harmonic ? 'The third-harmonic view is on. It is illustrative: the amplitude $h$ is a display value.' : 'The third-harmonic view is off.'
    case 'h':
      return null
    case 'spec':
      return s1.spec === 'unit'
        ? 'You now describe the bank by one unit\'s rating. The lab derives $a$, $V_{LL}$ and the rated $S_{3\\phi} = 3S_{unit}$.'
        : 'You now set the line voltage and $a$ directly.'
    case 'preset':
      return 'You loaded a preset. Compare the numbers with the book.'
    case 'experiment':
      return 'A guided experiment is loaded. Read its question and predict the answer before you look at the numbers.'
    case 'reveal':
      return `The lab now shows the answer. Compare it with your prediction.${shiftTail()}`
    case 'view': case 'init':
      return null
  }
}
