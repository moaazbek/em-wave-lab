import { Dispatch, ReactNode } from 'react'
import { Heading, ParamSlider, Segmented, Switch } from '../../ui/controls'
import { sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { SelectField } from '../../ui/SelectField'
import { Prose, Tex } from '../../ui/Tex'
import { nearbyDrawable, smartAdjust, stepTargets } from './adjust'
import { MAX_DRAWN_COILS, ResistancePer, WindingType, drawableCoilCounts, nearestDrawable } from './engine'
import type { Model } from './derive'
import { Action, ArmState, ChangeKind, FluxMode, LIMITS, POLES, PRESETS, PresetId, fromPreset, isCustomized, parseSpeed } from './state'

const BTN = 'flex h-7 min-w-7 shrink-0 items-center justify-center rounded-[3px] border border-rule px-2 text-[12px] text-mute hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-mute'
const CHIP = 'num h-6 rounded-[3px] border px-1.5 text-[11.5px]'

export function Controls({ model, dispatch, rotor }: { model: Model; dispatch: Dispatch<Action>; rotor?: ReactNode }) {
  const s = model.state
  const { f, geo } = model
  const set = (change: ChangeKind, patch: Partial<ArmState>) => dispatch({ type: 'set', change, patch })
  /** Choice buttons go through the smart adjust: the pressed choice is kept, other settings change only if needed. */
  const choose = (change: ChangeKind, patch: Partial<ArmState>) => {
    const r = smartAdjust(s, patch)
    dispatch({ type: 'set', change, patch: r.patch, notes: r.notes })
  }
  const setC = (C: number) => set('C', { C, chord: 0 })
  const steps = stepTargets(s)
  const chips = nearbyDrawable(s)
  const frog = s.type === 'frog'
  const poleOk = (P: number) => frog || drawableCoilCounts(s.type, s.m, P, s.progressive).length > 0
  const blocked = POLES.filter((P) => !poleOk(P))
  const poleHint = blocked.length === 0 ? null
    : s.type === 'wave' ? 'Wave windings need $P \\ge 4$. With 2 poles, a wave winding connects like a lap winding.'
      : `A triplex lap winding with ${blocked.join(' or ')} poles needs $C \\ge 2mP$ = ${blocked.map((P) => 2 * s.m * P).join(' or ')} coils; the lab draws $C \\le$ ${MAX_DRAWN_COILS}.`
  /** Slider moves stop on drawable values up to 48 (typed values are never changed). */
  const snapC = (v: number) => {
    const C = Math.round(v)
    return C <= MAX_DRAWN_COILS && model.drawable.length ? (nearestDrawable(model.drawable, C) ?? C) : C
  }
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading section="7.3">Winding</Heading>
        <SelectField<PresetId>
          id="arm-preset" label="Preset (Chapman)" value={s.preset} customized={isCustomized(s)}
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(id) => dispatch({ type: 'load', state: fromPreset(id), change: 'preset' })}
        />
        <Segmented<WindingType> label="Winding type" value={s.type} onChange={(v) => choose('type', { type: v })}
          options={[{ value: 'lap', label: 'Lap' }, { value: 'wave', label: 'Wave' }, { value: 'frog', label: 'Frog-leg' }]} />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<'1' | '2' | '3'> label={frog ? 'Plex of the lap part' : 'Plex'} value={String(s.m) as '1' | '2' | '3'} onChange={(v) => choose('m', { m: Number(v) })}
            options={[{ value: '1', label: 'simplex' }, { value: '2', label: 'duplex' }, { value: '3', label: 'triplex' }]} />
          <Segmented<'p' | 'r'> label="Direction" value={s.progressive ? 'p' : 'r'} onChange={(v) => choose('dir', { progressive: v === 'p' })}
            options={[{ value: 'p', label: 'progressive' }, { value: 'r', label: 'retrogressive' }]} />
        </div>
        <div>
          <div className="mb-1 flex items-baseline gap-1.5"><Tex>P</Tex><span className="text-[12px] text-mute">poles</span></div>
          <Segmented<string> label="Number of poles" value={String(s.P)} onChange={(v) => choose('P', { P: Number(v) })}
            options={POLES.map((p) => ({ value: String(p), label: String(p), disabled: !poleOk(p) && p !== s.P, title: !poleOk(p) ? 'Not drawable with this winding' : undefined }))} />
          {poleHint && <p className="mt-1 text-[11.5px] leading-snug text-mute"><Prose>{poleHint}</Prose></p>}
        </div>
        <ParamSlider symbol={<Tex>C</Tex>} name="coils = commutator segments" integer unit="" scale="log" digits={4}
          min={LIMITS.C[0]} max={LIMITS.C[1]} value={s.C} onChange={(v) => setC(Math.round(v))} snap={snapC} />
        <div className="-mt-1 flex flex-wrap items-center gap-1.5">
          <button type="button" className={BTN} disabled={steps.prev === null} onClick={() => steps.prev !== null && setC(steps.prev)}
            aria-label={frog ? 'One coil fewer' : `Previous drawable C${steps.prev !== null ? ` (${steps.prev})` : ''}`}>−</button>
          <button type="button" className={BTN} disabled={steps.next === null} onClick={() => steps.next !== null && setC(steps.next)}
            aria-label={frog ? 'One coil more' : `Next drawable C${steps.next !== null ? ` (${steps.next})` : ''}`}>+</button>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Drawable values of C">
              <span className="text-[11.5px] text-mute">Drawable:</span>
              {chips.map((c) => (
                <button key={c} type="button" onClick={() => setC(c)} aria-pressed={c === s.C}
                  className={`${CHIP} ${c === s.C ? 'border-ink text-ink' : 'border-rule text-mute hover:text-ink'}`}>{c}</button>
              ))}
            </div>
          )}
        </div>
        <ParamSlider symbol={<Tex>{'N_C'}</Tex>} name="turns per coil" integer unit="" min={LIMITS.NC[0]} max={LIMITS.NC[1]} step={1} digits={3}
          value={s.NC} onChange={(v) => set('NC', { NC: Math.round(v) })} />
        <ParamSlider symbol={<Tex>{'y_s'}</Tex>} name="coil span (slots)" integer unit="" min={1} max={model.fullPitch} step={1} digits={3}
          value={model.f.ys} onChange={(v) => set('chord', { chord: model.fullPitch - Math.round(v) })} disabled={model.fullPitch <= 1}
          hint={<>pitch factor <Tex>p</Tex> = <span className="num text-ink">{sig(f.p, 4)} %</span> {f.p >= 99.999 ? '(full pitch)' : '(chorded winding)'}</>} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="7.5">Machine</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-mute">Flux given as</span>
          <Segmented<FluxMode> label="Flux given as" value={s.fluxMode} onChange={(v) => set('fluxMode', { fluxMode: v })}
            options={[{ value: 'phi', label: <Tex>\phi</Tex> }, { value: 'field', label: <Tex>{'B,\\ r,\\ l'}</Tex> }]} />
        </div>
        {s.fluxMode === 'phi' ? (
          <ParamSlider symbol={<Tex>\phi</Tex>} name="flux per pole" unit="Wb" prefix scale="log"
            min={LIMITS.phi[0]} max={LIMITS.phi[1]} value={s.phi} onChange={(v) => set('phi', { phi: v })} />
        ) : (
          <>
            <ParamSlider symbol={<Tex>B</Tex>} name="flux density under the poles" unit="T" prefix scale="log"
              min={LIMITS.B[0]} max={LIMITS.B[1]} value={s.B} onChange={(v) => set('B', { B: v })} />
            <ParamSlider symbol={<Tex>r</Tex>} name="rotor radius" unit="m" prefix scale="log"
              min={LIMITS.r[0]} max={LIMITS.r[1]} value={s.r} onChange={(v) => set('r', { r: v })} />
            <ParamSlider symbol={<Tex>l</Tex>} name="conductor length" unit="m" prefix scale="log"
              min={LIMITS.l[0]} max={LIMITS.l[1]} value={s.l} onChange={(v) => set('l', { l: v })}
              hint={<Prose>{`$\\phi = BA_P = 2\\pi r l B/P$ = ${sig(model.phi, 6)} Wb (Eq. 7-36); $e_{cond} = r\\omega B l$.`}</Prose>} />
          </>
        )}
        <ParamSlider symbol={<span style={{ color: MC.mechanical }}><Tex>n</Tex></span>} name="speed" unit="r/min" scale="log" digits={4}
          min={LIMITS.n[0]} max={LIMITS.n[1]} value={s.n} onChange={(v) => set('n', { n: v })} parse={parseSpeed}
          hint={<><Tex>\omega</Tex> = <span className="num text-ink">{sig(f.omega, 5)} rad/s</span> (mechanical speed). Typing "50 rev/s" also works.</>} />
        <ParamSlider symbol={<Tex>\beta</Tex>} name="pole arc / pole pitch" unit="" min={LIMITS.beta[0]} max={LIMITS.beta[1]} step={0.01} digits={3}
          value={s.beta} onChange={(v) => set('beta', { beta: Number(v.toFixed(2)) })}
          hint={<>1 = no dead zone (the exam's "ignore the dead zone").</>} />
        <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <button type="button" className={BTN} disabled={s.beta === 1} onClick={() => set('beta', { beta: 1 })}>Ignore dead zone</button>
          <span className="num text-[11.5px] leading-snug text-mute">
            pole arc {sig(geo.arcM, 4)}° mech · {sig(geo.arcE, 4)}° elec; dead zone {sig(geo.gapM, 4)}° mech · {sig(geo.gapE, 4)}° elec <span className="font-sans">(geometry)</span>
          </span>
        </div>
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
        <Heading>Display</Heading>
        <p className="text-[11.5px] leading-snug text-mute">
          {model.build.ok ? <>Brush width: <span className="num">{s.m - 0.5}</span> segment pitches (it touches <Tex>m</Tex> or <Tex>m+1</Tex> segments).</> : null}
        </p>
        {rotor}
      </section>
    </div>
  )
}
