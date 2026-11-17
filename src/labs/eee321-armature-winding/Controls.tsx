import { Dispatch, ReactNode } from 'react'
import { Heading, ParamSlider, Segmented, Switch } from '../../ui/controls'
import { sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { SelectField } from '../../ui/SelectField'
import { Prose, Tex } from '../../ui/Tex'
import type { ResistancePer, WindingType } from './engine'
import type { Model } from './derive'
import { Action, ArmState, ChangeKind, LIMITS, POLES, PRESETS, PresetId, fromPreset, isCustomized, parseSpeed } from './state'

const BTN = 'flex h-7 min-w-7 shrink-0 items-center justify-center rounded-[3px] border border-rule px-2 text-[12px] text-mute hover:text-ink'

export function Controls({ model, dispatch, rotor }: { model: Model; dispatch: Dispatch<Action>; rotor?: ReactNode }) {
  const s = model.state
  const { f } = model
  const set = (change: ChangeKind, patch: Partial<ArmState>) => dispatch({ type: 'set', change, patch })
  const stepC = (d: number) => set('C', { C: Math.min(LIMITS.C[1], Math.max(LIMITS.C[0], s.C + d)), chord: 0 })
  const mStep = s.type === 'lap' ? s.m * s.P : 1
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading section="7.3">Winding</Heading>
        <SelectField<PresetId>
          id="arm-preset" label="Preset (Chapman)" value={s.preset} customized={isCustomized(s)}
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(id) => dispatch({ type: 'load', state: fromPreset(id, s.beta), change: 'preset' })}
        />
        <Segmented<WindingType> label="Winding type" value={s.type} onChange={(v) => set('type', { type: v, chord: 0 })}
          options={[{ value: 'lap', label: 'Lap' }, { value: 'wave', label: 'Wave' }, { value: 'frog', label: 'Frog-leg' }]} />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<'1' | '2' | '3'> label={s.type === 'frog' ? 'Plex of the lap part' : 'Plex'} value={String(s.m) as '1' | '2' | '3'} onChange={(v) => set('m', { m: Number(v) })}
            options={[{ value: '1', label: 'simplex' }, { value: '2', label: 'duplex' }, { value: '3', label: 'triplex' }]} />
          <Segmented<'p' | 'r'> label="Direction" value={s.progressive ? 'p' : 'r'} onChange={(v) => set('dir', { progressive: v === 'p' })}
            options={[{ value: 'p', label: 'progressive' }, { value: 'r', label: 'retrogressive' }]} />
        </div>
        <div>
          <div className="mb-1 flex items-baseline gap-1.5"><Tex>P</Tex><span className="text-[12px] text-mute">poles</span></div>
          <Segmented<string> label="Number of poles" value={String(s.P)} onChange={(v) => set('P', { P: Number(v), chord: 0 })}
            options={POLES.map((p) => ({ value: String(p), label: String(p) }))} />
        </div>
        <ParamSlider symbol={<Tex>C</Tex>} name="coils = commutator segments" integer unit="" scale="log" digits={4}
          min={LIMITS.C[0]} max={LIMITS.C[1]} value={s.C} onChange={(v) => set('C', { C: Math.round(v), chord: 0 })} />
        <div className="-mt-1 flex flex-wrap items-center gap-1.5">
          <button type="button" className={BTN} onClick={() => stepC(-1)} aria-label="One coil fewer">−1</button>
          <button type="button" className={BTN} onClick={() => stepC(1)} aria-label="One coil more">+1</button>
          {mStep > 1 && <>
            <button type="button" className={BTN} onClick={() => stepC(-mStep)} aria-label={`${mStep} coils fewer`}>−{mStep}</button>
            <button type="button" className={BTN} onClick={() => stepC(mStep)} aria-label={`${mStep} coils more`}>+{mStep}</button>
          </>}
          <span className="text-[11.5px] text-mute">{s.type === 'lap' ? <>steps of <Tex>mP</Tex> keep a lap winding buildable</> : null}</span>
        </div>
        <ParamSlider symbol={<Tex>{'N_C'}</Tex>} name="turns per coil" integer unit="" min={LIMITS.NC[0]} max={LIMITS.NC[1]} step={1} digits={3}
          value={s.NC} onChange={(v) => set('NC', { NC: Math.round(v) })} />
        <ParamSlider symbol={<Tex>{'y_s'}</Tex>} name="coil span (slots)" integer unit="" min={1} max={model.fullPitch} step={1} digits={3}
          value={model.f.ys} onChange={(v) => set('chord', { chord: model.fullPitch - Math.round(v) })} disabled={model.fullPitch <= 1}
          hint={<>pitch factor <Tex>p</Tex> = <span className="num text-ink">{sig(f.p, 4)} %</span> {f.p >= 99.999 ? '(full pitch)' : '(chorded winding)'}</>} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="7.5">Machine</Heading>
        <ParamSlider symbol={<Tex>\phi</Tex>} name="flux per pole" unit="Wb" prefix scale="log"
          min={LIMITS.phi[0]} max={LIMITS.phi[1]} value={s.phi} onChange={(v) => set('phi', { phi: v })} />
        <ParamSlider symbol={<span style={{ color: MC.mechanical }}><Tex>n</Tex></span>} name="speed" unit="r/min" scale="log" digits={4}
          min={LIMITS.n[0]} max={LIMITS.n[1]} value={s.n} onChange={(v) => set('n', { n: v })} parse={parseSpeed}
          hint={<><Tex>\omega</Tex> = <span className="num text-ink">{sig(f.omega, 5)} rad/s</span> (mechanical speed). Typing "50 rev/s" also works.</>} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="Ex. 7-4">Resistance</Heading>
        <ParamSlider symbol={<Tex>R</Tex>} name={`resistance per ${s.Rper}`} unit="Ω" prefix scale="log"
          min={LIMITS.R[0]} max={LIMITS.R[1]} value={s.R} onChange={(v) => set('R', { R: v })} />
        <Segmented<ResistancePer> label="Resistance given per" value={s.Rper} onChange={(v) => set('Rper', { Rper: v })}
          options={[{ value: 'conductor', label: 'per conductor' }, { value: 'turn', label: 'per turn' }, { value: 'coil', label: 'per coil' }]} />
        <p className="text-[11.5px] leading-snug text-mute">
          <Prose>{`Series–parallel rule: ${sig(f.elementsPerPath, 5)} ${s.Rper === 'conductor' ? 'conductors' : s.Rper === 'turn' ? 'turns' : 'coils'} in series per path, $a$ = ${f.a} paths in parallel.`}</Prose>
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="7.5">Load</Heading>
        <Segmented<'open' | 'load'> label="Load" value={s.load ? 'load' : 'open'} onChange={(v) => set('load', { load: v === 'load' })}
          options={[{ value: 'open', label: 'open circuit' }, { value: 'load', label: 'resistor' }]} />
        {s.load && (
          <>
            <ParamSlider symbol={<Tex>{'R_L'}</Tex>} name="load resistance" unit="Ω" prefix scale="log"
              min={LIMITS.RL[0]} max={LIMITS.RL[1]} value={s.RL} onChange={(v) => set('RL', { RL: v })} />
            <Switch checked={s.ignoreRA} onChange={(v) => set('ignoreRA', { ignoreRA: v })}>ignore <Tex>{'R_A'}</Tex> (Example 7-4(d))</Switch>
          </>
        )}
        <p className="text-[11.5px] leading-snug text-mute"><Prose>{'Generator; the brush voltage drop is neglected.'}</Prose></p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="p. 448">Display</Heading>
        <ParamSlider symbol={<Tex>\beta</Tex>} name="pole-arc fraction (dead zone)" unit="" min={LIMITS.beta[0]} max={LIMITS.beta[1]} step={0.01} digits={3}
          value={s.beta} onChange={(v) => set('beta', { beta: Number(v.toFixed(2)) })}
          hint={<>The book's <Tex>{'E_A'}</Tex> formula assumes all conductors are under the poles (<Tex>{'\\beta = 1'}</Tex>).</>} />
        <p className="text-[11.5px] leading-snug text-mute">
          {model.build.ok ? <>Brush width: <span className="num">{s.m - 0.5}</span> segment pitches (it touches <Tex>m</Tex> or <Tex>m+1</Tex> segments).</> : null}
        </p>
        {rotor}
      </section>
    </div>
  )
}
