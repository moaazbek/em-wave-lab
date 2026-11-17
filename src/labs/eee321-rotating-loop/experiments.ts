import type { ExperimentInfo } from '../../ui/teaching'
import { LoopState, fromPreset } from './state'

export interface Experiment extends ExperimentInfo {
  setup: LoopState
  reveal?: { label: string; patch: Partial<LoopState> }
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'start', title: 'Starting current', section: '7.1', tag: 'Ex. 7-1(b)',
    setup: fromPreset('ex71b'),
    task: 'The lab shows the no-load steady state. Think about the first instant after the switch closes.',
    question: 'When the switch closes, the loop is not moving yet. What current flows?',
    answer: 'At rest $\\omega = 0$, so $e_{ind} = \\tfrac{2}{\\pi}\\phi\\,\\omega = 0$. Only $R$ limits the current: $i = V_B/R = 120/0.3 = 400$ A. As the loop speeds up, $e_{ind}$ rises and $i$ falls, until $i = 0$ at no load.',
    reveal: { label: 'Hold the shaft still (ω = 0)', patch: { given: 'speed', omega: 0 } },
  },
  {
    id: 'load', title: 'Loading the motor', section: '7.1', tag: 'Ex. 7-1(c)',
    setup: fromPreset('ex71b'),
    task: 'The motor runs at no load.',
    question: 'Apply a 10 N·m load. Does the speed fall by a lot or by a little? Which quantity sets the current: the load or the resistor?',
    answer: 'By a little: from 480 to 432 rad/s (10 %). The load sets the current: $i = \\tau_{load}/\\tfrac{2}{\\pi}\\phi = 10/0.25 = 40$ A. The resistor only sets how far $e_{ind}$ (and so $\\omega$) must drop: $iR = 12$ V, so $e_{ind} = 108$ V.',
    reveal: { label: 'Apply 10 N·m', patch: { tau: 10 } },
  },
  {
    id: 'double-r', title: 'Double the resistance', section: '7.1', tag: 'Ex. 7-1',
    setup: fromPreset('ex71c'),
    task: 'The motor carries a 10 N·m load with $R$ = 0.3 Ω.',
    question: 'Double $R$ to 0.6 Ω at the same load. Does the current change?',
    answer: 'No. $i$ stays 40 A, because the torque fixes it. The drop $iR$ doubles to 24 V, so $e_{ind}$ falls to 96 V and $\\omega$ falls to 384 rad/s. The loss $i^2R$ doubles to 960 W.',
    reveal: { label: 'Set R = 0.6 Ω', patch: { R: 0.6 } },
  },
  {
    id: 'push', title: 'Push the shaft', section: '7.1', tag: 'Ex. 7-1(d)',
    setup: fromPreset('ex71b'),
    task: 'The machine runs at no load. Now a torque pushes the shaft in the direction of rotation.',
    question: 'Apply 7.5 N·m in the direction of rotation. What happens to the current?',
    answer: 'It reverses: $i = -7.5/0.25 = -30$ A. Then $e_{ind} = 120 + 9 = 129$ V and $\\omega = 516$ rad/s, above the no-load speed. $P_{conv} = -3870$ W: the machine is a generator. The battery absorbs 3600 W and $R$ takes 270 W.',
    reveal: { label: 'Apply 7.5 N·m in the direction of rotation', patch: { tau: -7.5 } },
  },
  {
    id: 'weaken', title: 'Weaken the field', section: '7.1', tag: 'Ex. 7-1(e)',
    setup: fromPreset('ex71b'),
    task: 'The motor runs at no load with $B$ = 0.25 T.',
    question: 'Reduce $B$ from 0.25 T to 0.20 T. Does the loop slow down or speed up?',
    answer: 'It speeds up, to 600 rad/s. At no load $e_{ind} = V_B = 120$ V. With less flux, $\\tfrac{2}{\\pi}\\phi = 0.2$, the loop must turn faster to make the same voltage: $\\omega = 120/0.2 = 600$ rad/s.',
    reveal: { label: 'Set B = 0.20 T', patch: { B: 0.2 } },
  },
  {
    id: 'drive', title: 'Drive it from outside', section: '7.1', tag: 'Prob. 7-1',
    setup: fromPreset('p71-500'),
    task: 'Problem 7-1: a prime mover turns the shaft. $B$ = 0.4 T, $l$ = 0.5 m, $r$ = 0.25 m, $R$ = 0.4 Ω, $V_B$ = 48 V.',
    question: 'The shaft turns at 500 rad/s. Is the machine a motor or a generator?',
    answer: 'A generator. $e_{ind} = \\tfrac{2}{\\pi}\\phi\\,\\omega = 0.1 \\times 500 = 50$ V is larger than $V_B$ = 48 V, so $i = (48 - 50)/0.4 = -5$ A: 5 A flows out of the machine into the battery. At 450 rad/s, $e_{ind}$ = 45 V is smaller than 48 V, so 7.5 A flows into the machine: it is a motor.',
    reveal: { label: 'Go to 450 rad/s', patch: { omega: 450 } },
  },
]
