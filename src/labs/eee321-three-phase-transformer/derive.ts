import {
  Bases, Circuit, CircuitValues, Connection, FromTests, NETLISTS, Rating, Solution, bases, circuitFrom, circuitFromTests, fromUnitRating,
  loadAngle, ratingFromBank, ratingFromUnit, ratioFormula, realParams, secondaryVoltageForPrimary, solve,
} from './engine'
import type { XfState } from './state'

/** Real-bank part of the model (null in the ideal model). */
export interface RealModel {
  rating: Rating
  bases: Bases
  /** Null when the data cannot be used (see error). */
  circuit: Circuit | null
  /** Test conversions and results (circuit from test data only). */
  tests: FromTests | null
  /** Why nothing is computed: a wattmeter reading above V·I, or no solution of Eq. (2-64). */
  error: { text: string; where: 'OC' | 'SC' | 'load' } | null
  /** True when the series branch / the shunt branch is neglected. */
  noSeries: boolean
  noShunt: boolean
  /** Load as a fraction of the rating. */
  frac: number
}

/** Everything the screen shows, computed once per state from the engine. */
export interface Model {
  state: XfState
  sol: Solution
  conn: Connection
  /** Primary line voltage and turns ratio actually used (from the line inputs, the unit rating or the real rating). */
  VLL: number
  a: number
  /** Rated S of the bank (unit-rating mode and real bank). */
  Srated: number | null
  formula: ReturnType<typeof ratioFormula>
  real: RealModel | null
}

/** The rating of a real bank from the state. */
export function ratingOf(s: XfState): Rating {
  const n = NETLISTS[s.conn]
  return s.rBy === 'bank' ? ratingFromBank(n, s.rS, s.rVP, s.rVS) : ratingFromUnit(n, s.rS, s.rVP, s.rVS)
}

/** The equivalent circuit from the state (test data, per-unit or ohms). */
export function circuitOf(s: XfState, rating: Rating): { circuit: Circuit | null; tests: FromTests | null; error: RealModel['error'] } {
  const n = NETLISTS[s.conn]
  if (s.zFrom === 'test') {
    const t = circuitFromTests(n, rating,
      s.ocOn ? { side: s.ocSide, form: s.ocForm, reading: { V: s.ocV, I: s.ocI, P: s.ocP } } : null,
      s.scOn ? { side: s.scSide, form: s.scForm, reading: { V: s.scV, I: s.scI, P: s.scP } } : null)
    return t.ok ? { circuit: t.value.circuit, tests: t.value, error: null } : { circuit: null, tests: null, error: { text: t.reason, where: t.test } }
  }
  const v: CircuitValues = { Req: s.zR, Xeq: s.zX, RC: s.zSh && s.zRc > 0 ? s.zRc : null, XM: s.zSh && s.zXm > 0 ? s.zXm : null }
  return { circuit: circuitFrom(v, s.zFrom === 'pu' ? 'pu' : s.zFrom === 'ohmP' ? 'P' : 'S', rating), tests: null, error: null }
}

export function derive(state: XfState): Model {
  const netlist = NETLISTS[state.conn]
  const base = { netlist, S3: state.S3, pf: state.pf, lagging: state.lagging, seq: state.seq, f: state.f }
  if (state.model === 'real') {
    const rating = ratingOf(state)
    const c = circuitOf(state, rating)
    let error = c.error
    if (!error && c.circuit && state.hold === 'pri') {
      const v = secondaryVoltageForPrimary(rating.VphiP, rating.a, c.circuit.ZseS, state.S3 / 3 / rating.VphiS, loadAngle(state.pf, state.lagging))
      if (v === null) error = { text: 'No secondary voltage satisfies Eq. (2-64): the load is too large for this series impedance with the primary held at its rated voltage.', where: 'load' }
    }
    const ideal = { ...base, VLL: rating.VLL, a: rating.a }
    const sol = c.circuit && !error ? solve({ ...ideal, real: realParams(rating, c.circuit, state.hold) }) : solve(ideal)
    const circ = c.circuit
    return {
      state, sol, conn: state.conn, VLL: rating.VLL, a: rating.a, Srated: rating.S, formula: ratioFormula(netlist),
      real: {
        rating, bases: bases(rating), circuit: error ? null : circ, tests: c.tests, error,
        noSeries: !!circ && circ.S.Req === 0 && circ.S.Xeq === 0, noShunt: !circ || circ.YeS === null,
        frac: rating.S > 0 ? state.S3 / rating.S : 0,
      },
    }
  }
  let VLL = state.VLL, a = state.a, Srated: number | null = null
  if (state.spec === 'unit') {
    const u = fromUnitRating(netlist, state.uVp, state.uVs, state.uS)
    VLL = u.VLL; a = u.a; Srated = u.Srated
  }
  const sol = solve({ ...base, VLL, a })
  return { state, sol, conn: state.conn, VLL, a, Srated, formula: ratioFormula(netlist), real: null }
}

export const CONN_TEX: Record<Connection, string> = { YY: 'Y\\text{–}Y', YD: 'Y\\text{–}\\Delta', DY: '\\Delta\\text{–}Y', DD: '\\Delta\\text{–}\\Delta' }
export const CONN_TEXT: Record<Connection, string> = { YY: 'Y–Y', YD: 'Y–Δ', DY: 'Δ–Y', DD: 'Δ–Δ' }

/** "30° lag", "30° lead" or "no shift" from the engine's shift. */
export function shiftWords(shiftDeg: number): string {
  if (Math.abs(shiftDeg) < 1e-6) return 'no shift'
  return `${Math.abs(shiftDeg).toFixed(0)}° ${shiftDeg < 0 ? 'lag' : 'lead'}`
}

/** Connection part of the shift (0 or ±30°) and the load angle δ of a real bank. */
export function shiftParts(m: Model): { conn: number; delta: number } {
  const delta = m.sol.real?.deltaDeg ?? 0
  return { conn: Math.round((m.sol.shiftDeg + delta) / 30) * 30, delta }
}

/** The shift in words: "30° lag", or for a real bank "30° lag + δ 2.05°" (connection shift and load angle). */
export function shiftLabel(m: Model): string {
  if (!m.sol.real) return shiftWords(m.sol.shiftDeg)
  const { conn, delta } = shiftParts(m)
  const d = `δ ${Math.abs(delta).toFixed(2)}°`
  if (conn === 0) return `${d} ${delta >= 0 ? 'lag' : 'lead'} (load angle)`
  return `${shiftWords(conn)} ${delta >= 0 ? '+' : '−'} ${d}`
}

/** "(HV)" / "(LV)" after primary and secondary. */
export const sideTag = (m: Model, side: 'P' | 'S') => (side === 'P' ? (m.a >= 1 ? 'HV' : 'LV') : m.a >= 1 ? 'LV' : 'HV')
