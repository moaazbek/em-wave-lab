import type { Connection, Sequence } from './engine'

export type SpecifyBy = 'line' | 'unit'

export interface XfState {
  preset: PresetId
  conn: Connection
  spec: SpecifyBy
  /** "Line voltage and a": primary line-to-line voltage (V) and turns ratio. */
  VLL: number
  a: number
  /** "Single-phase unit rating": the unit's primary and secondary winding voltages (V) and its rating (VA). */
  uVp: number
  uVs: number
  uS: number
  /** Load: S_3φ (VA), power factor, lag or lead. */
  S3: number
  pf: number
  lagging: boolean
  seq: Sequence
  f: 50 | 60
  /** Third-harmonic view (illustrative) and its amplitude h. */
  harmonic: boolean
  h: number
  /** Phasor view: draw the secondary on the primary diagram (scaled), and rotate with ωt or freeze at t = 0. */
  overlay: boolean
  rotate: boolean
}

export type PresetId = 'ex29' | 'bank' | 'yd' | 'yy' | 'dd'

const R3 = Math.sqrt(3)
type Case = Omit<XfState, 'preset' | 'harmonic' | 'h' | 'overlay' | 'rotate'>

export const PRESETS: readonly { id: PresetId; label: string; values: Case }[] = [
  {
    id: 'ex29', label: 'Example 2-9 ratings (Δ–Y 13.8 kV / 208 V, 50 kVA)',
    values: { conn: 'DY', spec: 'line', VLL: 13800, a: (13800 * R3) / 208, uVp: 13800, uVs: 208 / R3, uS: 50e3 / 3, S3: 50e3, pf: 0.8, lagging: true, seq: 'abc', f: 60 },
  },
  {
    id: 'bank', label: 'Bank of 3 × 10 MVA, 33/11 kV, Δ–Y',
    values: { conn: 'DY', spec: 'unit', VLL: 33e3, a: 3, uVp: 33e3, uVs: 11e3, uS: 10e6, S3: 30e6, pf: 0.9, lagging: true, seq: 'abc', f: 50 },
  },
  {
    id: 'yd', label: 'Y–Δ step-down 13.8 kV, a = 10',
    values: { conn: 'YD', spec: 'line', VLL: 13800, a: 10, uVp: 13800 / R3, uVs: 13800 / R3 / 10, uS: 1e6 / 3, S3: 1e6, pf: 0.8, lagging: true, seq: 'abc', f: 60 },
  },
  {
    id: 'yy', label: 'Y–Y 480/240 V',
    values: { conn: 'YY', spec: 'line', VLL: 480, a: 2, uVp: 480 / R3, uVs: 240 / R3, uS: 10e3, S3: 30e3, pf: 1, lagging: true, seq: 'abc', f: 60 },
  },
  {
    id: 'dd', label: 'Δ–Δ 4160/480 V',
    values: { conn: 'DD', spec: 'line', VLL: 4160, a: 4160 / 480, uVp: 4160, uVs: 480, uS: 500e3 / 3, S3: 500e3, pf: 0.85, lagging: false, seq: 'abc', f: 60 },
  },
]

export const LIMITS = {
  VLL: [100, 765e3], a: [0.05, 200], uVp: [100, 765e3], uVs: [10, 765e3], uS: [100, 1e9], S3: [1, 1e9], h: [0, 0.5],
} as const

const VIEW = { harmonic: false, h: 0.2, overlay: false, rotate: true }

export function fromPreset(id: PresetId, view: Pick<XfState, 'harmonic' | 'h' | 'overlay' | 'rotate'> = VIEW): XfState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0]
  return { preset: p.id, ...view, ...p.values }
}

export const DEFAULT_STATE: XfState = fromPreset('ex29')

/** True when a value of the case differs from the preset (view switches do not count). */
export function isCustomized(s: XfState): boolean {
  const p = PRESETS.find((x) => x.id === s.preset)!.values
  const common = p.conn !== s.conn || p.spec !== s.spec || p.S3 !== s.S3 || p.pf !== s.pf || p.lagging !== s.lagging || p.seq !== s.seq || p.f !== s.f
  return common || (s.spec === 'line' ? p.VLL !== s.VLL || p.a !== s.a : p.uVp !== s.uVp || p.uVs !== s.uVs || p.uS !== s.uS)
}

/* ---------- session ---------- */

export type ChangeKind =
  | 'init' | 'conn' | 'spec' | 'VLL' | 'a' | 'unit' | 'S3' | 'pf' | 'lag' | 'seq' | 'f' | 'harmonic' | 'h' | 'view'
  | 'preset' | 'experiment' | 'reveal' | 'rated'

export interface Session {
  state: XfState
  before: XfState
  change: ChangeKind
  at: number
}

export type Action =
  | { type: 'set'; change: ChangeKind; patch: Partial<XfState> }
  | { type: 'load'; state: XfState; change: ChangeKind }

const COALESCE_MS = 1500

export function reduce(s: Session, a: Action): Session {
  const now = Date.now()
  if (a.type === 'load') return { state: a.state, before: s.state, change: a.change, at: now }
  if (a.change === 'view') return { ...s, state: { ...s.state, ...a.patch } }
  const same = a.change === s.change && now - s.at < COALESCE_MS
  return { state: { ...s.state, ...a.patch }, before: same ? s.before : s.state, change: a.change, at: now }
}

export const initSession = (state: XfState): Session => ({ state, before: state, change: 'init', at: 0 })

/* ---------- URL ---------- */

export function encodeState(s: XfState): string {
  const q = new URLSearchParams()
  q.set('p', s.preset); q.set('c', s.conn); q.set('by', s.spec)
  // full precision, so a preset ratio such as 13800·√3/208 survives a shared link exactly
  for (const k of ['VLL', 'a', 'uVp', 'uVs', 'uS', 'S3', 'pf', 'h'] as const) q.set(k, String(s[k]))
  q.set('lag', s.lagging ? '1' : '0'); q.set('seq', s.seq); q.set('f', String(s.f))
  q.set('h3', s.harmonic ? '1' : '0'); q.set('ov', s.overlay ? '1' : '0'); q.set('rot', s.rotate ? '1' : '0')
  return q.toString()
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function decodeState(query: string): XfState {
  const q = new URLSearchParams(query)
  const pid = q.get('p') as PresetId | null
  const b = fromPreset(pid && PRESETS.some((p) => p.id === pid) ? pid : DEFAULT_STATE.preset)
  const num = (k: string, fb: number, lo: number, hi: number) => {
    const raw = q.get(k)
    const v = raw === null ? NaN : Number(raw)
    return Number.isFinite(v) ? clamp(v, lo, hi) : fb
  }
  const pick = <T extends string>(k: string, allowed: readonly T[], fb: T): T => {
    const v = q.get(k) as T | null
    return v !== null && allowed.includes(v) ? v : fb
  }
  const bool = (k: string, fb: boolean) => (q.has(k) ? q.get(k) === '1' : fb)
  const S3raw = num('S3', b.S3, 0, LIMITS.S3[1])
  return {
    preset: b.preset,
    conn: pick('c', ['YY', 'YD', 'DY', 'DD'] as const, b.conn),
    spec: pick('by', ['line', 'unit'] as const, b.spec),
    VLL: num('VLL', b.VLL, ...LIMITS.VLL),
    a: num('a', b.a, ...LIMITS.a),
    uVp: num('uVp', b.uVp, ...LIMITS.uVp),
    uVs: num('uVs', b.uVs, ...LIMITS.uVs),
    uS: num('uS', b.uS, ...LIMITS.uS),
    S3: S3raw > 0 ? Math.max(S3raw, LIMITS.S3[0]) : 0,
    pf: num('pf', b.pf, 0, 1),
    lagging: bool('lag', b.lagging),
    seq: pick('seq', ['abc', 'acb'] as const, b.seq),
    f: q.get('f') === '50' ? 50 : q.get('f') === '60' ? 60 : b.f,
    harmonic: bool('h3', b.harmonic),
    h: num('h', b.h, ...LIMITS.h),
    overlay: bool('ov', b.overlay),
    rotate: bool('rot', b.rotate),
  }
}
