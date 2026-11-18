import { MAX_DRAWN_COILS, drawRule, drawableCoilCounts, fullPitch, nearestDrawable } from './engine'
import { PLEX } from './derive'
import { ArmState, POLES } from './state'

/**
 * Smart adjust, used when the student presses a choice button (winding type, m, direction, P).
 * Keeps the choice just pressed and changes as few other settings as needed to reach a drawable winding:
 *   1. P, only when no C ≤ 48 can be drawn with it (wave with P = 2; triplex lap with P = 10 or 12),
 *   2. C, to the nearest drawable value (tie: the smaller one) — kept when C > 48 (large machine),
 *   3. y_s back to full pitch.
 * Every automatic change is returned as a sentence (maths between dollar signs).
 * Frog-leg is never drawn: its numbers are kept as they are.
 */
export function smartAdjust(s: ArmState, patch: Partial<ArmState>): { patch: Partial<ArmState>; notes: string[] } {
  const next: ArmState = { ...s, ...patch }
  const out: Partial<ArmState> = { ...patch }
  const notes: string[] = []
  if (next.type === 'frog') return { patch: out, notes }
  const list = (P: number) => drawableCoilCounts(next.type, next.m, P, next.progressive)

  // 1. poles
  let P = next.P
  if (list(P).length === 0) {
    const ok = POLES.filter((p) => list(p).length > 0)
    const P1 = nearestDrawable(ok, P)
    if (P1 !== null) {
      if (next.type === 'wave' && P < 4) notes.push(`Wave windings need at least 4 poles, so $P$ changed from ${P} to ${P1}.`)
      else notes.push(`A ${PLEX[next.m]} ${next.type} winding with ${P} poles needs at least $2mP$ = ${2 * next.m * P} coils, more than the lab draws, so $P$ changed from ${P} to ${P1}.`)
      P = P1
      out.P = P1
    }
  }

  // 2. coils (a large machine keeps its C; the numbers are still exact)
  let C = next.C
  if (C <= MAX_DRAWN_COILS) {
    const fail = drawRule(next.type, next.m, P, next.progressive, C)
    const C1 = nearestDrawable(list(P), C)
    if (fail && C1 !== null) {
      notes.push(`$C$ changed from ${C} to ${C1}, so that ${fail.need}.`)
      C = C1
      out.C = C1
    }
  }

  // 3. coil span back to full pitch for the new C and P
  if (P !== s.P || C !== s.C || 'type' in patch || 'P' in patch) {
    if (next.chord !== 0) notes.push(`$y_s$ changed back to full pitch, ${fullPitch(C, P)} slots.`)
    out.chord = 0
  }
  return { patch: out, notes }
}

/** Previous and next drawable C for the stepper (null at the ends; frog-leg: plain ±1). */
export function stepTargets(s: ArmState): { prev: number | null; next: number | null } {
  if (s.type === 'frog') return { prev: s.C > 2 ? s.C - 1 : null, next: s.C + 1 }
  const list = drawableCoilCounts(s.type, s.m, s.P, s.progressive)
  const below = list.filter((c) => c < s.C), above = list.filter((c) => c > s.C)
  return { prev: below.length ? below[below.length - 1] : null, next: above.length ? above[0] : null }
}

/** At most `max` drawable values nearest the current C, in ascending order. */
export function nearbyDrawable(s: ArmState, max = 8): number[] {
  if (s.type === 'frog') return []
  const list = drawableCoilCounts(s.type, s.m, s.P, s.progressive)
  return [...list].sort((x, y) => Math.abs(x - s.C) - Math.abs(y - s.C) || x - y).slice(0, max).sort((x, y) => x - y)
}
