import { useEffect, useState } from 'react'
import type { Clock } from '../../ui/clock'
import { Snapshot, Winding, analyze } from './engine'

/**
 * Rotor angle α (mechanical, rad) from the clock. The clock phase grows with time and α = 2π − phase, so the
 * rotor turns clockwise in the end view and the coils slide to the left in the developed diagram.
 */
export const rotorAngle = (phase: number) => ((2 * Math.PI - phase) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)

/** Discrete state that changes what is drawn: tapped segments and conductor signs. */
const keyOf = (s: Snapshot) => `${s.tapped.map((t) => t.join('.')).join('|')}/${s.topSign.join('')}/${s.bottomSign.join('')}`

/**
 * The engine's snapshot at the clock's rotor angle. The engine runs every frame (cheap for C ≤ 48), but React
 * re-renders only when the discrete state changes; positions in between move by transforms.
 */
export function useSnapshot(clock: Clock, w: Winding | null, beta: number, econd: number): { alpha: number; snap: Snapshot | null } {
  const [state, setState] = useState<{ alpha: number; snap: Snapshot | null; key: string }>(() => {
    const alpha = rotorAngle(clock.phase)
    const snap = w ? analyze(w, alpha, beta, econd) : null
    return { alpha, snap, key: snap ? keyOf(snap) : '' }
  })
  useEffect(() => {
    let lastKey = ''
    const update = (phase: number, force = false) => {
      const alpha = rotorAngle(phase)
      if (!w) { setState({ alpha, snap: null, key: '' }); return }
      const snap = analyze(w, alpha, beta, econd)
      const key = keyOf(snap)
      if (force || key !== lastKey) { lastKey = key; setState({ alpha, snap, key }) }
    }
    update(clock.phase, true)
    return clock.subscribe((p) => update(p))
  }, [clock, w, beta, econd])
  return { alpha: state.alpha, snap: state.snap }
}
