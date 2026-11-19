import { useMemo, useReducer, useState } from 'react'
import { LabFrame } from '../../shell/LabFrame'
import { LabHeader } from '../../shell/LabHeader'
import { useUrlSync } from '../../shell/router'
import { useClock } from '../../ui/clock'
import { Heading, ParamSlider } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { AngleReadout, PlaybackControls } from '../../ui/Playback'
import { ExperimentList, ShowWork, WhatIsHappening } from '../../ui/teaching'
import { Prose, Tex } from '../../ui/Tex'
import { useMediaQuery } from '../../ui/theme'
import { Controls } from './Controls'
import { Model, derive, displayRate, slowDown } from './derive'
import { EXPERIMENTS, Experiment } from './experiments'
import { MachineView } from './MachineView'
import { OperatingPlot } from './OperatingPlot'
import { PowerBars } from './PowerBars'
import { Results } from './Results'
import { LIMITS, decodeState, encodeState, initSession, reduce } from './state'
import { reaction, situation } from './teaching'
import { WaveformPlot } from './WaveformPlot'
import { workSteps } from './work'

const SLUG = 'eee321-rotating-loop'

export default function RotatingLoopLab({ query }: { query: string }) {
  const [session, dispatch] = useReducer(reduce, query, (q) => initSession(decodeState(q)))
  const model = useMemo(() => derive(session.state), [session.state])
  const before = useMemo(() => derive(session.before), [session.before])
  const desktop = useMediaQuery('(min-width: 1100px)')
  const [experiment, setExperiment] = useState<string | null>(null)
  // The rotor angle is the clock's phase; it wraps after two revolutions so the waveform cursor can follow both.
  const time = useClock({ initialPhase: 0, wrap: 4 * Math.PI, rate: (sel) => displayRate(model.op, slowDown(model.c, sel)) })
  const factor = slowDown(model.c, time.speed)

  useUrlSync(SLUG, session.state, encodeState, (q) => dispatch({ type: 'load', state: decodeState(q), change: 'init' }))

  const loadExperiment = (id: string) => {
    const e = EXPERIMENTS.find((x) => x.id === id)!
    setExperiment(e.id)
    dispatch({ type: 'load', state: { ...e.setup, poleArc: session.state.poleArc }, change: 'experiment' })
    time.clock.reset(0)
  }
  const reveal = (e: Experiment) => dispatch({ type: 'set', change: 'reveal', patch: e.reveal!.patch })
  const onTau = (v: number) => dispatch({ type: 'set', change: 'tau', patch: { tau: v } })
  const onOmega = (v: number) => dispatch({ type: 'set', change: 'omega', patch: { omega: v } })

  const explanation = (
    <section className="min-w-0">
      <WhatIsHappening reaction={reaction(before, model, session.change)} lines={situation(model)} />
    </section>
  )
  const experiments = <ExperimentList experiments={EXPERIMENTS} activeId={experiment} onLoad={loadExperiment} onReveal={reveal} />
  const showWork = <ShowWork compute={() => workSteps(model.op)} dep={model.op} />
  const caption = <Caption model={model} factor={factor} />
  const waveform = (
    <section className="min-w-0">
      <Heading section="7.1">Voltage against rotor angle</Heading>
      <div className="mt-2.5">
        <ParamSlider symbol={<span />} name="pole-arc fraction (drawing only)" unit="" min={LIMITS.poleArc[0]} max={LIMITS.poleArc[1]} step={0.01} digits={3}
          value={session.state.poleArc} onChange={(v) => dispatch({ type: 'set', change: 'poleArc', patch: { poleArc: Number(v.toFixed(2)) } })} />
      </div>
      <div className="mt-1"><WaveformPlot model={model} clock={time.clock} /></div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
        <Prose>{"Pole gaps are drawn for illustration. The book's equations and all numbers ignore them ($A_P = \\pi r l$). The shape follows Chapman Figs. 7-3 and 7-5b; it is drawn from the engine."}</Prose>
      </p>
    </section>
  )
  const operating = (
    <section className="min-w-0">
      <Heading section="7.1">Operating line</Heading>
      <div className="mt-3"><OperatingPlot model={model} onTau={onTau} onOmega={onOmega} /></div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
        <Prose>{`$\\omega = \\dfrac{V_B}{\\tfrac{2}{\\pi}\\phi} - \\dfrac{R\\,\\tau_{load}}{(\\tfrac{2}{\\pi}\\phi)^2}$, from (7-6), (7-16) and KVL. It is not a figure in the book. Drag the point to set ${model.op.given === 'torque' ? '$\\tau_{load}$' : '$\\omega$'}.`}</Prose>
      </p>
    </section>
  )
  const power = (
    <section>
      <Heading section="7.1">Power flow</Heading>
      <div className="mt-3"><PowerBars model={model} /></div>
    </section>
  )
  const header = <LabHeader number="02" title="The rotating loop" tag="Chapman § 7.1" compact={!desktop} />

  return (
    <LabFrame
      desktop={desktop}
      header={header}
      course="EEE 321"
      left={<><Controls model={model} dispatch={dispatch} />{experiments}</>}
      centre={
        <>
          <Toolbar time={time} />
          <MachineView model={model} clock={time.clock} className="mt-2.5 h-[clamp(300px,calc(100vh-420px),560px)]" />
          {caption}
          <div className="mt-6 grid grid-cols-2 gap-6">
            {waveform}
            {operating}
          </div>
          <div className="mt-6">{power}</div>
          <div className="mt-6">{explanation}</div>
          <div className="mt-6">{showWork}</div>
        </>
      }
      right={<Results model={model} />}
      pinned={
        <>
          <div className="px-3 py-1.5"><Toolbar time={time} compact /></div>
          <MachineView model={model} clock={time.clock} compact className="h-[min(40vh,320px)] border-x-0" />
        </>
      }
      tabs={[
        { id: 'controls', label: 'Controls', content: <Controls model={model} dispatch={dispatch} /> },
        { id: 'results', label: 'Results', content: <Results model={model} /> },
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
              {caption}
              {waveform}
              {operating}
              {power}
            </div>
          ),
        },
      ]}
    />
  )
}

function Toolbar({ time, compact = false }: { time: ReturnType<typeof useClock>; compact?: boolean }) {
  const playback = (
    <PlaybackControls
      time={time} unit="rev/s" unitTitle="Animation speed in revolutions per second at no load"
      stepLabel="Step forward by 1/24 of a revolution" stepTitle="Step (15°)"
      readout={<AngleReadout clock={time.clock} label={'\\theta ='} />}
    />
  )
  if (compact) return <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3">{playback}</div>
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Legend />
      <div className="ml-auto flex shrink-0 items-center gap-1.5">{playback}</div>
    </div>
  )
}

/** Marks used in the drawing; each has a symbol as well as a colour. */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-mute">
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="6" fill="none" stroke="var(--ink)" /><circle cx="7" cy="7" r="2" fill={MC.current} /></svg>
        <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="6" fill="none" stroke="var(--ink)" /><path d="M4 4L10 10M10 4L4 10" stroke={MC.current} strokeWidth="1.6" /></svg>
        current out of / into the page
      </span>
      <span className="flex items-center gap-1.5">
        <span className="num font-semibold" style={{ color: MC.voltage }}>+ −</span>
        induced voltage: polarity of the near end
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden><path d="M1 4H14" stroke={MC.mechanical} strokeWidth="2" /><path d="M19 4L13 1V7Z" fill={MC.mechanical} /></svg>
        force <Tex>F = ilB</Tex>
      </span>
    </div>
  )
}

function Caption({ model, factor }: { model: Model; factor: number }) {
  const { op } = model
  const Fref = op.iStart * op.l * op.B
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11.5px] text-mute">
      <span>
        {op.omega > 0 ? (
          <>
            Shown at <span className="num text-ink">{factor === 1 ? 'real speed' : `1/${sig(factor, 3)} of real speed`}</span>: one real revolution takes{' '}
            <span className="num">{si((2 * Math.PI) / op.omega, 's', 3)}</span>, on screen <span className="num text-ink">{sig((2 * Math.PI * factor) / op.omega, 2)} s</span>
          </>
        ) : (
          <>The loop is at rest: <Tex>{'\\omega = 0'}</Tex></>
        )}
      </span>
      <span>
        Force arrows: full length <Tex>{'= i_{start}\\,lB'}</Tex> <span className="num text-ink">= {si(Fref, 'N', 3)}</span>
      </span>
      <span>
        Front view, <Tex>{'\\omega > 0'}</Tex> counter-clockwise
      </span>
    </div>
  )
}

