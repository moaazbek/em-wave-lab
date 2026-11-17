import { si, sig } from '../../ui/format'
import type { Model } from './derive'
import type { ChangeKind } from './state'

/**
 * Plain sentences for the explanation panel. Maths between dollar signs.
 * Short sentences, no idioms: many readers use English as a second language.
 */

const W = (x: number) => si(x, 'W', 3)
const rad = (x: number) => `${sig(x, 4)} rad/s`
const amp = (x: number) => si(x, 'A', 3)
const volt = (x: number) => si(x, 'V', 4)

/** Two or three sentences that describe the current situation. */
export function situation(m: Model): string[] {
  const { op } = m
  const out: string[] = []
  if (op.mode === 'motor' && op.omega === 0) {
    out.push(`The loop is held at rest, so $e_{ind} = 0$ and $i = V_B/R$ = ${amp(op.i)}. All of $P_B$ = ${W(op.PB)} is lost in $R$. The current makes the starting torque $\\tau_{ind}$ = ${si(op.tauInd, 'N·m', 3)}.`)
  } else if (op.mode === 'motor') {
    out.push(`The machine is a motor. The battery supplies $P_B$ = ${W(op.PB)}; $i^2R$ = ${W(op.PR)} is lost in $R$, and $P_{conv}$ = ${W(op.Pconv)} becomes mechanical power.`)
  } else if (op.mode === 'generator') {
    out.push(`The machine is a generator. The shaft supplies ${W(-op.Pconv)}; $i^2R$ = ${W(op.PR)} is lost in $R$, and ${W(-op.PB)} goes into the battery, which is charging.`)
  } else {
    out.push(`There is no load: $i = 0$, so $e_{ind} = V_B$ = ${volt(op.VB)} and no power flows.`)
  }
  if (op.given === 'torque') {
    out.push(`The loop turns at $\\omega$ = ${rad(op.omega)} ($n$ = ${op.n.toFixed(0)} r/min). At this speed $\\tau_{ind}$ balances $\\tau_{load}$ = ${si(op.tauLoad, 'N·m', 3)}.`)
    out.push(`Start-up: when the switch closes the loop is still, so $e_{ind} = 0$ and $i = V_B/R$ = ${amp(op.iStart)}. As the loop speeds up, $e_{ind}$ rises and $i$ falls, until the torques balance.`)
  } else {
    out.push(`A prime mover holds $\\omega$ = ${rad(op.omega)}, so $e_{ind} = \\tfrac{2}{\\pi}\\phi\\,\\omega$ = ${volt(op.eInd)} is fixed by the speed. The current $(V_B - e_{ind})/R$ = ${amp(op.i)} follows from KVL.`)
    out.push(op.eInd > op.VB
      ? `$e_{ind}$ is larger than $V_B$ = ${volt(op.VB)}, so current flows into the battery.`
      : op.eInd < op.VB
        ? `$e_{ind}$ is smaller than $V_B$ = ${volt(op.VB)}, so the battery drives current into the loop.`
        : `$e_{ind}$ equals $V_B$, so no current flows.`)
  }
  return out
}

const modeFlip = (a: Model, b: Model): string | null => {
  if (a.op.mode === b.op.mode) return null
  if (b.op.mode === 'generator') return 'The current reversed. The machine now pushes power into the battery: it is a generator.'
  if (b.op.mode === 'motor') return a.op.mode === 'generator'
    ? 'The current reversed. The machine now takes power from the battery: it is a motor.'
    : 'Current now flows out of the battery: the machine is a motor.'
  return 'The current is now zero: the machine runs at no load.'
}

const updown = (x0: number, x1: number, up: string, down: string) => (x1 > x0 ? up : down)

/** One or two sentences reacting to the last change, or null. */
export function reaction(a: Model, b: Model, change: ChangeKind): string | null {
  const s0 = a.state, s1 = b.state
  const flip = modeFlip(a, b)
  const tail = flip ? ` ${flip}` : ''
  const torqueGiven = s1.given === 'torque'
  switch (change) {
    case 'B': case 'r': case 'l': {
      const key = change as 'B' | 'r' | 'l'
      if (s0[key] === s1[key]) return null
      const sym = key === 'B' ? '$B$' : key === 'r' ? '$r$' : '$l$'
      const head = `You ${updown(s0[key], s1[key], 'raised', 'reduced')} ${sym}. The flux ${updown(a.op.phi, b.op.phi, 'rose', 'fell')} from ${si(a.op.phi, 'Wb', 3)} to ${si(b.op.phi, 'Wb', 3)}`
      if (torqueGiven) {
        const why = b.op.phi < a.op.phi ? 'must turn faster to make the same $e_{ind}$' : 'needs less speed to make the same $e_{ind}$'
        return `${head}, so the loop ${why}: $\\omega$ ${updown(a.op.omega, b.op.omega, 'rose', 'fell')} from ${sig(a.op.omega, 4)} to ${rad(b.op.omega)}.${tail}`
      }
      return `${head}. At the same speed $e_{ind}$ changed from ${volt(a.op.eInd)} to ${volt(b.op.eInd)}, so $i$ changed from ${amp(a.op.i)} to ${amp(b.op.i)}.${tail}`
    }
    case 'VB': {
      if (s0.VB === s1.VB) return null
      const head = `You ${updown(s0.VB, s1.VB, 'raised', 'lowered')} $V_B$ from ${volt(s0.VB)} to ${volt(s1.VB)}.`
      return torqueGiven
        ? `${head} The current stays ${amp(b.op.i)}, because the load torque fixes it. $e_{ind}$ and $\\omega$ ${updown(a.op.omega, b.op.omega, 'rose', 'fell')}: $\\omega$ = ${rad(b.op.omega)}.${tail}`
        : `${head} At the same speed $e_{ind}$ stays ${volt(b.op.eInd)}, so the current changed from ${amp(a.op.i)} to ${amp(b.op.i)}.${tail}`
    }
    case 'R': {
      if (s0.R === s1.R) return null
      const head = `You ${updown(s0.R, s1.R, 'raised', 'lowered')} $R$ from ${si(s0.R, 'Ω', 3)} to ${si(s1.R, 'Ω', 3)}.`
      return torqueGiven
        ? `${head} The current stays ${amp(b.op.i)}, because the load torque fixes it. The drop $iR$ changed, so $e_{ind}$ = ${volt(b.op.eInd)} and $\\omega$ = ${rad(b.op.omega)}.${tail}`
        : `${head} The speed is held, so $e_{ind}$ does not change; the current changed from ${amp(a.op.i)} to ${amp(b.op.i)}.${tail}`
    }
    case 'tau': {
      if (a.op.tauLoad === b.op.tauLoad) return null
      return `You ${updown(a.op.tauLoad, b.op.tauLoad, 'raised', 'lowered')} the load torque from ${si(a.op.tauLoad, 'N·m', 3)} to ${si(b.op.tauLoad, 'N·m', 3)}. The torque sets the current: $i = \\tau_{load}/\\tfrac{2}{\\pi}\\phi$ = ${amp(b.op.i)}. Then $e_{ind} = V_B - iR$ = ${volt(b.op.eInd)} and $\\omega$ ${updown(a.op.omega, b.op.omega, 'rose', 'fell')} from ${sig(a.op.omega, 4)} to ${rad(b.op.omega)}.${tail}`
    }
    case 'omega': {
      if (a.op.omega === b.op.omega) return null
      return `You ${updown(a.op.omega, b.op.omega, 'raised', 'lowered')} the speed from ${sig(a.op.omega, 4)} to ${rad(b.op.omega)}. $e_{ind}$ ${updown(a.op.eInd, b.op.eInd, 'rose', 'fell')} to ${volt(b.op.eInd)}, so $i = (V_B - e_{ind})/R$ = ${amp(b.op.i)}.${tail}`
    }
    case 'given':
      return s1.given === 'speed'
        ? 'You switched to "shaft speed given". A prime mover now holds $\\omega$; the current follows from KVL.'
        : 'You switched to "shaft torque given". The load torque now sets the current, and the loop finds its own speed.'
    case 'poleArc':
      return 'The pole-arc fraction changes only the drawing and the waveform. All numbers use $A_P = \\pi r l$.'
    case 'preset':
      return 'You loaded a preset from Chapman. Compare the numbers with the book.'
    case 'experiment':
      return 'A guided experiment is loaded. Read its question and predict the answer before you look at the numbers.'
    case 'reveal':
      return `The lab now shows the answer. Compare what you see with your prediction.${tail}`
    case 'init':
      return null
  }
}
