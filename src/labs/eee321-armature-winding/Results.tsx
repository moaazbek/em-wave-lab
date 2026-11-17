import { Heading } from '../../ui/controls'
import { plain, si, sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Row } from '../../ui/Row'
import { Prose } from '../../ui/Tex'
import { Model, windingName } from './derive'

export function Results({ model }: { model: Model }) {
  const { f, state: s } = model
  const yc = f.yc === null ? 'no formula' : f.ycInteger ? (f.yc > 0 ? `+${f.yc}` : String(f.yc)) : `${sig(f.yc, 5)} (not an integer)`
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section="7.3">Winding</Heading>
        <p className="mt-2 text-[12.5px] text-mute">{windingName(s)}, {s.progressive ? 'progressive' : 'retrogressive'}, {s.P} poles</p>
        <dl className="mt-1.5">
          <Row sym="Z = 2CN_C">{f.Z}</Row>
          <Row sym="a" sub="parallel paths">{f.a}</Row>
          <Row sym="y_c" sub="commutator pitch">{yc}</Row>
          <Row sym="\text{brushes}">{f.brushes}</Row>
          <Row sym="C/a" sub="coils per path">{plain(f.coilsPerPath, '')}</Row>
          <Row sym="Z/a" sub="conductors per path">{plain(f.condPerPath, '')}</Row>
          <Row sym="y_s" sub="coil span, slots">{f.ys}</Row>
          <Row sym="p" sub="pitch factor">{sig(f.p, 4)} %</Row>
        </dl>
      </section>

      <section>
        <Heading section="7.5">Constants and speed</Heading>
        <dl className="mt-1.5">
          <Row sym="K = \tfrac{ZP}{2\pi a}">{plain(f.K, '')}</Row>
          <Row sym="K' = \tfrac{ZP}{60a}">{plain(f.Kp, '')}</Row>
          <Row sym="\omega" color={MC.mechanical} sub="mechanical speed">{plain(f.omega, 'rad/s')}</Row>
          <Row sym="e_{cond} = \tfrac{P\phi\omega}{2\pi}" color={MC.voltage}>{si(f.econd, 'V', 4)}</Row>
        </dl>
      </section>

      <section>
        <Heading section="7.5">Voltage and current</Heading>
        <dl className="mt-1.5">
          <Row sym="E_A = K\phi\omega" color={MC.voltage}>{si(f.EA, 'V', 5)}</Row>
          <Row sym="R_A" sub="series–parallel rule">{si(f.RA, 'Ω', 4)}</Row>
          <Row sym="I_A" color={MC.current}>{si(f.IA, 'A', 4)}</Row>
          <Row sym="I_A / a" color={MC.current} sub="per path">{si(f.Ipath, 'A', 4)}</Row>
          <Row sym="V_T" color={MC.voltage}>{si(f.VT, 'V', 5)}</Row>
          <Row sym="\tau_{ind} = K\phi I_A" color={MC.mechanical} sub="countertorque">{si(f.tau, 'N·m', 4)}</Row>
        </dl>
        {!s.load && <p className="mt-1.5 text-[11.5px] text-mute">Open circuit: <Prose>{'$I_A = 0$, $V_T = E_A$.'}</Prose></p>}
      </section>

      <section>
        <Heading>Model</Heading>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-mute">
          <li><Prose>{'The book\'s equations assume every conductor is under a pole face; Chapman p. 448 calls them approximations. The pole-arc control shows why.'}</Prose></li>
          <li><Prose>{'$R_A$ by the series–parallel rule of Example 7-4(c): elements per path in series, $a$ paths in parallel.'}</Prose></li>
          <li><Prose>{'Generator with a load resistor; brush drop, armature reaction and $L\\,di/dt$ are neglected.'}</Prose></li>
        </ul>
      </section>
    </div>
  )
}
