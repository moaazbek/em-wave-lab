import { DEG, brewsterAngle, fromPreset } from '../../physics'
import { DEFAULT_STATE, LabState } from './state'

export interface Experiment {
  id: string
  title: string
  section: string
  setup: LabState
  /** What to try, in one or two short sentences. */
  task: string
  question: string
  answer: string
  /** Optional button inside the answer that moves the lab to the answer. */
  reveal?: { label: string; patch: Partial<LabState> }
}

const base: LabState = { ...DEFAULT_STATE, part: 'total', rays: true, comp: 'x' }
const thetaB = brewsterAngle(fromPreset('air'), fromPreset('diel225'), 'par')! / DEG

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'pec-normal',
    title: 'Normal incidence on a perfect conductor',
    section: '8-6',
    setup: { ...base, m1: fromPreset('air'), m2: fromPreset('pec'), f: 3e8, thetaDeg: 0, pol: 'perp', quantity: 'E' },
    task: 'Watch the map and the plot below it. Then switch the field from $E$ to $H$.',
    question: 'Where are the zeros of $E$? Where are the zeros of $H$?',
    answer:
      'The zeros of $E$ are at $z = -n\\lambda_1/2$ ($n = 0, 1, 2, \\dots$), so one zero is on the conductor itself. The zeros of $H$ are at $z = -(2n+1)\\lambda_1/4$, exactly between the zeros of $E$, and $H$ is maximum on the conductor. The zeros do not move: this is a pure standing wave ($S \\to \\infty$). $E$ and $H$ are also a quarter period apart in time.',
    reveal: { label: 'Show H', patch: { quantity: 'H', comp: 'x' } },
  },
  {
    id: 'dielectric-min',
    title: 'Air to a dielectric',
    section: '8-8',
    setup: { ...base, m1: fromPreset('air'), m2: fromPreset('diel4'), f: 1e9, thetaDeg: 0, pol: 'perp', quantity: 'E' },
    task: 'Look at the envelope of $|E|$ in the plot along $z$.',
    question: 'Why is the field at the interface a minimum, not a maximum?',
    answer:
      'Medium 2 has the smaller intrinsic impedance ($\\eta_2 = \\eta_0/2$), so $\\Gamma = (\\eta_2 - \\eta_1)/(\\eta_2 + \\eta_1) = -1/3$ is negative. At $z = 0$ the reflected field is opposite to the incident field: $|E| = E_{i0}(1 - 1/3)$, the minimum. The maximum $E_{i0}(1 + 1/3)$ is a quarter wavelength in front, so $S = 2$. If you exchange the two media, $\\Gamma$ becomes positive and the interface becomes a maximum.',
    reveal: { label: 'Exchange the media', patch: { m1: fromPreset('diel4'), m2: fromPreset('air') } },
  },
  {
    id: 'brewster',
    title: 'Brewster angle',
    section: '8-10.3',
    setup: { ...base, m1: fromPreset('air'), m2: fromPreset('diel225'), f: 1e9, thetaDeg: 30, pol: 'par', quantity: 'H' },
    task: 'Drag the incident ray, or drag on the plot of $|\\Gamma|$ against $\\theta_i$.',
    question: 'At which angle does the parallel-polarized reflection disappear?',
    answer:
      `At $\\theta_{B\\parallel} = \\tan^{-1}\\sqrt{\\epsilon_2/\\epsilon_1} = \\tan^{-1}(1.5)$ = ${thetaB.toFixed(2)}°. There $\\Gamma_\\parallel = 0$: the reflected ray vanishes and the standing-wave pattern in Medium 1 disappears. Perpendicular polarization has no such angle when $\\mu_1 = \\mu_2$; switch the polarization to compare.`,
    reveal: { label: 'Go to the Brewster angle', patch: { thetaDeg: Number(thetaB.toFixed(4)) } },
  },
  {
    id: 'total-reflection',
    title: 'Total reflection',
    section: '8-10.1',
    setup: { ...base, m1: fromPreset('diel4'), m2: fromPreset('air'), f: 1e9, thetaDeg: 20, pol: 'perp', quantity: 'E' },
    task: 'Increase $\\theta_i$ slowly past the critical angle $\\theta_c$ = 30°.',
    question: 'What is in Medium 2 when $\\theta_i > \\theta_c$?',
    answer:
      'Not zero field, but no transmitted ray. Medium 2 holds an evanescent wave: it travels along $x$ together with the pattern in Medium 1, and its amplitude decays in $z$ as $e^{-\\alpha z}$. It carries no average power into Medium 2, so $|\\Gamma| = 1$. Only the phase of $\\Gamma$ changes with the angle. At $\\theta_i$ = 45° the decay constant equals $\\beta_0$.',
    reveal: { label: 'Go to 45°', patch: { thetaDeg: 45 } },
  },
  {
    id: 'skin-depth',
    title: 'Skin depth',
    section: '8-3.2',
    setup: { ...base, m1: fromPreset('air'), m2: fromPreset('copper'), f: 3e6, thetaDeg: 0, pol: 'perp', quantity: 'H' },
    task: 'Medium 2 is drawn on a magnified $z$ scale. Change $f$, then change $\\sigma_2$.',
    question: 'How do $f$ and $\\sigma$ change the penetration into copper?',
    answer:
      'The skin depth is $\\delta = 1/\\sqrt{\\pi f\\mu\\sigma}$, so it falls as $1/\\sqrt{f}$ and as $1/\\sqrt{\\sigma}$. For copper at 3 MHz, $\\delta$ = 0.038 mm; at 100 times the frequency it is 10 times smaller. Almost all the power is reflected. The map shows $H$ because $E$ inside copper is extremely small ($|\\tau| \\approx 2|\\eta_2|/\\eta_1$), but $H$ at the surface is twice the incident $H$.',
  },
  {
    id: 'seawater',
    title: 'Same material, three behaviours',
    section: '8-3',
    setup: { ...base, m1: fromPreset('air'), m2: fromPreset('seawater'), f: 5e6, thetaDeg: 0, pol: 'perp', quantity: 'E', advanced: true },
    task: 'Sweep $f$ from 1 kHz to 100 GHz and watch the class of Medium 2.',
    question: 'Is seawater a conductor or a dielectric?',
    answer:
      'It depends on the frequency, because the loss tangent $\\sigma/\\omega\\epsilon$ falls as $1/f$. With $\\epsilon_r$ = 72 and $\\sigma$ = 4 S/m, seawater is a good conductor below about 10 MHz ($\\sigma/\\omega\\epsilon > 100$), a general lossy medium between 10 MHz and 100 GHz, and a low-loss dielectric near 100 GHz ($\\sigma/\\omega\\epsilon < 0.01$). In the advanced view, compare the two approximate formulas with the exact values: each is accurate only in its own region. (Real seawater also changes $\\epsilon_r$ at high frequency; this model keeps it constant.)',
  },
]
