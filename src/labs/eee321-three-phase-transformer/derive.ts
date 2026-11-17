import { Connection, NETLISTS, Solution, fromUnitRating, ratioFormula, solve } from './engine'
import type { XfState } from './state'

/** Everything the screen shows, computed once per state from the engine. */
export interface Model {
  state: XfState
  sol: Solution
  conn: Connection
  /** Primary line voltage and turns ratio actually used (from the line inputs or the unit rating). */
  VLL: number
  a: number
  /** Rated S_3φ of the bank (unit-rating mode only). */
  Srated: number | null
  formula: ReturnType<typeof ratioFormula>
}

export function derive(state: XfState): Model {
  const netlist = NETLISTS[state.conn]
  let VLL = state.VLL, a = state.a, Srated: number | null = null
  if (state.spec === 'unit') {
    const u = fromUnitRating(netlist, state.uVp, state.uVs, state.uS)
    VLL = u.VLL; a = u.a; Srated = u.Srated
  }
  const sol = solve({ netlist, VLL, a, S3: state.S3, pf: state.pf, lagging: state.lagging, seq: state.seq, f: state.f })
  return { state, sol, conn: state.conn, VLL, a, Srated, formula: ratioFormula(netlist) }
}

export const CONN_TEX: Record<Connection, string> = { YY: 'Y\\text{–}Y', YD: 'Y\\text{–}\\Delta', DY: '\\Delta\\text{–}Y', DD: '\\Delta\\text{–}\\Delta' }
export const CONN_TEXT: Record<Connection, string> = { YY: 'Y–Y', YD: 'Y–Δ', DY: 'Δ–Y', DD: 'Δ–Δ' }

/** "30° lag", "30° lead" or "no shift" from the engine's shift. */
export function shiftWords(shiftDeg: number): string {
  if (Math.abs(shiftDeg) < 1e-6) return 'no shift'
  return `${Math.abs(shiftDeg).toFixed(0)}° ${shiftDeg < 0 ? 'lag' : 'lead'}`
}
