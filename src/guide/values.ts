/**
 * Every number written in the guide's text, as `{{key: shown}}`, comes from one of these entries: the same
 * derivation the lab uses for its results, from a preset's URL state. The guide test checks that the shown text is
 * a correct rounding of the value. Used only by the tests; the guide page shows the text as written.
 */
import { derive as armDerive } from '../labs/eee321-armature-winding/derive'
import { decodeState as armDecode } from '../labs/eee321-armature-winding/state'
import { derive as loopDerive } from '../labs/eee321-rotating-loop/derive'
import { decodeState as loopDecode } from '../labs/eee321-rotating-loop/state'
import { derive as xfDerive } from '../labs/eee321-three-phase-transformer/derive'
import { decodeState as xfDecode } from '../labs/eee321-three-phase-transformer/state'
import { derive as waveDerive } from '../labs/plane-wave-incidence/derive'
import { decodeState as waveDecode } from '../labs/plane-wave-incidence/state'

const wave = (q: string) => waveDerive(waveDecode(q))
const xf = (q: string) => xfDerive(xfDecode(q))
const loop = (q: string) => loopDerive(loopDecode(q))
const arm = (q: string) => armDerive(armDecode(q))

export const VALUES: Record<string, () => number> = {
  // EEE 361: air → lossless dielectric (εr = 4), normal incidence, 1 GHz
  'wave.normal.Gamma': () => wave('th=0').sol.Gamma.re,
  'wave.normal.tau': () => wave('th=0').sol.tau.re,
  'wave.normal.S': () => wave('th=0').sw.S,
  // EEE 321 Lab 01, ideal Y–Δ 13.8 kV, a = 10
  'xf.yd.ratio': () => xf('p=yd').sol.ratio,
  'xf.yd.a': () => xf('p=yd').a,
  'xf.yd.shift': () => xf('p=yd').sol.shiftDeg,
  // EEE 321 Lab 01, real bank, Problem 2-12
  'xf.r212.VR': () => xf('p=r212').sol.real!.VR,
  'xf.r212.eta': () => xf('p=r212').sol.real!.eta,
  // EEE 321 Lab 02, Example 7-1 (c) and Problem 7-1 at 500 rad/s
  'loop.ex71c.i': () => loop('p=ex71c').op.i,
  'loop.ex71c.omega': () => loop('p=ex71c').op.omega,
  'loop.p71-500.i': () => loop('p=p71-500').op.i,
  // EEE 321 Lab 03
  'arm.lap16.a': () => arm('p=lap16').f.a,
  'arm.p72.EA': () => arm('p=p72').f.EA,
  'arm.p72.EAdz': () => arm('p=p72').f.EAdz,
  'arm.ex73.EA': () => arm('p=ex73').f.EA,
}
