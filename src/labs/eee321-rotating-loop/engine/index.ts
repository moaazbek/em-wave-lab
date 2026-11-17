/**
 * Simple rotating loop between curved pole faces — Chapman, Electric Machinery Fundamentals, 5th ed., § 7.1.
 * Pure TypeScript: no UI imports. Every number, plot and animation frame of the lab reads from here.
 *
 * Sign conventions
 *   omega > 0      counter-clockwise (the direction the book's motor turns)
 *   i > 0          current out of the battery's + terminal into the loop (motor action); then tau_ind > 0 (CCW)
 *   e_ind > 0      opposes that current
 *   tau_load > 0   opposes the rotation; tau_load < 0 is a torque applied in the direction of rotation
 */

export interface MachineParams {
  /** Battery voltage V_B (V). */
  VB: number
  /** Total resistance of battery and wiring R (ohm). */
  R: number
  /** Flux density under the pole faces B (T). */
  B: number
  /** Radius from the axis to the loop conductors r (m). */
  r: number
  /** Axial length of the conductors l (m). */
  l: number
}

export interface MachineConstants extends MachineParams {
  /** Rotor area under one pole A_P = pi r l (m^2). */
  AP: number
  /** Flux per pole phi = A_P B (Wb). */
  phi: number
  /** k = (2/pi) phi = 2 r l B (V·s/rad = N·m/A). */
  k: number
  /** Starting current V_B / R (A): omega = 0 so e_ind = 0. */
  iStart: number
  /** No-load speed V_B / ((2/pi) phi) (rad/s). */
  omegaNl: number
  /** Starting (stall) torque (2/pi) phi V_B / R (N·m). */
  tauStall: number
}

export type MachineMode = 'motor' | 'generator' | 'idle'
export type GivenQuantity = 'torque' | 'speed'

export interface OperatingPoint extends MachineConstants {
  given: GivenQuantity
  /** Load torque (N·m). Mode A: the input. Mode B: equal to tau_ind (the prime mover supplies -tau_ind). */
  tauLoad: number
  /** Angular speed (rad/s), counter-clockwise positive. */
  omega: number
  /** Speed in r/min, n = 60 omega / (2 pi). */
  n: number
  /** Tangential speed of the conductors v = r omega (m/s). */
  v: number
  /** Voltage induced in each conductor under a pole face, v B l (V). */
  eConductor: number
  /** Induced voltage e_ind = 2 v B l = (2/pi) phi omega (V). */
  eInd: number
  /** Loop current (A). */
  i: number
  /** Force on each conductor under a pole face, F = i l B (N), tangential, CCW positive. */
  F: number
  /** Induced torque tau_ind = (2/pi) phi i (N·m). */
  tauInd: number
  /** Torque supplied by the prime mover in Mode B, -tau_ind (N·m); 0 in Mode A. */
  tauPrimeMover: number
  /** Power out of the battery V_B i (W). Negative: the battery absorbs power (charging). */
  PB: number
  /** Power lost in R, i^2 R (W). */
  PR: number
  /** Converted power e_ind i = tau_ind omega (W). Positive: electric to mechanical; zero at standstill. */
  Pconv: number
  /** Mechanical power at the shaft, tau_ind omega (W): output as a motor, input (negative) as a generator. */
  Pshaft: number
  mode: MachineMode
  /** True when the loop turns in the positive direction (omega > 0). */
  turnsPositive: boolean
  /** Mode A: the requested load torque reached the starting torque, so omega would be <= 0. */
  exceedsStall: boolean
}

/** Relative size under which the current counts as zero (no load). */
const IDLE_REL = 1e-12

export function machineConstants(p: MachineParams): MachineConstants {
  const AP = Math.PI * p.r * p.l
  const phi = AP * p.B
  const k = 2 * p.r * p.l * p.B // = (2/pi) phi, written without pi so it is exact
  return {
    ...p, AP, phi, k,
    iStart: p.VB / p.R,
    omegaNl: p.VB / k,
    tauStall: (k * p.VB) / p.R,
  }
}

function finish(c: MachineConstants, given: GivenQuantity, tauLoad: number, omega: number, eInd: number, i: number, exceedsStall: boolean): OperatingPoint {
  const tauInd = c.k * i
  const Pconv = eInd * i
  // The mode follows the direction of the current only (Chapman: motor or generator by the current alone).
  // For omega > 0 this is the sign of P_conv; at standstill (omega = 0, e_ind = 0) a current out of the
  // battery still makes the loop a motor: it produces the starting torque but converts no power yet.
  const mode: MachineMode = Math.abs(i) <= IDLE_REL * c.iStart ? 'idle' : i > 0 ? 'motor' : 'generator'
  const v = c.r * omega
  return {
    ...c, given, tauLoad, omega,
    n: (60 * omega) / (2 * Math.PI),
    v,
    eConductor: v * c.B * c.l,
    eInd, i,
    F: i * c.l * c.B,
    tauInd,
    tauPrimeMover: given === 'speed' ? -tauInd : 0,
    PB: c.VB * i,
    PR: i * i * c.R,
    Pconv,
    Pshaft: tauInd * omega,
    mode,
    turnsPositive: omega > 0,
    exceedsStall,
  }
}

/**
 * Mode A, shaft (load) torque given (Example 7-1):
 *   i = tau_load / ((2/pi) phi),  e_ind = V_B - i R,  omega = e_ind / ((2/pi) phi).
 * The result is computed as given; `turnsPositive` and `exceedsStall` flag tau_load >= tau_stall.
 */
export function solveTorqueMode(p: MachineParams & { tauLoad: number }): OperatingPoint {
  const c = machineConstants(p)
  const i = p.tauLoad / c.k
  const eInd = p.VB - i * p.R
  const omega = eInd / c.k
  return finish(c, 'torque', p.tauLoad, omega, eInd, i, p.tauLoad >= c.tauStall)
}

/**
 * Mode B, shaft speed given (Problem 7-1; a prime mover holds omega):
 *   e_ind = (2/pi) phi omega,  i = (V_B - e_ind) / R,  tau_ind = (2/pi) phi i.
 */
export function solveSpeedMode(p: MachineParams & { omega: number }): OperatingPoint {
  const c = machineConstants(p)
  const eInd = c.k * p.omega
  const i = (p.VB - eInd) / p.R
  return finish(c, 'speed', c.k * i, p.omega, eInd, i, false)
}

/** Operating line omega(tau_load) = omega_nl - R tau_load / ((2/pi) phi)^2. */
export function operatingLineOmega(c: MachineConstants, tauLoad: number): number {
  return c.omegaNl - (c.R * tauLoad) / (c.k * c.k)
}

/** Inverse of the operating line: the load torque at which the loop turns at omega. */
export function operatingLineTorque(c: MachineConstants, omega: number): number {
  return ((c.omegaNl - omega) * c.k * c.k) / c.R
}

/* ------------------------------------------------------------------ */
/* Rotor angle, poles and commutator                                    */
/* ------------------------------------------------------------------ */

/**
 * Geometry used for the waveform and the animation (front view, x right, y up, angles CCW from +x):
 * the S pole is centred at 0 rad (right), the N pole at pi (left). Each pole face covers
 * poleArcFraction * 90° on each side of its centre (fraction 1: no gap between the poles).
 * Conductor ab sits at the rotor angle theta, conductor cd at theta + pi.
 * The pole gaps are an illustration only: every number above uses A_P = pi r l (no gaps).
 */
export type Pole = 'N' | 'S'
export type Dir = 'out' | 'in'

/** Wrap an angle to (-pi, pi]. */
export function wrapAngle(a: number): number {
  let x = a % (2 * Math.PI)
  if (x <= -Math.PI) x += 2 * Math.PI
  if (x > Math.PI) x -= 2 * Math.PI
  return x
}

/** Pole a conductor at angle alpha is under, or null in a gap (or exactly on a pole edge). */
export function poleAt(alpha: number, poleArcFraction: number): Pole | null {
  const half = (poleArcFraction * Math.PI) / 2
  const a = wrapAngle(alpha)
  if (Math.abs(a) < half) return 'S'
  if (Math.PI - Math.abs(a) < half) return 'N'
  return null
}

export interface ShaftState {
  B: number
  r: number
  l: number
  omega: number
  i: number
}

/**
 * Instantaneous voltage of the loop at rotor angle theta (V):
 *   +2 v B l when ab is under the S pole and cd under the N pole,
 *   -2 v B l when ab is under the N pole and cd under the S pole,
 *   0 when the conductors are in the gaps between the poles.
 */
export function loopEmfAtAngle(theta: number, s: ShaftState, poleArcFraction: number): number {
  const pole = poleAt(theta, poleArcFraction)
  if (pole === null) return 0
  const e = 2 * s.r * s.omega * s.B * s.l
  return pole === 'S' ? e : -e
}

/**
 * Voltage at the brushes after the commutator (V). The commutator reverses the loop connections
 * each half turn, at the angles where the loop voltage is zero, so the brush voltage keeps one polarity.
 */
export function brushVoltageAtAngle(theta: number, s: ShaftState, poleArcFraction: number): number {
  const reversal = Math.cos(theta) >= 0 ? 1 : -1
  return reversal * loopEmfAtAngle(theta, s, poleArcFraction) + 0 // + 0 turns -0 into 0
}

/** Smallest angle at which the brushes are drawn shorting the commutator segments (rad). */
export const MIN_COMMUTATION_HALF_ANGLE = (3 * Math.PI) / 180

/**
 * True while the brushes short the two commutator segments. The segment gaps line up with the
 * conductors, and the brushes sit midway between the poles, so this happens while the conductors
 * cross the gaps between the poles (where the loop voltage is zero). With no gap (fraction 1) the
 * switch is instantaneous; it is drawn over +/- 3° so it can be seen.
 */
export function isCommutating(theta: number, poleArcFraction: number): boolean {
  const half = Math.max(((1 - poleArcFraction) * Math.PI) / 2, MIN_COMMUTATION_HALF_ANGLE)
  const a = Math.abs(wrapAngle(theta))
  return Math.abs(a - Math.PI / 2) < half
}

export interface ConductorState {
  name: 'ab' | 'cd'
  /** Angle of the conductor (rad, CCW from +x). */
  angle: number
  pole: Pole | null
  /** Direction of the induced voltage along the conductor (out of or into the page), null beyond the poles or at rest. */
  emf: Dir | null
  /** Direction of the current (out of or into the page), null beyond the poles or when i = 0. */
  current: Dir | null
  /** Tangential force, CCW positive (N); 0 beyond the poles. */
  force: number
}

/**
 * State of both conductors at rotor angle theta.
 * Under the S pole (B radially outward) a CCW motion induces a voltage into the page; under the N pole
 * (B radially inward) out of the page: e = (v x B) . l. Positive current (motor) flows against the
 * induced voltage, so F = i (l x B) is CCW on both conductors.
 * Beyond the pole edges the brushes short the loop: no voltage, no current through it, no force.
 */
export function conductorStates(theta: number, s: ShaftState, poleArcFraction: number): [ConductorState, ConductorState] {
  const one = (name: 'ab' | 'cd', angle: number): ConductorState => {
    const pole = poleAt(angle, poleArcFraction)
    if (pole === null) return { name, angle, pole, emf: null, current: null, force: 0 }
    const emfUnderS: Dir = s.omega >= 0 ? 'in' : 'out'
    const emf: Dir | null = s.omega === 0 ? null : pole === 'S' ? emfUnderS : emfUnderS === 'in' ? 'out' : 'in'
    const currentUnderS: Dir = s.i > 0 ? 'out' : 'in'
    const current: Dir | null = s.i === 0 ? null : pole === 'S' ? currentUnderS : currentUnderS === 'in' ? 'out' : 'in'
    return { name, angle, pole, emf, current, force: s.i * s.l * s.B }
  }
  return [one('ab', theta), one('cd', theta + Math.PI)]
}
