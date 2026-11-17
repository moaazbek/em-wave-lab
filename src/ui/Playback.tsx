import { ReactNode, useEffect, useRef } from 'react'
import { Clock, SPEEDS, useClock } from './clock'
import { Tex } from './Tex'

/** 14 × 14 filled SVG icon. No icon fonts, no emoji. */
export const Icon = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d={d} fill="currentColor" /></svg>
)

const BTN = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-rule text-mute hover:text-ink'

/**
 * Play / pause, step, reset and the speed select. Returned as a fragment so the caller places it
 * in its own toolbar row. `unit` labels the speed choices (T/s periods, rev/s revolutions).
 */
export function PlaybackControls({ time, unit = 'T/s', unitTitle = 'Animation speed in periods per second', stepLabel = 'Step forward by 1/24 of a period', stepTitle = 'Step (1/24 period)', readout, format }: {
  /** Label of a speed choice (default: "<value> <unit>"). */
  format?: (v: number) => string
  time: ReturnType<typeof useClock>
  unit?: string
  unitTitle?: string
  stepLabel?: string
  stepTitle?: string
  readout?: ReactNode
}) {
  return (
    <>
      <button type="button" className={BTN} onClick={() => time.setPlaying(!time.playing)} aria-label={time.playing ? 'Pause' : 'Play'} title={time.playing ? 'Pause' : 'Play'}>
        <Icon d={time.playing ? 'M3 2h3v10H3zM8 2h3v10H8z' : 'M3.5 1.5v11l9-5.5z'} />
      </button>
      <button type="button" className={BTN} onClick={() => { time.setPlaying(false); time.clock.step() }} aria-label={stepLabel} title={stepTitle}>
        <Icon d="M2 1.5v11l7-5.5zM10 2h2v10h-2z" />
      </button>
      <button type="button" className={BTN} onClick={() => time.clock.reset()} aria-label="Reset time to t = 0" title="Reset to t = 0">
        <Icon d="M7 2a5 5 0 1 0 5 5h-1.6A3.4 3.4 0 1 1 7 3.6V6l3.5-3L7 0z" />
      </button>
      <select
        className="select num h-7 shrink-0 rounded-[3px] border border-rule pl-1.5 pr-6 text-[12px] text-ink"
        value={time.speed} onChange={(e) => time.setSpeed(Number(e.target.value))} aria-label={unitTitle}
      >
        {SPEEDS.map((v) => <option key={v} value={v}>{format ? format(v) : `${v} ${unit}`}</option>)}
      </select>
      {readout}
    </>
  )
}

/** Angle readout ("ωt = 45°", "θ = 120°"), written straight to the DOM so React does not render every frame. */
export function AngleReadout({ clock, label, modulo = 360 }: { clock: Clock; label: string; modulo?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const show = (phase: number) => {
      if (ref.current) ref.current.textContent = `${String(Math.round((phase * 180) / Math.PI) % modulo).padStart(3, ' ')}°`
    }
    show(clock.phase)
    return clock.subscribe(show)
  }, [clock, modulo])
  return (
    <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap pl-1 text-[12px] text-mute">
      <Tex>{label}</Tex><span ref={ref} className="num w-[3.2em] text-ink" />
    </span>
  )
}
