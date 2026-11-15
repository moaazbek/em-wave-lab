import { niceBelow } from '../../ui/format'
import {
  C, DEG, Part, Quantity, abs, zProfile, InterfaceSolution, MediumClass, MediumParams, Polarization, StandingWave, brewsterAngle, classify,
  criticalAngle, getPreset, isCustomized, mediumParams, solveInterface, standingWave, surfaceCurrent,
} from '../../physics'
import type { LabState } from './state'

/** Everything the screen shows, computed once per state from the physics engine. */
export interface Model {
  state: LabState
  sol: InterfaceSolution
  p1: MediumParams
  p2: MediumParams
  cls1: MediumClass
  cls2: MediumClass
  name1: string
  name2: string
  thetaC: number | null
  /** Brewster angle for each polarization (null when none). */
  thetaB: Record<Polarization, number | null>
  sw: StandingWave
  /** Surface current phasor on a perfect conductor (A/m). */
  js: { x: C; y: C }
  normal: boolean
}

export const CLASS_LABEL: Record<MediumClass, string> = {
  lossless: 'lossless',
  'low-loss': 'low-loss dielectric',
  lossy: 'general lossy medium',
  'good-conductor': 'good conductor',
  pec: 'perfect conductor',
}

const mediumName = (preset: string, customized: boolean): string => {
  const p = getPreset(preset)
  const base = p.id.startsWith('diel') ? `Dielectric (${p.note})` : p.id === 'water' ? 'Distilled water' : p.label
  return customized ? `${base}, customized` : base
}

export function derive(state: LabState): Model {
  const sol = solveInterface(state.m1, state.m2, state.f, state.thetaDeg * DEG, state.pol, state.e0)
  return {
    state, sol,
    p1: sol.p1,
    p2: mediumParams(state.m2, state.f),
    cls1: classify(state.m1, state.f),
    cls2: classify(state.m2, state.f),
    name1: mediumName(state.m1.preset, isCustomized(state.m1)),
    name2: mediumName(state.m2.preset, isCustomized(state.m2)),
    thetaC: criticalAngle(state.m1, state.m2),
    thetaB: { perp: brewsterAngle(state.m1, state.m2, 'perp'), par: brewsterAngle(state.m1, state.m2, 'par') },
    sw: standingWave(sol, 12),
    js: surfaceCurrent(sol),
    normal: state.thetaDeg === 0,
  }
}

/**
 * Extra display gain for Medium 2. In a good conductor the transmitted E is a tiny fraction of E_i0
 * and would be invisible on the shared colour scale; the map and the z-plot then multiply Medium 2
 * by this 1-2-5 factor and say so on screen. Returns 1 when no gain is needed.
 */
export function medium2Gain(sol: Model['sol'], part: Part, q: Quantity, axis: 'x' | 'y' | 'z'): number {
  if (sol.regime === 'pec' || part === 'inc' || part === 'ref') return 1
  const norm = q === 'E' ? sol.e0 : sol.e0 / sol.p1.eta.re
  // The transmitted field never grows with z, so its largest magnitude is at z = 0+.
  const peak = abs(zProfile(sol, part, q, axis, 0, 2)) / norm
  if (peak === 0 || peak >= 0.1) return 1
  return niceBelow(1.5 / peak)
}

/** Axis of the field component the map and the 1-D plot show. */
export function shownAxis(state: LabState): 'x' | 'y' | 'z' {
  const transverse = state.pol === 'perp' ? 'E' : 'H'
  return state.quantity === transverse ? 'y' : state.comp
}
