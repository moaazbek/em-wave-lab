import { useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowIcon, Button } from '../../ui/buttons'
import { LabFrame } from '../../shell/LabFrame'
import { LabHeader } from '../../shell/LabHeader'
import { useUrlSync } from '../../shell/router'
import { useClock } from '../../ui/clock'
import { Heading, ParamSlider } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { PALETTES } from '../../ui/palette'
import { PlaybackControls } from '../../ui/Playback'
import { ExperimentList, ShowWork, WhatIsHappening } from '../../ui/teaching'
import { Tex } from '../../ui/Tex'
import { useMediaQuery, useTheme } from '../../ui/theme'
import { BrushPlot } from './BrushPlot'
import { Controls } from './Controls'
import { DevelopedDiagram, Highlight, PathChips, ShortedNote } from './DevelopedDiagram'
import { Model, derive, windingName } from './derive'
import { EndView } from './EndView'
import { MAX_DRAWN_COILS, Winding, cleanAngle } from './engine'
import { ExamMode } from './ExamMode'
import { EXPERIMENTS, Experiment } from './experiments'
import { PathSchematic } from './PathSchematic'
import { BeyondNote, Results } from './Results'
import { useSnapshot } from './rotor'
import { decodeState, encodeState, initSession, reduce } from './state'
import { reaction, situation } from './teaching'
import { workSteps } from './work'

const SLUG = 'eee321-armature-winding'
/** Displayed segments per second for each playback choice. */
const SEG_PER_SEC = 4

/** Clock phase for the engine's clean angle (every brush touches exactly m segments, no coil commutated). */
const cleanPhase = (w: Winding) => (2 * Math.PI - cleanAngle(w)) % (2 * Math.PI)

export default function ArmatureWindingLab({ query }: { query: string }) {
  const [session, dispatch] = useReducer(reduce, query, (q) => initSession(decodeState(q)))
  const model = useMemo(() => derive(session.state), [session.state])
  const before = useMemo(() => derive(session.before), [session.before])
  const desktop = useMediaQuery('(min-width: 1100px)')
  const [experiment, setExperiment] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<Highlight>({ path: null, brush: null })
  const [cycling, setCycling] = useState(false)
  const s = session.state
  const w = model.build.ok ? model.build.winding : null
  const time = useClock({ initialPhase: 0, rate: (sel) => (SEG_PER_SEC * sel) / s.C })
  const { alpha, snap } = useSnapshot(time.clock, w, s.beta, model.f.econd)

  useUrlSync(SLUG, s, encodeState, (q) => dispatch({ type: 'load', state: decodeState(q), change: 'init' }))

  // start at an angle with no commutation, so the first view shows clean paths
  useEffect(() => { if (w) time.clock.reset(cleanPhase(w)) }, [])

  // experiment 1: highlight the paths one by one (twice through), driven by the engine's traced paths
  useEffect(() => {
    if (!cycling || !snap) return
    time.setPlaying(false)
    // show the paths at an angle with no commutation, so every path has its full C/a coils
    if (w) time.clock.reset(cleanPhase(w))
    const n = snap.paths.length
    let i = 0
    setHighlight({ path: 0, brush: null })
    const id = window.setInterval(() => {
      i++
      if (i >= 2 * n) { setCycling(false); setHighlight({ path: null, brush: null }); return }
      setHighlight({ path: i % n, brush: null })
    }, 1100)
    return () => window.clearInterval(id)
  }, [cycling])

  const loadExperiment = (id: string) => {
    const e = EXPERIMENTS.find((x) => x.id === id)!
    setExperiment(e.id)
    setCycling(false)
    setHighlight({ path: null, brush: null })
    dispatch({ type: 'load', state: e.setup, change: 'experiment' })
    const d = derive(e.setup)
    if (d.build.ok) time.clock.reset(cleanPhase(d.build.winding))
  }
  const reveal = (e: Experiment) => {
    if (e.reveal?.cyclePaths) setCycling(true)
    else if (e.reveal?.patch) dispatch({ type: 'set', change: 'reveal', patch: e.reveal.patch })
  }

  const rotorControl = w ? (
    <ParamSlider symbol={<Tex>{'\\theta_m'}</Tex>} name="rotor angle (pauses)" unit="°" min={0} max={359.9} step={0.1} digits={4}
      value={Number(((alpha * 180) / Math.PI).toFixed(1))}
      onChange={(v) => { time.setPlaying(false); time.clock.reset((2 * Math.PI - (v * Math.PI) / 180) % (2 * Math.PI)) }} />
  ) : null
  const explanation = (
    <section className="min-w-0">
      <WhatIsHappening reaction={[...session.notes, reaction(before, model, session.change)].filter(Boolean).join(' ') || null} lines={situation(model)} />
    </section>
  )
  const experiments = <ExperimentList experiments={EXPERIMENTS} activeId={experiment} onLoad={loadExperiment} onReveal={reveal} />
  const showWork = <ShowWork compute={() => workSteps(model)} dep={model} />
  const goTo = (C: number) => {
    dispatch({ type: 'set', change: 'C', patch: { C, chord: 0 } })
    const d = derive({ ...s, C, chord: 0 })
    if (d.build.ok) time.clock.reset(cleanPhase(d.build.winding))
  }
  const notDrawn = !model.build.ok && (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2.5 border border-dashed border-rule bg-panel px-4 py-6 text-center text-[13px] leading-relaxed text-mute">
      <p>{model.build.reason}</p>
      {model.nearest !== null && (
        <Button variant="secondary" onClick={() => goTo(model.nearest!)} icon={<ArrowIcon />}>
          <span>{s.C > MAX_DRAWN_COILS ? 'Show a small drawable version' : 'Go to nearest drawable'} (<span className="num">C = {model.nearest}</span>)</span>
        </Button>
      )}
    </div>
  )
  const diagram = (
    <section className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule pb-1.5">
        <h3 className="tag !text-ink">Developed winding · {windingName(s)}, {s.progressive ? 'progressive' : 'retrogressive'}</h3>
        <span className="tag">§ 7.3</span>
      </div>
      {w && snap ? (
        <>
          <div className="mt-2 flex flex-col gap-1.5"><PathChips snap={snap} highlight={highlight} onHighlight={setHighlight} /><ShortedNote snap={snap} /></div>
          <DevelopedDiagram w={w} snap={snap} clock={time.clock} highlight={highlight} onHighlight={setHighlight} className="mt-2" />
        </>
      ) : <div className="mt-2">{notDrawn}</div>}
    </section>
  )
  const schematic = w && snap ? (
    <section className="min-w-0">
      <Heading section="7.3">Parallel paths</Heading>
      <div className="mt-2.5"><PathSchematic snap={snap} highlight={highlight} onHighlight={setHighlight} compact={!desktop} /></div>
    </section>
  ) : null
  const brushPlot = w ? (
    <section className="min-w-0">
      <Heading section="p. 448">Brush voltage against rotor angle</Heading>
      <div className="mt-2.5"><BrushPlot w={w} beta={s.beta} econd={model.f.econd} EA={model.f.EA} EAdz={model.f.EAdz} avg={model.avgBrush ?? 0} clock={time.clock} /></div>
    </section>
  ) : null
  const header = <LabHeader number="03" title={<>Armature windings and <Tex>{'E_A'}</Tex></>} tag="Chapman § 7.3, 7.5" compact={!desktop} />
  const endView = (cls: string) => (w && snap ? <EndView w={w} snap={snap} geo={model.geo} clock={time.clock} className={cls} /> : <div className={cls}>{notDrawn}</div>)

  return (
    <LabFrame
      desktop={desktop}
      header={header}
      course="EEE 321"
      left={<><Controls model={model} dispatch={dispatch} rotor={rotorControl} />{experiments}</>}
      centre={
        <>
          <Toolbar time={time} C={s.C} model={model} />
          <div className="mt-2.5">{diagram}</div>
          <Caption model={model} speedSel={time.speed} />
          {w && (
            <div className="mt-6 grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-6">
              <section className="min-w-0">
                <Heading section="7.3">End view</Heading>
                {endView('mt-2.5 h-[300px]')}
              </section>
              {schematic}
            </div>
          )}
          {brushPlot && <div className="mt-6">{brushPlot}</div>}
          <div className="mt-6">{explanation}</div>
          <div className="mt-6"><ExamMode /></div>
          <div className="mt-6">{showWork}</div>
        </>
      }
      right={<Results model={model} />}
      pinned={
        <>
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 py-1.5">
            <PlaybackControls time={time} unit="seg/s" unitTitle="Animation speed in segments per second" format={(v) => `${v * SEG_PER_SEC} seg/s`}
              stepLabel="Step the rotor forward" stepTitle="Step" />
          </div>
          {endView('h-[min(40vh,300px)] border-x-0')}
        </>
      }
      tabs={[
        { id: 'controls', label: 'Controls', content: <Controls model={model} dispatch={dispatch} rotor={rotorControl} /> },
        { id: 'results', label: 'Results', content: <Results model={model} /> },
        {
          id: 'diagram', label: 'Diagram',
          content: (
            <div className="flex flex-col gap-6">
              {diagram}
              <Caption model={model} speedSel={time.speed} />
              {schematic}
              {brushPlot}
            </div>
          ),
        },
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
        { id: 'exam', label: 'Exam', content: <ExamMode /> },
      ]}
    />
  )
}

function Toolbar({ time, C, model }: { time: ReturnType<typeof useClock>; C: number; model: Model }) {
  const { theme } = useTheme()
  const plus = PALETTES[theme].field[4], minus = PALETTES[theme].field[0]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-mute">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke={plus} strokeWidth="1.4" /><circle cx="7" cy="7" r="2" fill={plus} /></svg>
          <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke={minus} strokeWidth="1.4" /><path d="M4 4L10 10M10 4L4 10" stroke={minus} strokeWidth="1.3" /></svg>
          conductor voltage + / −
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--faint)" strokeWidth="1.4" /></svg>
          between the poles (0)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="10" aria-hidden><line x1="5" y1="0" x2="5" y2="10" stroke="var(--ink)" strokeWidth="1.2" /><line x1="16" y1="0" x2="16" y2="10" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="3 2" /></svg>
          top / bottom layer
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10" aria-hidden><path d="M5 1l4 4l-4 4l-4-4z" fill="var(--warn)" /></svg>
          commutating
        </span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <PlaybackControls time={time} unit="seg/s" unitTitle="Animation speed in segments per second" format={(v) => `${v * SEG_PER_SEC} seg/s`}
          stepLabel="Step the rotor forward" stepTitle="Step" />
        {model.build.ok && <span className="num pl-1 text-[11px] text-faint">C = {C}</span>}
      </div>
    </div>
  )
}

function Caption({ model, speedSel }: { model: Model; speedSel: number }) {
  const { state: s } = model
  const realRevPerSec = s.n / 60
  const shownRevPerSec = (SEG_PER_SEC * speedSel) / s.C
  return (
    <p className="mt-2 text-[11.5px] leading-snug text-mute">
      Poles and brushes are fixed; the slots, coils and segments slide with the rotor. Slots and segments are numbered from 1.{' '}
      Shown at <span className="num text-ink">1/{sig(realRevPerSec / shownRevPerSec, 3)}</span> of real speed
      (real: <span className="num">{sig(s.n, 4)} r/min = {sig(realRevPerSec, 3)} rev/s</span>; one segment pitch takes <span className="num text-ink">{si(1 / (SEG_PER_SEC * speedSel), 's', 2)}</span> on screen).
      {' '}Hover or tap a path chip or a brush to highlight its path in magenta.
      {model.f.ycBeyondCourse && model.build.ok && <BeyondNote />}
    </p>
  )
}

