/**
 * Single source of colour for CSS (as custom properties) and for the canvas field map.
 * The three wave colours were checked for colour-vision deficiency (protan, deutan, tritan)
 * with a Delta-E validator; see README "Decisions".
 */
export interface Palette {
  bg: string
  panel: string
  sunk: string
  ink: string
  mute: string
  faint: string
  rule: string
  /** incident, reflected, transmitted */
  inc: string
  ref: string
  trn: string
  warn: string
  /** Diverging field map: stops from -1 to +1 (neutral in the middle). */
  field: readonly [string, string, string, string, string]
  /** Ink used for overlays drawn on top of the field map. */
  mapInk: string
  mapHalo: string
}

export const LIGHT: Palette = {
  bg: '#f4f2ec', panel: '#fbfaf6', sunk: '#ece9e1',
  ink: '#16181b', mute: '#565b62', faint: '#8e9299', rule: '#d6d2c7',
  inc: '#b07a00', ref: '#a31c6b', trn: '#16a37f', warn: '#a8431a',
  field: ['#08306b', '#4f93d2', '#f1efe8', '#ee8a4e', '#b5380a'],
  mapInk: '#16181b', mapHalo: '#f6f4ee',
}

export const DARK: Palette = {
  bg: '#0b0e11', panel: '#11151a', sunk: '#080a0d',
  ink: '#e9e6df', mute: '#a0a6ad', faint: '#69707a', rule: '#262c34',
  inc: '#f2c744', ref: '#d9488f', trn: '#5fe0c0', warn: '#ff9d6b',
  field: ['#7cd2ff', '#1a66b8', '#0c1014', '#c2481a', '#ff9a52'],
  mapInk: '#f1eee7', mapHalo: '#0b0e11',
}

/**
 * EEE 321 labs: physical meaning -> existing, validated token (DESIGN.md "Colour by meaning — EEE 321 labs").
 * No new colours: voltage, current and mechanical quantities reuse the three wave colours.
 */
export const MACHINE_COLOR = {
  /** e_ind, V_B, loop and brush voltages */
  voltage: 'var(--inc)',
  /** i, current marks ⊙ / ⊗, current arrow */
  current: 'var(--ref)',
  /** tau, omega, n, F, shaft power */
  mechanical: 'var(--trn)',
  /** B-field lines */
  field: 'var(--mute)',
  /** poles, rotor outline, wiring */
  structure: 'var(--ink)',
} as const

/**
 * EEE 321 Lab 01 (three-phase transformer): phase -> existing token. Phase A/a (transformer 1) amber,
 * B/b (transformer 2) magenta, C/c (transformer 3) green. Line-to-line phasors and the neutral use --ink.
 * Primary and secondary are told apart by position and by upper/lower-case labels, never by colour.
 */
export const PHASE_COLOR = ['var(--inc)', 'var(--ref)', 'var(--trn)'] as const

export type ThemeName = 'light' | 'dark'
export const PALETTES: Record<ThemeName, Palette> = { light: LIGHT, dark: DARK }

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * 256-entry lookup table for the diverging field map, packed as little-endian ABGR
 * so it can be written straight into a Uint32Array view of ImageData.
 */
export function fieldLut(p: Palette): Uint32Array {
  const stops = p.field.map(hexToRgb)
  const lut = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * (stops.length - 1)
    const k = Math.min(stops.length - 2, Math.floor(t))
    const u = t - k
    const a = stops[k], b = stops[k + 1]
    const r = Math.round(a[0] + (b[0] - a[0]) * u)
    const g = Math.round(a[1] + (b[1] - a[1]) * u)
    const bl = Math.round(a[2] + (b[2] - a[2]) * u)
    lut[i] = (255 << 24) | (bl << 16) | (g << 8) | r
  }
  return lut
}

export const fieldGradientCss = (p: Palette, dir = 'to right') => `linear-gradient(${dir}, ${p.field.join(', ')})`
