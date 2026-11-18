import { Heading } from '../../ui/controls'
import { plain, si, sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { BeyondBadge, Row } from '../../ui/Row'
import { Prose } from '../../ui/Tex'
import { Model, windingName } from './derive'

/** One line for an m-plex wave winding: its pitch formula is not in the course. */
export function BeyondNote({ className = 'mt-1.5' }: { className?: string }) {
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <BeyondBadge />
      <span><Prose>{'$y_c = 2(C \\pm m)/P$. Chapman gives $y_c$ only for simplex wave windings (Eq. 7-27). This general form reduces to it when $m = 1$.'}</Prose></span>
    </span>
  )
}

export function Results({ model }: { model: Model }) {
  const { f, state: s, geo } = model
  const yc = f.yc === null ? 'no formula' : f.ycInteger ? (f.yc > 0 ? `+${f.yc}` : String(f.yc)) : `${sig(f.yc, 5)} (not an integer)`
  const dz = s.beta < 1
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section="7.3">Winding</Heading>
        <p className="mt-2 text-[12.5px] text-mute">{windingName(s)}, {s.progressive ? 'progressive' : 'retrogressive'}, {s.P} poles</p>
        <dl className="mt-1.5">
          <Row sym="Z = 2CN_C">{f.Z}</Row>
          <Row sym="a" sub="parallel paths">{f.a}</Row>
          <Row sym={f.ycBeyondCourse ? 'y_c = 2(C \\pm m)/P' : 'y_c'} sub={f.ycBeyondCourse ? undefined : 'commutator pitch'}>{yc}</Row>
          {f.ycBeyondCourse && <div className="pb-1 text-[11.5px] leading-snug text-mute"><BeyondNote className="" /></div>}
          <Row sym="\text{brushes}">{f.brushes}</Row>
          <Row sym="C/a" sub="coils per path">{plain(f.coilsPerPath, '')}</Row>
          <Row sym="Z/a" sub="conductors per path">{plain(f.condPerPath, '')}</Row>
          <Row sym="y_s" sub="coil span, slots">{f.ys}</Row>
          <Row sym="p" sub="pitch factor">{sig(f.p, 4)} %</Row>
        </dl>
      </section>

      <section>
        <Heading section="7.5">Poles and dead zone</Heading>
        <dl className="mt-1.5">
          <Row sym="\beta" sub="pole arc / pole pitch">{sig(s.beta, 3)}</Row>
          <Row sym="\theta_{arc}" sub="pole arc">{sig(geo.arcM, 4)}° mech · {sig(geo.arcE, 4)}° elec</Row>
          <Row sym="\theta_{gap}" sub="dead zone">{sig(geo.gapM, 4)}° mech · {sig(geo.gapE, 4)}° elec</Row>
          <Row sym="Z_{under} = \beta Z" sub="under the pole faces">{sig(f.Zunder, 5)}</Row>
        </dl>
        <p className="mt-1 text-[11.5px] text-mute">Angles: geometry, from <Prose>{'$\\theta_e = \\tfrac{P}{2}\\theta_m$ (Eq. 7-23).'}</Prose></p>
      </section>

      <section>
        <Heading section="7.5">Constants and speed</Heading>
        <dl className="mt-1.5">
          {s.fluxMode === 'field' && <Row sym="\phi = 2\pi r l B/P" sub="Eq. 7-36">{si(model.phi, 'Wb', 6)}</Row>}
          <Row sym="K = \tfrac{ZP}{2\pi a}">{plain(f.K, '')}</Row>
          <Row sym="K' = \tfrac{ZP}{60a}">{plain(f.Kp, '')}</Row>
          <Row sym="\omega" color={MC.mechanical} sub="mechanical speed">{plain(f.omega, 'rad/s')}</Row>
          <Row sym={s.fluxMode === 'field' ? 'e_{cond} = r\\omega B l' : 'e_{cond} = \\tfrac{P\\phi\\omega}{2\\pi}'} color={MC.voltage}>{si(f.econd, 'V', 4)}</Row>
        </dl>
      </section>

      <section>
        <Heading section="7.5">Voltage and current</Heading>
        <dl className="mt-1.5">
          <Row sym="E_A" color={MC.voltage} sub="Eq. 7-38, dead zone ignored">{si(f.EA, 'V', 5)}</Row>
          <Row sym="E_{A,dz}" color={MC.voltage} sub={<Prose>{'$\\beta K\\phi\\omega$, under the pole faces'}</Prose>}>{si(f.EAdz, 'V', 5)}</Row>
          {model.avgBrush !== null && <Row sym="\overline{V}_{brush}" color={MC.voltage} sub="coil-level average">{si(Math.abs(model.avgBrush), 'V', 5)}</Row>}
          <Row sym="R_A" sub="series–parallel rule">{si(f.RA, 'Ω', 4)}</Row>
          <Row sym="I_A" color={MC.current} sub={dz ? <Prose>{'from $E_{A,dz}$'}</Prose> : undefined}>{si(f.IA, 'A', 4)}</Row>
          <Row sym="I_A / a" color={MC.current} sub="per path">{si(f.Ipath, 'A', 4)}</Row>
          <Row sym="V_T" color={MC.voltage}>{si(f.VT, 'V', 5)}</Row>
          <Row sym={dz ? '\\tau_{ind,dz} = \\beta K\\phi I_A' : '\\tau_{ind} = K\\phi I_A'} color={MC.mechanical} sub="countertorque">{si(f.tau, 'N·m', 4)}</Row>
        </dl>
        {!s.load && <p className="mt-1.5 text-[11.5px] text-mute">Open circuit: <Prose>{dz ? '$I_A = 0$, $V_T = E_{A,dz}$.' : '$I_A = 0$, $V_T = E_A$.'}</Prose></p>}
      </section>

      <section>
        <Heading>Model</Heading>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-mute">
          <li><Prose>{'$E_A = K\\phi\\omega$ counts every conductor. Chapman p. 448 calls it an approximation: only the conductors under the pole faces make voltage, $E_{A,dz} = (Z_{under}/a)\\,e_{cond} = \\beta K\\phi\\omega$ (solutions manual, Problems 7-2 and 7-9).'}</Prose></li>
          <li><Prose>{'$\\phi = BA_P$ with $A_P = 2\\pi rl/P$ (Eqs. 7-35, 7-36): $\\beta$ removes conductors from the count; $B$ under the poles stays the same.'}</Prose></li>
          <li><Prose>{'$I_A$, $V_T$ and $\\tau$ use $E_{A,dz}$; with $\\beta = 1$ they are the book\'s values.'}</Prose></li>
          <li><Prose>{'$R_A$ by the series–parallel rule of Example 7-4(c): elements per path in series, $a$ paths in parallel.'}</Prose></li>
          <li><Prose>{'Generator with a load resistor; brush drop, armature reaction and $L\\,di/dt$ are neglected.'}</Prose></li>
        </ul>
      </section>
    </div>
  )
}
