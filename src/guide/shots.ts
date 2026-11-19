/**
 * Every screenshot of the guide: the URL state it is taken from, the viewport, what is clipped and which elements
 * carry numbered markers. Used by `scripts/guide-screenshots.ts` (which makes the images) and by the guide tests
 * (which check that the Markdown, the images and the marker files agree). No imports: Node runs the script directly.
 *
 * Selectors are Playwright selectors. A marker selector starting with "& " is looked up inside the (first) clip
 * element; otherwise in the whole page. Marker numbers follow the order of the list.
 */

/** Where the 22 px marker circle sits, relative to the element's box. */
export type Place = 'tl' | 'tr' | 'center' | 'left' | 'right' | 'top' | 'bottom'

export interface MarkerSpec {
  sel: string
  /** What the marker points at (kept in the JSON for the tests and for the person editing the text). */
  label: string
  place?: Place
}

export type Step =
  | { click: string }
  | { hover: string }
  | { fill: string; text: string }
  | { tab: string }
  | { wait: number }

export interface Shot {
  name: string
  /** Hash route without "#/" ("" = home page). */
  route: string
  device: 'desktop' | 'phone'
  /** Element(s) to clip to (union of their boxes); absent = the whole window. */
  clip?: string | string[]
  /** Space kept around the clip, in CSS pixels (default 6). Markers of a clipped shot may sit outside the image. */
  pad?: number
  steps?: Step[]
  markers: MarkerSpec[]
}

export interface ShotMeta {
  name: string
  device: 'desktop' | 'phone'
  /** True for a whole-window screenshot, false for a clipped part. */
  window: boolean
  /** Image size in pixels (device scale factor 2). */
  width: number
  height: number
  markers: { n: number; label: string; place: Place; box: { x: number; y: number; w: number; h: number } }[]
}

export const VIEWPORT = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } } as const

const LOOP = 'eee321-rotating-loop?p=ex71c'
const XF = 'eee321-three-phase-transformer'
const ARM = 'eee321-armature-winding'
const section = (where: string, title: string) => `[data-guide=${where}] section:has(> div > h3:text-is("${title}"))`
const slider = (name: string) => `[data-guide=controls] div:has(> div > label:has-text("${name}"))`

export const SHOTS: Shot[] = [
  /* ---------- Start here ---------- */
  {
    name: 'home-desktop', route: '', device: 'desktop',
    markers: [
      { sel: 'a[href="#/guide"]', label: 'How to use', place: 'bottom' },
      { sel: 'div:has(> span.tag:text-is("Courses"))', label: 'course chips', place: 'left' },
      { sel: '[data-ui=lab-tile] >> nth=0', label: 'a lab tile' },
      { sel: '[role=radiogroup][aria-label="Colour theme"]', label: 'theme choice', place: 'bottom' },
    ],
  },
  {
    name: 'layout-desktop', route: LOOP, device: 'desktop',
    markers: [
      { sel: '[data-guide=lab-header] a[href="#/"]', label: 'back to the list of labs', place: 'bottom' },
      { sel: '[data-guide=controls]', label: 'controls', place: 'center' },
      { sel: 'svg[aria-label^="Front view"]', label: 'simulation' },
      { sel: '[data-guide=results]', label: 'results' },
      { sel: section('centre', 'Voltage against rotor angle'), label: 'plots' },
      { sel: '[data-guide=lab-header] > div:nth-child(2)', label: 'Guide, Copy link, theme', place: 'bottom' },
    ],
  },
  {
    name: 'layout-phone', route: LOOP, device: 'phone',
    markers: [
      { sel: '[data-guide=pinned]', label: 'pinned view', place: 'tr' },
      { sel: '[data-guide=tabs]', label: 'tabs', place: 'top' },
      { sel: '[data-guide=tab-panel]', label: 'tab panel', place: 'tr' },
    ],
  },
  {
    name: 'ctl-slider', route: LOOP, device: 'desktop', clip: section('controls', 'Battery and circuit'),
    markers: [
      { sel: '& input[aria-label^="battery voltage"]', label: 'number field', place: 'right' },
      { sel: '& input[type=range] >> nth=0', label: 'slider', place: 'left' },
    ],
  },
  {
    name: 'ctl-preset', route: 'eee321-rotating-loop?p=ex71c&VB=100', device: 'desktop', clip: section('controls', 'Setup'),
    markers: [
      { sel: '& select', label: 'preset', place: 'left' },
      { sel: '& span.tag:text-is("customized")', label: 'customized tag', place: 'right' },
      { sel: '& [role=radiogroup]', label: 'segmented choice', place: 'right' },
    ],
  },
  {
    name: 'ctl-toolbar', route: 'plane-wave-incidence', device: 'desktop', clip: '[data-guide=toolbar]',
    markers: [
      { sel: '& [role=radiogroup][aria-label="Wave shown"]', label: 'segmented choice', place: 'top' },
      { sel: '& button[role=switch]', label: 'switch', place: 'top' },
      { sel: '& button[aria-label=Play]', label: 'play / pause', place: 'bottom' },
      { sel: '& button[aria-label^="Step forward"]', label: 'step', place: 'bottom' },
      { sel: '& button[aria-label^="Reset time"]', label: 'reset', place: 'bottom' },
      { sel: '& select', label: 'speed', place: 'bottom' },
    ],
  },
  {
    name: 'ctl-header', route: LOOP, device: 'desktop', clip: '[data-guide=lab-header] > div:nth-child(2)',
    markers: [
      { sel: '& a[href^="#/guide"]', label: 'Guide', place: 'bottom' },
      { sel: '& button:has-text("Copy link")', label: 'Copy link', place: 'bottom' },
      { sel: '& [role=radiogroup]', label: 'theme', place: 'bottom' },
    ],
  },
  {
    name: 'teach-what', route: LOOP, device: 'desktop', clip: section('centre', 'What is happening'),
    steps: [{ fill: '[data-guide=controls] input[aria-label^="resistance"]', text: '0.6' }],
    markers: [
      { sel: '& [data-guide=what-changed]', label: 'what changed', place: 'left' },
      { sel: '& [data-guide=what-is-happening] > p:nth-child(2)', label: 'the situation now', place: 'left' },
    ],
  },
  {
    name: 'teach-work', route: LOOP, device: 'desktop',
    clip: ['[data-guide=centre] [data-ui=disclosure]', '[data-guide=centre] [data-ui=disclosure] + div li:first-child'],
    steps: [{ click: '[data-guide=centre] [data-ui=disclosure]' }],
    markers: [
      { sel: '[data-guide=centre] [data-ui=disclosure]', label: 'Show the work', place: 'left' },
      { sel: '[data-guide=centre] [data-ui=disclosure] + div li:first-child span.tag', label: 'equation number', place: 'right' },
      { sel: '[data-guide=centre] [data-ui=disclosure] + div li:first-child .katex-display >> nth=0', label: 'equation', place: 'left' },
      { sel: '[data-guide=centre] [data-ui=disclosure] + div li:first-child .katex-display >> nth=1', label: 'numbers', place: 'left' },
      { sel: '[data-guide=centre] [data-ui=disclosure] + div li:first-child .katex-display >> nth=2', label: 'result', place: 'left' },
    ],
  },
  {
    name: 'teach-experiment', route: LOOP, device: 'desktop',
    clip: '[data-guide=controls] li:has([data-ui=experiment][aria-expanded=true])',
    steps: [{ click: '[data-guide=controls] [data-ui=experiment] >> nth=1' }],
    markers: [
      { sel: '& [data-ui=experiment]', label: 'experiment', place: 'left' },
      { sel: '& p:has-text("Predict first")', label: 'Predict first', place: 'left' },
      { sel: '& button:has-text("Show the answer")', label: 'Show the answer', place: 'left' },
      { sel: '& button:has-text("Set up this experiment")', label: 'Set up this experiment', place: 'right' },
    ],
  },

  /* ---------- EEE 361 Lab 01 ---------- */
  {
    name: 'lab-wave-desktop', route: 'plane-wave-incidence?th=0', device: 'desktop',
    markers: [
      { sel: section('controls', 'Guided experiments'), label: 'guided experiments' },
      { sel: '[data-guide=toolbar]', label: 'toolbar', place: 'top' },
      { sel: 'canvas[aria-label^="Animated map"]', label: 'field map' },
      { sel: 'svg[aria-label^="Field along z"]', label: 'plot along z' },
      { sel: '[data-guide=results]', label: 'results' },
      { sel: '[data-guide=lab-header] button[role=switch]', label: 'Advanced', place: 'bottom' },
    ],
  },
  { name: 'lab-wave-phone', route: 'plane-wave-incidence?th=0', device: 'phone', markers: [] },
  {
    name: 'wave-inputs', route: 'plane-wave-incidence?th=0', device: 'desktop', clip: section('controls', 'Wave'),
    markers: [
      { sel: '& input[aria-label^="frequency"]', label: 'f', place: 'right' },
      { sel: '& input[aria-label^="incidence angle"]', label: 'θi', place: 'right' },
    ],
  },
  {
    name: 'wave-medium2', route: 'plane-wave-incidence?th=0', device: 'desktop', clip: section('controls', 'Medium 2 · z > 0'),
    markers: [
      { sel: '& select', label: 'Medium 2 material', place: 'left' },
      { sel: '& input[aria-label^="permittivity"]', label: 'εr2', place: 'right' },
      { sel: '& input[aria-label^="conductivity"]', label: 'σ2', place: 'right' },
    ],
  },
  {
    name: 'wave-results', route: 'plane-wave-incidence?th=0', device: 'desktop',
    clip: [section('results', 'Interface'), section('results', 'Standing wave in Medium 1')],
    markers: [
      { sel: '[data-guide=results] [data-guide=row-Gamma]', label: 'Γ', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-tau]', label: 'τ', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-S]', label: 'S', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-Emin]', label: '|E|min', place: 'left' },
    ],
  },

  /* ---------- EEE 321 Lab 01 ---------- */
  {
    name: 'lab-xf-desktop', route: `${XF}?p=yd`, device: 'desktop',
    markers: [
      { sel: '[role=radiogroup][aria-label=Model]', label: 'Model', place: 'right' },
      { sel: 'select#xf-preset', label: 'Preset', place: 'left' },
      { sel: '[role=radiogroup][aria-label=Connection]', label: 'Connection', place: 'right' },
      { sel: 'svg[aria-label^="Wiring of"]', label: 'wiring' },
      { sel: '[data-guide=centre] button[aria-label=Play]', label: 'playback', place: 'bottom' },
      { sel: '[data-guide=results]', label: 'results' },
    ],
  },
  { name: 'lab-xf-phone', route: `${XF}?p=yd`, device: 'phone', markers: [] },
  {
    name: 'xf-ideal-results', route: `${XF}?p=yd`, device: 'desktop', clip: '[data-guide=results] section >> nth=0',
    markers: [
      { sel: '& [data-guide=row-VLLVll]', label: 'V_LL/V_ll', place: 'left' },
      { sel: '& [data-guide=row-a]', label: 'a', place: 'left' },
      { sel: '& [data-guide=row-angleVabangleVAB]', label: 'phase shift', place: 'left' },
    ],
  },
  {
    name: 'xf-ideal-phasors', route: `${XF}?p=yd`, device: 'desktop', clip: '[data-guide=centre] section:has(> div > h3:text-is("Phasor diagrams"))',
    markers: [
      { sel: '& svg[aria-label^="Phasor diagrams"]', label: 'phasor diagrams' },
      { sel: '& button[role=switch] >> nth=0', label: 'Rotate with ωt', place: 'top' },
      { sel: '& button[role=switch] >> nth=1', label: 'Overlay secondary', place: 'top' },
    ],
  },
  {
    name: 'xf-real-rating', route: `${XF}?p=r212`, device: 'desktop', clip: section('controls', 'Rating'),
    markers: [
      { sel: '& [role=radiogroup]', label: 'given as', place: 'right' },
      { sel: '& input[aria-label^="one transformer"]', label: 'S_φ', place: 'right' },
      { sel: '& input[aria-label^="primary winding"]', label: 'V_φP', place: 'right' },
      { sel: '& input[aria-label^="secondary winding"]', label: 'V_φS', place: 'right' },
    ],
  },
  {
    name: 'xf-real-tests', route: `${XF}?p=r212`, device: 'desktop', clip: section('controls', 'Equivalent circuit from'),
    markers: [
      { sel: '& [role=radiogroup][aria-label="Equivalent circuit from"]', label: 'test data', place: 'right' },
      { sel: '& button[role=switch] >> nth=0', label: 'OC test switch', place: 'left' },
      { sel: '& [role=radiogroup][aria-label="OC test measured on"]', label: 'measured on', place: 'left' },
      { sel: '& [role=radiogroup][aria-label="OC readings are"]', label: 'readings are', place: 'left' },
      { sel: '& input[aria-label^="OC voltmeter"]', label: 'readings', place: 'right' },
      { sel: '& p:has-text("One transformer:") >> nth=0', label: 'one-transformer values', place: 'left' },
    ],
  },
  {
    name: 'xf-real-operating', route: `${XF}?p=r212`, device: 'desktop', clip: section('controls', 'Operating point'),
    markers: [
      { sel: '& [role=radiogroup][aria-label="Hold at rated voltage"]', label: 'hold', place: 'left' },
      { sel: '& [role=radiogroup][aria-label="Load given as"]', label: 'load as', place: 'right' },
      { sel: '& input[aria-label^="load of the bank"]', label: 'S_load', place: 'right' },
      { sel: '& button:has-text("Rated load")', label: 'Rated load', place: 'left' },
      { sel: '& input[aria-label^="power factor"]', label: 'PF', place: 'right' },
    ],
  },
  {
    name: 'xf-real-results', route: `${XF}?p=r212`, device: 'desktop',
    clip: [section('results', 'Operating point (one transformer)'), section('results', 'Power and efficiency (bank)')],
    markers: [
      { sel: '[data-guide=results] [data-guide=row-VR]', label: 'VR', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-PCu3IphiS2ReqS]', label: 'P_Cu', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-Pcore]', label: 'P_core', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-eta]', label: 'η', place: 'left' },
    ],
  },
  {
    name: 'xf-real-circuit', route: `${XF}?p=r212&hero=circuit`, device: 'desktop',
    clip: ['[data-guide=centre] [role=radiogroup][aria-label="Hero view"]', '[data-guide=centre] svg[aria-label^="Approximate equivalent circuit"]'],
    markers: [
      { sel: '[data-guide=centre] [role=radiogroup][aria-label="Hero view"]', label: 'hero view', place: 'right' },
      { sel: '[data-guide=centre] svg[aria-label^="Approximate equivalent circuit"]', label: 'equivalent circuit' },
    ],
  },

  /* ---------- EEE 321 Lab 02 ---------- */
  {
    name: 'lab-loop-desktop', route: LOOP, device: 'desktop',
    markers: [
      { sel: 'select#loop-preset', label: 'preset', place: 'left' },
      { sel: '[role=radiogroup][aria-label="Given quantity"]', label: 'given', place: 'right' },
      { sel: 'svg[aria-label^="Front view"]', label: 'machine' },
      { sel: '[aria-label^="Operating line"]', label: 'operating line' },
      { sel: section('centre', 'Voltage against rotor angle'), label: 'voltage against angle' },
      { sel: '[data-guide=results]', label: 'results' },
    ],
  },
  { name: 'lab-loop-phone', route: LOOP, device: 'phone', markers: [] },
  {
    name: 'loop-shaft', route: LOOP, device: 'desktop', clip: section('controls', 'Shaft'),
    markers: [
      { sel: '& input[aria-label^="load torque"]', label: 'τ_load', place: 'right' },
      { sel: '& div:text-is("negative = applied in the direction of rotation")', label: 'sign hint', place: 'left' },
    ],
  },
  {
    name: 'loop-results', route: LOOP, device: 'desktop',
    clip: [section('results', 'Mode'), section('results', 'Operating point')],
    markers: [
      { sel: '[data-guide=results] span:text-is("MOTOR")', label: 'mode badge', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-eind]', label: 'e_ind', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-i]', label: 'i', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-omega]', label: 'ω', place: 'left' },
    ],
  },
  {
    name: 'loop-generator', route: 'eee321-rotating-loop?p=p71-500', device: 'desktop',
    clip: [section('results', 'Mode'), section('results', 'Operating point')],
    markers: [
      { sel: '[data-guide=results] span:text-is("GENERATOR")', label: 'mode badge', place: 'left' },
      { sel: '[data-guide=results] [data-guide=row-i]', label: 'i', place: 'left' },
    ],
  },

  /* ---------- EEE 321 Lab 03 ---------- */
  {
    name: 'lab-arm-desktop', route: `${ARM}?p=lap16`, device: 'desktop',
    markers: [
      { sel: 'select#arm-preset', label: 'preset', place: 'left' },
      { sel: '[role=radiogroup][aria-label="Winding type"]', label: 'winding type', place: 'right' },
      { sel: '[role=group][aria-label="Drawable values of C"]', label: 'C and drawable chips', place: 'right' },
      { sel: '[role=group][aria-label="Parallel paths"]', label: 'path chips', place: 'left' },
      { sel: 'svg[aria-label^="Developed winding"]', label: 'developed diagram', place: 'tr' },
      { sel: '[data-guide=results]', label: 'results' },
    ],
  },
  { name: 'lab-arm-phone', route: `${ARM}?p=lap16`, device: 'phone', markers: [] },
  {
    name: 'arm-path', route: `${ARM}?p=lap16`, device: 'desktop', clip: '[data-guide=diagram]',
    steps: [{ hover: '[role=group][aria-label="Parallel paths"] [data-ui=chip] >> nth=0' }],
    markers: [
      { sel: '& [role=group][aria-label="Parallel paths"] [data-ui=chip] >> nth=0', label: 'Path 1 chip', place: 'left' },
      { sel: '& svg[aria-label^="Developed winding"]', label: 'highlighted path' },
    ],
  },
  {
    name: 'arm-c', route: `${ARM}?p=lap16`, device: 'desktop',
    clip: [slider('coils = commutator segments'), '[data-guide=controls] div:has(> [role=group][aria-label="Drawable values of C"])'],
    markers: [
      { sel: '[data-guide=controls] input[aria-label^="coils = commutator segments"]', label: 'C', place: 'right' },
      { sel: '[data-guide=controls] button[aria-label^="Previous drawable C"]', label: '− / +', place: 'left' },
      { sel: '[role=group][aria-label="Drawable values of C"]', label: 'drawable chips', place: 'right' },
    ],
  },
  {
    name: 'arm-notdrawn', route: `${ARM}?p=lap16&C=18`, device: 'desktop', clip: '[data-guide=not-drawable] >> nth=0',
    markers: [
      { sel: '& p', label: 'reason', place: 'top' },
      { sel: '& [data-ui=button]', label: 'Go to nearest drawable', place: 'left' },
    ],
  },
  {
    name: 'arm-beta', route: `${ARM}?p=p72`, device: 'desktop',
    clip: [slider('pole arc / pole pitch'), '[data-guide=controls] div:has(> button:has-text("Ignore dead zone"))'],
    markers: [
      { sel: '[data-guide=controls] input[aria-label^="pole arc / pole pitch"]', label: 'β', place: 'right' },
      { sel: '[data-guide=controls] button:has-text("Ignore dead zone")', label: 'Ignore dead zone', place: 'left' },
      { sel: '[data-guide=controls] span.num:has-text("dead zone")', label: 'geometry', place: 'left' },
    ],
  },
  {
    name: 'arm-dz-results', route: `${ARM}?p=p72`, device: 'desktop', clip: section('results', 'Voltage and current'),
    markers: [
      { sel: '& [data-guide=row-EA]', label: 'E_A', place: 'left' },
      { sel: '& [data-guide=row-EAdz]', label: 'E_A,dz', place: 'left' },
      { sel: '& [data-guide=row-IA]', label: 'I_A', place: 'left' },
    ],
  },
  {
    name: 'arm-ex73', route: `${ARM}?p=ex73`, device: 'desktop', clip: section('results', 'Winding'),
    markers: [
      { sel: '& [data-guide=row-Z2CNC]', label: 'Z', place: 'left' },
      { sel: '& [data-guide=row-a]', label: 'a', place: 'left' },
    ],
  },
  {
    name: 'arm-ex73-ea', route: `${ARM}?p=ex73`, device: 'desktop', clip: section('results', 'Voltage and current'),
    markers: [
      { sel: '& [data-guide=row-EA]', label: 'E_A', place: 'left' },
    ],
  },
  {
    name: 'arm-exam', route: `${ARM}?p=lap16`, device: 'desktop', clip: '[data-guide=exam]',
    steps: [
      { click: '[data-guide=exam] [role=radio]:text-is("lap")' },
      { click: '[data-guide=exam] [role=radio]:text-is("simplex")' },
      { fill: '[data-guide=exam] label:has-text("coils") input', text: '12' },
      { click: '[data-guide=exam] button:has-text("Check")' },
    ],
    markers: [
      { sel: '& button:has-text("New winding")', label: 'New winding', place: 'left' },
      { sel: '& svg[aria-label^="Developed winding"]', label: 'diagram' },
      { sel: '& [role=radiogroup][aria-label=Type]', label: 'type, plex, direction', place: 'left' },
      { sel: '& label:has-text("coils") input', label: 'number fields', place: 'left' },
      { sel: '& button:has-text("Check")', label: 'Check', place: 'left' },
      { sel: '& ul', label: 'grading', place: 'left' },
    ],
  },
]

export const shotByName = (name: string): Shot | undefined => SHOTS.find((s) => s.name === name)
