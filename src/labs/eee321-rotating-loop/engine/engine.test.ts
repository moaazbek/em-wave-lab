import { describe, expect, it } from 'vitest'
import {
  MachineParams, brushVoltageAtAngle, conductorStates, isCommutating, loopEmfAtAngle, machineConstants,
  operatingLineOmega, operatingLineTorque, poleAt, solveSpeedMode, solveTorqueMode,
} from './index'

/** Relative tolerance 1e-9; exact comparison when the expected value is zero. */
function near(actual: number, expected: number, rel = 1e-9) {
  if (expected === 0) expect(actual).toBe(0)
  else expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(rel)
}

const EX71: MachineParams = { r: 0.5, l: 1.0, R: 0.3, B: 0.25, VB: 120 }
const P71: MachineParams = { B: 0.4, VB: 48, l: 0.5, R: 0.4, r: 0.25 }

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('Chapman Example 7-1', () => {
  it('flux and (2/pi) phi', () => {
    const c = machineConstants(EX71)
    near(c.phi, Math.PI * 0.5 * 1.0 * 0.25)
    expect(c.phi.toFixed(6)).toBe('0.392699')
    near(c.k, 0.25)
    near((2 / Math.PI) * c.phi, 0.25)
    near(c.AP, Math.PI * 0.5)
  })
  it('(b) starting current and no load', () => {
    const c = machineConstants(EX71)
    near(c.iStart, 400)
    const s = solveTorqueMode({ ...EX71, tauLoad: 0 })
    expect(s.i).toBe(0)
    near(s.eInd, 120)
    near(s.omega, 480)
    near(c.omegaNl, 480)
    expect(s.mode).toBe('idle')
    // the starting current is also the Mode B result at omega = 0
    const st = solveSpeedMode({ ...EX71, omega: 0 })
    near(st.i, 400)
    expect(st.eInd).toBe(0)
  })
  it('(c) 10 N·m load', () => {
    const s = solveTorqueMode({ ...EX71, tauLoad: 10 })
    near(s.i, 40)
    near(s.eInd, 108)
    near(s.omega, 432)
    near(s.tauLoad * s.omega, 4320)
    near(s.Pshaft, 4320)
    near(s.PB, 4800)
    near(s.PR, 480)
    near(s.Pconv, 4320)
    expect(s.mode).toBe('motor')
  })
  it('(d) 7.5 N·m applied in the direction of rotation', () => {
    const s = solveTorqueMode({ ...EX71, tauLoad: -7.5 })
    near(s.i, -30)
    near(s.eInd, 129)
    near(s.omega, 516)
    near(s.PB, -3600)
    near(s.PR, 270)
    near(s.Pconv, -3870)
    expect(s.mode).toBe('generator')
  })
  it('(e) no load with B = 0.20 T', () => {
    const s = solveTorqueMode({ ...EX71, B: 0.2, tauLoad: 0 })
    near(s.k, 0.2)
    near(s.omega, 600)
  })
  it('stall torque', () => {
    near(machineConstants(EX71).tauStall, 100)
    const s = solveTorqueMode({ ...EX71, tauLoad: 100 })
    expect(s.exceedsStall).toBe(true)
    expect(s.turnsPositive).toBe(false)
    expect(solveTorqueMode({ ...EX71, tauLoad: 99.8 }).exceedsStall).toBe(false)
  })
})

describe('Chapman Problem 7-1, Mode B', () => {
  it('500 rad/s: generator, 5 A into the battery', () => {
    const s = solveSpeedMode({ ...P71, omega: 500 })
    near(s.eInd, 50)
    near(s.i, -5)
    near(s.PB, -240)
    near(s.tauInd, -0.5)
    near(s.tauPrimeMover, 0.5)
    expect(s.mode).toBe('generator')
  })
  it('550 rad/s: generator', () => {
    const s = solveSpeedMode({ ...P71, omega: 550 })
    near(s.eInd, 55)
    near(s.i, -17.5)
    expect(s.mode).toBe('generator')
  })
  it('450 rad/s: motor, 7.5 A into the machine', () => {
    const s = solveSpeedMode({ ...P71, omega: 450 })
    near(s.eInd, 45)
    near(s.i, 7.5)
    near(s.PB, 360)
    expect(s.mode).toBe('motor')
  })
})

describe('invariants on random cases', () => {
  const rnd = mulberry32(321)
  const logU = (lo: number, hi: number) => Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo)))
  const params = (): MachineParams => ({
    VB: logU(1, 500), R: logU(0.01, 10), B: 0.05 + rnd() * 1.45, r: 0.05 + rnd() * 0.95, l: 0.1 + rnd() * 1.9,
  })
  const check = (s: ReturnType<typeof solveTorqueMode>) => {
    const scale = s.VB * s.iStart
    // V_B i = e_ind i + i^2 R and e_ind i = tau_ind omega (relative 1e-9 of the power scale)
    expect(Math.abs(s.VB * s.i - (s.eInd * s.i + s.i * s.i * s.R)) / scale).toBeLessThan(1e-9)
    expect(Math.abs(s.eInd * s.i - s.tauInd * s.omega) / scale).toBeLessThan(1e-9)
    // e_ind = 2 v B l (7-5) = (2/pi) phi omega (7-6); tau_ind = 2 r i l B (7-15) = (2/pi) phi i (7-16)
    expect(Math.abs(s.eInd - 2 * s.v * s.B * s.l) / s.VB).toBeLessThan(1e-9)
    expect(Math.abs(s.eInd - (2 / Math.PI) * s.phi * s.omega) / s.VB).toBeLessThan(1e-9)
    expect(Math.abs(s.tauInd - 2 * s.r * s.i * s.l * s.B) / s.tauStall).toBeLessThan(1e-9)
    expect(Math.abs(s.tauInd - (2 / Math.PI) * s.phi * s.i) / s.tauStall).toBeLessThan(1e-9)
    // the operating point lies on the operating line
    expect(Math.abs(operatingLineOmega(s, s.tauInd) - s.omega) / s.omegaNl).toBeLessThan(1e-9)
  }
  it('Mode A: 600 cases, tau_ind = tau_load', () => {
    for (let n = 0; n < 600; n++) {
      const p = params()
      const c = machineConstants(p)
      const tauLoad = (rnd() * 2 - 1) * c.tauStall * 0.999
      const s = solveTorqueMode({ ...p, tauLoad })
      check(s)
      expect(Math.abs(s.tauInd - tauLoad) / c.tauStall).toBeLessThan(1e-9)
      expect(s.turnsPositive).toBe(true)
      expect(s.mode).toBe(tauLoad > 0 ? 'motor' : tauLoad < 0 ? 'generator' : 'idle')
    }
  })
  it('Mode B: 600 cases', () => {
    for (let n = 0; n < 600; n++) {
      const p = params()
      const c = machineConstants(p)
      const omega = rnd() * 2 * c.omegaNl
      const s = solveSpeedMode({ ...p, omega })
      check(s)
      expect(Math.abs(operatingLineTorque(c, omega) - s.tauInd) / c.tauStall).toBeLessThan(1e-9)
      expect(s.mode).toBe(omega < c.omegaNl ? 'motor' : 'generator')
    }
  })
})

describe('waveforms', () => {
  const s = solveTorqueMode({ ...EX71, tauLoad: 10 })
  const peak = 2 * s.v * s.B * s.l
  it('pole-arc fraction 1: |e_loop| = 2 v B l away from the pole boundaries', () => {
    for (let d = 0; d < 720; d += 0.7) {
      const th = (d * Math.PI) / 180
      if (Math.abs(Math.abs(Math.cos(th))) < 1e-9) continue
      near(Math.abs(loopEmfAtAngle(th, s, 1)), peak)
    }
    near(peak, s.eInd)
  })
  it('the brush voltage is never negative and equals |e_loop|', () => {
    for (const f of [1, 0.9, 0.6]) for (let d = -360; d < 720; d += 0.37) {
      const th = (d * Math.PI) / 180
      const e = brushVoltageAtAngle(th, s, f)
      expect(e).toBeGreaterThanOrEqual(0)
      expect(e).toBe(Math.abs(loopEmfAtAngle(th, s, f)))
    }
  })
  it('pole-arc fraction < 1: zero voltage in the gaps, and the brushes short the segments there', () => {
    const f = 0.9 // gap of 18° centred on 90° and 270°
    for (const d of [82, 85, 90, 95, 98, 262, 270, 278]) {
      const th = (d * Math.PI) / 180
      expect(loopEmfAtAngle(th, s, f)).toBe(0)
      expect(isCommutating(th, f)).toBe(true)
    }
    for (const d of [0, 45, 80, 100, 180, 260, 280]) {
      const th = (d * Math.PI) / 180
      expect(Math.abs(loopEmfAtAngle(th, s, f))).toBeGreaterThan(0)
      expect(isCommutating(th, f)).toBe(false)
    }
  })
  it('loop voltage changes sign each half turn; poles are N left, S right', () => {
    expect(poleAt(0, 0.9)).toBe('S')
    expect(poleAt(Math.PI, 0.9)).toBe('N')
    expect(loopEmfAtAngle(0, s, 0.9)).toBeGreaterThan(0)
    expect(loopEmfAtAngle(Math.PI, s, 0.9)).toBeLessThan(0)
  })
  it('conductors: voltage opposes motor current, force is CCW for a motor and CW for a generator', () => {
    const [ab, cd] = conductorStates(0, s, 0.9)
    expect(ab.pole).toBe('S')
    expect(cd.pole).toBe('N')
    expect(ab.emf).toBe('in')
    expect(ab.current).toBe('out')
    expect(cd.emf).toBe('out')
    expect(cd.current).toBe('in')
    near(ab.force, 40 * 1.0 * 0.25)
    near(cd.force, 10)
    const g = solveTorqueMode({ ...EX71, tauLoad: -7.5 })
    const [gab] = conductorStates(0, g, 0.9)
    expect(gab.current).toBe(gab.emf) // generator: the induced voltage drives the current
    expect(gab.force).toBeLessThan(0)
    const [gap] = conductorStates(Math.PI / 2, s, 0.9)
    expect(gap.pole).toBeNull()
    expect(gap.emf).toBeNull()
    expect(gap.current).toBeNull()
    expect(gap.force).toBe(0)
  })
})
