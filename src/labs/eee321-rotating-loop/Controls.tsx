import { Dispatch } from 'react'
import { Heading, ParamSlider, Segmented } from '../../ui/controls'
import { plain, si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { SelectField } from '../../ui/SelectField'
import { Prose, Tex } from '../../ui/Tex'
import type { GivenQuantity } from './engine'
import type { Model } from './derive'
import { Action, ChangeKind, LIMITS, LoopState, PRESETS, PresetId, fromPreset, isCustomized } from './state'

export function Controls({ model, dispatch }: { model: Model; dispatch: Dispatch<Action> }) {
  const s = model.state
  const { c, op } = model
  const set = (change: ChangeKind, patch: Partial<LoopState>) => dispatch({ type: 'set', change, patch })
  const torqueGiven = s.given === 'torque'
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Heading section="7.1">Setup</Heading>
        <SelectField<PresetId>
          id="loop-preset" label="Preset (Chapman)" value={s.preset} customized={isCustomized(s)}
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(id) => dispatch({ type: 'load', state: fromPreset(id, s.poleArc), change: 'preset' })}
        />
        <div>
          <div className="mb-1 text-[12px] text-mute">Given</div>
          <Segmented<GivenQuantity>
            label="Given quantity" value={s.given}
            onChange={(v) => {
              // keep the same operating point when switching: carry the current torque or speed over
              set('given', v === 'speed' ? { given: v, omega: op.omega } : { given: v, tau: op.tauInd })
            }}
            options={[{ value: 'torque', label: 'shaft torque' }, { value: 'speed', label: 'shaft speed' }]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="Ex. 7-1">Battery and circuit</Heading>
        <ParamSlider symbol={<span style={{ color: MC.voltage }}><Tex>{'V_B'}</Tex></span>} name="battery voltage" unit="V" prefix scale="log"
          min={LIMITS.VB[0]} max={LIMITS.VB[1]} value={s.VB} onChange={(v) => set('VB', { VB: v })} />
        <ParamSlider symbol={<Tex>R</Tex>} name="resistance" unit="Ω" scale="log"
          min={LIMITS.R[0]} max={LIMITS.R[1]} value={s.R} onChange={(v) => set('R', { R: v })} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="7.1">Field and geometry</Heading>
        <ParamSlider symbol={<Tex>B</Tex>} name="flux density" unit="T" min={LIMITS.B[0]} max={LIMITS.B[1]} step={0.01} digits={3}
          value={s.B} onChange={(v) => set('B', { B: round(v, 2) })} />
        <ParamSlider symbol={<Tex>r</Tex>} name="radius" unit="m" min={LIMITS.r[0]} max={LIMITS.r[1]} step={0.01} digits={3}
          value={s.r} onChange={(v) => set('r', { r: round(v, 2) })} />
        <ParamSlider symbol={<Tex>l</Tex>} name="length" unit="m" min={LIMITS.l[0]} max={LIMITS.l[1]} step={0.01} digits={3}
          value={s.l} onChange={(v) => set('l', { l: round(v, 2) })} />
        <p className="text-[11.5px] leading-snug text-mute">
          <Prose>{`$\\phi = \\pi r l B$ = ${plain(c.phi, 'Wb')}, so $\\tfrac{2}{\\pi}\\phi$ = ${plain(c.k, 'V·s')}.`}</Prose>
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <Heading section="Ex. 7-1">Shaft</Heading>
        {torqueGiven ? (
          <>
            <ParamSlider
              symbol={<span style={{ color: MC.mechanical }}><Tex>{'\\tau_{load}'}</Tex></span>} name="load torque" unit="N·m" prefix
              min={model.tauMin} max={model.tauMax} step={model.tauStep} digits={4}
              value={op.tauLoad}
              onChange={(v) => set('tau', { tau: round(v, 10) })}
              onOutOfRange={(v) => set('tau', { tau: v })}
              hint="negative = applied in the direction of rotation"
            />
            {model.stallWarning && (
              <p className="border-l-2 border-warn pl-2 text-[12px] leading-snug text-warn" role="alert">
                <Prose>{`Load torque exceeds the starting torque $\\tfrac{2}{\\pi}\\phi V_B/R$ = ${si(c.tauStall, 'N·m', 4)}; the loop cannot turn in the positive direction. The torque is held at ${si(model.tauMax, 'N·m', 4)}.`}</Prose>
              </p>
            )}
          </>
        ) : (
          <>
            <ParamSlider
              symbol={<span style={{ color: MC.mechanical }}><Tex>\omega</Tex></span>} name="shaft speed" unit="rad/s" prefix
              min={0} max={model.omegaMax} step={model.omegaMax / 1000} digits={4}
              value={op.omega}
              onChange={(v) => set('omega', { omega: round(v, 10) })}
              onOutOfRange={(v) => set('omega', { omega: v })}
              hint={<>held by a prime mover; <Tex>{'\\omega_{nl}'}</Tex> = {si(c.omegaNl, 'rad/s', 4)}</>}
            />
            {model.negativeSpeedWarning && (
              <p className="border-l-2 border-warn pl-2 text-[12px] leading-snug text-warn" role="alert">
                <Prose>{'Only $\\omega \\ge 0$ is allowed in this lab: the loop turns counter-clockwise or stands still. The speed is held at 0.'}</Prose>
              </p>
            )}
            {model.speedClamped && (
              <p className="text-[12px] leading-snug text-mute">
                <Prose>{`The speed is limited to $2\\,\\omega_{nl}$ = ${si(model.omegaMax, 'rad/s', 4)}.`}</Prose>
              </p>
            )}
          </>
        )}
        <p className="text-[11.5px] leading-snug text-mute">
          <Prose>{'Signs: $\\omega > 0$ is counter-clockwise. $i > 0$ flows out of the battery\'s + terminal into the loop. $e_{ind} > 0$ opposes that current. $\\tau_{load} > 0$ opposes the rotation.'}</Prose>
        </p>
      </section>
    </div>
  )
}

/** Remove floating-point noise from slider steps (0.25000000000000006 -> 0.25). */
const round = (v: number, places: number) => Number(v.toFixed(places))
