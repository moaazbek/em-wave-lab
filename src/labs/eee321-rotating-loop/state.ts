import type { GivenQuantity } from './engine'

export interface LoopState {
  /** Preset the setup started from; "customized" is shown when any value differs. */
  preset: PresetId
  given: GivenQuantity
  VB: number
  R: number
  B: number
  r: number
  l: number
  /** Requested load torque (Mode A, N·m). May lie beyond the allowed range; the lab clamps it and warns. */
  tau: number
  /** Requested shaft speed (Mode B, rad/s). May be negative when typed; the lab clamps it and warns. */
  omega: number
  /** Pole-arc fraction, for the waveform and the drawing only. */
  poleArc: number
}

export type PresetId = 'ex71b' | 'ex71c' | 'ex71d' | 'ex71e' | 'p71-500' | 'p71-450'

const EX71 = { VB: 120, R: 0.3, B: 0.25, r: 0.5, l: 1.0 }
const P71 = { VB: 48, R: 0.4, B: 0.4, r: 0.25, l: 0.5 }

export const PRESETS: readonly { id: PresetId; label: string; values: Omit<LoopState, 'preset' | 'poleArc'> }[] = [
  { id: 'ex71b', label: 'Example 7-1 (b) no load', values: { given: 'torque', ...EX71, tau: 0, omega: 480 } },
  { id: 'ex71c', label: 'Example 7-1 (c) 10 N·m load', values: { given: 'torque', ...EX71, tau: 10, omega: 432 } },
  { id: 'ex71d', label: 'Example 7-1 (d) 7.5 N·m applied', values: { given: 'torque', ...EX71, tau: -7.5, omega: 516 } },
  { id: 'ex71e', label: 'Example 7-1 (e) B = 0.20 T', values: { given: 'torque', ...EX71, B: 0.2, tau: 0, omega: 600 } },
  { id: 'p71-500', label: 'Problem 7-1, 500 rad/s', values: { given: 'speed', ...P71, tau: -0.5, omega: 500 } },
  { id: 'p71-450', label: 'Problem 7-1, 450 rad/s', values: { given: 'speed', ...P71, tau: 0.75, omega: 450 } },
]

export const DEFAULT_POLE_ARC = 0.9

export function fromPreset(id: PresetId, poleArc = DEFAULT_POLE_ARC): LoopState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[1]
  return { preset: p.id, poleArc, ...p.values }
}

/** True when a value that matters for the preset's case differs from it (the pole-arc drawing does not count). */
export function isCustomized(s: LoopState): boolean {
  const p = PRESETS.find((x) => x.id === s.preset)!.values
  const base = p.given !== s.given || p.VB !== s.VB || p.R !== s.R || p.B !== s.B || p.r !== s.r || p.l !== s.l
  return base || (s.given === 'torque' ? p.tau !== s.tau : p.omega !== s.omega)
}

export const LIMITS = {
  VB: [1, 500], R: [0.01, 10], B: [0.05, 1.5], r: [0.05, 1], l: [0.1, 2], poleArc: [0.5, 1],
} as const

/** Default setup: Example 7-1 (c), a loaded motor. */
export const DEFAULT_STATE: LoopState = fromPreset('ex71c')

/* ---------- Session: current state, the state before the last change, and what changed ---------- */

export type ChangeKind =
  | 'init' | 'VB' | 'R' | 'B' | 'r' | 'l' | 'tau' | 'omega' | 'given' | 'poleArc' | 'preset' | 'experiment' | 'reveal'

export interface Session {
  state: LoopState
  before: LoopState
  change: ChangeKind
  at: number
}

export type Action =
  | { type: 'set'; change: ChangeKind; patch: Partial<LoopState> }
  | { type: 'load'; state: LoopState; change: ChangeKind }

/** A slider drag is one change: repeated edits of the same control within this time keep the first "before". */
const COALESCE_MS = 1500

export function reduce(s: Session, a: Action): Session {
  const now = Date.now()
  if (a.type === 'load') return { state: a.state, before: s.state, change: a.change, at: now }
  const same = a.change === s.change && now - s.at < COALESCE_MS
  return { state: { ...s.state, ...a.patch }, before: same ? s.before : s.state, change: a.change, at: now }
}

export const initSession = (state: LoopState): Session => ({ state, before: state, change: 'init', at: 0 })

/* ---------- URL codec ---------- */

const num6 = (v: number) => String(Number(v.toPrecision(6)))

export function encodeState(s: LoopState): string {
  const q = new URLSearchParams()
  q.set('p', s.preset)
  q.set('g', s.given === 'torque' ? 't' : 'w')
  q.set('VB', num6(s.VB)); q.set('R', num6(s.R)); q.set('B', num6(s.B)); q.set('r', num6(s.r)); q.set('l', num6(s.l))
  q.set('tau', num6(s.tau)); q.set('w', num6(s.omega)); q.set('pa', num6(s.poleArc))
  return q.toString()
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function decodeState(query: string): LoopState {
  const q = new URLSearchParams(query)
  const pid = q.get('p') as PresetId | null
  const base = fromPreset(pid && PRESETS.some((p) => p.id === pid) ? pid : DEFAULT_STATE.preset)
  const num = (key: string, fallback: number, lo = -Infinity, hi = Infinity) => {
    const raw = q.get(key)
    const v = raw === null ? NaN : Number(raw)
    return Number.isFinite(v) ? clamp(v, lo, hi) : fallback
  }
  const g = q.get('g')
  return {
    preset: base.preset,
    given: g === 'w' ? 'speed' : g === 't' ? 'torque' : base.given,
    VB: num('VB', base.VB, ...LIMITS.VB),
    R: num('R', base.R, ...LIMITS.R),
    B: num('B', base.B, ...LIMITS.B),
    r: num('r', base.r, ...LIMITS.r),
    l: num('l', base.l, ...LIMITS.l),
    tau: num('tau', base.tau, -1e9, 1e9),
    omega: num('w', base.omega, -1e9, 1e9),
    poleArc: num('pa', base.poleArc, ...LIMITS.poleArc),
  }
}
