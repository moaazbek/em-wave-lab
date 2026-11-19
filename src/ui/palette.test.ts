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

/* ---------- contrast of buttons, chips, disclosures, experiment items and lab tiles ---------- */

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => lin(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
/** color-mix(in srgb, a p%, b): channel-wise interpolation of the sRGB values. */
const mix = (a: string, b: string, p: number) => {
  const x = hexToRgb(a), y = hexToRgb(b)
  return '#' + x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, '0')).join('')
}

describe('interactive elements reach WCAG contrast (text 4.5 : 1, borders and icons 3 : 1)', () => {
  for (const [name, p] of [['light', LIGHT], ['dark', DARK]] as [string, Palette][]) {
    it(name, () => {
      const surfaces = { bg: p.bg, panel: p.panel, sunk: p.sunk }
      const text = (fg: string, bg: string, what: string) => expect(contrast(fg, bg), `${what}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      const edge = (fg: string, bg: string, what: string) => expect(contrast(fg, bg), `${what}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(3)
      // Button primary: --bg text on --ink, and on the hover fill color-mix(--ink 85 %, --bg)
      text(p.bg, p.ink, 'primary rest')
      text(p.bg, mix(p.ink, p.bg, 0.85), 'primary hover')
      // Button secondary / small and Chip: --ink text, --mute border at rest (on --bg or --panel), --ink border and --sunk fill on hover
      for (const [k, s] of Object.entries(surfaces)) text(p.ink, s, `secondary / chip text on ${k}`)
      edge(p.mute, p.bg, 'secondary border on bg'); edge(p.mute, p.panel, 'secondary border on panel')
      edge(p.ink, p.sunk, 'secondary hover border')
      // Chip "current": --bg text on --ink
      text(p.bg, p.ink, 'chip current')
      // Disclosure, ExperimentItem, LabTile: --ink titles and chevron / arrow icons, --mute secondary text, on --panel and on the --sunk hover fill
      for (const s of [p.panel, p.sunk]) {
        text(p.ink, s, 'title'); text(p.mute, s, 'state text / preview / summary')
        edge(p.ink, s, 'chevron or arrow icon')
        edge(p.mute, s, '"Open lab" pill border')
      }
      // light-theme tertiary text (numbers, footer) now meets AA; dark --faint (3.66 : 1) is unchanged (DESIGN.md § 13)
      if (name === 'light') { text(p.faint, p.panel, 'faint on panel'); text(p.faint, p.bg, 'faint on bg') }
      // the open experiment's --inc left rule is a mark next to an --ink border, not the only cue
      edge(p.ink, p.panel, 'open experiment border')
    })
  }
})
