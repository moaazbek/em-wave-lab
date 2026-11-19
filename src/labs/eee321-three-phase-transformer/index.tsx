import { useMemo, useReducer, useState } from 'react'
import { LabFrame } from '../../shell/LabFrame'
import { LabHeader } from '../../shell/LabHeader'
import { useUrlSync } from '../../shell/router'
import { useClock } from '../../ui/clock'
import { Heading, Segmented, Switch } from '../../ui/controls'
import { PHASE_COLOR } from '../../ui/palette'
import { AngleReadout, PlaybackControls } from '../../ui/Playback'
import { ExperimentList, ShowWork, WhatIsHappening } from '../../ui/teaching'
import { Prose, Tex } from '../../ui/Tex'
import { useMediaQuery } from '../../ui/theme'
import { Controls } from './Controls'
import { Model, derive } from './derive'
import { CircuitDiagram, PerPhasePhasors, TestSketch } from './EquivCircuit'
import { EXPERIMENTS, Experiment, REAL_EXPERIMENTS } from './experiments'
import { LoadPlots, PowerBars } from './RealPlots'
import { PhasorView } from './PhasorView'
import { Results } from './Results'
import { decodeState, encodeState, initSession, reduce } from './state'
import { reaction, situation } from './teaching'
import { WaveformPlot } from './WaveformPlot'
import { WiringView } from './WiringView'
import { workSteps } from './work'

const SLUG = 'eee321-three-phase-transformer'

export default function ThreePhaseTransformerLab({ query }: { query: string }) {
  const [session, dispatch] = useReducer(reduce, query, (q) => initSession(decodeState(q)))
  const model = useMemo(() => derive(session.state), [session.state])
  const before = useMemo(() => derive(session.before), [session.before])
  const desktop = useMediaQuery('(min-width: 1100px)')
  const [experiment, setExperiment] = useState<string | null>(null)
  const [pinned, setPinned] = useState<'wiring' | 'phasors' | 'circuit'>('wiring')
  // ωt starts at 0, so a frozen phasor diagram and the waveform cursor both show t = 0
  const time = useClock({ initialPhase: 0 })
  const s = session.state

  useUrlSync(SLUG, s, encodeState, (q) => dispatch({ type: 'load', state: decodeState(q), change: 'init' }))

  const real = s.model === 'real'
  const expList = real ? REAL_EXPERIMENTS : EXPERIMENTS
  const loadExperiment = (id: string) => {
    const e = expList.find((x) => x.id === id)!
    setExperiment(e.id)
    dispatch({ type: 'load', state: { ...e.setup, overlay: s.overlay, rotate: s.rotate }, change: 'experiment' })
    time.clock.reset(0)
  }
  const reveal = (e: Experiment) => dispatch({ type: 'set', change: 'reveal', patch: e.reveal!.patch })

  const explanation = (
    <section className="min-w-0">
      <WhatIsHappening reaction={reaction(before, model, session.change)} lines={situation(model)} />
    </section>
  )
  const experiments = <ExperimentList experiments={expList} activeId={experiment} onLoad={loadExperiment} onReveal={reveal} />
  const showWork = <ShowWork compute={() => workSteps(model)} dep={model} />
  const wiring = (cls: string, compact = false) => (
    <WiringView model={model} clock={time.clock} reduced={time.reduced} compact={compact} className={cls} />
  )
  const phasorSwitches = (
    <div className="flex flex-wrap items-center gap-x-4">
      <Switch checked={s.rotate} onChange={(v) => dispatch({ type: 'set', change: 'view', patch: { rotate: v } })}>Rotate with <Tex>{'\\omega t'}</Tex></Switch>
      <Switch checked={s.overlay} onChange={(v) => dispatch({ type: 'set', change: 'view', patch: { overlay: v } })}>Overlay secondary</Switch>
    </div>
  )
  const phasors = (cls: string, compact = false) => <PhasorView model={model} clock={time.clock} compact={compact} className={cls} />
  const waveform = (
    <section className="min-w-0">
      <Heading section="2.10">{s.harmonic ? 'Third-harmonic view (illustrative)' : 'Line voltages against time'}</Heading>
      <div className="mt-2.5"><WaveformPlot model={model} clock={time.clock} /></div>
    </section>
  )
  const header = <LabHeader slug={SLUG} number="01" title="Three-phase transformer connections" tag="Chapman § 2.10" compact={!desktop} />
  const setGain = (g: 1 | 5 | 10) => dispatch({ type: 'set', change: 'view', patch: { gain: g } })
  const errorBanner = model.real?.error && (
    <p className="mt-2.5 rounded-[3px] border border-warn px-3 py-2 text-[12.5px] leading-snug text-warn" role="alert">
      {model.real.error.where === 'load' ? model.real.error.text : <Prose>{`${model.real.error.where} test: ${/V·I/.test(model.real.error.text) ? 'the wattmeter reading cannot exceed $V\\cdot I$' : model.real.error.text}. Nothing is computed; the wiring shows the ideal bank at its rating.`}</Prose>}
    </p>
  )
  const heroSwitch = real && (
    <Segmented<'conn' | 'circuit'> label="Hero view" value={s.hero} onChange={(v) => dispatch({ type: 'set', change: 'view', patch: { hero: v } })}
      options={[{ value: 'conn', label: 'Connections' }, { value: 'circuit', label: 'Equivalent circuit' }]} />
  )
  const circuitHero = (compact: boolean) => <CircuitHero model={model} compact={compact} onGain={setGain} />
  const realBelow = real && model.sol.real && (
    <>
      <section className="min-w-0">
        <Heading section="2.7">Power flow (bank)</Heading>
        <div className="mt-2.5"><PowerBars model={model} /></div>
      </section>
      <section className="min-w-0">
        <Heading section="2.7">Voltage regulation and efficiency against load</Heading>
        <div className="mt-2.5"><LoadPlots model={model} /></div>
      </section>
    </>
  )

  return (
    <LabFrame
      desktop={desktop}
      header={header}
      course="EEE 321"
      left={<><Controls model={model} dispatch={dispatch} />{experiments}</>}
      centre={
        <>
          <Toolbar time={time} extra={heroSwitch} />
          {errorBanner}
          {real && s.hero === 'circuit' ? <div className="mt-2.5">{circuitHero(false)}</div> : (
            <>
              {wiring('mt-2.5 h-[clamp(320px,calc(100vh-460px),460px)]')}
              <Caption reduced={time.reduced} />
            </>
          )}
          <section className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-1.5">
              <h3 className="tag !text-ink">Phasor diagrams</h3>
              {phasorSwitches}
            </div>
            {phasors('mt-2.5 h-[300px]')}
          </section>
          {realBelow && <div className="mt-6 flex flex-col gap-6">{realBelow}</div>}
          <div className="mt-6">{waveform}</div>
          <div className="mt-6">{explanation}</div>
          <div className="mt-6">{showWork}</div>
        </>
      }
      right={<Results model={model} />}
      pinned={
        <>
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 py-1.5">
            <Segmented<'wiring' | 'phasors' | 'circuit'> label="Pinned view" value={real ? pinned : pinned === 'circuit' ? 'wiring' : pinned} onChange={setPinned}
              options={[{ value: 'wiring', label: 'Wiring' }, { value: 'phasors', label: 'Phasors' }, ...(real ? [{ value: 'circuit' as const, label: 'Circuit' }] : [])]} />
            <span className="w-1 shrink-0" />
            <PlaybackControls time={time} />
          </div>
          {real && pinned === 'circuit'
            ? <CircuitDiagram model={model} className="border-x-0" />
            : pinned === 'phasors' ? phasors('h-[min(40vh,300px)] border-x-0', true) : wiring('h-[min(40vh,320px)] border-x-0', true)}
        </>
      }
      tabs={[
        { id: 'controls', label: 'Controls', content: <Controls model={model} dispatch={dispatch} /> },
        { id: 'results', label: 'Results', content: <div className="flex flex-col gap-4">{errorBanner}<Results model={model} /></div> },
        {
          id: 'explain', label: 'Explain',
          content: (
            <div className="flex flex-col gap-6">
              {explanation}
              {experiments}
              {showWork}
            </div>
          ),
        },
        {
          id: 'plots', label: 'Plots',
          content: (
            <div className="flex flex-col gap-6">
              {real && model.sol.real && (
                <section className="flex flex-col gap-4">
                  <Heading section="2.7">Per-phase circuit and phasors</Heading>
                  {circuitHero(true)}
                </section>
              )}
              {realBelow}
              <section>
                <Heading>{pinned === 'wiring' || pinned === 'circuit' ? 'Phasor diagrams' : 'Wiring'}</Heading>
                {pinned !== 'phasors' ? (
                  <>
                    <div className="mt-2">{phasorSwitches}</div>
                    {phasors('mt-2 h-[260px]', true)}
                  </>
                ) : wiring('mt-2.5 h-[300px]', true)}
              </section>
              {waveform}
              <Caption reduced={time.reduced} />
            </div>
          ),
        },
      ]}
    />
  )
}

/** Equivalent-circuit hero: the per-phase circuit, the test set-ups and the per-phase phasor diagram. */
function CircuitHero({ model, compact, onGain }: { model: Model; compact: boolean; onGain: (g: 1 | 5 | 10) => void }) {
  if (!model.sol.real) return <div className="border border-dashed border-rule bg-panel px-4 py-6 text-center text-[13px] text-mute">Nothing to draw: the data are refused (see the message above).</div>
  const tests = model.state.zFrom === 'test'
  return (
    <div className="flex flex-col gap-4">
      <div>
        <CircuitDiagram model={model} />
        <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
          <Prose>{`Approximate equivalent circuit of one transformer (Chapman Fig. 2-17), referred to the ${model.state.refSide === 'pu' ? 'per-unit system' : model.state.refSide === 'P' ? 'primary' : 'secondary'}. Values of the present operating point; "neglected" elements are drawn faint and dashed.`}</Prose>
        </p>
      </div>
      {tests && (
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <TestSketch model={model} kind="OC" />
          <TestSketch model={model} kind="SC" />
        </div>
      )}
      <PerPhasePhasors model={model} onGain={onGain} />
    </div>
  )
}

function Toolbar({ time, extra }: { time: ReturnType<typeof useClock>; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {extra}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-mute">
        {['T1 · phase A/a', 'T2 · phase B/b', 'T3 · phase C/c'].map((t, k) => (
          <span key={t} className="flex items-center gap-1.5">
            <svg width="16" height="8" aria-hidden><line x1="0" y1="4" x2="16" y2="4" stroke={PHASE_COLOR[k]} strokeWidth="2.5" /></svg>
            {t}
          </span>
        ))}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <PlaybackControls time={time} readout={<AngleReadout clock={time.clock} label={'\\omega t ='} />} />
      </div>
    </div>
  )
}

function Caption({ reduced }: { reduced: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11.5px] text-mute">
      <span>
        {reduced
          ? <>Arrows: direction of the instantaneous current, size <Tex>{'\\propto'}</Tex> current (reduced motion).</>
          : <>Moving dots: dot speed <Tex>{'\\propto'}</Tex> current, scaled per side (display only). They move back and forth with the AC current.</>}
      </span>
      <span>
        Wires are generated from the netlist; • on a coil marks the dotted end. Time is slowed; <Tex>{'\\omega t'}</Tex> drives the dots, phasors and cursor.
      </span>
    </div>
  )
}
