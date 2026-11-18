import type { ResistancePer, WindingType } from './engine'

export interface ArmState {
  preset: PresetId
  type: WindingType
  /** Plex m (frog-leg: m_lap). */
  m: number
  progressive: boolean
  P: number
  C: number
  NC: number
  /** Slots removed from full pitch (0 = full pitch; > 0 = chorded). */
  chord: number
  /** Flux given as φ, or as B, r and l (φ = 2πrlB/P, Eq. 7-36). */
  fluxMode: FluxMode
  /** Flux per pole (Wb), used when fluxMode = 'phi'. */
  phi: number
  /** Flux density under the poles (T), rotor radius (m), conductor length (m), used when fluxMode = 'field'. */
  B: number
  r: number
  l: number
  /** Speed (r/min). */
  n: number
  /** Resistance of one element and which element it is. */
  R: number
  Rper: ResistancePer
  load: boolean
  RL: number
  ignoreRA: boolean
  /** Pole-arc fraction β = pole arc / pole pitch (0.5 … 1). 1 = the book's "ignore the dead zone". */
  beta: number
}

export type FluxMode = 'phi' | 'field'
export type PresetId = 'ex72' | 'ex73' | 'ex74' | 'p77' | 'p72' | 'wave9' | 'lap16'

type Case = Omit<ArmState, 'preset'>
const base: Omit<Case, 'type' | 'm' | 'P' | 'C' | 'NC'> = {
  progressive: true, chord: 0, fluxMode: 'phi', phi: 0.01, B: 1, r: 0.1, l: 0.3, n: 1000, R: 0.01, Rper: 'turn',
  load: false, RL: 100, ignoreRA: false, beta: 1,
}

/** The book's examples ignore the dead zone (β = 1); the figure presets open with β = 0.8 so the gaps show. */
export const PRESETS: readonly { id: PresetId; label: string; values: Case }[] = [
  { id: 'ex72', label: 'Example 7-2 (four-loop machine)', values: { ...base, type: 'lap', m: 1, P: 2, C: 4, NC: 1, phi: 0.05, n: 1200, R: 0.1, Rper: 'coil' } },
  { id: 'ex73', label: 'Example 7-3 (duplex lap, 6 poles, 72 coils)', values: { ...base, type: 'lap', m: 2, P: 6, C: 72, NC: 12, phi: 0.039, n: 400 } },
  { id: 'ex74', label: 'Example 7-4 (simplex wave, 12 poles, 144 coils)', values: { ...base, type: 'wave', m: 1, P: 12, C: 144, NC: 10, phi: 0.05, n: 200, R: 0.011, Rper: 'turn', load: true, RL: 1000, ignoreRA: true } },
  { id: 'p77', label: 'Problem 7-7 (duplex lap, 8 poles, 64 coils)', values: { ...base, type: 'lap', m: 2, P: 8, C: 64, NC: 10, phi: 0.003125, n: 3600, R: 0.011, Rper: 'turn' } },
  { id: 'p72', label: 'Problem 7-2 (dead zone)', values: { ...base, type: 'lap', m: 1, P: 2, C: 8, NC: 1, fluxMode: 'field', B: 1, r: 0.1, l: 0.3, n: 1800, R: 0.04, Rper: 'coil', load: true, RL: 1, beta: 0.75 } },
  { id: 'wave9', label: 'Simplex wave, 9 coils, 4 poles (book Fig. 7-20)', values: { ...base, type: 'wave', m: 1, P: 4, C: 9, NC: 1, beta: 0.8 } },
  { id: 'lap16', label: 'Simplex lap, 16 coils, 4 poles (book Fig. 7-15)', values: { ...base, type: 'lap', m: 1, P: 4, C: 16, NC: 1, beta: 0.8 } },
]

export const LIMITS = {
  C: [2, 1000], NC: [1, 100], phi: [1e-4, 1], B: [0.01, 3], r: [0.005, 2], l: [0.005, 5], n: [1, 1e4], R: [1e-5, 100], RL: [0.01, 1e5], beta: [0.5, 1],
} as const
export const POLES = [2, 4, 6, 8, 10, 12] as const

export function fromPreset(id: PresetId): ArmState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS.find((x) => x.id === 'lap16')!
  return { preset: p.id, ...p.values }
}

export const DEFAULT_STATE: ArmState = fromPreset('lap16')

export function isCustomized(s: ArmState): boolean {
  const p = PRESETS.find((x) => x.id === s.preset)!.values
  return (Object.keys(p) as (keyof Case)[]).some((k) => p[k] !== s[k])
}

/* ---------- session ---------- */

export type ChangeKind =
  | 'init' | 'type' | 'm' | 'dir' | 'P' | 'C' | 'NC' | 'chord' | 'fluxMode' | 'phi' | 'B' | 'r' | 'l' | 'n' | 'R' | 'Rper' | 'load' | 'RL'
  | 'ignoreRA' | 'beta'
  | 'preset' | 'experiment' | 'reveal'

export interface Session {
  state: ArmState
  before: ArmState
  change: ChangeKind
  at: number
  /** Automatic changes made by the smart adjust, one sentence each. */
  notes: string[]
}

export type Action =
  | { type: 'set'; change: ChangeKind; patch: Partial<ArmState>; notes?: string[] }
  | { type: 'load'; state: ArmState; change: ChangeKind }

const COALESCE_MS = 1500

export function reduce(s: Session, a: Action): Session {
  const now = Date.now()
  if (a.type === 'load') return { state: a.state, before: s.state, change: a.change, at: now, notes: [] }
  const same = a.change === s.change && now - s.at < COALESCE_MS && !a.notes?.length
  return { state: { ...s.state, ...a.patch }, before: same ? s.before : s.state, change: a.change, at: now, notes: a.notes ?? [] }
}

export const initSession = (state: ArmState): Session => ({ state, before: state, change: 'init', at: 0, notes: [] })

/* ---------- URL ---------- */

export function encodeState(s: ArmState): string {
  const q = new URLSearchParams()
  q.set('p', s.preset); q.set('t', s.type); q.set('m', String(s.m)); q.set('dir', s.progressive ? 'p' : 'r')
  q.set('fm', s.fluxMode)
  for (const k of ['P', 'C', 'NC', 'chord', 'phi', 'B', 'r', 'l', 'n', 'R', 'RL', 'beta'] as const) q.set(k, String(s[k]))
  q.set('per', s.Rper); q.set('load', s.load ? '1' : '0'); q.set('nora', s.ignoreRA ? '1' : '0')
  return q.toString()
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function decodeState(query: string): ArmState {
  const q = new URLSearchParams(query)
  const pid = q.get('p') as PresetId | null
  const b = fromPreset(pid && PRESETS.some((p) => p.id === pid) ? pid : DEFAULT_STATE.preset)
  const num = (k: string, fb: number, lo: number, hi: number, int = false) => {
    const raw = q.get(k)
    const v = raw === null ? NaN : Number(raw)
    return Number.isFinite(v) ? clamp(int ? Math.round(v) : v, lo, hi) : fb
  }
  const t = q.get('t')
  const P = num('P', b.P, 2, 12, true)
  return {
    preset: b.preset,
    type: t === 'lap' || t === 'wave' || t === 'frog' ? t : b.type,
    m: num('m', b.m, 1, 3, true),
    progressive: q.has('dir') ? q.get('dir') !== 'r' : b.progressive,
    P: (POLES as readonly number[]).includes(P) ? P : b.P,
    C: num('C', b.C, ...LIMITS.C, true),
    NC: num('NC', b.NC, ...LIMITS.NC, true),
    chord: num('chord', b.chord, 0, 500, true),
    fluxMode: q.get('fm') === 'field' ? 'field' : q.get('fm') === 'phi' ? 'phi' : b.fluxMode,
    phi: num('phi', b.phi, ...LIMITS.phi),
    B: num('B', b.B, ...LIMITS.B),
    r: num('r', b.r, ...LIMITS.r),
    l: num('l', b.l, ...LIMITS.l),
    n: num('n', b.n, ...LIMITS.n),
    R: num('R', b.R, ...LIMITS.R),
    Rper: (['conductor', 'turn', 'coil'] as const).find((x) => x === q.get('per')) ?? b.Rper,
    load: q.has('load') ? q.get('load') === '1' : b.load,
    RL: num('RL', b.RL, ...LIMITS.RL),
    ignoreRA: q.has('nora') ? q.get('nora') === '1' : b.ignoreRA,
    beta: num('beta', b.beta, ...LIMITS.beta),
  }
}

/**
 * Speed input: r/min by default; also "50 rev/s" (or rps), "3000 rpm", "r/min", and "rad/s".
 * Returns r/min, or null when the text is not a speed.
 */
export function parseSpeed(text: string): number | null {
  const t = text.trim().replace(/−/g, '-').replace(/,/g, '.')
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([kK]?)\s*(.*)$/.exec(t)
  if (!m) return null
  let v = Number(m[1]) * (m[2] ? 1e3 : 1)
  const unit = m[3].toLowerCase().replace(/\s+/g, '')
  if (unit === '' || unit === 'rpm' || unit === 'r/min' || unit === 'rev/min') return v
  if (unit === 'rev/s' || unit === 'rps' || unit === 'r/s') return v * 60
  if (unit === 'rad/s') { v = (v * 60) / (2 * Math.PI); return v }
  return null
}
