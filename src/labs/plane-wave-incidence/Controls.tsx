import { Dispatch } from 'react'
import {
  GOOD_CONDUCTOR_MIN, LOSSLESS_PRESET_IDS, LOW_LOSS_MAX, PRESETS, classBoundaryFrequencies, isCustomized,
} from '../../physics'
import { Heading, ParamSlider } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { Prose, Tex } from '../../ui/Tex'
import { CLASS_LABEL, Model } from './derive'
import { Action, LIMITS, setMedium, setPreset } from './state'

function PresetSelect({ which, value, customized, onChange }: { which: 1 | 2; value: string; customized: boolean; onChange: (id: string) => void }) {
  const list = which === 1 ? PRESETS.filter((p) => LOSSLESS_PRESET_IDS.includes(p.id)) : PRESETS
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`preset-${which}`} className="text-[12px] text-mute">Material (typical values)</label>
        {customized && <span className="tag !text-warn">customized</span>}
      </div>
      <select
        id={`preset-${which}`}
        className="select mt-1 h-9 w-full rounded-[3px] border border-rule pl-2 pr-7 text-[13px] text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {list.map((p) => (
          <option key={p.id} value={p.id}>{p.label} ({p.note})</option>
        ))}
      </select>
    </div>
  )
}

/** Where Medium 2 sits on the frequency axis: the same material changes class with f. */
function ClassStrip({ model }: { model: Model }) {
  const { state } = model
  const [lo, hi] = LIMITS.f
  const frac = (f: number) => Math.min(1, Math.max(0, Math.log(f / lo) / Math.log(hi / lo)))
  if (state.m2.pec) return <p className="text-[12px] text-mute">A perfect conductor is the same at every frequency.</p>
  if (state.m2.sigma === 0)
    return <p className="text-[12px] text-mute"><Prose>{'$\\sigma_2 = 0$: Medium 2 is lossless at every frequency.'}</Prose></p>
  const b = classBoundaryFrequencies(state.m2)
  const a = frac(b.goodConductorBelow), c = frac(b.lowLossAbove)
  const segs = [
    { from: 0, to: a, o: 0.85, cls: 'good-conductor' as const },
    { from: a, to: c, o: 0.4, cls: 'lossy' as const },
    { from: c, to: 1, o: 0.13, cls: 'low-loss' as const },
  ]
  return (
    <div>
      <div className="relative mt-3 h-2.5">
        {segs.map((s) => s.to > s.from && (
          <div key={s.cls} className="absolute inset-y-0 bg-ink" style={{ left: `calc(${s.from * 100}% + ${s.from > 0 ? 1 : 0}px)`, width: `calc(${(s.to - s.from) * 100}% - ${s.from > 0 ? 1 : 0}px)`, opacity: s.o }} />
        ))}
        <div className="absolute -top-2.5 h-[22px] w-0 -translate-x-1/2 border-l-2 border-inc" style={{ left: `${frac(state.f) * 100}%` }} />
      </div>
      <div className="num mt-1 flex justify-between text-[10px] text-faint"><span>1 kHz</span><span>1 MHz</span><span>1 GHz</span><span>100 GHz</span></div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px]">
        {segs.map((s) => (
          <span key={s.cls} className={model.cls2 === s.cls ? 'font-medium text-ink' : 'text-mute'}>
            <span className="mr-1 inline-block h-2 w-2 bg-ink align-baseline" style={{ opacity: s.o }} />
            {CLASS_LABEL[s.cls]}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
        <Prose>{`Good conductor below ${si(b.goodConductorBelow, 'Hz', 3)}, low-loss above ${si(b.lowLossAbove, 'Hz', 3)}. The limits $\\sigma/\\omega\\epsilon$ = ${GOOD_CONDUCTOR_MIN} and ${LOW_LOSS_MAX} are a convention: “$\\gg$” and “$\\ll$” have no exact boundary.`}</Prose>
      </p>
    </div>
  )
}

export function Controls({ model, dispatch }: { model: Model; dispatch: Dispatch<Action> }) {
  const s = model.state
  const pec = s.m2.pec
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading>Wave</Heading>
        <ParamSlider symbol={<Tex>f</Tex>} name="frequency" unit="Hz" prefix scale="log" min={LIMITS.f[0]} max={LIMITS.f[1]}
          value={s.f} onChange={(v) => dispatch({ type: 'physics', change: 'f', patch: { f: v } })} />
        <ParamSlider symbol={<span className="text-inc"><Tex>{'\\theta_i'}</Tex></span>} name="incidence angle" unit="°" min={0} max={89.9} step={0.1} digits={3}
          value={s.thetaDeg} onChange={(v) => dispatch({ type: 'physics', change: 'theta', patch: { thetaDeg: Math.round(v * 10) / 10 } })} />
        <ParamSlider symbol={<span className="text-inc"><Tex>{'E_{i0}'}</Tex></span>} name="amplitude" unit="V/m" prefix scale="log" min={LIMITS.e0[0]} max={LIMITS.e0[1]}
          value={s.e0} onChange={(v) => dispatch({ type: 'physics', change: 'e0', patch: { e0: v } })} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="8-2">Medium 1 · z &lt; 0</Heading>
        <PresetSelect which={1} value={s.m1.preset} customized={isCustomized(s.m1)} onChange={(id) => dispatch(setPreset(1, id))} />
        <ParamSlider symbol={<Tex>{'\\epsilon_{r1}'}</Tex>} name="permittivity" unit="" scale="log" min={1} max={100}
          value={s.m1.epsR} onChange={(v) => dispatch(setMedium(1, 'epsR', v, s))} />
        <ParamSlider symbol={<Tex>{'\\mu_{r1}'}</Tex>} name="permeability" unit="" scale="log" min={1} max={100}
          value={s.m1.muR} onChange={(v) => dispatch(setMedium(1, 'muR', v, s))} />
        <p className="text-[11.5px] leading-snug text-mute"><Prose>{'Medium 1 is lossless in this version: $\\sigma_1 = 0$.'}</Prose></p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="8-3">Medium 2 · z &gt; 0</Heading>
        <PresetSelect which={2} value={s.m2.preset} customized={isCustomized(s.m2)} onChange={(id) => dispatch(setPreset(2, id))} />
        {pec ? (
          <p className="text-[12px] leading-snug text-mute">
            A perfect conductor is an explicit choice, not a very large <Tex>{'\\sigma'}</Tex>. Choose another material to edit values.
          </p>
        ) : (
          <>
            <ParamSlider symbol={<Tex>{'\\epsilon_{r2}'}</Tex>} name="permittivity" unit="" scale="log" min={1} max={100}
              value={s.m2.epsR} onChange={(v) => dispatch(setMedium(2, 'epsR', v, s))} />
            <ParamSlider symbol={<Tex>{'\\mu_{r2}'}</Tex>} name="permeability" unit="" scale="log" min={1} max={100}
              value={s.m2.muR} onChange={(v) => dispatch(setMedium(2, 'muR', v, s))} />
            <ParamSlider symbol={<Tex>{'\\sigma_2'}</Tex>} name="conductivity" unit="S/m" prefix scale="log" zeroStop min={LIMITS.sigma[0]} max={LIMITS.sigma[1]}
              value={s.m2.sigma} onChange={(v) => dispatch(setMedium(2, 'sigma', v, s))}
              hint={s.m2.sigma > 0 ? <>loss tangent <Tex>{'\\sigma_2/\\omega\\epsilon_2'}</Tex> <span className="num text-ink">= {sig(model.p2.lossTangent, 4)}</span> · {CLASS_LABEL[model.cls2]}</> : 'Slider at the left end: exactly 0 (lossless).'} />
          </>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <Heading section="8-3">Medium 2 class against frequency</Heading>
        <ClassStrip model={model} />
      </section>
    </div>
  )
}
