import { niceBelow } from '../../ui/format'
import { MachineConstants, OperatingPoint, machineConstants, solveSpeedMode, solveTorqueMode } from './engine'
import type { LoopState } from './state'

/** Everything the screen shows, computed once per state from the engine. */
export interface Model {
  state: LoopState
  c: MachineConstants
  op: OperatingPoint
  /** Load-torque slider range: [-tau_stall, tau_stall - step], on a grid of `tauStep`. */
  tauMin: number
  tauMax: number
  tauStep: number
  /** Speed slider range (Mode B): [0, 2 omega_nl]. */
  omegaMax: number
  /** Mode A: the requested load torque reaches the starting torque, so it is clamped. */
  stallWarning: boolean
  /** Mode B: a negative speed was requested; only omega >= 0 is allowed. */
  negativeSpeedWarning: boolean
  /** Mode B: the requested speed was above 2 omega_nl and is clamped. */
  speedClamped: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function derive(state: LoopState): Model {
  const p = { VB: state.VB, R: state.R, B: state.B, r: state.r, l: state.l }
  const c = machineConstants(p)
  const tauStep = niceBelow(c.tauStall / 500)
  const tauMax = c.tauStall - tauStep
  const tauMin = -c.tauStall
  const omegaMax = 2 * c.omegaNl
  const op = state.given === 'torque'
    ? solveTorqueMode({ ...p, tauLoad: clamp(state.tau, tauMin, tauMax) })
    : solveSpeedMode({ ...p, omega: clamp(state.omega, 0, omegaMax) })
  return {
    state, c, op, tauMin, tauMax, tauStep, omegaMax,
    stallWarning: state.given === 'torque' && state.tau >= c.tauStall,
    negativeSpeedWarning: state.given === 'speed' && state.omega < 0,
    speedClamped: state.given === 'speed' && state.omega > omegaMax,
  }
}

/** Smallest 1-2-5 value that is >= x. */
export function niceAbove(x: number): number {
  const b = niceBelow(x)
  if (b >= x) return b
  const e = Math.floor(Math.log10(b))
  const m = b / 10 ** e
  return (m === 1 ? 2 : m === 2 ? 5 : 10) * 10 ** e
}

/**
 * Display slow-down. The factor depends on the no-load speed and the speed choice only (not on the
 * operating point), so loading the motor visibly slows the loop. At no load one revolution takes
 * about 1/selection seconds or a little longer. It is a 1-2-5 number, never below 1 (real speed).
 */
export function slowDown(c: MachineConstants, selectionRevPerSec: number): number {
  return Math.max(1, niceAbove(c.omegaNl / (2 * Math.PI * selectionRevPerSec)))
}

/** Displayed revolutions per second for the animation clock. */
export const displayRate = (op: OperatingPoint, factor: number): number => op.omega / (2 * Math.PI * factor)
