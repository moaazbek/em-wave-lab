import { C, abs, arg } from '../../physics/complex'
import { Heading } from '../../ui/controls'
import { phaseDeg, si, sig } from '../../ui/format'
import { PHASE_COLOR } from '../../ui/palette'
import { Row } from '../../ui/Row'
import { Prose, Tex } from '../../ui/Tex'
import { CONN_TEXT, Model, shiftWords } from './derive'

const polar = (z: C, unit: string) => `${si(abs(z), unit, 4)} ∠ ${phaseDeg(arg(z))}`
/** Drop floating-point noise (e.g. Q = 5e-13 var at PF 1): parts below 1e-9 of the reference count as zero. */
const clean = (x: number, ref: number) => (Math.abs(x) <= 1e-9 * Math.abs(ref) ? 0 : x)

export function Results({ model }: { model: Model }) {
  const { sol, formula, conn } = model
  const { pri, sec } = sol
  const n = sol.params.netlist
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section="2.10">{CONN_TEXT[conn]} bank</Heading>
        <dl className="mt-1.5">
          <Row sym="V_{LL}/V_{ll}" sub={<>= <Tex>{formula.tex}</Tex> {formula.eq}</>}>{sig(sol.ratio, 6)}</Row>
          <Row sym="a" sub="turns ratio">{sig(model.a, 6)}</Row>
          <Row sym="\angle V_{ab} - \angle V_{AB}" sub={shiftWords(sol.shiftDeg)}>{phaseDeg(sol.shiftDeg * Math.PI / 180)}</Row>
        </dl>
      </section>

      <section>
        <Heading>Primary · {pri.star ? 'Y' : 'Δ'}</Heading>
        <dl className="mt-1.5">
          <Row sym="V_{LL}">{si(pri.VLLmag, 'V', 5)}</Row>
          <Row sym="V_{LN}" sub={pri.star ? undefined : 'of the supply'}>{si(pri.VLNmag, 'V', 5)}</Row>
          <Row sym="V_{p\text{-}pri}" sub="winding">{si(pri.Vp, 'V', 5)}</Row>
          <Row sym="I_{L\text{-}pri}" sub="line">{si(pri.IL, 'A', 5)}</Row>
          <Row sym="I_{p\text{-}pri}" sub="winding">{si(pri.Ip, 'A', 5)}</Row>
          <Row sym="S" sub={<Tex>{'= \\sqrt3\\,V_{LL} I_L'}</Tex>}>{si(abs(pri.Sline), 'VA', 4)}</Row>
          <Row sym="P">{si(clean(pri.Sline.re, abs(pri.Sline)), 'W', 4)}</Row>
          <Row sym="Q">{si(clean(pri.Sline.im, abs(pri.Sline)), 'var', 4)}</Row>
        </dl>
      </section>

      <section>
        <Heading>Secondary · {sec.star ? 'Y' : 'Δ'}</Heading>
        <dl className="mt-1.5">
          <Row sym="V_{ll}">{si(sec.VLLmag, 'V', 5)}</Row>
          <Row sym="V_{ln}" sub={sec.star ? undefined : 'equivalent Y'}>{si(sec.VLNmag, 'V', 5)}</Row>
          <Row sym="V_{p\text{-}sec}" sub="winding">{si(sec.Vp, 'V', 5)}</Row>
          <Row sym="I_{L\text{-}sec}" sub="line">{si(sec.IL, 'A', 5)}</Row>
          <Row sym="I_{p\text{-}sec}" sub="winding">{si(sec.Ip, 'A', 5)}</Row>
          <Row sym="S">{si(abs(sec.Sline), 'VA', 4)}</Row>
          <Row sym="P">{si(clean(sec.Sline.re, abs(sec.Sline)), 'W', 4)}</Row>
          <Row sym="Q">{si(clean(sec.Sline.im, abs(sec.Sline)), 'var', 4)}</Row>
        </dl>
      </section>

      <section>
        <Heading>Phasors</Heading>
        <dl className="mt-1.5">
          <Row sym="V_{AB}">{polar(pri.Vll[0], 'V')}</Row>
          <Row sym="V_{ab}">{polar(sec.Vll[0], 'V')}</Row>
          {[0, 1, 2].map((k) => (
            <Row key={`p${k}`} sym={`V_{${n.primary[k].dot}${n.primary[k].other}}`} color={PHASE_COLOR[k]} sub={`T${k + 1} primary`}>{polar(pri.Vw[k], 'V')}</Row>
          ))}
          {[0, 1, 2].map((k) => (
            <Row key={`s${k}`} sym={`V_{${n.secondary[k].dot}${n.secondary[k].other}}`} color={PHASE_COLOR[k]} sub={`T${k + 1} secondary`}>{polar(sec.Vw[k], 'V')}</Row>
          ))}
          <Row sym="I_A" color={PHASE_COLOR[0]}>{polar(pri.Iline[0], 'A')}</Row>
          <Row sym="I_a" color={PHASE_COLOR[0]}>{polar(sec.Iline[0], 'A')}</Row>
        </dl>
      </section>

      <section>
        <Heading>Model</Heading>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-mute">
          <li><Prose>{'Three ideal single-phase transformers: no winding impedance, no magnetizing current.'}</Prose></li>
          <li><Prose>{'RMS phasors; reference $V_{AN}$ of the supply at $0°$. Balanced load, no circulating current in a delta.'}</Prose></li>
          <li><Prose>{'Everything follows from the wiring (netlist); the 30° shift is a result, not a rule.'}</Prose></li>
        </ul>
      </section>
    </div>
  )
}
