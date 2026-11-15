import { describe, expect, it } from 'vitest'
import { DARK, LIGHT, Palette, hexToRgb } from './palette'

/** Machado et al. (2009) severity-1.0 matrices, applied in linear RGB. */
const CVD: Record<string, number[][]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
}
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)

function oklab(hex: string, m: number[][]): number[] {
  const [r0, g0, b0] = hexToRgb(hex).map((v) => lin(v / 255))
  const [r, g, b] = m.map((row) => Math.min(1, Math.max(0, row[0] * r0 + row[1] * g0 + row[2] * b0)))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s,
  ]
}
const dE = (a: string, b: string, m: number[][]) => {
  const x = oklab(a, m), y = oklab(b, m)
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

describe('wave colours stay distinguishable under colour-vision deficiency', () => {
  for (const [name, p] of [['light', LIGHT], ['dark', DARK]] as [string, Palette][]) {
    it(name, () => {
      const waves = [p.inc, p.ref, p.trn]
      for (const [kind, m] of Object.entries(CVD))
        for (let i = 0; i < 3; i++)
          for (let j = i + 1; j < 3; j++)
            expect(dE(waves[i], waves[j], m), `${kind} ${waves[i]} vs ${waves[j]}`).toBeGreaterThan(8)
      // the two ends of the field map must differ strongly from each other and from neutral
      for (const m of Object.values(CVD)) {
        expect(dE(p.field[0], p.field[4], m)).toBeGreaterThan(20)
        expect(dE(p.field[0], p.field[2], m)).toBeGreaterThan(20)
        expect(dE(p.field[4], p.field[2], m)).toBeGreaterThan(20)
      }
    })
  }
})
