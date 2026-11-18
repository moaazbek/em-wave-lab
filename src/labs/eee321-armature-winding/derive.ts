import {
  BuildResult, FormulaResult, PoleGeometry, WindingSpec, averageBrushVoltage, buildWinding, drawRule, drawableCoilCounts, fluxFromField,
  formula, fullPitch, nearestDrawable, poleGeometry,
} from './engine'
import type { ArmState } from './state'

export interface Model {
  state: ArmState
  spec: WindingSpec
  /** Flux per pole used (Wb): typed, or 2πrlB/P (Eq. 7-36) in the B, r, l mode. */
  phi: number
  f: FormulaResult
  build: BuildResult
  fullPitch: number
  geo: PoleGeometry
  /** Coil-level average brush voltage over one segment pitch (null when the winding is not drawn). */
  avgBrush: number | null
  /** Drawable C ≤ 48 for this type, plex, poles and direction, and the one nearest to C (null if none / frog-leg). */
  drawable: number[]
  nearest: number | null
  /** The book's reason when a simplex wave y_c is not an integer (shown even for C > 48, as in Example 7-4). */
  pitchReason: string | null
}

/**
 * The coil-level average is proportional to e_cond, so it is computed once per winding and β (with e_cond = 1)
 * and scaled; sliding φ or n then costs nothing.
 */
const avgCache = new Map<string, number>()
function averageFor(build: BuildResult, beta: number, econd: number): number | null {
  if (!build.ok) return null
  const w = build.winding, sp = w.spec
  const key = `${sp.type}|${sp.m}|${sp.progressive}|${sp.P}|${sp.C}|${sp.NC}|${w.ys}|${beta}`
  let v = avgCache.get(key)
  if (v === undefined) {
    v = averageBrushVoltage(w, beta, 1)
    if (avgCache.size > 200) avgCache.clear()
    avgCache.set(key, v)
  }
  return v * econd
}

export function derive(s: ArmState): Model {
  const fp = fullPitch(s.C, s.P)
  const ys = Math.max(1, fp - s.chord)
  const spec: WindingSpec = { type: s.type, m: s.m, progressive: s.progressive, P: s.P, C: s.C, NC: s.NC, ys }
  const phi = s.fluxMode === 'field' ? fluxFromField(s.B, s.r, s.l, s.P) : s.phi
  const f = formula(spec, { phi, n: s.n, R: s.R, Rper: s.Rper, load: s.load, RL: s.RL, ignoreRA: s.ignoreRA, beta: s.beta })
  const build = buildWinding(spec)
  const drawable = s.type === 'frog' ? [] : drawableCoilCounts(s.type, s.m, s.P, s.progressive)
  const rule = drawRule(s.type, s.m, s.P, s.progressive, s.C, Infinity)
  return {
    state: s, spec, phi, f, build, fullPitch: fp,
    geo: poleGeometry(s.P, s.beta),
    avgBrush: averageFor(build, s.beta, f.econd),
    drawable,
    nearest: nearestDrawable(drawable, s.C),
    pitchReason: rule && /^Not realizable/.test(rule.reason) ? rule.reason : null,
  }
}

export const PLEX = ['', 'simplex', 'duplex', 'triplex'] as const
export const TYPE_NAME = { lap: 'lap', wave: 'wave', frog: 'frog-leg' } as const

/** "simplex lap", "duplex wave", "frog-leg (m_lap = 1)". */
export function windingName(s: { type: 'lap' | 'wave' | 'frog'; m: number }): string {
  if (s.type === 'frog') return `frog-leg (m_lap = ${s.m})`
  return `${PLEX[s.m] ?? `${s.m}-plex`} ${TYPE_NAME[s.type]}`
}
