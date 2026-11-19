import type { Connection, Sequence } from './engine'

export type SpecifyBy = 'line' | 'unit'
export type XfModel = 'ideal' | 'real'
export type ZFrom = 'test' | 'pu' | 'ohmP' | 'ohmS'
export type RefSide = 'P' | 'S' | 'pu'

export interface XfState {
  preset: PresetId
  /** Ideal transformers, or a real bank (approximate equivalent circuit of each transformer). */
  model: XfModel
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

  /* ---------- real bank ---------- */
  /** Rating given for one transformer (S_φ, V_φP, V_φS) or for the bank (S, V_LL, V_ll). */
  rBy: 'unit' | 'bank'
  rS: number
  rVP: number
  rVS: number
  /** Where the equivalent circuit comes from. */
  zFrom: ZFrom
  /** OC test: used or not, side (P = primary, S = secondary), readings form, V, I, P. */
  ocOn: boolean
  ocSide: 'P' | 'S'
  ocForm: 'bank' | 'unit'
  ocV: number
  ocI: number
  ocP: number
  scOn: boolean
  scSide: 'P' | 'S'
  scForm: 'bank' | 'unit'
  scV: number
  scI: number
  scP: number
  /** Per-unit or ohm values (per transformer): series R_eq, X_eq; shunt R_C, X_M when zSh. */
  zR: number
  zX: number
  zSh: boolean
  zRc: number
  zXm: number
  /** Operating point: hold the secondary or the primary at rated voltage; load given as S or as a fraction. */
  hold: 'sec' | 'pri'
  loadBy: 'S' | 'frac'
  /** Display only: side the circuit is referred to, hero view, gain of the drop phasors. */
  refSide: RefSide
  hero: 'conn' | 'circuit'
  gain: 1 | 5 | 10
}

export type IdealPresetId = 'ex29' | 'bank' | 'yd' | 'yy' | 'dd'
export type RealPresetId = 'r29' | 'r210' | 'r211' | 'r212' | 'r213' | 'rmid'
export type PresetId = IdealPresetId | RealPresetId

const R3 = Math.sqrt(3)
type ViewKey = 'harmonic' | 'h' | 'overlay' | 'rotate' | 'refSide' | 'hero' | 'gain'
type Case = Omit<XfState, 'preset' | ViewKey>
type IdealCase = Omit<Case, keyof typeof REAL_OFF>
type RealCase = Omit<Case, keyof typeof IDEAL_OFF>

/** Real-bank fields when an ideal preset is loaded (they are not used in the ideal model). */
const REAL_OFF = {
  rBy: 'unit', rS: 50e3 / 3, rVP: 13800, rVS: 208 / R3, zFrom: 'pu',
  ocOn: false, ocSide: 'S', ocForm: 'bank', ocV: 480, ocI: 4.1, ocP: 945,
  scOn: true, scSide: 'P', scForm: 'bank', scV: 1400, scI: 1.8, scP: 912,
  zR: 0.01, zX: 0.07, zSh: false, zRc: 100, zXm: 20, hold: 'sec', loadBy: 'S',
} as const satisfies Partial<Case>
/** Ideal-only fields when a real preset is loaded. */
const IDEAL_OFF = { spec: 'unit', VLL: 13800, a: 10, uVp: 13800, uVs: 1380, uS: 1e6 } as const satisfies Partial<Case>

const ideal = (v: Omit<IdealCase, 'model'>): Case => ({ model: 'ideal', ...REAL_OFF, ...v })
const real = (v: Omit<RealCase, 'model'>): Case => ({ model: 'real', ...IDEAL_OFF, ...v })
const NOTEST = { ocOn: false, ocSide: 'S', ocForm: 'bank', ocV: 0, ocI: 0, ocP: 0, scOn: false, scSide: 'P', scForm: 'bank', scV: 0, scI: 0, scP: 0 } as const
const LOAD = { pf: 0.8, lagging: true, seq: 'abc', hold: 'sec', loadBy: 'S' } as const

export const PRESETS: readonly { id: PresetId; label: string; values: Case }[] = [
  {
    id: 'ex29', label: 'Example 2-9 ratings (Δ–Y 13.8 kV / 208 V, 50 kVA)',
    values: ideal({ conn: 'DY', spec: 'line', VLL: 13800, a: (13800 * R3) / 208, uVp: 13800, uVs: 208 / R3, uS: 50e3 / 3, S3: 50e3, pf: 0.8, lagging: true, seq: 'abc', f: 60 }),
  },
  {
    id: 'bank', label: 'Bank of 3 × 10 MVA, 33/11 kV, Δ–Y',
    values: ideal({ conn: 'DY', spec: 'unit', VLL: 33e3, a: 3, uVp: 33e3, uVs: 11e3, uS: 10e6, S3: 30e6, pf: 0.9, lagging: true, seq: 'abc', f: 50 }),
  },
  {
    id: 'yd', label: 'Y–Δ step-down 13.8 kV, a = 10',
    values: ideal({ conn: 'YD', spec: 'line', VLL: 13800, a: 10, uVp: 13800 / R3, uVs: 13800 / R3 / 10, uS: 1e6 / 3, S3: 1e6, pf: 0.8, lagging: true, seq: 'abc', f: 60 }),
  },
  {
    id: 'yy', label: 'Y–Y 480/240 V',
    values: ideal({ conn: 'YY', spec: 'line', VLL: 480, a: 2, uVp: 480 / R3, uVs: 240 / R3, uS: 10e3, S3: 30e3, pf: 1, lagging: true, seq: 'abc', f: 60 }),
  },
  {
    id: 'dd', label: 'Δ–Δ 4160/480 V',
    values: ideal({ conn: 'DD', spec: 'line', VLL: 4160, a: 4160 / 480, uVp: 4160, uVs: 480, uS: 500e3 / 3, S3: 500e3, pf: 0.85, lagging: false, seq: 'abc', f: 60 }),
  },
  {
    id: 'r29', label: 'Example 2-9 (50 kVA, 13.8 kV/208 V, Δ–Y, 0.01 + j0.07 pu)',
    values: real({ ...NOTEST, ...LOAD, conn: 'DY', f: 60, rBy: 'bank', rS: 50e3, rVP: 13800, rVS: 208, zFrom: 'pu', zR: 0.01, zX: 0.07, zSh: false, zRc: 100, zXm: 20, S3: 50e3 }),
  },
  {
    id: 'r210', label: 'Problem 2-10 (500 kVA bank, 34.5/11 kV — unit ratings)',
    // the problem gives only the ratings: no test data, so the circuit is ideal (both tests off)
    values: real({ ...NOTEST, ...LOAD, conn: 'YY', f: 60, rBy: 'bank', rS: 500e3, rVP: 34.5e3, rVS: 11e3, zFrom: 'test', zR: 0.01, zX: 0.05, zSh: false, zRc: 100, zXm: 20, S3: 500e3 }),
  },
  {
    id: 'r211', label: 'Problem 2-11 (100 MVA, 230/115 kV, Δ–Y)',
    values: real({ ...NOTEST, ...LOAD, conn: 'DY', f: 60, rBy: 'bank', rS: 100e6, rVP: 230e3, rVS: 115e3, zFrom: 'pu', zR: 0.015, zX: 0.06, zSh: true, zRc: 100, zXm: 20, S3: 80e6 }),
  },
  {
    id: 'r212', label: 'Problem 2-12 (3 × 20 kVA, 24 000/277 V, Δ–Y, OC + SC tests)',
    values: real({
      ...LOAD, pf: 0.9, conn: 'DY', f: 60, rBy: 'unit', rS: 20e3, rVP: 24000, rVS: 277, zFrom: 'test',
      ocOn: true, ocSide: 'S', ocForm: 'bank', ocV: 480, ocI: 4.1, ocP: 945,
      scOn: true, scSide: 'P', scForm: 'bank', scV: 1400, scI: 1.8, scP: 912,
      zR: 0.01, zX: 0.05, zSh: false, zRc: 100, zXm: 20, S3: 60e3,
    }),
  },
  {
    id: 'r213', label: 'Problem 2-13 (3 × 100 kVA, 8314/480 V, Y–Δ, SC test)',
    values: real({
      ...NOTEST, ...LOAD, conn: 'YD', f: 60, rBy: 'unit', rS: 100e3, rVP: 8314, rVS: 480, zFrom: 'test',
      scOn: true, scSide: 'P', scForm: 'unit', scV: 510, scI: 12.6, scP: 3000,
      zR: 0.01, zX: 0.05, zSh: false, zRc: 100, zXm: 20, S3: 300e3,
    }),
  },
  {
    id: 'rmid', label: 'Midterm-style bank (3 × 10 MVA, 33/11 kV, Δ–Y, 0.002 + j0.083 pu)',
    values: real({ ...NOTEST, ...LOAD, pf: 0.9, conn: 'DY', f: 50, rBy: 'unit', rS: 10e6, rVP: 33e3, rVS: 11e3, zFrom: 'pu', zR: 0.002, zX: 0.083, zSh: false, zRc: 100, zXm: 20, S3: 30e6 }),
  },
]

export const IDEAL_PRESETS = PRESETS.filter((p) => p.values.model === 'ideal')
export const REAL_PRESETS = PRESETS.filter((p) => p.values.model === 'real')

export const LIMITS = {
  VLL: [100, 765e3], a: [0.05, 200], uVp: [100, 765e3], uVs: [10, 765e3], uS: [100, 1e9], S3: [1, 1e9], h: [0, 0.5],
  rS: [100, 3e9], rV: [10, 765e3], read: [0, 1e9], z: [0, 1e9], frac: [0, 1.25],
} as const

export type View = Pick<XfState, ViewKey>
const VIEW: View = { harmonic: false, h: 0.2, overlay: false, rotate: true, refSide: 'P', hero: 'conn', gain: 10 }

export function fromPreset(id: PresetId, view: Partial<View> = {}): XfState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0]
  return { preset: p.id, ...VIEW, ...view, ...p.values }
}
export const viewOf = (s: XfState): View => ({ harmonic: s.harmonic, h: s.h, overlay: s.overlay, rotate: s.rotate, refSide: s.refSide, hero: s.hero, gain: s.gain })

export const DEFAULT_STATE: XfState = fromPreset('ex29')

/** True when a value of the case differs from the preset (view switches do not count). */
export function isCustomized(s: XfState): boolean {
  const p = PRESETS.find((x) => x.id === s.preset)!.values
  if (p.model !== s.model) return true
  const common = p.conn !== s.conn || p.S3 !== s.S3 || p.pf !== s.pf || p.lagging !== s.lagging || p.seq !== s.seq || p.f !== s.f
  if (s.model === 'ideal')
    return common || p.spec !== s.spec || (s.spec === 'line' ? p.VLL !== s.VLL || p.a !== s.a : p.uVp !== s.uVp || p.uVs !== s.uVs || p.uS !== s.uS)
  const keys: (keyof Case)[] = ['rBy', 'rS', 'rVP', 'rVS', 'zFrom', 'hold', 'loadBy']
  if (s.zFrom === 'test') keys.push('ocOn', 'scOn', ...(s.ocOn ? ['ocSide', 'ocForm', 'ocV', 'ocI', 'ocP'] as const : []), ...(s.scOn ? ['scSide', 'scForm', 'scV', 'scI', 'scP'] as const : []))
  else keys.push('zR', 'zX', 'zSh', ...(s.zSh ? ['zRc', 'zXm'] as const : []))
  return common || keys.some((k) => p[k] !== s[k])
}

/* ---------- session ---------- */

export type ChangeKind =
  | 'init' | 'conn' | 'spec' | 'VLL' | 'a' | 'unit' | 'S3' | 'pf' | 'lag' | 'seq' | 'f' | 'harmonic' | 'h' | 'view'
  | 'preset' | 'experiment' | 'reveal' | 'rated'
  | 'model' | 'rating' | 'zFrom' | 'test' | 'z' | 'hold' | 'loadBy'

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
  q.set('m', s.model)
  if (s.model === 'real') {
    q.set('rBy', s.rBy); q.set('zf', s.zFrom); q.set('hold', s.hold); q.set('lb', s.loadBy); q.set('ref', s.refSide); q.set('hero', s.hero); q.set('g', String(s.gain))
    for (const k of ['rS', 'rVP', 'rVS', 'ocV', 'ocI', 'ocP', 'scV', 'scI', 'scP', 'zR', 'zX', 'zRc', 'zXm'] as const) q.set(k, String(s[k]))
    q.set('oc', s.ocOn ? '1' : '0'); q.set('ocS', s.ocSide); q.set('ocF', s.ocForm)
    q.set('sc', s.scOn ? '1' : '0'); q.set('scS', s.scSide); q.set('scF', s.scForm)
    q.set('sh', s.zSh ? '1' : '0')
  }
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
    model: pick('m', ['ideal', 'real'] as const, b.model),
    rBy: pick('rBy', ['unit', 'bank'] as const, b.rBy),
    rS: num('rS', b.rS, ...LIMITS.rS),
    rVP: num('rVP', b.rVP, ...LIMITS.rV),
    rVS: num('rVS', b.rVS, ...LIMITS.rV),
    zFrom: pick('zf', ['test', 'pu', 'ohmP', 'ohmS'] as const, b.zFrom),
    ocOn: bool('oc', b.ocOn), ocSide: pick('ocS', ['P', 'S'] as const, b.ocSide), ocForm: pick('ocF', ['bank', 'unit'] as const, b.ocForm),
    ocV: num('ocV', b.ocV, ...LIMITS.read), ocI: num('ocI', b.ocI, ...LIMITS.read), ocP: num('ocP', b.ocP, ...LIMITS.read),
    scOn: bool('sc', b.scOn), scSide: pick('scS', ['P', 'S'] as const, b.scSide), scForm: pick('scF', ['bank', 'unit'] as const, b.scForm),
    scV: num('scV', b.scV, ...LIMITS.read), scI: num('scI', b.scI, ...LIMITS.read), scP: num('scP', b.scP, ...LIMITS.read),
    zR: num('zR', b.zR, ...LIMITS.z), zX: num('zX', b.zX, ...LIMITS.z), zSh: bool('sh', b.zSh),
    zRc: num('zRc', b.zRc, ...LIMITS.z), zXm: num('zXm', b.zXm, ...LIMITS.z),
    hold: pick('hold', ['sec', 'pri'] as const, b.hold),
    loadBy: pick('lb', ['S', 'frac'] as const, b.loadBy),
    refSide: pick('ref', ['P', 'S', 'pu'] as const, b.refSide),
    hero: pick('hero', ['conn', 'circuit'] as const, b.hero),
    gain: q.get('g') === '1' ? 1 : q.get('g') === '5' ? 5 : q.get('g') === '10' ? 10 : b.gain,
  }
}
