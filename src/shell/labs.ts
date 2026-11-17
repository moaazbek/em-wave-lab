import { ComponentType, lazy } from 'react'
import type { CourseCode } from './courses'

export interface LabEntry {
  /** Route: "#/<slug>". Never change a published slug: shared links depend on it. */
  slug: string
  course: CourseCode
  /** Number within its course, in textbook order. */
  number: string
  title: string
  summary: string
  /** Textbook reference shown under the summary, e.g. "Cheng § 8-2, …". */
  tag: string
  /** One line on the model's scope, shown under the course on the home page. */
  model: string
  component: ComponentType<{ query: string }>
}

/** Registry of labs. A new lab is one more entry here plus its folder under src/labs/. */
export const LABS: LabEntry[] = [
  {
    slug: 'plane-wave-incidence',
    course: 'EEE 361',
    number: '01',
    title: 'Plane-wave incidence',
    summary:
      'A uniform plane wave meets a plane boundary between two media. See the standing wave, refraction, the Brewster angle, total reflection and the skin effect, with the same numbers you get by hand.',
    tag: 'Cheng § 8-2, 8-3, 8-5 to 8-8, 8-10',
    model: 'Model: uniform plane waves, linear isotropic homogeneous media, steady state. Material values are typical and approximate.',
    component: lazy(() => import('../labs/plane-wave-incidence')),
  },
  {
    slug: 'eee321-three-phase-transformer',
    course: 'EEE 321',
    number: '01',
    title: 'Three-phase transformer connections',
    summary:
      'Y–Y, Y–Δ, Δ–Y and Δ–Δ banks of three single-phase transformers. See the current move in every winding and line, the phasors of both sides, the √3 factors and the 30° shift.',
    tag: 'Chapman § 2.10',
    model: 'Model: three ideal single-phase transformers, balanced load, no circulating current in a delta; the third-harmonic view is illustrative.',
    component: lazy(() => import('../labs/eee321-three-phase-transformer')),
  },
  {
    slug: 'eee321-rotating-loop',
    course: 'EEE 321',
    number: '02',
    title: 'The rotating loop',
    summary:
      'One loop turns between curved pole faces, fed by a battery through a resistor. Load it or drive it and see it settle as a motor or a generator, with the commutator, the forces and the power flow.',
    tag: 'Chapman § 7.1',
    model: 'Model: steady state of the simple rotating loop; $A_P = \\pi r l$ ignores the gaps between the poles; the only loss is $i^2R$.',
    component: lazy(() => import('../labs/eee321-rotating-loop')),
  },
]

export interface PlannedLab {
  course: CourseCode
  number?: string
  /** May contain inline maths between dollar signs. */
  title: string
  tag?: string
}

/** Announced, not built yet. Shown as text only. */
export const PLANNED: PlannedLab[] = [
  { course: 'EEE 361', title: "Faraday's law and moving loops" },
  { course: 'EEE 361', title: 'Transmission lines' },
  { course: 'EEE 321', number: '03', title: 'Armature windings and $E_A$', tag: '§ 7.3, 7.5' },
]
