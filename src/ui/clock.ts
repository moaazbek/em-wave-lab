import { useEffect, useMemo, useState } from 'react'

/**
 * Animation clock shared by the labs. It owns a phase (omega*t for a wave, the rotor angle for a
 * machine) and runs in requestAnimationFrame, outside React state; views subscribe and redraw themselves.
 */
export class Clock {
  /** Phase (rad), kept in [0, wrap). */
  phase: number
  playing = false
  /** Displayed periods (or revolutions) per second. */
  speed = 0.5
  /** The phase wraps at this value: 2 pi for one period, 4 pi to follow two revolutions. */
  readonly wrap: number
  private listeners = new Set<(phase: number) => void>()
  private raf = 0
  private last = 0

  /** Defaults: starts at 45 degrees, so a standing wave is not caught at a zero instant. */
  constructor(initialPhase = Math.PI / 4, wrap = 2 * Math.PI) {
    this.phase = initialPhase
    this.wrap = wrap
  }

  subscribe(fn: (phase: number) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((l) => l(this.phase))
  }
  private tick = (t: number) => {
    const dt = Math.min(0.05, (t - this.last) / 1000)
    this.last = t
    this.phase = (this.phase + 2 * Math.PI * this.speed * dt) % this.wrap
    this.emit()
    this.raf = requestAnimationFrame(this.tick)
  }
  play() {
    if (this.playing) return
    this.playing = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }
  pause() {
    this.playing = false
    cancelAnimationFrame(this.raf)
  }
  /** Advance by a fraction of a period (default 1/24 = 15 degrees). */
  step(fraction = 1 / 24) {
    this.phase = (this.phase + 2 * Math.PI * fraction + this.wrap) % this.wrap
    this.emit()
  }
  reset(phase = 0) {
    this.phase = phase
    this.emit()
  }
}

export const SPEEDS = [0.125, 0.25, 0.5, 1] as const

export interface ClockOptions {
  initialPhase?: number
  wrap?: number
  /**
   * Displayed periods per second actually used by the clock. When given, the speed selection is
   * only an input to it (the rotating loop maps the selection and its own speed onto this rate).
   */
  rate?: number
}

export function useClock(options: ClockOptions = {}) {
  const clock = useMemo(() => new Clock(options.initialPhase, options.wrap), [])
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [playing, setPlaying] = useState(!reduced)
  const [speed, setSpeed] = useState(0.5)
  const rate = options.rate
  useEffect(() => {
    clock.speed = rate ?? speed
  }, [clock, speed, rate])
  useEffect(() => {
    if (playing) clock.play()
    else clock.pause()
    return () => clock.pause()
  }, [clock, playing])
  return { clock, playing, setPlaying, speed, setSpeed, reduced }
}
