import { texNum } from '../../ui/format'
import type { WorkStep } from '../../ui/teaching'
import type { OperatingPoint } from './engine'

/** Up to 6 significant figures without trailing zeros (0.392699, 432, 1.5708); exponent form outside 1e-3 … 1e6. */
function tn(x: number): string {
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a >= 1e6 || a < 1e-3) return texNum(x, 4)
  return String(Number(x.toPrecision(6)))
}
/** Quantity with unit; negative values in parentheses when substituted. */
const q = (x: number, unit: string, paren = true) => {
  const v = `${tn(x)}\\ ${unit}`
  return paren && x < 0 ? `(${v})` : v
}
const U = {
  m: '\\text{m}', m2: '\\text{m}^2', T: '\\text{T}', Wb: '\\text{Wb}', Vs: '\\text{V}\\cdot\\text{s}', A: '\\text{A}',
  V: '\\text{V}', ohm: '\\Omega', Nm: '\\text{N}\\cdot\\text{m}', rads: '\\text{rad/s}', W: '\\text{W}', ms: '\\text{m/s}',
}

/** "Show the work" for the current mode: each step as equation, equation with numbers and units, result. */
export function workSteps(op: OperatingPoint): WorkStep[] {
  const steps: WorkStep[] = [
    {
      title: 'Rotor area under one pole', section: '7.1',
      lines: ['A_P = \\pi r l', `A_P = \\pi\\,(${q(op.r, U.m, false)})(${q(op.l, U.m, false)})`, `A_P = ${q(op.AP, U.m2, false)}`],
    },
    {
      title: 'Flux per pole', section: '7.1',
      lines: ['\\phi = A_P B', `\\phi = (${q(op.AP, U.m2, false)})(${q(op.B, U.T, false)})`, `\\phi = ${q(op.phi, U.Wb, false)}`],
    },
    {
      title: 'Machine constant', section: '7.1',
      lines: ['\\tfrac{2}{\\pi}\\phi', `\\tfrac{2}{\\pi}\\phi = \\tfrac{2}{\\pi}\\,(${q(op.phi, U.Wb, false)})`, `\\tfrac{2}{\\pi}\\phi = ${q(op.k, U.Vs, false)}`],
    },
  ]
  const k = `${q(op.k, U.Vs, false)}`
  if (op.given === 'torque') {
    steps.push(
      {
        title: 'Current from the load torque', section: '7.1', tag: 'Eq. (7-16)',
        lines: ['i = \\dfrac{\\tau_{load}}{\\tfrac{2}{\\pi}\\phi}', `i = \\dfrac{${q(op.tauLoad, U.Nm, false)}}{${k}}`, `i = ${q(op.i, U.A, false)}`],
      },
      {
        title: 'Induced voltage', section: '7.1', tag: 'KVL',
        lines: ['e_{ind} = V_B - iR', `e_{ind} = ${q(op.VB, U.V)} - ${q(op.i, U.A)}(${q(op.R, U.ohm, false)})`, `e_{ind} = ${q(op.eInd, U.V, false)}`],
      },
      {
        title: 'Speed', section: '7.1', tag: 'Eq. (7-6)',
        lines: [
          '\\omega = \\dfrac{e_{ind}}{\\tfrac{2}{\\pi}\\phi}',
          `\\omega = \\dfrac{${q(op.eInd, U.V, false)}}{${k}}`,
          `\\omega = ${q(op.omega, U.rads, false)} \\qquad n = \\dfrac{60\\,\\omega}{2\\pi} = ${tn(op.n)}\\ \\text{r/min}`,
        ],
      },
    )
  } else {
    steps.push(
      {
        title: 'Induced voltage from the speed', section: '7.1', tag: 'Eq. (7-6)',
        lines: ['e_{ind} = \\tfrac{2}{\\pi}\\phi\\,\\omega', `e_{ind} = (${k})(${q(op.omega, U.rads, false)})`, `e_{ind} = ${q(op.eInd, U.V, false)}`],
      },
      {
        title: 'Current', section: '7.1', tag: 'KVL',
        lines: ['i = \\dfrac{V_B - e_{ind}}{R}', `i = \\dfrac{${q(op.VB, U.V, false)} - ${q(op.eInd, U.V)}}{${q(op.R, U.ohm, false)}}`, `i = ${q(op.i, U.A, false)}`],
      },
      {
        title: 'Induced torque', section: '7.1', tag: 'Eq. (7-16)',
        lines: ['\\tau_{ind} = \\tfrac{2}{\\pi}\\phi\\, i', `\\tau_{ind} = (${k})${q(op.i, U.A)}`, `\\tau_{ind} = ${q(op.tauInd, U.Nm, false)} \\qquad \\text{prime mover: } -\\tau_{ind} = ${q(op.tauPrimeMover, U.Nm, false)}`],
      },
    )
  }
  steps.push(
    {
      title: 'Check with the conductor speed', section: '7.1', tag: 'Eq. (7-5)',
      lines: [
        'v = r\\omega, \\qquad e_{ind} = 2vBl',
        `v = (${q(op.r, U.m, false)})(${q(op.omega, U.rads, false)}) = ${q(op.v, U.ms, false)}, \\qquad e_{ind} = 2(${q(op.v, U.ms, false)})(${q(op.B, U.T, false)})(${q(op.l, U.m, false)})`,
        `e_{ind} = ${q(op.eInd, U.V, false)}`,
      ],
    },
    {
      title: op.given === 'torque' ? 'Shaft power' : 'Converted power', section: '7.1', tag: op.given === 'torque' ? 'Ex. 7-1' : '§ 7.1',
      lines: [
        'P = \\tau\\,\\omega',
        `P = ${q(op.tauInd, U.Nm)}(${q(op.omega, U.rads, false)})`,
        `P = ${q(op.Pshaft, U.W, false)}`,
      ],
    },
    {
      title: 'Battery and resistor power', section: '7.1',
      lines: [
        'P_B = V_B\\, i, \\qquad P_R = i^2 R',
        `P_B = (${q(op.VB, U.V, false)})${q(op.i, U.A)}, \\qquad P_R = ${q(op.i, U.A)}^2(${q(op.R, U.ohm, false)})`,
        `P_B = ${q(op.PB, U.W, false)}, \\qquad P_R = ${q(op.PR, U.W, false)}`,
      ],
      note: op.PB < 0 ? 'P_B is negative: the battery absorbs power (it is charging).' : undefined,
    },
    {
      title: 'Conclusion', section: '7.1',
      lines: [
        'P_{conv} = e_{ind}\\, i = \\tau_{ind}\\,\\omega',
        `P_{conv} = (${q(op.eInd, U.V, false)})${q(op.i, U.A)}`,
        op.mode === 'motor' && op.Pconv === 0 ? `P_{conv} = 0, \\quad i = ${q(op.i, U.A)} > 0 \\ \\Rightarrow\\ \\text{motor at standstill}`
        : op.mode === 'motor' ? `P_{conv} = ${q(op.Pconv, U.W, false)} > 0 \\ \\Rightarrow\\ \\text{motor}`
          : op.mode === 'generator' ? `P_{conv} = ${q(op.Pconv, U.W, false)} < 0 \\ \\Rightarrow\\ \\text{generator}`
            : 'i = 0 \\ \\Rightarrow\\ \\text{no load (idle)}',
      ],
      note: op.mode === 'motor' && op.Pconv === 0 ? 'The loop is held at rest: it makes torque but converts no power yet.'
        : op.mode === 'motor' ? 'Electric power becomes mechanical power.'
        : op.mode === 'generator' ? 'Mechanical power becomes electric power; the current flows into the battery.'
          : 'No current flows, so no power is converted.',
    },
  )
  return steps
}
