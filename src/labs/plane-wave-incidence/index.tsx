import { Dispatch, useMemo, useReducer, useState } from 'react'
import { Part, Polarization, Quantity } from '../../physics'
import { LabFrame } from '../../shell/LabFrame'
import { LabHeader } from '../../shell/LabHeader'
import { useUrlSync } from '../../shell/router'
import { Heading, Segmented, Switch } from '../../ui/controls'
import { AngleReadout, PlaybackControls } from '../../ui/Playback'
import { ExperimentList, ExperimentPanel, ShowWork, WhatIsHappening } from '../../ui/teaching'
import { si, sig } from '../../ui/format'
import { PALETTES, fieldGradientCss } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { useMediaQuery, useTheme } from '../../ui/theme'
import { useClock } from '../../ui/clock'
import { Controls } from './Controls'
import { Model, derive, shownAxis } from './derive'
import { EXPERIMENTS, Experiment } from './experiments'
import { FieldMap } from './FieldMap'
import { GammaPlot } from './GammaPlot'
import { Results } from './Results'
import { Action, decodeState, encodeState, initSession, reduce } from './state'
import { reaction, situation } from './teaching'
import { workSteps } from './work'
import { ZPlot } from './ZPlot'

const SLUG = 'plane-wave-incidence'
/** Experiments start at omega*t = 45 degrees: at t = 0 a pure standing wave in E is zero everywhere. */
const START_PHASE = Math.PI / 4

export default function PlaneWaveIncidenceLab({ query }: { query: string }) {
  const [session, dispatch] = useReducer(reduce, query, (q) => initSession(decodeState(q)))
  const model = useMemo(() => derive(session.state), [session.state])
  const before = useMemo(() => derive(session.before), [session.before])
  const { theme } = useTheme()
  const time = useClock()
  const desktop = useMediaQuery('(min-width: 1100px)')
  const [experiment, setExperiment] = useState<string | null>(null)

  // The full state lives in the URL, so a link reproduces the exact setup.
  useUrlSync(SLUG, session.state, encodeState, (q) => dispatch({ type: 'load', state: decodeState(q), change: 'init' }))

  const onTheta = (d: number) => dispatch({ type: 'physics', change: 'theta', patch: { thetaDeg: d } })
  const loadExperiment = (id: string) => {
    const e = EXPERIMENTS.find((x) => x.id === id)!
    setExperiment(e.id)
    dispatch({ type: 'load', state: { ...e.setup, advanced: e.setup.advanced || session.state.advanced }, change: 'experiment' })
    time.clock.reset(START_PHASE)
  }
  const active = EXPERIMENTS.find((e) => e.id === experiment) ?? null
  const reveal = (e: Experiment) => {
    const patch = e.reveal!.patch
    const viewOnly = Object.keys(patch).every((k) => ['part', 'quantity', 'comp', 'rays', 'advanced'].includes(k))
    dispatch(viewOnly ? { type: 'view', patch } : { type: 'physics', change: 'reveal', patch })
  }

  const explanation = (
    <section className="min-w-0">
      {active && (
        <ExperimentPanel experiment={active} index={EXPERIMENTS.indexOf(active)} onClose={() => setExperiment(null)} onReveal={() => reveal(active)} />
      )}
      <WhatIsHappening reaction={reaction(before, model, session.change)} lines={situation(model)} />
    </section>
  )
  const experiments = <ExperimentList experiments={EXPERIMENTS} activeId={experiment} onLoad={loadExperiment} />
  const showWork = <ShowWork compute={() => workSteps(model)} dep={model} />
  const gamma = (
    <section>
      <Heading section="8-10">Reflection against angle</Heading>
      <div className="mt-3"><GammaPlot model={model} onTheta={onTheta} /></div>
      <p className="mt-1 text-[11.5px] leading-snug text-mute">
        Solid line: the current polarization. Drag on the plot to set <Tex>{'\\theta_i'}</Tex>.
      </p>
    </section>
  )
  const header = (
    <LabHeader
      number="01" title="Plane-wave incidence" tag="Cheng § 8-2 to 8-10" compact={!desktop}
      advanced={{ checked: session.state.advanced, onChange: (v) => dispatch({ type: 'view', patch: { advanced: v } }) }}
    />
  )

  return (
    <LabFrame
      desktop={desktop}
      header={header}
      course="EEE 361"
      left={<>{experiments}<Controls model={model} dispatch={dispatch} /></>}
      centre={
        <>
          <Toolbar model={model} dispatch={dispatch} time={time} />
          <FieldMap model={model} theme={theme} clock={time.clock} onTheta={onTheta} className="mt-2.5 h-[clamp(280px,calc(100vh-430px),620px)]" />
          <ZPlot model={model} clock={time.clock} />
          <Caption model={model} theme={theme} speed={time.speed} />
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6">
            {explanation}
            {gamma}
          </div>
          <div className="mt-6">{showWork}</div>
        </>
      }
      right={<Results model={model} />}
      pinned={
        <>
          <div className="px-3 py-1.5"><Toolbar model={model} dispatch={dispatch} time={time} compact /></div>
          <FieldMap model={model} theme={theme} clock={time.clock} onTheta={onTheta} className="h-[min(38vh,320px)] border-x-0" />
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
            <div className="flex flex-col gap-5">
              <section>
                <Heading section="8-8">Field along z</Heading>
                <div className="mt-3 border-t border-rule"><ZPlot model={model} clock={time.clock} height={170} /></div>
                <Caption model={model} theme={theme} speed={time.speed} />
              </section>
              {gamma}
            </div>
          ),
        },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ */

function Toolbar({ model, dispatch, time, compact = false }: { model: Model; dispatch: Dispatch<Action>; time: ReturnType<typeof useClock>; compact?: boolean }) {
  const s = model.state
  const axis = shownAxis(s)
  const part = (
    <Segmented<Part>
      label="Wave shown" value={s.part} onChange={(v) => dispatch({ type: 'view', patch: { part: v } })}
      options={[
        { value: 'total', label: 'Total' },
        { value: 'inc', label: compact ? 'Inc.' : 'Incident', dot: 'var(--inc)', title: 'Incident wave' },
        { value: 'ref', label: compact ? 'Refl.' : 'Reflected', dot: 'var(--ref)', title: 'Reflected wave' },
        { value: 'trans', label: compact ? 'Trans.' : 'Transmitted', dot: 'var(--trn)', title: 'Transmitted wave' },
      ]}
    />
  )
  const field = (
    <Segmented<Quantity>
      label="Field shown" value={s.quantity} onChange={(v) => dispatch({ type: 'view', patch: { quantity: v } })}
      options={[{ value: 'E', label: <Tex>{'\\mathbf{E}'}</Tex>, title: 'Electric field' }, { value: 'H', label: <Tex>{'\\mathbf{H}'}</Tex>, title: 'Magnetic field' }]}
    />
  )
  const comp = axis !== 'y' && (
    <Segmented<'x' | 'z'>
      label="Component shown" value={s.comp} onChange={(v) => dispatch({ type: 'view', patch: { comp: v } })}
      options={[
        { value: 'x', label: <Tex>{`${s.quantity}_x`}</Tex>, title: 'Component tangential to the boundary' },
        { value: 'z', label: <Tex>{`${s.quantity}_z`}</Tex>, title: 'Component normal to the boundary' },
      ]}
    />
  )
  const pol = (
    <Segmented<Polarization>
      label="Polarization" value={s.pol} onChange={(v) => dispatch({ type: 'physics', change: 'pol', patch: { pol: v } })}
      options={[
        { value: 'perp', label: <><Tex>{'\\perp'}</Tex> {compact ? 'Perp.' : 'Perpendicular'}</>, title: 'Perpendicular polarization (TE): E along a_y' },
        { value: 'par', label: <><Tex>{'\\parallel'}</Tex> {compact ? 'Par.' : 'Parallel'}</>, title: 'Parallel polarization (TM): H along a_y' },
      ]}
    />
  )
  const rays = <Switch checked={s.rays} onChange={(v) => dispatch({ type: 'view', patch: { rays: v } })}>Rays</Switch>
  const playback = (
    <PlaybackControls time={time} readout={!compact && <AngleReadout clock={time.clock} label={'\\omega t ='} />} />
  )
  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">{part}{field}{comp}</div>
        <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3">{playback}<span className="w-1 shrink-0" />{pol}{rays}</div>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {part}{field}{comp}{pol}{rays}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">{playback}</div>
    </div>
  )
}

function Caption({ model, theme, speed }: { model: Model; theme: 'light' | 'dark'; speed: number }) {
  const { sol, state } = model
  const axis = shownAxis(state)
  const amp = state.quantity === 'E' ? sol.e0 : sol.e0 / sol.p1.eta.re
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11.5px] text-mute">
      <span>
        Lengths are to scale: <Tex>{'\\lambda_1'}</Tex> <span className="num text-ink">= {si(sol.p1.lambda, 'm', 3)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Tex>{`${state.quantity}_${axis}`}</Tex>
        <span className="num">−2</span>
        <span className="h-2 w-24 border border-rule" style={{ background: fieldGradientCss(PALETTES[theme]) }} />
        <span className="num">+2</span>
        <span>× <span className="num text-ink">{si(amp, state.quantity === 'E' ? 'V/m' : 'A/m', 3)}</span></span>
      </span>
      <span>
        Time is slowed <span className="num text-ink">{sig(state.f / speed, 2)}</span> times: one period (<span className="num">{si(1 / state.f, 's', 3)}</span>) takes <span className="num text-ink">{sig(1 / speed, 2)} s</span>
      </span>
    </div>
  )
}

