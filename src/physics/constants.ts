/** Permeability of free space (H/m). */
export const MU0 = 4e-7 * Math.PI
/** Permittivity of free space (F/m). */
export const EPS0 = 8.8541878128e-12
/** Speed of light in free space (m/s). */
export const C0 = 1 / Math.sqrt(MU0 * EPS0)
/** Intrinsic impedance of free space (ohm). */
export const ETA0 = Math.sqrt(MU0 / EPS0)

/**
 * Classification thresholds on the loss tangent sigma/(omega*epsilon).
 * These are a convention: "<<1" and ">>1" have no exact boundary.
 */
export const LOW_LOSS_MAX = 0.01
export const GOOD_CONDUCTOR_MIN = 100

export const DEG = Math.PI / 180
