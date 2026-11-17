import { Heading } from '../../ui/controls'
import { plain, si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Badge, Row } from '../../ui/Row'
import { Prose } from '../../ui/Tex'
import type { Model } from './derive'

const MODE_TEXT = {
  motor: { badge: 'MOTOR', why: '$P_{conv} = e_{ind}\\,i > 0$: electric power becomes mechanical power.' },
  generator: { badge: 'GENERATOR', why: '$P_{conv} = e_{ind}\\,i < 0$: mechanical power becomes electric power; current flows into the battery.' },
  idle: { badge: 'NO LOAD', why: '$i = 0$: no power flows; $e_{ind} = V_B$.' },
} as const

export function Results({ model }: { model: Model }) {
  const { op } = model
  const torqueGiven = op.given === 'torque'
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section="7.1">Mode</Heading>
        <div className="mt-2.5 flex items-center gap-2">
          <Badge strong={op.mode !== 'idle'}>{MODE_TEXT[op.mode].badge}</Badge>
          <span className="text-[12.5px] text-mute">{torqueGiven ? 'shaft torque given' : 'shaft speed given'}</span>
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-mute">
          <Prose>{op.omega === 0 && op.mode === 'motor'
            ? '$i > 0$ but $\\omega = 0$: the loop is held at rest. $e_{ind} = 0$, so no power is converted; all of $P_B$ is lost in $R$.'
            : MODE_TEXT[op.mode].why}</Prose>
        </p>
      </section>

      <section>
        <Heading section="7.1">Machine</Heading>
        <dl className="mt-1.5">
          <Row sym="A_P = \pi r l">{plain(op.AP, 'm²')}</Row>
          <Row sym="\phi = A_P B">{plain(op.phi, 'Wb')}</Row>
          <Row sym="\tfrac{2}{\pi}\phi">{plain(op.k, 'V·s')}</Row>
        </dl>
      </section>

      <section>
        <Heading section="Ex. 7-1">Operating point</Heading>
        <dl className="mt-1.5">
          <Row sym="e_{ind}" color={MC.voltage}>{si(op.eInd, 'V', 4)}</Row>
          <Row sym="i" color={MC.current} sub={op.i < 0 ? 'into the battery' : op.i > 0 ? 'out of the battery' : undefined}>{si(op.i, 'A', 4)}</Row>
          <Row sym="\omega" color={MC.mechanical}>{si(op.omega, 'rad/s', 4)}</Row>
          <Row sym="n" color={MC.mechanical}>{op.n.toFixed(1)} r/min</Row>
          <Row sym="\tau_{ind}" color={MC.mechanical}>{si(op.tauInd, 'N·m', 4)}</Row>
          {!torqueGiven && <Row sym="\tau_{pm} = -\tau_{ind}" color={MC.mechanical} sub="prime mover">{si(op.tauPrimeMover, 'N·m', 4)}</Row>}
          <Row sym="v = r\omega" sub="conductor speed">{si(op.v, 'm/s', 4)}</Row>
          <Row sym="F = ilB" sub="per conductor">{si(op.F, 'N', 4)}</Row>
        </dl>
      </section>

      <section>
        <Heading section="7.1">Power</Heading>
        <dl className="mt-1.5">
          <Row sym="P_B = V_B i" color={MC.voltage}>{si(op.PB, 'W', 4)}</Row>
          <Row sym="P_R = i^2 R">{si(op.PR, 'W', 4)}</Row>
          <Row sym="P_{conv} = e_{ind} i" color={MC.mechanical}>{si(op.Pconv, 'W', 4)}</Row>
          <Row sym="P_{shaft} = \tau\omega" color={MC.mechanical}>{si(op.Pshaft, 'W', 4)}</Row>
        </dl>
      </section>

      {torqueGiven && (
        <section>
          <Heading section="Ex. 7-1">Limits</Heading>
          <dl className="mt-1.5">
            <Row sym="i_{start} = V_B/R" color={MC.current}>{si(op.iStart, 'A', 4)}</Row>
            <Row sym="\omega_{nl} = V_B / \tfrac{2}{\pi}\phi" color={MC.mechanical}>{si(op.omegaNl, 'rad/s', 4)}</Row>
            <Row sym="\tau_{stall} = \tfrac{2}{\pi}\phi\,V_B/R" color={MC.mechanical}>{si(op.tauStall, 'N·m', 4)}</Row>
          </dl>
        </section>
      )}

      <section>
        <Heading>Model</Heading>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-mute">
          <li><Prose>{'Steady state only. The book gives no inertia, so start-up is described in words, not animated.'}</Prose></li>
          <li><Prose>{'$A_P = \\pi r l$ ignores the gaps between the poles. The gaps appear only in the waveform and the drawing.'}</Prose></li>
          <li><Prose>{'The only loss is $i^2R$. $B$ is uniform and radial under the poles, zero beyond their edges.'}</Prose></li>
        </ul>
      </section>
    </div>
  )
}
