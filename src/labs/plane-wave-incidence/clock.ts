import { useEffect, useMemo, useState } from 'react'

/**
 * Animation clock. It owns the phase omega*t and runs in requestAnimationFrame,
 * outside React state; views subscribe and redraw themselves.
 */
export class Clock {
  /** omega * t (rad). Starts at 45 degrees so a standing wave is not caught at a zero instant. */
  phase = Math.PI / 4
  playing = false
  /** Displayed periods per second (the real wave is slowed down by f / speed). */
  speed = 0.5
  private listeners = new Set<(phase: number) => void>()
  private raf = 0
  private last = 0

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
    this.phase = (this.phase + 2 * Math.PI * this.speed * dt) % (2 * Math.PI)
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
    this.phase = (this.phase + 2 * Math.PI * fraction + 2 * Math.PI) % (2 * Math.PI)
    this.emit()
  }
  reset(phase = 0) {
    this.phase = phase
    this.emit()
  }
}

export const SPEEDS = [0.125, 0.25, 0.5, 1] as const

export function useClock() {
  const clock = useMemo(() => new Clock(), [])
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [playing, setPlaying] = useState(!reduced)
  const [speed, setSpeed] = useState(0.5)
  useEffect(() => {
    clock.speed = speed
  }, [clock, speed])
  useEffect(() => {
    if (playing) clock.play()
    else clock.pause()
    return () => clock.pause()
  }, [clock, playing])
  return { clock, playing, setPlaying, speed, setSpeed, reduced }
}
