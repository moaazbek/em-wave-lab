import {
  LOSSLESS_PRESET_IDS, MediumState, PRESETS, Part, Polarization, Quantity, editMedium, fromPreset,
} from '../../physics'

export interface LabState {
  m1: MediumState
  m2: MediumState
  /** Frequency (Hz). */
  f: number
  /** Angle of incidence (degrees). */
  thetaDeg: number
  /** Incident amplitude E_i0 (V/m). */
  e0: number
  pol: Polarization
  /** Which wave the map shows. */
  part: Part
  /** Which field the map shows. */
  quantity: Quantity
  /** Component shown when the chosen field lies in the plane of incidence. */
  comp: 'x' | 'z'
  rays: boolean
  advanced: boolean
}

export const LIMITS = {
  epsR: [1, 100], muR: [1, 100], sigma: [1e-6, 1e8], f: [1e3, 1e11], theta: [0, 89.9], e0: [1e-3, 1e3],
} as const

export const DEFAULT_STATE: LabState = {
  m1: fromPreset('air'),
  m2: fromPreset('diel4'),
  f: 1e9,
  thetaDeg: 30,
  e0: 1,
  pol: 'perp',
  part: 'total',
  quantity: 'E',
  comp: 'x',
  rays: true,
  advanced: false,
}

/** What the student changed last; the explanation panel reacts to it. */
export type ChangeKind =
  | 'init' | 'f' | 'theta' | 'e0' | 'pol' | 'preset1' | 'preset2'
  | 'eps1' | 'mu1' | 'eps2' | 'mu2' | 'sigma2' | 'experiment' | 'reveal'

export interface Session {
  state: LabState
  /** State before the last physical change began (a slider drag counts as one change). */
  before: LabState
  change: ChangeKind
  at: number
}

export type Action =
  | { type: 'physics'; change: ChangeKind; patch: Partial<LabState> }
  | { type: 'view'; patch: Partial<Pick<LabState, 'part' | 'quantity' | 'comp' | 'rays' | 'advanced'>> }
  | { type: 'load'; state: LabState; change: ChangeKind }

const COALESCE_MS = 1500

export function reduce(s: Session, a: Action): Session {
  const now = Date.now()
  switch (a.type) {
    case 'view':
      return { ...s, state: { ...s.state, ...a.patch } }
    case 'load':
      return { state: a.state, before: s.state, change: a.change, at: now }
    case 'physics': {
      let next = { ...s.state, ...a.patch }
      // The field along a_y is the natural one to look at; follow the polarization.
      if (a.patch.pol && a.patch.pol !== s.state.pol) next = { ...next, quantity: a.patch.pol === 'perp' ? 'E' : 'H' }
      const same = a.change === s.change && now - s.at < COALESCE_MS
      return { state: next, before: same ? s.before : s.state, change: a.change, at: now }
    }
  }
}

export const initSession = (state: LabState): Session => ({ state, before: state, change: 'init', at: 0 })

/* ---------- actions used by the controls ---------- */

export const setMedium = (which: 1 | 2, key: 'epsR' | 'muR' | 'sigma', value: number, s: LabState): Action => {
  const m = which === 1 ? s.m1 : s.m2
  const change = (key === 'epsR' ? 'eps' : key === 'muR' ? 'mu' : 'sigma') + which as ChangeKind
  return { type: 'physics', change, patch: which === 1 ? { m1: editMedium(m, { [key]: value }) } : { m2: editMedium(m, { [key]: value }) } }
}

export const setPreset = (which: 1 | 2, id: string): Action => ({
  type: 'physics',
  change: which === 1 ? 'preset1' : 'preset2',
  patch: which === 1 ? { m1: fromPreset(id) } : { m2: fromPreset(id) },
})

/* ---------- URL codec: the full state lives in the hash query ---------- */

const n = (v: number) => String(Number(v.toPrecision(6)))

export function encodeState(s: LabState): string {
  const q = new URLSearchParams()
  q.set('p1', s.m1.preset); q.set('e1', n(s.m1.epsR)); q.set('u1', n(s.m1.muR))
  q.set('p2', s.m2.preset); q.set('e2', n(s.m2.epsR)); q.set('u2', n(s.m2.muR)); q.set('s2', n(s.m2.sigma))
  if (s.m2.pec) q.set('pec', '1')
  q.set('f', n(s.f)); q.set('th', n(s.thetaDeg)); q.set('E0', n(s.e0)); q.set('pol', s.pol)
  q.set('part', s.part); q.set('q', s.quantity); q.set('c', s.comp)
  q.set('rays', s.rays ? '1' : '0'); q.set('adv', s.advanced ? '1' : '0')
  return q.toString()
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function decodeState(query: string): LabState {
  const q = new URLSearchParams(query)
  const d = DEFAULT_STATE
  const num = (key: string, fallback: number, lo: number, hi: number) => {
    const raw = q.get(key)
    const v = raw === null ? NaN : Number(raw)
    return Number.isFinite(v) ? clamp(v, lo, hi) : fallback
  }
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const v = q.get(key) as T | null
    return v !== null && allowed.includes(v) ? v : fallback
  }
  const ids = PRESETS.map((p) => p.id)
  const b1 = fromPreset(pick('p1', LOSSLESS_PRESET_IDS, d.m1.preset))
  const b2 = fromPreset(pick('p2', ids, d.m2.preset))
  const sigmaRaw = num('s2', b2.sigma, 0, LIMITS.sigma[1])
  return {
    m1: { ...b1, epsR: num('e1', b1.epsR, ...LIMITS.epsR), muR: num('u1', b1.muR, ...LIMITS.muR) },
    m2: {
      ...b2,
      epsR: num('e2', b2.epsR, ...LIMITS.epsR),
      muR: num('u2', b2.muR, ...LIMITS.muR),
      sigma: sigmaRaw > 0 ? Math.max(sigmaRaw, LIMITS.sigma[0]) : 0,
      pec: q.has('pec') ? q.get('pec') === '1' : b2.pec,
    },
    f: num('f', d.f, ...LIMITS.f),
    thetaDeg: num('th', d.thetaDeg, ...LIMITS.theta),
    e0: num('E0', d.e0, ...LIMITS.e0),
    pol: pick('pol', ['perp', 'par'] as const, d.pol),
    part: pick('part', ['total', 'inc', 'ref', 'trans'] as const, d.part),
    quantity: pick('q', ['E', 'H'] as const, q.get('pol') === 'par' ? 'H' : 'E'),
    comp: pick('c', ['x', 'z'] as const, d.comp),
    rays: q.get('rays') !== '0',
    advanced: q.get('adv') === '1',
  }
}
