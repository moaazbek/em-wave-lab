import { ComponentType, lazy } from 'react'

export interface LabEntry {
  slug: string
  number: string
  title: string
  summary: string
  /** Sections of Cheng, Field and Wave Electromagnetics (2nd ed.) that the lab covers. */
  sections: string
  component: ComponentType<{ query: string }>
}

/** Registry of labs. A new lab is one more entry here plus its folder under src/labs/. */
export const LABS: LabEntry[] = [
  {
    slug: 'plane-wave-incidence',
    number: '01',
    title: 'Plane-wave incidence',
    summary:
      'A uniform plane wave meets a plane boundary between two media. See the standing wave, refraction, the Brewster angle, total reflection and the skin effect, with the same numbers you get by hand.',
    sections: '8-2, 8-3, 8-5 to 8-8, 8-10',
    component: lazy(() => import('../labs/plane-wave-incidence')),
  },
]

/** Announced, not built yet. Shown as text only. */
export const PLANNED: string[] = ["Faraday's law and moving loops", 'Transmission lines']
