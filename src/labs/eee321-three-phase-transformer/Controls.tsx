import { Dispatch } from 'react'
import { Heading, NumberField, ParamSlider, Segmented, Switch } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { SelectField } from '../../ui/SelectField'
import { Prose, Tex } from '../../ui/Tex'
import type { Connection, Sequence } from './engine'
import { Model, sideTag } from './derive'
import {
  Action, ChangeKind, IDEAL_PRESETS, LIMITS, PresetId, REAL_PRESETS, RefSide, SpecifyBy, XfModel, XfState, ZFrom, fromPreset, isCustomized, viewOf,
} from './state'

const BTN = 'h-7 self-start rounded-[3px] border border-rule px-2.5 text-[12px] text-mute hover:border-ink hover:text-ink'
const HINT = 'text-[11.5px] leading-snug text-mute'

export function Controls({ model, dispatch }: { model: Model; dispatch: Dispatch<Action> }) {
  const s = model.state
  const set = (change: ChangeKind, patch: Partial<XfState>) => dispatch({ type: 'set', change, patch })
  const real = s.model === 'real'
  const list = real ? REAL_PRESETS : IDEAL_PRESETS
  const options = list.map((p) => ({ value: p.id, label: p.label }))
  if (!list.some((p) => p.id === s.preset)) options.unshift({ value: s.preset, label: real ? 'From the ideal settings' : 'From the real bank' })

  /** Switch the model and carry the present bank over, so the ratings stay the same. */
  const switchModel = (m: XfModel) => {
    if (m === s.model) return
    if (m === 'real') {
      const Sphi = (model.Srated ?? Math.max(s.S3, 3e3)) / 3
      set('model', { model: 'real', rBy: 'unit', rS: Sphi, rVP: model.sol.pri.Vp, rVS: model.sol.sec.Vp })
    } else {
      const r = model.real!.rating
      set('model', { model: 'ideal', spec: 'unit', uVp: r.VphiP, uVs: r.VphiS, uS: r.Sphi })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Model</Heading>
        <Segmented<XfModel> label="Model" value={s.model} onChange={switchModel}
          options={[{ value: 'ideal', label: 'Ideal' }, { value: 'real', label: 'Real bank' }]} />
        <SelectField<PresetId>
          id="xf-preset" label="Preset" value={s.preset} customized={isCustomized(s)}
          options={options}
          onChange={(id) => dispatch({ type: 'load', state: fromPreset(id, viewOf(s)), change: 'preset' })}
        />
        <Segmented<Connection>
          label="Connection" value={s.conn} onChange={(v) => set('conn', { conn: v })}
          options={[{ value: 'YY', label: 'Y–Y' }, { value: 'YD', label: 'Y–Δ' }, { value: 'DY', label: 'Δ–Y' }, { value: 'DD', label: 'Δ–Δ' }]}
        />
      </section>

      {real ? <RealControls model={model} set={set} /> : <IdealControls model={model} set={set} />}

      <section className="flex flex-col gap-2.5">
        <Heading>Supply</Heading>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div>
            <div className="mb-1 text-[12px] text-mute">Phase sequence</div>
            <Segmented<Sequence> label="Phase sequence" value={s.seq} onChange={(v) => set('seq', { seq: v })}
              options={[{ value: 'abc', label: 'abc' }, { value: 'acb', label: 'acb' }]} />
          </div>
          <div>
            <div className="mb-1 text-[12px] text-mute">Frequency</div>
            <Segmented<'50' | '60'> label="Frequency" value={String(s.f) as '50' | '60'} onChange={(v) => set('f', { f: v === '50' ? 50 : 60 })}
              options={[{ value: '50', label: '50 Hz' }, { value: '60', label: '60 Hz' }]} />
          </div>
        </div>
        <p className={HINT}>
          <Prose>{real
            ? 'Reference: each secondary winding at the angle the ideal wiring gives it. The frequency changes only the time axis.'
            : `Reference: $V_{AN} = (V_{LL}/\\sqrt3)\\angle 0°$ of the supply. ${s.conn[0] === 'D' ? 'With a $\\Delta$ primary, $V_{AN}$ is the supply\'s voltage to its own neutral.' : ''} The frequency changes only the time axis.`}</Prose>
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Third harmonic</Heading>
        <Switch checked={s.harmonic} onChange={(v) => set('harmonic', { harmonic: v })}>Third-harmonic view (illustrative)</Switch>
        {s.harmonic && (
          <ParamSlider symbol={<Tex>h</Tex>} name="third-harmonic amplitude (illustrative)" unit="" min={LIMITS.h[0]} max={LIMITS.h[1]} step={0.01} digits={2}
            value={s.h} onChange={(v) => set('h', { h: Number(v.toFixed(2)) })} />
        )}
        <p className={HINT}>
          <Prose>{'Chapman gives no value for the harmonic, so $h$ is a display parameter; the core is not modelled.'}</Prose>
        </p>
      </section>
    </div>
  )
}

type Set = (change: ChangeKind, patch: Partial<XfState>) => void

/** PF slider and lagging / unity / leading. */
function PowerFactor({ s, set }: { s: XfState; set: Set }) {
  const kind = s.pf >= 1 ? 'unity' : s.lagging ? 'lag' : 'lead'
  return (
    <>
      <ParamSlider symbol={<span className="text-[12.5px]">PF</span>} name="power factor" unit="" min={0} max={1} step={0.01} digits={3}
        value={s.pf} onChange={(v) => set('pf', { pf: Number(v.toFixed(2)) })} />
      <Segmented<'lag' | 'unity' | 'lead'>
        label="Lagging, unity or leading" value={kind}
        onChange={(v) => set(v === 'unity' ? 'pf' : 'lag', v === 'unity' ? { pf: 1 } : { lagging: v === 'lag', pf: s.pf >= 1 ? 0.9 : s.pf })}
        options={[{ value: 'lag', label: 'lagging' }, { value: 'unity', label: 'unity' }, { value: 'lead', label: 'leading' }]}
      />
    </>
  )
}

function IdealControls({ model, set }: { model: Model; set: Set }) {
  const s = model.state
  return (
    <>
      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Bank</Heading>
        <div>
          <div className="mb-1 text-[12px] text-mute">Specify by</div>
          <Segmented<SpecifyBy>
            label="Specify by" value={s.spec}
            onChange={(v) => {
              // carry the present bank over, so switching the input mode does not change the circuit
              if (v === 'unit') {
                const R3 = Math.sqrt(3)
                const uVp = model.conn[0] === 'Y' ? model.VLL / R3 : model.VLL
                set('spec', { spec: 'unit', uVp, uVs: uVp / model.a })
              } else set('spec', { spec: 'line', VLL: model.VLL, a: model.a })
            }}
            options={[{ value: 'line', label: 'line voltage and a' }, { value: 'unit', label: 'unit rating' }]}
          />
        </div>
        {s.spec === 'line' ? (
          <>
            <ParamSlider symbol={<Tex>{'V_{LL}'}</Tex>} name="primary line voltage" unit="V" prefix scale="log"
              min={LIMITS.VLL[0]} max={LIMITS.VLL[1]} value={s.VLL} onChange={(v) => set('VLL', { VLL: v })} />
            <ParamSlider symbol={<Tex>a</Tex>} name="turns ratio" unit="" scale="log" digits={5}
              min={LIMITS.a[0]} max={LIMITS.a[1]} value={s.a} onChange={(v) => set('a', { a: v })} />
            <p className={HINT}><Prose>{'$a = N_P/N_S$ is the ratio of one transformer\'s windings, not of the line voltages.'}</Prose></p>
          </>
        ) : (
          <>
            <ParamSlider symbol={<Tex>{'V_{\\phi P}'}</Tex>} name="unit primary winding" unit="V" prefix scale="log"
              min={LIMITS.uVp[0]} max={LIMITS.uVp[1]} value={s.uVp} onChange={(v) => set('unit', { uVp: v })} />
            <ParamSlider symbol={<Tex>{'V_{\\phi S}'}</Tex>} name="unit secondary winding" unit="V" prefix scale="log"
              min={LIMITS.uVs[0]} max={LIMITS.uVs[1]} value={s.uVs} onChange={(v) => set('unit', { uVs: v })} />
            <ParamSlider symbol={<Tex>{'S_\\phi'}</Tex>} name="unit rating" unit="VA" prefix scale="log"
              min={LIMITS.uS[0]} max={LIMITS.uS[1]} value={s.uS} onChange={(v) => set('unit', { uS: v })} />
            <p className={HINT}>
              <Prose>{`Bank of three units: $a$ = ${sig(model.a, 5)}, $V_{LL}$ = ${si(model.VLL, 'V', 4)} (${model.conn[0] === 'Y' ? '$\\sqrt3\\,V_{\\phi P}$ on a Y primary' : '$V_{\\phi P}$ on a $\\Delta$ primary'}), rated $S = 3S_\\phi$ = ${si(model.Srated ?? 0, 'VA', 4)}.`}</Prose>
            </p>
            <button type="button" onClick={() => set('rated', { S3: model.Srated ?? s.S3 })} className={BTN}>Rated load</button>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Balanced load</Heading>
        <ParamSlider symbol={<Tex>S</Tex>} name="apparent power of the bank" unit="VA" prefix scale="log" zeroStop
          min={LIMITS.S3[0]} max={LIMITS.S3[1]} value={s.S3} onChange={(v) => set('S3', { S3: v })}
          hint={s.S3 === 0 ? 'Slider at the left end: no load.' : undefined} />
        <PowerFactor s={s} set={set} />
      </section>
    </>
  )
}

function RealControls({ model, set }: { model: Model; set: Set }) {
  const s = model.state
  const r = model.real!
  const R = r.rating
  const hv = (side: 'P' | 'S') => sideTag(model, side)
  const sideOpts = [{ value: 'P' as const, label: `primary (${hv('P')})` }, { value: 'S' as const, label: `secondary (${hv('S')})` }]
  /** Switch the circuit source and carry the present circuit over (in the new units). */
  const switchFrom = (z: ZFrom) => {
    const c = r.circuit
    if (z === 'test' || !c) { set('zFrom', { zFrom: z }); return }
    const v = z === 'pu' ? c.pu : z === 'ohmP' ? c.P : c.S
    set('zFrom', {
      zFrom: z, zR: v.Req, zX: v.Xeq, zSh: v.RC !== null || v.XM !== null,
      zRc: v.RC !== null && Number.isFinite(v.RC) ? v.RC : s.zRc, zXm: v.XM !== null && Number.isFinite(v.XM) ? v.XM : s.zXm,
    })
  }
  const zUnit = s.zFrom === 'pu' ? '' : 'Ω'
  const zName = s.zFrom === 'pu' ? 'per-unit' : `Ω, referred to the ${s.zFrom === 'ohmP' ? `primary (${hv('P')})` : `secondary (${hv('S')})`}`
  const err = r.error
  const test = (k: 'oc' | 'sc') => {
    const T = k === 'oc' ? 'OC' : 'SC'
    const key = (x: 'On' | 'Side' | 'Form' | 'V' | 'I' | 'P') => `${k}${x}` as keyof XfState
    const put = (x: 'On' | 'Side' | 'Form' | 'V' | 'I' | 'P', v: unknown) => set('test', { [key(x)]: v } as Partial<XfState>)
    const on = s[key('On')] as boolean
    const side = s[key('Side')] as 'P' | 'S'
    const form = s[key('Form')] as 'bank' | 'unit'
    const res = k === 'oc' ? r.tests?.oc : r.tests?.sc
    const star = side === 'P' ? model.sol.pri.star : model.sol.sec.star
    return (
      <div className="flex flex-col gap-2 rounded-[3px] border border-rule p-2.5">
        <Switch checked={on} onChange={(v) => put('On', v)}>{k === 'oc' ? 'Open-circuit test' : 'Short-circuit test'}</Switch>
        {on ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11.5px] text-mute">Measured on</span>
              <Segmented<'P' | 'S'> label={`${T} test measured on`} value={side} onChange={(v) => put('Side', v)} options={sideOpts} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11.5px] text-mute">Readings are</span>
              <Segmented<'bank' | 'unit'> label={`${T} readings are`} value={form} onChange={(v) => put('Form', v)}
                options={[{ value: 'bank', label: 'bank line values' }, { value: 'unit', label: 'one transformer' }]} />
            </div>
            <NumberField symbol={<Tex>{`V_{${T}}`}</Tex>} name={`${T} voltmeter`} unit="V" value={s[key('V')] as number} onChange={(v) => put('V', v)} />
            <NumberField symbol={<Tex>{`I_{${T}}`}</Tex>} name={`${T} ammeter`} unit="A" value={s[key('I')] as number} onChange={(v) => put('I', v)} />
            <NumberField symbol={<Tex>{`P_{${T}}`}</Tex>} name={`${T} wattmeter`} unit="W" value={s[key('P')] as number} onChange={(v) => put('P', v)} />
            {err && err.where === T && (
              <p className="text-[11.5px] leading-snug text-warn" role="alert">
                <Prose>{/V·I/.test(err.text) ? 'The wattmeter reading cannot exceed $V\\cdot I$. Nothing is computed.' : `${err.text} Nothing is computed.`}</Prose>
              </p>
            )}
            {res && form === 'bank' && (
              <p className={HINT}><Prose>{`One transformer: ${si(res.perPhase.V, 'V', 5)}, ${si(res.perPhase.I, 'A', 5)}, ${si(res.perPhase.P, 'W', 5)} (${star ? 'Y side: $V/\\sqrt3$, $I$, $P/3$' : '$\\Delta$ side: $V$, $I/\\sqrt3$, $P/3$'}).`}</Prose></p>
            )}
          </>
        ) : (
          <p className={HINT}>{k === 'oc' ? 'Not used: the shunt branch is neglected.' : <Prose>{'Not used: $Z_{SE} = 0$.'}</Prose>}</p>
        )}
      </div>
    )
  }
  return (
    <>
      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Rating</Heading>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[12px] text-mute">Given as</span>
          <Segmented<'unit' | 'bank'> label="Rating given as" value={s.rBy}
            onChange={(v) => set('rating', v === 'unit' ? { rBy: 'unit', rS: R.Sphi, rVP: R.VphiP, rVS: R.VphiS } : { rBy: 'bank', rS: R.S, rVP: R.VLL, rVS: R.Vll })}
            options={[{ value: 'unit', label: 'one transformer' }, { value: 'bank', label: 'the bank' }]} />
        </div>
        <ParamSlider symbol={<Tex>{s.rBy === 'unit' ? 'S_\\phi' : 'S'}</Tex>} name={s.rBy === 'unit' ? 'one transformer' : 'the bank'} unit="VA" prefix scale="log"
          min={LIMITS.rS[0]} max={LIMITS.rS[1]} value={s.rS} onChange={(v) => set('rating', { rS: v })} />
        <ParamSlider symbol={<Tex>{s.rBy === 'unit' ? 'V_{\\phi P}' : 'V_{LL}'}</Tex>} name={`${s.rBy === 'unit' ? 'primary winding' : 'primary line'} (${hv('P')})`} unit="V" prefix scale="log"
          min={LIMITS.rV[0]} max={LIMITS.rV[1]} value={s.rVP} onChange={(v) => set('rating', { rVP: v })} />
        <ParamSlider symbol={<Tex>{s.rBy === 'unit' ? 'V_{\\phi S}' : 'V_{ll}'}</Tex>} name={`${s.rBy === 'unit' ? 'secondary winding' : 'secondary line'} (${hv('S')})`} unit="V" prefix scale="log"
          min={LIMITS.rV[0]} max={LIMITS.rV[1]} value={s.rVS} onChange={(v) => set('rating', { rVS: v })} />
        <p className={HINT}>
          <Prose>{s.rBy === 'unit'
            ? `Bank: $S = 3S_\\phi$ = ${si(R.S, 'VA', 4)}, $V_{LL}$ = ${si(R.VLL, 'V', 5)}, $V_{ll}$ = ${si(R.Vll, 'V', 5)}; $a = V_{\\phi P}/V_{\\phi S}$ = ${sig(R.a, 6)}.`
            : `One transformer: $S_\\phi = S/3$ = ${si(R.Sphi, 'VA', 4)}, $V_{\\phi P}$ = ${si(R.VphiP, 'V', 5)} (${model.sol.pri.star ? '$V_{LL}/\\sqrt3$, Y' : '$V_{LL}$, $\\Delta$'}), $V_{\\phi S}$ = ${si(R.VphiS, 'V', 5)} (${model.sol.sec.star ? '$V_{ll}/\\sqrt3$, Y' : '$V_{ll}$, $\\Delta$'}); $a$ = ${sig(R.a, 6)}.`}</Prose>
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.5">Equivalent circuit from</Heading>
        <Segmented<ZFrom> label="Equivalent circuit from" value={s.zFrom} onChange={switchFrom}
          options={[{ value: 'test', label: 'test data' }, { value: 'pu', label: 'per-unit' }, { value: 'ohmP', label: `Ω (${hv('P')})` }, { value: 'ohmS', label: `Ω (${hv('S')})` }]} />
        {s.zFrom === 'test' ? (
          <>{test('oc')}{test('sc')}</>
        ) : (
          <>
            <p className={HINT}>One transformer, {zName}.</p>
            <NumberField symbol={<Tex>{'R_{eq}'}</Tex>} name="series resistance" unit={zUnit} prefix={s.zFrom !== 'pu'} digits={5} value={s.zR} onChange={(v) => set('z', { zR: v })} />
            <NumberField symbol={<Tex>{'X_{eq}'}</Tex>} name="series reactance" unit={zUnit} prefix={s.zFrom !== 'pu'} digits={5} value={s.zX} onChange={(v) => set('z', { zX: v })} />
            <Switch checked={s.zSh} onChange={(v) => set('z', { zSh: v })}>excitation (shunt) branch</Switch>
            {s.zSh ? (
              <>
                <NumberField symbol={<Tex>{'R_C'}</Tex>} name="core-loss resistance" unit={zUnit} prefix={s.zFrom !== 'pu'} digits={5} value={s.zRc} onChange={(v) => set('z', { zRc: v })} />
                <NumberField symbol={<Tex>{'X_M'}</Tex>} name="magnetizing reactance" unit={zUnit} prefix={s.zFrom !== 'pu'} digits={5} value={s.zXm} onChange={(v) => set('z', { zXm: v })} />
              </>
            ) : <p className={HINT}>Shunt branch neglected: no core loss.</p>}
          </>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.7">Operating point</Heading>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[12px] text-mute">Hold</span>
          <Segmented<'sec' | 'pri'> label="Hold at rated voltage" value={s.hold} onChange={(v) => set('hold', { hold: v })}
            options={[{ value: 'sec', label: 'secondary at rated V' }, { value: 'pri', label: 'primary at rated V' }]} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[12px] text-mute">Load as</span>
          <Segmented<'S' | 'frac'> label="Load given as" value={s.loadBy} onChange={(v) => set('loadBy', { loadBy: v })}
            options={[{ value: 'S', label: <Tex>{'S_{load}'}</Tex> }, { value: 'frac', label: '% of rated' }]} />
        </div>
        {s.loadBy === 'S' ? (
          <div className="flex flex-col gap-1.5">
            <ParamSlider symbol={<Tex>{'S_{load}'}</Tex>} name="load of the bank" unit="VA" prefix scale="log" zeroStop
              min={LIMITS.S3[0]} max={LIMITS.S3[1]} value={s.S3} onChange={(v) => set('S3', { S3: v })}
              hint={<>{sig(r.frac * 100, 4)} % of rated{s.hold === 'pri' ? ' (current at rated secondary voltage)' : ''}</>} />
            <button type="button" onClick={() => set('rated', { S3: R.S })} className={BTN}>Rated load</button>
          </div>
        ) : (
          <ParamSlider symbol={<Tex>{'S_{load}/S'}</Tex>} name="fraction of rated" unit="%" min={0} max={125} step={1} digits={4}
            value={Number((r.frac * 100).toFixed(4))} onChange={(v) => set('S3', { S3: (v / 100) * R.S })}
            hint={<>{si(s.S3, 'VA', 4)}</>} />
        )}
        <PowerFactor s={s} set={set} />
        {err && err.where === 'load' && <p className="text-[11.5px] leading-snug text-warn" role="alert">{err.text}</p>}
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading>Display</Heading>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[12px] text-mute">Show circuit referred to</span>
          <Segmented<RefSide> label="Show circuit referred to" value={s.refSide} onChange={(v) => set('view', { refSide: v })}
            options={[{ value: 'P', label: `${hv('P')} (Ω)` }, { value: 'S', label: `${hv('S')} (Ω)` }, { value: 'pu', label: 'per-unit' }]} />
        </div>
        <p className={HINT}>This changes the display only. Every result is the same on either side.</p>
      </section>
    </>
  )
}
