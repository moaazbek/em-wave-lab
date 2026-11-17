import { Dispatch } from 'react'
import { Heading, ParamSlider, Segmented, Switch } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { SelectField } from '../../ui/SelectField'
import { Prose, Tex } from '../../ui/Tex'
import type { Connection, Sequence } from './engine'
import type { Model } from './derive'
import { Action, ChangeKind, LIMITS, PRESETS, PresetId, SpecifyBy, XfState, fromPreset, isCustomized } from './state'

export function Controls({ model, dispatch }: { model: Model; dispatch: Dispatch<Action> }) {
  const s = model.state
  const set = (change: ChangeKind, patch: Partial<XfState>) => dispatch({ type: 'set', change, patch })
  const view = { harmonic: s.harmonic, h: s.h, overlay: s.overlay, rotate: s.rotate }
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Connection</Heading>
        <SelectField<PresetId>
          id="xf-preset" label="Preset" value={s.preset} customized={isCustomized(s)}
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(id) => dispatch({ type: 'load', state: fromPreset(id, view), change: 'preset' })}
        />
        <Segmented<Connection>
          label="Connection" value={s.conn} onChange={(v) => set('conn', { conn: v })}
          options={[{ value: 'YY', label: 'Y–Y' }, { value: 'YD', label: 'Y–Δ' }, { value: 'DY', label: 'Δ–Y' }, { value: 'DD', label: 'Δ–Δ' }]}
        />
      </section>

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
            <p className="text-[11.5px] leading-snug text-mute">
              <Prose>{'$a$ is the ratio of one transformer\'s windings, not of the line voltages.'}</Prose>
            </p>
          </>
        ) : (
          <>
            <ParamSlider symbol={<Tex>{'V_{p,1}'}</Tex>} name="unit primary winding" unit="V" prefix scale="log"
              min={LIMITS.uVp[0]} max={LIMITS.uVp[1]} value={s.uVp} onChange={(v) => set('unit', { uVp: v })} />
            <ParamSlider symbol={<Tex>{'V_{p,2}'}</Tex>} name="unit secondary winding" unit="V" prefix scale="log"
              min={LIMITS.uVs[0]} max={LIMITS.uVs[1]} value={s.uVs} onChange={(v) => set('unit', { uVs: v })} />
            <ParamSlider symbol={<Tex>{'S_{unit}'}</Tex>} name="unit rating" unit="VA" prefix scale="log"
              min={LIMITS.uS[0]} max={LIMITS.uS[1]} value={s.uS} onChange={(v) => set('unit', { uS: v })} />
            <p className="text-[11.5px] leading-snug text-mute">
              <Prose>{`Bank of three units: $a$ = ${sig(model.a, 5)}, $V_{LL}$ = ${si(model.VLL, 'V', 4)} (${model.conn[0] === 'Y' ? '$\\sqrt3\\,V_{p}$ on a Y primary' : '$V_p$ on a $\\Delta$ primary'}), rated $S_{3\\phi} = 3S_{unit}$ = ${si(model.Srated ?? 0, 'VA', 4)}.`}</Prose>
            </p>
            <button type="button" onClick={() => set('rated', { S3: model.Srated ?? s.S3 })}
              className="h-8 self-start rounded-[3px] border border-rule px-3 text-[12.5px] text-mute hover:border-ink hover:text-ink">
              Rated load
            </button>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Balanced load</Heading>
        <ParamSlider symbol={<Tex>{'S_{3\\phi}'}</Tex>} name="apparent power" unit="VA" prefix scale="log" zeroStop
          min={LIMITS.S3[0]} max={LIMITS.S3[1]} value={s.S3} onChange={(v) => set('S3', { S3: v })}
          hint={s.S3 === 0 ? 'Slider at the left end: no load.' : undefined} />
        <ParamSlider symbol={<span className="text-[12.5px]">PF</span>} name="power factor" unit="" min={0} max={1} step={0.01} digits={3}
          value={s.pf} onChange={(v) => set('pf', { pf: Number(v.toFixed(2)) })} />
        <Segmented<'lag' | 'lead'>
          label="Lagging or leading" value={s.lagging ? 'lag' : 'lead'} onChange={(v) => set('lag', { lagging: v === 'lag' })}
          options={[{ value: 'lag', label: 'lagging' }, { value: 'lead', label: 'leading' }]}
        />
      </section>

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
        <p className="text-[11.5px] leading-snug text-mute">
          <Prose>{`Reference: $V_{AN} = (V_{LL}/\\sqrt3)\\angle 0°$ of the supply. ${s.conn[0] === 'D' ? 'With a $\\Delta$ primary, $V_{AN}$ is the supply\'s voltage to its own neutral.' : ''} The frequency changes only the time axis.`}</Prose>
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="2.10">Third harmonic</Heading>
        <Switch checked={s.harmonic} onChange={(v) => set('harmonic', { harmonic: v })}>Third-harmonic view (illustrative)</Switch>
        {s.harmonic && (
          <ParamSlider symbol={<Tex>h</Tex>} name="third-harmonic amplitude (illustrative)" unit="" min={LIMITS.h[0]} max={LIMITS.h[1]} step={0.01} digits={2}
            value={s.h} onChange={(v) => set('h', { h: Number(v.toFixed(2)) })} />
        )}
        <p className="text-[11.5px] leading-snug text-mute">
          <Prose>{'Chapman gives no value for the harmonic, so $h$ is a display parameter; the core is not modelled.'}</Prose>
        </p>
      </section>
    </div>
  )
}
