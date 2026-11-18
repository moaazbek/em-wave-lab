import type { ExperimentInfo } from '../../ui/teaching'
import { ArmState, fromPreset } from './state'

export interface Experiment extends ExperimentInfo {
  setup: ArmState
  /** Controls set by the answer button; `cyclePaths` highlights the paths one by one instead. */
  reveal?: { label: string; patch?: Partial<ArmState>; cyclePaths?: boolean }
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'count', title: 'Count the paths', section: '7.3', tag: 'Eq. (7-26)',
    setup: fromPreset('lap16'),
    task: 'Simplex lap winding, 4 poles, 16 coils.',
    question: 'How many brushes and how many parallel paths?',
    answer: '4 brushes and 4 paths: $a = mP = 4$. Each path holds $C/a = 4$ coils between a + brush and a − brush. The button highlights each path in turn.',
    reveal: { label: 'Highlight the paths one by one', cyclePaths: true },
  },
  {
    id: 'duplex', title: 'Simplex → duplex', section: '7.3', tag: 'Ex. 7-3',
    setup: fromPreset('lap16'),
    task: 'Simplex lap, 4 poles, 16 coils.',
    question: 'Make it duplex. What happens to $a$, to $y_c$ and to the brush width?',
    answer: '$a$ doubles to $mP = 8$, $y_c = \\pm 2$ (each coil skips one segment), and the brushes are wider: they span two segments, as in Example 7-3. The two windings of the duplex armature are two separate closed cycles.',
    reveal: { label: 'Make it duplex', patch: { m: 2 } },
  },
  {
    id: 'wave', title: 'Lap → wave, same coils and flux', section: '7.3', tag: 'Eq. (7-28)',
    setup: fromPreset('lap16'),
    task: 'Simplex lap, 4 poles, 16 coils. Watch $E_A$ and $R_A$ in the results.',
    question: 'Change it to a wave winding. Does $E_A$ go up or down? By how much? And $R_A$?',
    answer: '$a$ goes from $P = 4$ to 2, so each path has twice as many conductors: $E_A$ is multiplied by $P/2 = 2$ and $R_A$ by $(P/2)^2 = 4$. (A simplex wave with 16 coils and 4 poles cannot be built, since $2(C \\pm 1)/P$ is not an integer, but the numbers still follow the book.)',
    reveal: { label: 'Change to wave', patch: { type: 'wave' } },
  },
  {
    id: 'retro', title: 'Progressive → retrogressive', section: '7.3', tag: 'Eq. (7-25)',
    setup: fromPreset('lap16'),
    task: 'Simplex lap, progressive. Look at where each coil ends and at the brush signs.',
    question: 'What changes on the diagram, and at the brushes, for a retrogressive winding?',
    answer: '$y_c$ changes sign: each coil now ends on the segment behind its start. For the same rotation, the brush polarity reverses: the + brushes become − and the − brushes become +.',
    reveal: { label: 'Make it retrogressive', patch: { progressive: false } },
  },
  {
    id: 'build', title: 'Can this wave winding be built?', section: '7.3', tag: 'Eq. (7-27)',
    setup: { ...fromPreset('wave9'), C: 10 },
    task: 'Simplex wave, 4 poles, 10 coils.',
    question: 'Can it be built? What about 9 coils?',
    answer: 'With 10 coils, no: $y_c = 2(C \\pm 1)/P$ = 5.5 or 4.5, not an integer. With 9 coils, yes: $y_c = 5$ (progressive) or 4 (retrogressive), as in the book.',
    reveal: { label: 'Use 9 coils', patch: { C: 9 } },
  },
  {
    id: 'dead', title: 'The dead zone', section: '7.5', tag: 'Prob. 7-2',
    setup: fromPreset('p72'),
    task: 'Problem 7-2: simplex lap, 2 poles, 8 coils, so 16 conductors. About 12 of them are under the pole faces ($\\beta$ = 0.75).',
    question: 'Does $E_A$ equal $K\\phi\\omega$ = 45.2 V? Then set $\\beta = 1$ ("ignore the dead zone"). Which value does the exam formula give?',
    answer: 'No. Only the conductors under the poles make voltage: $E_{A,dz} = (Z_{under}/a)\\,e_{cond} = \\beta K\\phi\\omega \\approx$ 33.9 V, and $I_A$ = 31.4 A with $R_A$ = 0.08 Ω and $R_L$ = 1 Ω. With $\\beta = 1$ every conductor counts: the exam formula $E_A = K\\phi\\omega$ gives 45.2 V.',
    reveal: { label: 'Set β = 1 (ignore the dead zone)', patch: { beta: 1 } },
  },
  {
    id: 'ripple', title: 'Pole arc and brush voltage', section: '7.5', tag: 'p. 448',
    setup: { ...fromPreset('lap16'), beta: 1 },
    task: 'Simplex lap, 4 poles, 16 coils, $\\beta = 1$: no dead zone. Look at the brush-voltage plot.',
    question: 'Set the pole arc to $\\beta$ = 0.7 of the pole pitch. Does the brush voltage stay at $K\\phi\\omega$? What is its average?',
    answer: 'No. The dead zone is now $(1-\\beta)\\,360^\\circ/P$ = 27° mech (54° elec). Conductors in it give no voltage, so the brush voltage ripples. Its average is $\\beta K\\phi\\omega$ = 0.7 × 5.33 V = 3.73 V: the dashed line. It equals $(Z_{under}/a)\\,e_{cond}$ with $Z_{under} = \\beta Z$.',
    reveal: { label: 'Set β = 0.7', patch: { beta: 0.7 } },
  },
]
