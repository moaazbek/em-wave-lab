import { Dispatch, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Part, Polarization, Quantity } from '../../physics'
import { ThemeToggle } from '../../shell/App'
import { parseHash, replaceQuery } from '../../shell/router'
import { Heading, Segmented, Switch } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { PALETTES, fieldGradientCss } from '../../ui/palette'
import { Prose, Tex } from '../../ui/Tex'
import { useMediaQuery, useTheme } from '../../ui/theme'
import { Clock, SPEEDS, useClock } from './clock'
import { Controls } from './Controls'
import { Model, derive, shownAxis } from './derive'
import { EXPERIMENTS, Experiment } from './experiments'
import { FieldMap } from './FieldMap'
import { GammaPlot } from './GammaPlot'
import { Results } from './Results'
import { Action, ChangeKind, decodeState, encodeState, initSession, reduce } from './state'
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
  const [tab, setTab] = useState<'controls' | 'results' | 'explain' | 'plots'>('controls')

  // The full state lives in the URL, so a link reproduces the exact setup.
  const stateRef = useRef(session.state)
  stateRef.current = session.state
  useEffect(() => {
    const t = setTimeout(() => replaceQuery(SLUG, encodeState(session.state)), 150)
    return () => clearTimeout(t)
  }, [session.state])
  useEffect(() => {
    const onHash = () => {
      const r = parseHash(window.location.hash)
      if (r.path === SLUG && r.query && r.query !== encodeState(stateRef.current))
        dispatch({ type: 'load', state: decodeState(r.query), change: 'init' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onTheta = (d: number) => dispatch({ type: 'physics', change: 'theta', patch: { thetaDeg: d } })
  const loadExperiment = (e: Experiment) => {
    setExperiment(e.id)
    dispatch({ type: 'load', state: { ...e.setup, advanced: e.setup.advanced || session.state.advanced }, change: 'experiment' })
    time.clock.reset(START_PHASE)
  }
  const active = EXPERIMENTS.find((e) => e.id === experiment) ?? null

  const toolbar = <Toolbar model={model} dispatch={dispatch} time={time} />
  const explanation = (
    <ExplanationPanel model={model} before={before} change={session.change} active={active} dispatch={dispatch} onClose={() => setExperiment(null)} />
  )
  const experiments = <ExperimentList activeId={experiment} onLoad={loadExperiment} />
  const gamma = (
    <section>
      <Heading section="8-10">Reflection against angle</Heading>
      <div className="mt-3"><GammaPlot model={model} onTheta={onTheta} /></div>
      <p className="mt-1 text-[11.5px] leading-snug text-mute">
        Solid line: the current polarization. Drag on the plot to set <Tex>{'\\theta_i'}</Tex>.
      </p>
    </section>
  )
  const header = <Header advanced={session.state.advanced} dispatch={dispatch} compact={!desktop} />

  if (desktop) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-[292px_minmax(0,1fr)_324px]">
          <aside className="scroll-thin flex flex-col gap-6 overflow-y-auto border-r border-rule bg-panel px-4 py-4" aria-label="Controls">
            {experiments}
            <Controls model={model} dispatch={dispatch} />
          </aside>
          <main className="scroll-thin overflow-y-auto px-5 py-4">
            {toolbar}
            <FieldMap model={model} theme={theme} clock={time.clock} onTheta={onTheta} className="mt-2.5 h-[clamp(280px,calc(100vh-430px),620px)]" />
            <ZPlot model={model} clock={time.clock} />
            <Caption model={model} theme={theme} speed={time.speed} />
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6">
              {explanation}
              {gamma}
            </div>
            <div className="mt-6"><ShowWork model={model} /></div>
          </main>
          <aside className="scroll-thin overflow-y-auto border-l border-rule bg-panel px-4 py-4" aria-label="Results">
            <Results model={model} />
          </aside>
        </div>
      </div>
    )
  }

  const tabs = [['controls', 'Controls'], ['results', 'Results'], ['explain', 'Explain'], ['plots', 'Plots']] as const
  return (
    <div className="flex min-h-full flex-col">
      {header}
      <div className="sticky top-0 z-20 border-b border-rule bg-bg">
        <div className="px-3 py-1.5"><Toolbar model={model} dispatch={dispatch} time={time} compact /></div>
        <FieldMap model={model} theme={theme} clock={time.clock} onTheta={onTheta} className="h-[min(38vh,320px)] border-x-0" />
        <div role="tablist" aria-label="Panels" className="flex">
          {tabs.map(([id, label]) => (
            <button
              key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`h-11 flex-1 border-b-2 text-[13px] ${tab === id ? 'border-ink font-medium text-ink' : 'border-transparent text-mute'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="flex-1 bg-panel px-4 pb-10 pt-4">
        {tab === 'controls' && <Controls model={model} dispatch={dispatch} />}
        {tab === 'results' && <Results model={model} />}
        {tab === 'explain' && (
          <div className="flex flex-col gap-6">
            {explanation}
            {experiments}
            <ShowWork model={model} />
          </div>
        )}
        {tab === 'plots' && (
          <div className="flex flex-col gap-5">
            <section>
              <Heading section="8-8">Field along z</Heading>
              <div className="mt-3 border-t border-rule"><ZPlot model={model} clock={time.clock} height={170} /></div>
              <Caption model={model} theme={theme} speed={time.speed} />
            </section>
            {gamma}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Header({ advanced, dispatch, compact }: { advanced: boolean; dispatch: Dispatch<Action>; compact: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard not available: the address bar already holds the link */ }
  }
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-rule bg-panel px-3 sm:px-4">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <a href="#/" className="tag shrink-0 !text-mute hover:!text-ink" aria-label="Back to the list of labs">{compact ? '← Labs' : '← Field Lab'}</a>
        <h1 className="truncate text-[14px] font-semibold tracking-[-0.005em]">
          <span className="num mr-1.5 font-normal text-faint">01</span>Plane-wave incidence
        </h1>
        {!compact && <span className="tag hidden xl:inline">Cheng § 8-2 to 8-10</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <Switch checked={advanced} onChange={(v) => dispatch({ type: 'view', patch: { advanced: v } })}>Advanced</Switch>
        <button type="button" onClick={copy} className="hidden h-7 text-[12px] text-mute hover:text-ink sm:block" title="The link contains the full setup">
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {!compact && <ThemeToggle />}
      </div>
    </header>
  )
}

const Icon = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d={d} fill="currentColor" /></svg>
)

function Toolbar({ model, dispatch, time, compact = false }: { model: Model; dispatch: Dispatch<Action>; time: ReturnType<typeof useClock>; compact?: boolean }) {
  const s = model.state
  const axis = shownAxis(s)
  const btn = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-rule text-mute hover:text-ink'
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
    <>
      <button type="button" className={btn} onClick={() => time.setPlaying(!time.playing)} aria-label={time.playing ? 'Pause' : 'Play'} title={time.playing ? 'Pause' : 'Play'}>
        <Icon d={time.playing ? 'M3 2h3v10H3zM8 2h3v10H8z' : 'M3.5 1.5v11l9-5.5z'} />
      </button>
      <button type="button" className={btn} onClick={() => { time.setPlaying(false); time.clock.step() }} aria-label="Step forward by 1/24 of a period" title="Step (1/24 period)">
        <Icon d="M2 1.5v11l7-5.5zM10 2h2v10h-2z" />
      </button>
      <button type="button" className={btn} onClick={() => time.clock.reset()} aria-label="Reset time to t = 0" title="Reset to t = 0">
        <Icon d="M7 2a5 5 0 1 0 5 5h-1.6A3.4 3.4 0 1 1 7 3.6V6l3.5-3L7 0z" />
      </button>
      <select
        className="select num h-7 shrink-0 rounded-[3px] border border-rule pl-1.5 pr-6 text-[12px] text-ink"
        value={time.speed} onChange={(e) => time.setSpeed(Number(e.target.value))} aria-label="Animation speed in periods per second"
      >
        {SPEEDS.map((v) => <option key={v} value={v}>{v} T/s</option>)}
      </select>
      {!compact && <PhaseReadout clock={time.clock} />}
    </>
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

/** omega*t readout, written straight to the DOM so React does not render every frame. */
function PhaseReadout({ clock }: { clock: Clock }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const show = (phase: number) => {
      if (ref.current) ref.current.textContent = `${String(Math.round((phase * 180) / Math.PI) % 360).padStart(3, '\u2007')}°`
    }
    show(clock.phase)
    return clock.subscribe(show)
  }, [clock])
  return (
    <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap pl-1 text-[12px] text-mute">
      <Tex>{'\\omega t ='}</Tex><span ref={ref} className="num w-[3.2em] text-ink" />
    </span>
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

function ExperimentList({ activeId, onLoad }: { activeId: string | null; onLoad: (e: Experiment) => void }) {
  return (
    <section>
      <Heading>Guided experiments</Heading>
      <ol className="mt-1">
        {EXPERIMENTS.map((e, i) => (
          <li key={e.id}>
            <button
              type="button" onClick={() => onLoad(e)} aria-pressed={activeId === e.id}
              className={`flex w-full items-baseline gap-2 border-b border-rule py-[7px] text-left text-[12.5px] leading-snug hover:text-ink ${activeId === e.id ? 'font-medium text-ink' : 'text-mute'}`}
            >
              <span className="num w-4 shrink-0 text-[11px] text-faint">{i + 1}</span>
              <span className="min-w-0 flex-1">{e.title}</span>
              <span className="tag shrink-0">§ {e.section}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ExplanationPanel({ model, before, change, active, dispatch, onClose }: {
  model: Model; before: Model; change: ChangeKind; active: Experiment | null; dispatch: Dispatch<Action>; onClose: () => void
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => setShown(false), [active?.id])
  const react = reaction(before, model, change)
  const lines = situation(model)
  return (
    <section className="min-w-0">
      {active && (
        <div className="mb-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
            <h3 className="tag !text-ink">Experiment {EXPERIMENTS.indexOf(active) + 1} · {active.title}</h3>
            <button type="button" onClick={onClose} className="tag hover:!text-ink">Close</button>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mute"><Prose>{active.task}</Prose></p>
          <p className="mt-1.5 text-[15px] font-medium leading-snug"><Prose>{`Predict first: ${active.question}`}</Prose></p>
          {!shown ? (
            <button type="button" onClick={() => setShown(true)} className="mt-2.5 h-8 rounded-[3px] border border-ink px-3 text-[12.5px] hover:bg-ink hover:text-bg">
              Show the answer
            </button>
          ) : (
            <div className="mt-2.5 border-l-2 border-ink pl-3">
              <p className="text-[13.5px] leading-relaxed"><Prose>{active.answer}</Prose></p>
              {active.reveal && (
                <button
                  type="button"
                  onClick={() => {
                    const patch = active.reveal!.patch
                    const viewOnly = Object.keys(patch).every((k) => ['part', 'quantity', 'comp', 'rays', 'advanced'].includes(k))
                    dispatch(viewOnly ? { type: 'view', patch } : { type: 'physics', change: 'reveal', patch })
                  }}
                  className="mt-2 h-8 rounded-[3px] border border-rule px-3 text-[12.5px] text-mute hover:border-ink hover:text-ink"
                >
                  {active.reveal.label}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <Heading>What is happening</Heading>
      <div className="mt-2.5 flex flex-col gap-2 text-[14px] leading-relaxed" aria-live="polite">
        {react && <p className="border-l-2 border-inc pl-3"><Prose>{react}</Prose></p>}
        {lines.map((l, i) => <p key={i} className={react ? 'text-mute' : ''}><Prose>{l}</Prose></p>)}
      </div>
    </section>
  )
}

function ShowWork({ model }: { model: Model }) {
  const [open, setOpen] = useState(false)
  const steps = useMemo(() => (open ? workSteps(model) : []), [open, model])
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
        <span className="tag !text-ink">Show the work</span>
        <span className="tag">{open ? 'Hide' : 'Equation, numbers, result'}</span>
      </summary>
      <ol className="mt-1">
        {steps.map((st, i) => (
          <li key={st.title} className="border-b border-rule py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-[13px] font-medium"><span className="num mr-2 text-[11px] font-normal text-faint">{i + 1}</span>{st.title}</h4>
              <span className="tag shrink-0">{st.section.startsWith('beyond') ? st.section : `§ ${st.section}`}</span>
            </div>
            <div className="scroll-thin mt-1 overflow-x-auto pb-1 text-[13px]">
              {st.lines.map((l, k) => <Tex key={k} display>{l}</Tex>)}
            </div>
            {st.note && <p className="text-[11.5px] leading-snug text-mute">{st.note}</p>}
          </li>
        ))}
      </ol>
    </details>
  )
}
