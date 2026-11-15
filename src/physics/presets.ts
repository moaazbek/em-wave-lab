import type { Medium } from './medium'

export interface Preset extends Medium {
  id: string
  label: string
  /** Shown beside the label; all values are typical and approximate. */
  note: string
}

export const PRESETS: readonly Preset[] = [
  { id: 'air', label: 'Air', note: 'εr = 1', epsR: 1, muR: 1, sigma: 0, pec: false },
  { id: 'diel225', label: 'Lossless dielectric', note: 'εr = 2.25', epsR: 2.25, muR: 1, sigma: 0, pec: false },
  { id: 'diel4', label: 'Lossless dielectric', note: 'εr = 4', epsR: 4, muR: 1, sigma: 0, pec: false },
  { id: 'water', label: 'Distilled water (idealized lossless)', note: 'εr = 81', epsR: 81, muR: 1, sigma: 0, pec: false },
  { id: 'drysoil', label: 'Dry soil', note: 'εr ≈ 4, σ ≈ 10⁻⁴ S/m', epsR: 4, muR: 1, sigma: 1e-4, pec: false },
  { id: 'wetsoil', label: 'Wet soil', note: 'εr ≈ 10, σ ≈ 10⁻² S/m', epsR: 10, muR: 1, sigma: 1e-2, pec: false },
  { id: 'seawater', label: 'Seawater', note: 'εr = 72, σ = 4 S/m', epsR: 72, muR: 1, sigma: 4, pec: false },
  { id: 'copper', label: 'Copper', note: 'σ = 5.8×10⁷ S/m', epsR: 1, muR: 1, sigma: 5.8e7, pec: false },
  { id: 'pec', label: 'Perfect conductor', note: 'σ → ∞', epsR: 1, muR: 1, sigma: 0, pec: true },
]

/** Medium 1 is lossless in this version, so it offers only these. */
export const LOSSLESS_PRESET_IDS: readonly string[] = ['air', 'diel225', 'diel4', 'water']

export const getPreset = (id: string): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0]

/** A medium as the student has set it: the preset it started from plus its current values. */
export interface MediumState extends Medium {
  preset: string
}

export function fromPreset(id: string): MediumState {
  const p = getPreset(id)
  return { preset: p.id, epsR: p.epsR, muR: p.muR, sigma: p.sigma, pec: p.pec }
}

/** Edit some values; every other value is kept, and the preset name stays as the origin. */
export function editMedium(m: MediumState, patch: Partial<Medium>): MediumState {
  return { ...m, ...patch }
}

/** True when the current values differ from the preset the medium started as. */
export function isCustomized(m: MediumState): boolean {
  const p = getPreset(m.preset)
  return p.epsR !== m.epsR || p.muR !== m.muR || p.sigma !== m.sigma || p.pec !== m.pec
}
