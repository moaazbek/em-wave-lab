import { BuildResult, FormulaResult, WindingSpec, buildWinding, formula, fullPitch } from './engine'
import type { ArmState } from './state'

export interface Model {
  state: ArmState
  spec: WindingSpec
  f: FormulaResult
  build: BuildResult
  fullPitch: number
}

export function derive(s: ArmState): Model {
  const fp = fullPitch(s.C, s.P)
  const ys = Math.max(1, fp - s.chord)
  const spec: WindingSpec = { type: s.type, m: s.m, progressive: s.progressive, P: s.P, C: s.C, NC: s.NC, ys }
  const f = formula(spec, { phi: s.phi, n: s.n, R: s.R, Rper: s.Rper, load: s.load, RL: s.RL, ignoreRA: s.ignoreRA })
  return { state: s, spec, f, build: buildWinding(spec), fullPitch: fp }
}

export const PLEX = ['', 'simplex', 'duplex', 'triplex'] as const
export const TYPE_NAME = { lap: 'lap', wave: 'wave', frog: 'frog-leg' } as const

/** "simplex lap", "duplex wave", "frog-leg (m_lap = 1)". */
export function windingName(s: { type: 'lap' | 'wave' | 'frog'; m: number }): string {
  if (s.type === 'frog') return `frog-leg (m_lap = ${s.m})`
  return `${PLEX[s.m] ?? `${s.m}-plex`} ${TYPE_NAME[s.type]}`
}
