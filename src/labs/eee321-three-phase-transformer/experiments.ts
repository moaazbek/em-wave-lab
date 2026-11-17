import type { ExperimentInfo } from '../../ui/teaching'
import { XfState, fromPreset } from './state'

export interface Experiment extends ExperimentInfo {
  setup: XfState
  reveal?: { label: string; patch: Partial<XfState> }
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'trap', title: 'The trap', section: '2.10', tag: 'Eq. (2-89)',
    setup: fromPreset('yd'),
    task: 'Y–Δ bank, 13.8 kV primary, $a = 10$.',
    question: 'What is the secondary line voltage $V_{ll}$?',
    answer: '796.7 V, not 1380 V. Each primary winding sees $V_{LN} = 13\\,800/\\sqrt3 = 7967$ V, so each secondary winding has 796.7 V. On the $\\Delta$ side that winding voltage is the line voltage. The line-voltage ratio is $\\sqrt3\\,a = 17.32$, not $a$.',
    reveal: { label: 'Compare with Y–Y (same a)', patch: { conn: 'YY' } },
  },
  {
    id: 'bank', title: 'The exam bank', section: '2.10', tag: 'Δ–Y bank',
    setup: { ...fromPreset('bank'), S3: 0 },
    task: 'Three single-phase units, each 10 MVA, 33 kV / 11 kV, connected Δ–Y. No load yet.',
    question: 'What are the line-to-line voltage ratings of the bank? And the line currents at rated load?',
    answer: '33 kV on the $\\Delta$ side (the winding voltage is the line voltage) and $\\sqrt3 \\times 11 = 19.05$ kV on the Y side. At rated load, 30 MVA: $I_{L\\text{-}pri} = 30\\,\\text{MVA}/(\\sqrt3 \\cdot 33\\,\\text{kV}) = 524.9$ A and $I_{L\\text{-}sec} = 30\\,\\text{MVA}/(\\sqrt3 \\cdot 19.05\\,\\text{kV}) = 909.1$ A.',
    reveal: { label: 'Apply rated load', patch: { S3: 30e6 } },
  },
  {
    id: 'line-phase', title: 'Line or phase current?', section: '2.10', tag: 'Ex. 2-9',
    setup: { ...fromPreset('ex29'), S3: 0 },
    task: 'Example 2-9 bank (Δ–Y, 13.8 kV / 208 V, 50 kVA), no load yet.',
    question: 'At rated load, is the current in a primary winding 2.092 A or 1.208 A?',
    answer: '1.208 A in the winding, 2.092 A in the line. The primary is a $\\Delta$, so $I_{L\\text{-}pri} = \\sqrt3\\, I_{p\\text{-}pri}$. Chapman gives 1.208 A as the winding current.',
    reveal: { label: 'Apply 50 kVA', patch: { S3: 50e3 } },
  },
  {
    id: 'shift', title: 'Which way is the shift?', section: '2.10', tag: '§ 2.10',
    setup: fromPreset('yd'),
    task: 'Y–Δ bank with phase sequence abc. Look at $V_{AB}$ and $V_{ab}$ in the phasor diagrams.',
    question: 'Does $V_{ab}$ lead or lag $V_{AB}$? What happens with sequence acb?',
    answer: 'With abc, $V_{ab}$ lags $V_{AB}$ by 30°. With acb the same wiring gives a 30° lead. The shift comes from the wiring and the sequence together.',
    reveal: { label: 'Switch to acb', patch: { seq: 'acb' } },
  },
  {
    id: 'no-shift', title: 'Y–Y versus Δ–Δ', section: '2.10', tag: '§ 2.10',
    setup: fromPreset('yy'),
    task: 'A Y–Y bank. Then compare with a Δ–Δ bank.',
    question: 'Is there any phase shift between the primary and secondary line voltages?',
    answer: 'None in either connection. Both sides form their line voltages the same way, so $V_{ab}$ is in phase with $V_{AB}$. For both, $V_{LL}/V_{ll} = a$ (2-88), (2-91).',
    reveal: { label: 'Switch to Δ–Δ', patch: { conn: 'DD' } },
  },
  {
    id: 'harmonic', title: 'Third harmonic', section: '2.10', tag: '§ 2.10',
    setup: { ...fromPreset('yy'), harmonic: true, h: 0.2 },
    task: 'The third-harmonic view is on (illustrative, $h$ = 0.2). Look at the waveform plot.',
    question: 'In Y–Y, where does the third harmonic appear: in the phase voltages, the line voltages, or both? What happens to it in a delta?',
    answer: 'In the phase voltages only. The three third harmonics are in phase ($3 \\times 120° = 360°$), so they cancel in every line voltage. Around a delta they add up to three times one of them and drive a circulating current. This is why Y–Δ has no third-harmonic problem.',
    reveal: { label: 'Switch to Y–Δ', patch: { conn: 'YD' } },
  },
]
