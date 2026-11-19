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
    answer: '33 kV on the $\\Delta$ side (the winding voltage is the line voltage) and $\\sqrt3 \\times 11 = 19.05$ kV on the Y side. At rated load, 30 MVA: $I_{LP} = 30\\,\\text{MVA}/(\\sqrt3 \\cdot 33\\,\\text{kV}) = 524.9$ A and $I_{LS} = 30\\,\\text{MVA}/(\\sqrt3 \\cdot 19.05\\,\\text{kV}) = 909.1$ A.',
    reveal: { label: 'Apply rated load', patch: { S3: 30e6 } },
  },
  {
    id: 'line-phase', title: 'Line or phase current?', section: '2.10', tag: 'Ex. 2-9',
    setup: { ...fromPreset('ex29'), S3: 0 },
    task: 'Example 2-9 bank (Δ–Y, 13.8 kV / 208 V, 50 kVA), no load yet.',
    question: 'At rated load, is the current in a primary winding 2.092 A or 1.208 A?',
    answer: '1.208 A in the winding, 2.092 A in the line. The primary is a $\\Delta$, so $I_{LP} = \\sqrt3\\, I_{\\phi P}$. Chapman gives 1.208 A as the winding current.',
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

const ex29Ohm = (() => {
  // Example 2-9 in ohms on the HV side: Z_base,HV = (13 800 V)² / (50 kVA / 3)
  const Zb = 13800 ** 2 / (50e3 / 3)
  return { zR: 0.01 * Zb, zX: 0.07 * Zb }
})()

/** Guided experiments of the real bank (Model: Real bank). */
export const REAL_EXPERIMENTS: Experiment[] = [
  {
    id: 'r-delta', title: 'The Δ trap', section: '2.10', tag: 'Prob. 2-12',
    setup: { ...fromPreset('r212'), hero: 'circuit' },
    task: 'Problem 2-12: the SC test is done on the HV side, which is connected in $\\Delta$. The bank line readings are 1400 V, 1.80 A and 912 W.',
    question: 'The SC test reads 1.80 A on the $\\Delta$ side. What current flows in one winding?',
    answer: '1.039 A. On a $\\Delta$ side the line current is $\\sqrt3$ times the winding current, so $I_\\phi = 1.80/\\sqrt3$ = 1.039 A. The voltage is the line voltage, 1400 V, and $P_\\phi$ = 912/3 = 304 W. The button enters these one-transformer readings: the circuit does not change.',
    reveal: { label: 'Enter one-transformer readings', patch: { scForm: 'unit', scV: 1400, scI: 1.8 / Math.sqrt(3), scP: 304 } },
  },
  {
    id: 'r-lead', title: 'Leading load', section: '2.7', tag: 'Eq. (2-62)',
    setup: fromPreset('r212'),
    task: 'Problem 2-12 bank at rated load, PF 0.9 lagging: VR = 2.94 %.',
    question: 'At 0.9 PF leading, is VR positive or negative?',
    answer: 'Negative: VR = −1.01 %. With a leading current, the drop $jX_{eq}I$ points partly along $V_{\\phi S}$ in the opposite way, so $|V_{\\phi P}/a|$ is smaller than $|V_{\\phi S}|$. The secondary voltage rises with load.',
    reveal: { label: 'Make the load leading', patch: { lagging: false } },
  },
  {
    id: 'r-half', title: 'Half the load', section: '2.7', tag: 'Eq. (2-67)',
    setup: fromPreset('r212'),
    task: 'Problem 2-12 bank at rated load, PF 0.9 lagging: $P_{Cu}$ = 586.4 W, $P_{core}$ = 1000.5 W.',
    question: 'Halve the load. What happens to the copper loss and to the core loss?',
    answer: 'The copper loss falls to one quarter, 146.6 W, because it goes with $I^2$. The core loss barely changes, 971.8 W, because it depends on the voltage, which hardly moves. So $\\eta$ falls a little, to 96.02 %.',
    reveal: { label: 'Set half load', patch: { S3: 30e3 } },
  },
  {
    id: 'r-side', title: 'HV or LV?', section: '2.5', tag: 'Eq. (2-62)',
    setup: { ...fromPreset('r212'), hero: 'circuit', refSide: 'P' },
    task: 'Problem 2-12 bank. The circuit is drawn referred to the HV side.',
    question: 'Refer the circuit to the LV side instead of the HV side. Does VR change?',
    answer: 'No. Every impedance is divided by $a^2$, every voltage by $a$ and every current is multiplied by $a$. VR stays 2.94 %, and so do the losses and $\\eta$. In per-unit the values are the same on both sides.',
    reveal: { label: 'Refer to the LV side', patch: { refSide: 'S' } },
  },
  {
    id: 'r-ohm', title: 'Ohms or per-unit', section: '2.6', tag: 'Ex. 2-9',
    setup: fromPreset('r29'),
    task: 'Example 2-9: 0.01 + j0.07 pu, full load at 0.8 PF lagging.',
    question: 'Do the ohm method and the per-unit method give the same VR?',
    answer: 'Yes: VR = 5.1 % both ways. In ohms on the HV side, $Z_{base}$ = 11 426 Ω, so $Z_{SE,P}$ = 114.3 + j799.8 Ω. The button enters these ohm values.',
    reveal: { label: 'Use ohms on the HV side', patch: { zFrom: 'ohmP', ...ex29Ohm } },
  },
  {
    id: 'r-core', title: 'No core data', section: '2.7', tag: 'midterm style',
    setup: fromPreset('rmid'),
    task: 'Three 10 MVA, 33/11 kV units in $\\Delta$–Y, $Z$ = 0.002 + j0.083 pu, rated load at 0.9 PF lagging. No OC data is given.',
    question: 'With the shunt branch neglected, which losses remain?',
    answer: 'Only the copper loss: $P_{Cu} = 3I^2R_{eq}$ = 60 kW, $P_{core}$ = 0. So $\\eta$ = 27 MW / 27.06 MW = 99.78 %. The circuit shows the shunt branch as neglected.',
    reveal: { label: 'Show the circuit', patch: { hero: 'circuit' } },
  },
]
