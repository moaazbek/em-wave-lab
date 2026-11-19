import { C, abs, arg } from '../../physics/complex'
import { Heading } from '../../ui/controls'
import { phaseDeg, si, sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Row } from '../../ui/Row'
import { Prose, Tex } from '../../ui/Tex'
import { CONN_TEXT, Model, shiftParts, sideTag } from './derive'
import type { CircuitValues } from './engine'

const pol = (z: C, unit: string, d = 6) => `${si(abs(z), unit, d)} ∠ ${phaseDeg(arg(z))}`
const dash = <span className="text-faint">neglected</span>

/** Results of the real bank: ratings, circuit on both sides and in per-unit, operating point, losses, efficiency. */
export function RealResults({ model }: { model: Model }) {
  const r = model.real!
  const R = r.rating, b = r.bases
  const { sol } = model
  const o = sol.real
  const hv = (x: 'P' | 'S') => sideTag(model, x)
  const shift = shiftParts(model)
  const cell = (v: number | null, ohm: boolean) => (v === null ? '—' : !Number.isFinite(v) ? '∞' : ohm ? si(v, 'Ω', 5) : sig(v, 5))
  const col = (c: CircuitValues | undefined, k: keyof CircuitValues, ohm: boolean) => (c ? cell(c[k], ohm) : '—')
  const c = r.circuit
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section="2.10">Ratings · {CONN_TEXT[model.conn]} bank</Heading>
        <dl className="mt-1.5">
          <Row sym="S" sub="bank">{si(R.S, 'VA', 5)}</Row>
          <Row sym="S_\phi = S/3" sub="one transformer">{si(R.Sphi, 'VA', 5)}</Row>
          <Row sym="V_{LL}" sub={`primary line (${hv('P')})`}>{si(R.VLL, 'V', 6)}</Row>
          <Row sym="V_{ll}" sub={`secondary line (${hv('S')})`}>{si(R.Vll, 'V', 6)}</Row>
          <Row sym="V_{\phi P}" sub="primary winding">{si(R.VphiP, 'V', 6)}</Row>
          <Row sym="V_{\phi S}" sub="secondary winding">{si(R.VphiS, 'V', 6)}</Row>
          <Row sym="a = V_{\phi P}/V_{\phi S}">{sig(R.a, 6)}</Row>
        </dl>
      </section>

      <section>
        <Heading section="2.6">One transformer's circuit</Heading>
        {r.error && <p className="mt-2 text-[12px] leading-snug text-warn" role="alert">{/V·I/.test(r.error.text) ? <Prose>{`${r.error.where} test: the wattmeter reading cannot exceed $V\\cdot I$. Nothing is computed.`}</Prose> : r.error.text}</p>}
        <div className="mt-2 grid grid-cols-[auto_1fr_1fr_1fr] gap-x-2 gap-y-1 text-[12.5px]">
          <span />
          <span className="tag text-right">{hv('P')} (Ω)</span>
          <span className="tag text-right">{hv('S')} (Ω)</span>
          <span className="tag text-right">pu</span>
          {(['Req', 'Xeq', 'RC', 'XM'] as const).map((k) => (
            <div key={k} className="contents">
              <span><Tex>{{ Req: 'R_{eq}', Xeq: 'X_{eq}', RC: 'R_C', XM: 'X_M' }[k]}</Tex></span>
              {(k === 'RC' || k === 'XM') && r.noShunt
                ? <span className="col-span-3 text-right text-[11.5px]">{dash} (no core data)</span>
                : <>
                  <span className="num text-right">{col(c?.P, k, true)}</span>
                  <span className="num text-right">{col(c?.S, k, true)}</span>
                  <span className="num text-right">{col(c?.pu, k, false)}</span>
                </>}
            </div>
          ))}
        </div>
        <dl className="mt-2">
          <Row sym="Z_{base}" sub={`${hv('P')} · ${hv('S')}, Eq. 2-94`}>{si(b.ZbaseP, 'Ω', 5)} · {si(b.ZbaseS, 'Ω', 5)}</Row>
          <Row sym="I_{\phi,base}" sub="2-93">{si(b.IphiBaseP, 'A', 5)} · {si(b.IphiBaseS, 'A', 5)}</Row>
          <Row sym="I_{L,base}" sub="2-95">{si(b.ILbaseP, 'A', 5)} · {si(b.ILbaseS, 'A', 5)}</Row>
        </dl>
        <p className="mt-1 text-[11.5px] leading-snug text-mute"><Prose>{'$Z_S = Z_P/a^2$; every per-unit value is the same on both sides.'}</Prose></p>
      </section>

      {o && (
        <>
          <section>
            <Heading section="2.7">Operating point (one transformer)</Heading>
            <dl className="mt-1.5">
              <Row sym="V_{\phi S}" color={MC.voltage} sub={model.state.hold === 'pri' ? 'solved from Eq. 2-64' : 'held at rated'}>{pol(o.VphiS, 'V')}</Row>
              <Row sym="I_{\phi S}" color={MC.current}>{pol(o.IphiS, 'A')}</Row>
              <Row sym="V_{\phi P}/a" color={MC.voltage} sub="Eq. 2-64">{pol(o.VPa, 'V')}</Row>
              <Row sym="V_{\phi P}" color={MC.voltage}>{pol(o.VphiP, 'V', 6)}</Row>
              <Row sym="V_P" sub="per-unit">{sig(abs(o.VphiP) / R.VphiP, 6)} ∠ {phaseDeg(arg(o.VphiP))}</Row>
              <Row sym="V_{LL}" sub={model.state.hold === 'pri' ? 'held' : 'needed'}>{si(sol.pri.VLLmag, 'V', 6)}</Row>
              <Row sym="VR" sub="Eq. 2-62">{sig(o.VR, 6)} %</Row>
              <Row sym="\delta" sub="load angle">{sig(o.deltaDeg, 5)}°</Row>
              <Row sym="\angle V_{ab} - \angle V_{AB}" sub={<>connection {shift.conn}°, <Tex>{'-\\delta'}</Tex></>}>{sig(sol.shiftDeg, 6)}°</Row>
            </dl>
          </section>

          <section>
            <Heading section="2.7">Power and efficiency (bank)</Heading>
            <dl className="mt-1.5">
              <Row sym="P_{out}" color={MC.mechanical}>{si(o.Pout, 'W', 6)}</Row>
              <Row sym="P_{Cu} = 3I_{\phi S}^2 R_{eq,S}" color={MC.mechanical}>{si(o.Pcu, 'W', 6)}</Row>
              <Row sym="P_{core}" color={MC.mechanical} sub={r.noShunt ? 'shunt branch neglected' : undefined}>{si(o.Pcore, 'W', 6)}</Row>
              <Row sym="P_{in}" color={MC.mechanical}>{si(o.Sin.re, 'W', 6)}</Row>
              <Row sym="\eta" sub="Eq. 2-67">{sig(o.eta, 6)} %</Row>
              <Row sym="Q_{windings}">{si(o.Qwind, 'var', 5)}</Row>
              <Row sym="Q_{core}">{si(o.Qcore, 'var', 5)}</Row>
              <Row sym="\text{PF}_{in}">{sig(o.pfIn, 5)} {o.Sin.im >= 0 ? 'lagging' : 'leading'}</Row>
            </dl>
          </section>

          <section>
            <Heading section="2.10">Currents</Heading>
            <dl className="mt-1.5">
              <Row sym="I_{LP}" color={MC.current} sub="primary line">{si(sol.pri.IL, 'A', 6)}</Row>
              <Row sym="I_{\phi P}" color={MC.current} sub="primary winding">{si(sol.pri.Ip, 'A', 6)}</Row>
              <Row sym="I_{LS}" color={MC.current} sub="secondary line">{si(sol.sec.IL, 'A', 6)}</Row>
              <Row sym="I_{\phi S}" color={MC.current} sub="secondary winding">{si(sol.sec.Ip, 'A', 6)}</Row>
              <Row sym="I_{ex}" color={MC.current} sub={`excitation, ${hv('P')} side`}>{r.noShunt ? dash : <>{si(abs(o.Iex), 'A', 4)} ({sig((abs(o.Iex) / b.IphiBaseP) * 100, 3)} %)</>}</Row>
            </dl>
          </section>
        </>
      )}

      <section>
        <Heading>Model</Heading>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-mute">
          <li><Prose>{'Approximate equivalent circuit of each transformer: $R_C \\parallel jX_M$ at the primary terminals, then $R_{eq} + jX_{eq}$ (Chapman Fig. 2-17).'}</Prose></li>
          <li><Prose>{'Three identical transformers, balanced load: work per transformer with winding quantities; bank powers are 3 times.'}</Prose></li>
          <li><Prose>{`${model.state.hold === 'pri' ? '$|V_{\\phi P}|$ held at its rating; $|V_{\\phi S}|$ solved from Eq. (2-64).' : '$V_{\\phi S}$ held at its rating (Chapman\'s definition of VR); $V_{\\phi P}$ from Eq. (2-64).'}`}</Prose></li>
        </ul>
      </section>
    </div>
  )
}
