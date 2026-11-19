# Design system — EEE 361 Field Lab

This document describes the visual design of the site as it is implemented, so another project can
reproduce it exactly. Every value below is taken from the code; the source file is named in each section.
If the code and this document disagree, the code is right: update this file.

The intended character is a precise measurement instrument or a well-made scientific publication:
a warm paper-like light theme, a deep neutral dark theme, hairline rules instead of cards and shadows,
one monospaced face for every number, and colour reserved for meaning.

---

## 1. Colour tokens

Source: `src/ui/palette.ts` (values), `src/ui/theme.ts` (how they are applied), `src/index.css` (Tailwind mapping).

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#f4f2ec` | `#0b0e11` | Page background; phone sticky header; text on inverted (ink) buttons |
| `--panel` | `#fbfaf6` | `#11151a` | Side columns, tab panels, plots, the ring around markers |
| `--sunk` | `#ece9e1` | `#080a0d` | Background of the field-map frame before the canvas draws |
| `--ink` | `#16181b` | `#e9e6df` | Primary text, active controls (filled), plot curve of the current case |
| `--mute` | `#565b62` | `#a0a6ad` | Secondary text, labels, hints, axis text, inactive controls |
| `--faint` | `#8e9299` | `#69707a` | Tertiary text (numbering, footer), zero line, the "other" curve |
| `--rule` | `#d6d2c7` | `#262c34` | All borders and hairlines, slider track, plot grid |
| `--inc` | `#b07a00` | `#f2c744` | **Incident wave** (amber) |
| `--ref` | `#a31c6b` | `#d9488f` | **Reflected wave** (magenta) |
| `--trn` | `#16a37f` | `#5fe0c0` | **Transmitted wave** (green) |
| `--warn` | `#a8431a` | `#ff9d6b` | Warnings and "different scale" notices; invalid input |
| `--map-ink` | `#16181b` | `#f1eee7` | Lines and text drawn on top of the field map |
| `--map-halo` | `#f6f4ee` | `#0b0e11` | Halo behind map lines and the tint behind map labels |

### How themes are applied

- `applyTheme()` writes the tokens as CSS custom properties on `<html>` (`style.setProperty('--bg', …)`),
  sets `data-theme="light|dark"` and `style.colorScheme`. Tailwind 4 maps them in `@theme inline`
  (`--color-bg: var(--bg)` …), so classes such as `bg-panel`, `text-mute`, `border-rule`, `text-inc` work.
- The default is **follow the system** (`prefers-color-scheme`), updated live when the system changes.
  The student can force Light or Dark; the choice is stored in `localStorage` under `eee361-theme`
  (removed for "Auto"). Storage errors are ignored.
- Each theme is designed separately. Dark is not an inversion: the wave colours are lighter and more
  saturated, and the field map runs bright-at-the-ends on a near-black centre.

### Copy-ready CSS

```css
:root {            /* light */
  --bg:#f4f2ec; --panel:#fbfaf6; --sunk:#ece9e1;
  --ink:#16181b; --mute:#565b62; --faint:#8e9299; --rule:#d6d2c7;
  --inc:#b07a00; --ref:#a31c6b; --trn:#16a37f; --warn:#a8431a;
  --map-ink:#16181b; --map-halo:#f6f4ee;
}
:root[data-theme="dark"] {
  --bg:#0b0e11; --panel:#11151a; --sunk:#080a0d;
  --ink:#e9e6df; --mute:#a0a6ad; --faint:#69707a; --rule:#262c34;
  --inc:#f2c744; --ref:#d9488f; --trn:#5fe0c0; --warn:#ff9d6b;
  --map-ink:#f1eee7; --map-halo:#0b0e11;
}
```

### Measured contrast (WCAG ratio against `--panel` / against `--bg`)

| Token | Light | Dark |
|---|---|---|
| ink | 17.03 / 15.89 | 14.70 / 15.53 |
| mute | 6.55 / 6.11 | 7.46 / 7.88 |
| faint | 2.99 / 2.79 | 3.66 / 3.87 |
| inc | 3.57 / 3.33 | 11.37 / 12.01 |
| ref | 6.85 / 6.39 | 4.60 / 4.86 |
| trn | 3.06 / 2.85 | 11.27 / 11.90 |
| warn | 5.77 / 5.39 | 8.98 / 9.48 |

Use `ink` and `mute` for anything that must be read. The wave colours are used for marks (dots, rays,
lines, symbols next to text), not for running text; see section 3.

---

## 2. Field colour maps

Source: `src/ui/palette.ts` (`field`, `fieldLut`, `fieldGradientCss`), `src/labs/plane-wave-incidence/FieldMap.tsx`.

A diverging map with five stops from −1 to +1 and a neutral centre. Two hues only (blue for negative,
orange for positive); never a rainbow.

| Stop | −1 | −0.5 | 0 | +0.5 | +1 |
|---|---|---|---|---|---|
| Light | `#08306b` | `#4f93d2` | `#f1efe8` | `#ee8a4e` | `#b5380a` |
| Dark | `#7cd2ff` | `#1a66b8` | `#0c1014` | `#c2481a` | `#ff9a52` |

- **Light theme:** dark ends, near-paper centre. Zero field reads as "paper".
- **Dark theme:** bright ends, near-black centre. Zero field reads as "background", so nodes look like gaps.
- **Interpolation:** linear in sRGB between neighbouring stops, sampled into a 256-entry lookup table
  (packed ABGR for direct writes into `ImageData`).
- **Range:** the map's −1…+1 spans **±2 × the incident amplitude** of the field shown (E_i0 for E,
  E_i0/η₁ for H). That is the largest value a total field can reach in Medium 1. Values outside clamp.
- **Legend:** a 96 × 8 px bar (`w-24 h-2`, 1 px `--rule` border) filled with
  `linear-gradient(to right, <5 stops>)`, labelled `−2` … `+2 × <amplitude with unit>`.
- **Rendering:** the field is sampled at most 640 columns wide (rows in proportion), then drawn
  to the full canvas with high-quality smoothing at `devicePixelRatio` up to 2.
- **Weak Medium 2 field:** when the peak transmitted field is below 10 % of the incident amplitude, Medium 2
  is drawn with a 1-2-5 display gain (for example ×50) and labelled; this is a display rule only.
- **Validation:** `src/ui/palette.test.ts` requires ΔE (OKLab × 100) > 20 between the two ends, and
  between each end and the centre, under normal vision and simulated protan, deutan and tritan vision.

---

## 3. Colour by meaning

Colour always follows the wave, never its position or rank. Each wave has one colour everywhere:
rays, angle arcs, plot curves, the dot in front of a result, the toolbar choice and the power bar.

| Meaning | Colour | Where it appears |
|---|---|---|
| Incident wave | `--inc` | Incident ray and arc, θᵢ symbol, E_i0 symbol, θᵢ slider symbol, current-angle line on the \|Γ\| plot, frequency marker on the class strip, left bar of the "what changed" sentence, dots before 𝒫_av,i |
| Reflected wave | `--ref` | Reflected ray and arc, θ_r label, dots before Γ and \|Γ\|², reflected part of the power bar, current point on the \|Γ\| plot |
| Transmitted wave | `--trn` | Transmitted ray and arc, θ_t label, dots before τ, θ_t and 1−\|Γ\|², transmitted part of the power bar |
| Total field | `--ink` | Curve of the z-plot when "Total" is shown |
| Warning / different scale | `--warn` | "Different scale: z magnified ×N", "Weak field: colour scale ×N", the dashed outline of a magnified Medium 2, its scale bar and z ticks, "customized" preset tag, "beyond the textbook" badge, invalid number input, true-value axis of an amplified Medium 2 |
| Strong class | `--ink` fill, `--bg` text | Class badge for *good conductor* and *perfect conductor* |
| Other classes | `--faint` border, `--ink` text | Class badge for *lossless*, *low-loss dielectric*, *general lossy medium* |
| Class strip | `--ink` at opacity 0.85 / 0.40 / 0.13 | Good conductor / general lossy / low-loss bands on the frequency axis |

### Colour by meaning — EEE 321 labs

The DC-machine labs (02, and 03 when built) reuse the same three validated colours with physical meanings,
through named aliases in `src/ui/palette.ts` (`MACHINE_COLOR`). No new hex values.

| Meaning | Alias | Token | Where it appears |
|---|---|---|---|
| Voltage (e_ind, V_B, e_loop, e_out) | `voltage` | `--inc` | +/− polarity marks on conductors and brushes, V_B and e_ind labels, waveform curves, P_B bar, e_ind dot |
| Current (i) | `current` | `--ref` | ⊙ / ⊗ marks in the conductors, current arrow and label in the circuit, i dot |
| Mechanical (τ, ω, n, F, shaft power) | `mechanical` | `--trn` | force arrows and values, rotation arrow, ω and τ labels, operating point, P_conv bar, prime-mover / load torque |
| Field (B) | `field` | `--mute` | radial field lines (55 % opacity) and their arrowheads |
| Structure | `structure` | `--ink` | pole, yoke and rotor outlines, wiring, N and S labels |

Poles and yoke are filled `--rule`, the rotor `--sunk`, the air inside the yoke `--panel`. The P_R bar
(heat) is `--faint`. Every mark also has a symbol or a label: ⊙/⊗, +/−, an arrowhead, or a text value; the
mode badge is text (MOTOR, GENERATOR, NO LOAD). A legend above the drawing explains the three marks.

**EEE 321 Lab 03 (armature windings)** uses `MACHINE_COLOR` as Lab 02 does — E_A, V_T and e `--inc`,
I_A and the highlighted parallel path `--ref` (drawn thicker, the other paths faded), τ and ω `--trn` — plus
the conductor voltage sign in the two ends of the diverging field map (`field[4]` orange for +, `field[0]`
blue for −, per theme), always with ⊙ (+) or ⊗ (−); conductors in the dead zone are a `--faint` ring.
Coils being commutated carry a small `--warn` diamond; one shorted while it has voltage also gets a `--warn`
"V ≠ 0" label and a `--warn` note line under the path chips. Top-layer coil sides are solid, bottom-layer sides
dashed (stated in the legend). Poles and the end view use `--rule` fills with `--ink` outlines; pole faces are
exactly β of the pole pitch at a fixed radius (the air gap never changes), field lines (`--mute`, 0.8 px, with
small arrowheads in the air gap) only under the pole faces, and one dead zone marked by a thin `--mute` arc with
end ticks and a dashed leader to a top-right label "dead zone / 18° mech / 36° elec". In the brush-voltage plot:
coil-level curve `--inc` 2 px, its average `--inc` dotted, Kφω `--ink` solid, βKφω `--ink` dashed `5 3`.
The m-plex wave pitch carries the `BeyondBadge` (1 px `--warn` border, 11 px `--warn` text, 3 px radius).
"Drawable:" C chips are 24 px tall outlined buttons, the current value with an `--ink` border.

**EEE 321 Lab 01, real bank** (per-phase circuit, phasor diagram, power bars) colours by meaning through
`PERPHASE_COLOR`: voltages `--inc`, currents `--ref`, power and losses `--trn` (P_Cu a 45 % tint, P_core a
45° hatch), circuit elements `--ink`, neglected elements `--faint` and dashed with the word "neglected".
Labels sit on an 85 % `--panel` halo. A magnified drop phasor carries a `--warn` "drops shown ×N, display only"
note. The VR curves differ by dash (solid lagging, `6 4` unity, `2 3` leading) as well as by label.

**EEE 321 Lab 01 (three-phase transformer)** uses the same three tokens for the three phases, through
`PHASE_COLOR` in `src/ui/palette.ts`:

| Meaning | Token | Where it appears |
|---|---|---|
| Phase A/a, transformer T1 | `--inc` | T1 coils and their moving dots, V_AN / V_an / winding phasors of T1, I_A and I_a (dashed), v_AN in the third-harmonic plot |
| Phase B/b, transformer T2 | `--ref` | T2 coils and dots, T2 phasors, I_B, I_b, v_BN |
| Phase C/c, transformer T3 | `--trn` | T3 coils and dots, T3 phasors, I_C, I_c, v_CN |
| Line-to-line phasors, neutral, rails | `--ink` | V_AB, V_BC, V_CA (thick), rails and their dots, the shift arc |
| Third harmonic summed around a delta | `--warn` | dash-dot curve in the third-harmonic plot |

Primary and secondary are told apart by position (left/right) and labels (upper/lower case), never by colour.
Each lab's legend states what the three colours mean there (phases in Lab 01; voltage, current, mechanical
in Labs 02 and 03).

**Colour is never the only cue.** Every coloured element also has a label, a symbol (θᵢ, Γ, τ), a
position (the rays leave the boundary in different directions) or a line style.

**Colour-vision check of the wave colours** (all pairs, OKLab ΔE × 100):

| Theme | Worst pair under CVD | Worst pair, normal vision | Note |
|---|---|---|---|
| Light | 11.4 (deutan, trn ↔ inc) | 18.2 | Passes lightness, chroma and 3:1 contrast checks |
| Dark | 13.7 (protan, trn ↔ inc) | 18.5 | Inc and trn are lighter (OKLab L ≈ 0.83–0.85) than a typical categorical band; kept on purpose for visibility on the near-black map |

`src/ui/palette.test.ts` enforces ΔE > 8 for every pair of wave colours in both themes under all
four simulations.

---

## 4. Typography

Source: `src/index.css`, `src/main.tsx`. Fonts are bundled locally with `@fontsource` (no requests to
font CDNs).

| Face | Family | Weights loaded | Use |
|---|---|---|---|
| Text | **IBM Plex Sans** (`ui-sans-serif, system-ui, sans-serif` fallback) | 400, 500, 600 | All prose and labels |
| Numbers | **IBM Plex Mono** (`ui-monospace, "SF Mono", Menlo, monospace` fallback) | 400, 500 | Every number, tags, axis ticks |
| Maths | **KaTeX** fonts | (KaTeX's own) | Every symbol and equation, never plain text |

Body: `14px / 1.45`, `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.

### Utility classes

- **`.num`** — Plex Mono, `font-variant-numeric: tabular-nums`, `font-feature-settings: "tnum", "zero" 0`,
  `letter-spacing: -0.01em`. Use it for every value so digits do not move while a slider is dragged.
- **`.tag`** — Plex Mono, `10.5px`, `letter-spacing: 0.08em`, `text-transform: uppercase`, colour
  `--mute`. Used for panel headings (made `--ink` with `!text-ink`), section references (`§ 8-10.2`),
  medium labels on the map, and small status words.
- **KaTeX** — `.katex { font-size: 1.06em }`; display maths `margin: 0.35em 0`, left-aligned.

### Type scale (px)

| Size | Weight | Use |
|---|---|---|
| 46 / 34 | 600, tracking −0.02em, line-height 1.1 | Home title, desktop / phone |
| 19 | 500, tracking −0.01em | Lab title in the home list |
| 16 | 400, relaxed | Home introduction |
| 15 | 500, snug | "Predict first" question |
| 14 | 400 / 600 | Body, explanation sentences, lab name in the header (600, tracking −0.005em), home list summary |
| 13.5 | 400, relaxed | Revealed answer |
| 13 | 400 | Result values, number fields, select text, phone tab labels, worked-step titles (500) |
| 12.5 | 400 | Experiment list, interface sub-heading, buttons in the explanation panel |
| 12 | 400 | Slider names, control labels, segmented buttons, switches, footer text, map labels |
| 11.5 | 400 | Hints, notes under panels, map notes, plot labels, legends |
| 11 | 400 | Numbering in lists, small badges, Γ-plot value labels |
| 10.5 | — | `.tag`, plot tick labels |
| 10 | — | Right-hand y-axis values of the z-plot, class-strip frequency labels |

### Text formatting rules

Source: `src/ui/format.ts`.

- Non-breaking space between a number and its unit (`2.400 GHz`, `14.59 %`); a number never wraps away from its unit.
- SI prefixes (T, G, M, k, m, µ, n, p); 4 significant figures by default, rounded even for large values.
- Typographic minus `−` (U+2212) in displayed numbers; exponents as `×10⁻⁶` with superscripts outside KaTeX.
- Real Γ and τ shown with their sign (`−0.3820`); complex values in polar form `|z| ∠ θ°`.
- Phases near 0° or 180° get extra decimals so the departure is visible (`179.99986°`).
- Explanatory sentences are short, without idioms; maths inside sentences is written `$…$` and rendered by `Prose`.

---

## 5. Spacing, borders, radius, elevation

Spacing uses Tailwind's 4 px scale.

| Purpose | Value |
|---|---|
| Between sections in a column | 24 px (`gap-6`) |
| Between controls inside a section | 10 px (`gap-2.5`) |
| Side column padding | 16 px (`px-4 py-4`) |
| Centre column padding | 20 px horizontal, 16 px vertical (`px-5 py-4`) |
| Phone tab panel padding | 16 px sides and top, 40 px bottom (`px-4 pt-4 pb-10`) |
| Heading to its content | 6 px under the rule (`pb-1.5`), then 8–12 px |
| Result rows | 3 px vertical padding each (`py-[3px]`) |
| Worked steps | 12 px vertical (`py-3`), separated by a rule |

- **Borders:** always 1 px `--rule`. Emphasis lines are 2 px (`border-l-2` for the "what changed" sentence
  in `--inc` and the revealed answer in `--ink`; `border-b-2` for the active phone tab).
- **Radius:** `3px` for every rectangle (segmented controls, buttons, selects, badges, map labels).
  Fully round only for dots, slider thumbs and the switch. Focus ring corners `2px`.
- **Elevation:** none. No shadows, no cards inside cards, no gradients except the field-map legend.
  Grouping is done with hairline rules, headings and whitespace.
- **Panels:** the two side columns and the phone tab panel are `--panel`; the page and the centre column
  are `--bg`. That one step of tone is the only "surface" distinction.

---

## 6. Shared components

Source: `src/ui/controls.tsx` unless stated.

### Panel heading — `Heading`
A flex row with a bottom rule (`border-b border-rule pb-1.5`): left the title as `.tag` in `--ink`,
right an optional textbook reference `§ 8-10.2` as `.tag` in `--mute` (title attribute names the book).

### Slider with number field — `ParamSlider`
```
θi  incidence angle ..................... [   30.0 ° ]   ← name row
──────────────●──────────────────────────────────────   ← range slider
loss tangent σ2/ωε2 = 0.4160 · general lossy medium      ← optional hint
```
- **Name row:** `flex items-baseline justify-between gap-2`. Left: the KaTeX symbol (coloured `--inc` when
  it belongs to the incident wave), then the plain name at 12 px `--mute`, truncated if needed.
  Right: the number field.
- **Number field:** 8.5 rem wide, `.num` 13 px, right-aligned, transparent background, only a bottom
  border (`--rule`, `--ink` when focused, `--warn` with `--warn` text when the input is invalid).
  Shows the value with SI prefix and unit. Accepts engineering input (`2.4e9`, `2.4 GHz`, `5 mhz`,
  `58 MS/m`, `100 µS/m`, `30°`). Selects all on focus; Enter commits, Escape cancels, blur commits.
  Out-of-range values clamp; unparseable text stays red until edited.
- **Range:** `input[type=range].slider`, full width, 28 px tall; track 2 px `--rule`, radius 1 px;
  thumb 14 px circle, `--ink` fill, 2 px `--panel` border, 1 px `--ink` outer ring (Firefox thumb 10 px).
  On coarse pointers (touch): 40 px tall, thumb 24 px (Firefox 20 px). Disabled: opacity 0.35.
- **Scales:** linear, or logarithmic over 1000 steps (values rounded to 3 significant figures). Log
  sliders can have a *zero stop*: the leftmost position is exactly 0 (used for conductivity:
  0, then 10⁻⁶ … 10⁸ S/m). An optional `snap` applies to slider moves only (Lab 03: C stops on drawable
  values); typed values are never snapped.
- **Hint:** 11.5 px `--mute`, snug, `-mt-0.5`.

### Segmented control — `Segmented`
A radio group in one 1 px `--rule` box with 3 px radius; buttons 28 px tall (`h-7`), `px-2.5`, 12 px,
separated by 1 px `--rule` lines. Selected: `--ink` background with `--bg` text. Unselected: `--mute`,
`--ink` on hover. An option may carry a 6 px identity dot in its wave colour (Incident, Reflected,
Transmitted). A `disabled` option is `--faint` with a `--faint` line-through and a not-allowed cursor; its
reason goes in its title and in a 11.5 px `--mute` hint under the control (never an error message).

### Number field — `NumberField`
The number field of `ParamSlider` without the slider, for typed data such as test readings: symbol and
12 px `--mute` name on the left, a 7.5 rem `.num` field on the right with the same border, focus, invalid
(`--warn`) and commit behaviour. Engineering input with units ("1.4 kV", "945 W").

### Switch — `Switch`
`role="switch"`, 28 px tall. Track 26 × 14 px, fully round, 1 px border: off `--faint` outline with a
`--faint` knob on the left; on `--ink` fill with a `--bg` knob on the right. Knob 8 px; its `left`
animates (the only transition on the site). Label 12 px, `--mute`, `--ink` when on.

### Select
`select.select`: native element with the arrow replaced by two 5 px CSS triangles in `--mute`
(right 8–13 px). Preset selects: 36 px tall, full width, 1 px `--rule`, 3 px radius, 13 px.
Speed select: 28 px tall, `.num` 12 px.

### Icon buttons (play, step, reset)
28 × 28 px, 1 px `--rule` border, 3 px radius, `--mute` icon (`--ink` on hover). Icons are 14 × 14 px
filled SVG paths:
- play `M3.5 1.5v11l9-5.5z`, pause `M3 2h3v10H3zM8 2h3v10H8z`
- step `M2 1.5v11l7-5.5zM10 2h2v10h-2z`
- reset `M7 2a5 5 0 1 0 5 5h-1.6A3.4 3.4 0 1 1 7 3.6V6l3.5-3L7 0z`

No emoji and no icon font.

### Result row — `Row` (`src/ui/Row.tsx`)
`<dl>` rows: left a 8 px wave-colour dot (optional), the KaTeX symbol, and a small 11.5 px `--mute`
qualifier ("reflected", "polar"); right the value in `.num` 13 px. 3 px vertical padding.

### Badge — `Badge` (`src/ui/Row.tsx`)
11.5 px, `px-1.5 py-px`, 3 px radius, 1 px border. `strong`: filled (`--ink` background, `--bg` text);
otherwise outlined (`--faint` border, `--ink` text). Lab 01 fills good conductor and perfect conductor;
Lab 02 fills MOTOR and GENERATOR and outlines NO LOAD.

### Select with "customized" tag — `SelectField` (`src/ui/SelectField.tsx`)
Label 12 px `--mute` with an optional `customized` `.tag` in `--warn` on the right; the select is 36 px
tall, full width, 1 px `--rule`, 3 px radius, 13 px.

### Playback — `PlaybackControls`, `AngleReadout` (`src/ui/Playback.tsx`)
Play / pause, step, reset (icon buttons below), the speed select (units "T/s" for waves, "rev/s" for
machines) and an angle readout (`ωt =` or `θ =`, `.num`, written to the DOM each frame).

### Teaching panels (`src/ui/teaching.tsx`)
`ExperimentList` (numbered rows with a `§` or reference tag), `ExperimentPanel` (task, "Predict first"
question at 15 px 500, "Show the answer", answer with a 2 px `--ink` left rule, optional set-the-controls
button), `WhatIsHappening` (reaction sentence with a 2 px `--inc` left rule, then the situation),
`ShowWork` (collapsible; each step numbered, tagged with a section or an equation number such as
"Eq. (7-6)", display maths one line each).

### Text buttons
- Primary (e.g. "Show the answer"): 32 px tall, `px-3`, 12.5 px, 1 px `--ink` border, 3 px radius;
  on hover fills `--ink` with `--bg` text.
- Secondary (e.g. "Go to 45°"): same size, `--rule` border, `--mute` text; hover border and text `--ink`.
- Header links ("Copy link", theme choices): plain 12 / 11.5 px text, `--mute` or `--faint`, hover
  `--ink`. The selected theme is `--ink` with a 1 px underline offset 4 px.

### Power bar
A 10 px tall row (`h-2.5`) split into the reflected share (`--ref`) and the entering share (`--trn`),
2 px gap, 1 px radius on each part; parts under 0.05 % are omitted.

### Mathematics — `Tex`, `Prose` (`src/ui/Tex.tsx`)
`Tex` renders KaTeX (`throwOnError: false`) with a small cache; `Prose` renders a sentence with `$…$`
maths inline.

### Focus and accessibility
- Focus ring: `outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 2px` on `:focus-visible`.
- Every input has a label with its unit; the number field's accessible name is
  "<name> (<unit>), type a value".
- The incident-ray handle and the |Γ| plot are keyboard sliders (arrow keys: 1°, with Shift: 0.1°).
- `prefers-reduced-motion: reduce` disables all transitions and starts the animation paused.

---

## 7. Field map

Source: `src/labs/plane-wave-incidence/FieldMap.tsx`, `viewport.ts`.

**Frame:** 1 px `--rule` border, `--sunk` background, no radius. Canvas fills it; an SVG overlay and
absolutely positioned HTML labels sit on top.

**Geometry:** the boundary z = 0 is a vertical line at **56 %** of the width; x = 0 is the vertical
centre. z runs right, x runs up. Medium 1 shows between 1.6 and 3.4 λ₁ (about one λ₁ per 125 px).
Medium 2 shares that scale unless its fields vary over less than λ₁/14, then only its z axis is
magnified (x stays shared so fronts meet at the boundary).

**Overlay lines** (all on top of the colours, each with a halo for legibility):

| Element | Style |
|---|---|
| Boundary | 1.5 px `--map-ink` over a 4 px `--map-halo` line at 50 % opacity |
| Normal (x = 0) | 1 px `--map-ink`, 45 % opacity, dash `5 5` |
| Rays | 2 px wave colour, round caps, over a 5 px `--map-halo` line at 55 %; dash `6 5` for oblique incidence on a lossy medium |
| Arrowheads | Triangle 11 px long, 9 px wide, in the wave colour with a 1 px halo outline, at 50 % (incident) or 55 % (reflected, transmitted) along the ray |
| Ray opacity | √(power fraction carried): 1 for incident, √\|Γ\|² for reflected, √(1−\|Γ\|²) for transmitted |
| Angle arcs | 1.25 px wave colour; radius clamp(30 px, 0.2 × boundary x, 52 px); reflected arc 5 px larger |
| Ray insets | 12 px from left/right edges, 44 px from top/bottom (clear of labels, axes and scale bar) |
| Normal incidence | incident and reflected rays drawn 5 px apart so both are visible |
| Angle handle | Circle r = 7 px, `--map-halo` fill, 2.5 px `--inc` stroke; invisible 30 px wide hit line along the incident ray |
| Perfect conductor | 45° hatch over Medium 2: 9 px pattern, 1.1 px `--map-ink` at 40 % |
| Magnified Medium 2 | Dashed outline `2 4`, 1 px `--warn`, inset 4.5 px |
| Axes glyph | Bottom-left, 22 px arrows with 6 px heads, 1.25 px `--map-ink`; labels *z* and *x* in KaTeX |
| Scale bars | 1.5 px line with 8 px end ticks, bottom 16 px; Medium 1 in `--map-ink` from x = 62 px; Medium 2 (magnified) in `--warn` at the right |

**Map labels** (HTML): 12 px (angles) or 11.5 px (medium names, notes), 3 px radius, tinted background
`color-mix(in srgb, var(--map-halo) 72%, transparent)` (78 % for notes, 80 % for warnings), text
`--map-ink`. Medium names sit top-left of each medium (`MEDIUM 1` as `.tag`, then the material),
truncated with an ellipsis. Warnings stack under the Medium 2 name. Notes (evanescent field, surface
current) wrap inside Medium 2, 30 px above the bottom.

---

## 8. Plots

### Field along z — `ZPlot.tsx`
- Height 150 px (desktop, attached under the map with `border-x border-b`), 170 px in the phone Plots tab.
  Background `--panel`. Padding: 26 px top (label row), 22 px bottom (ticks).
- Vertical range ±2.15 incident amplitudes. Grid: ±1 solid `--rule`, ±2 dashed `2 4` `--rule`,
  zero line `--faint`.
- Envelope \|F(z)\|: filled `--ink` at 6 % opacity with a 1 px `--faint` outline.
- Instantaneous curve: 2 px, coloured by the wave shown (`--ink` total, `--inc`, `--ref`, `--trn`).
- Boundary: 1.5 px `--ink`. Shares the z axis of the map exactly (same viewport function).
- Ticks: `−nλ₁` in Medium 1, `nλ₁` or metric lengths in Medium 2 (in `--warn` when magnified);
  `.num` 10.5 px `--mute`.
- Standing-wave markers at normal incidence: r = 2.75 px; maxima filled `--ink`, minima `--panel` with
  1.25 px `--ink` ring; legend "● max ○ min  S = …" in the label row.
- Amplified Medium 2: label "Medium 2 drawn ×N · right axis: true values" in `--warn`; Medium 1 ticks move
  next to the boundary and a second set of tick values (true values) is drawn at the right in `--warn`.

### |Γ| against θᵢ — `GammaPlot.tsx`
- Height 190 px; padding left 34, right 14, top 14, bottom 26 px. x: 0–90°, y: 0–1.
- Grid at 0 (solid), 0.5 and 1 (dashed `2 4`), `--rule`; tick text `.num` 10.5 px `--mute`.
- Current polarization: 2 px `--ink`. Other polarization: 1.5 px `--faint`, dash `5 4`.
- Legend row above the plot (11.5 px): a 20 px sample of each line style with its KaTeX label.
- θ_c and θ_B markers: 1 px `--mute`, dash `3 3`, labels at the top on a `--panel` background.
- Current angle: 1.5 px `--inc` vertical line; current point r = 5 px `--ref` with a 2 px `--panel`
  ring; its value in `.num` 11 px beside it (below the point when \|Γ\| > 0.8).
- The whole plot is a slider: pointer drag or arrow keys set θᵢ; cursor `ew-resize`.

### Class strip — `Controls.tsx`
A 10 px bar across 1 kHz – 100 GHz (log). Three bands in `--ink` at opacity 0.85 (good conductor),
0.40 (general lossy), 0.13 (low-loss), separated by 1 px gaps; the current frequency is a 2 px
`--inc` vertical line, 22 px tall. Frequency labels `.num` 10 px `--faint`; a legend below with the
current class in 500 weight.

---

## 9. Layouts

The lab switches layout with a media query at **1100 px** (`useMediaQuery('(min-width: 1100px)')`).

### Header (both layouts)
44 px tall (`h-11`), `--panel` background, bottom rule, `px-3` (`px-4` from 640 px).
Left: back link as `.tag` (`← Field Lab`, or `← Labs` on phone), then the lab name 14 px 600 with its
number `01` in `.num` `--faint`, then `Cheng § 8-2 to 8-10` as `.tag` (only from 1280 px).
Right: Advanced switch, "Copy link" (hidden below 640 px), theme choice Auto / Light / Dark (desktop only).

### Desktop (≥ 1100 px)
```
┌──────────────────────────────── header 44 px ───────────────────────────────┐
│ controls 292 px │ centre (1fr)                              │ results 324 px │
│ --panel         │ --bg                                      │ --panel        │
│ scrolls         │ toolbar (wraps; playback right-aligned)   │ scrolls        │
│                 │ FIELD MAP  height clamp(280px,            │                │
│ Guided          │            100vh − 430px, 620px)          │ Interface      │
│ experiments     │ z-plot 150 px (attached)                  │ Power          │
│ Wave            │ caption row (scale · legend · time)       │ Standing wave  │
│ Medium 1        │ ┌ explanation (1fr) ┐ ┌ |Γ| plot ≤360 ┐   │ Medium 1       │
│ Medium 2        │ └───────────────────┘ └───────────────┘   │ Medium 2       │
│ Class strip     │ Show the work (collapsible)               │                │
│                 │ footer                                    │                │
└─────────────────┴───────────────────────────────────────────┴────────────────┘
```
- Grid `292px minmax(0,1fr) 324px`, full viewport height; each column scrolls on its own (thin
  scrollbars in `--rule`). Side columns have a 1 px rule on their inner edge.
- The field map is the largest element on the screen.
- Explanation and |Γ| plot: grid `minmax(0,1fr) minmax(0,360px)`, 24 px gap, 20 px below the caption.

### Phone (< 1100 px)
```
┌ header 44 px ───────────────────────────┐
├ sticky block (--bg) ────────────────────┤
│ row 1: Total Inc. Refl. Trans. │ E H    │
│ row 2: ▶ ⏭ ↻ speed │ ⊥ Perp. ∥ Par. … → │  (scrolls sideways if needed)
│ FIELD MAP  height min(38vh, 320px)      │
│ Controls │ Results │ Explain │ Plots    │  tabs 44 px
├─────────────────────────────────────────┤
│ tab panel (--panel), page scrolls       │
│ … footer                                │
└─────────────────────────────────────────┘
```
- The toolbar, map and tabs stay pinned at the top (`sticky top-0 z-20`); the field map stays in view
  while the student works in any tab.
- Toolbar labels are shortened (Inc., Refl., Trans., Perp., Par.); the ωt readout is hidden.
- Tabs: equal width, 44 px tall, 13 px; active tab `--ink`, 500 weight, 2 px `--ink` underline.
- Explain tab: explanation, guided experiments, then Show the work. Plots tab: z-plot (170 px) and |Γ| plot.
- Touch targets: slider 40 px tall with a 24 px thumb; tabs 44 px; buttons at least 28 px.
- No horizontal page scroll; map labels truncate with an ellipsis.

### Lab frame and header (`src/shell/LabFrame.tsx`, `LabHeader.tsx`)
Both labs use the same frame: the desktop grid and phone tabs above, and the header (back link, number,
title, textbook tag such as `Chapman § 7.1`, optional Advanced switch, Copy link, theme).

### Lab 02 centre column (desktop)
Toolbar (legend of ⊙/⊗, +/−, force arrow on the left; playback right), machine view
(`clamp(300px, 100vh − 420px, 560px)` tall, 1 px `--rule` frame, `--panel` fill), caption (slow-down
factor, force scale), then the waveform and operating-line plots side by side (two equal columns, 24 px
gap), the power bars, the explanation, Show the work and the footer. Phone: the machine view is pinned
(`min(40vh, 320px)`) under a one-row toolbar; tabs Controls, Results, Explain, Plots.

### Home page (`src/shell/App.tsx`)
Single column, max width 768 px (`max-w-3xl`), padding 20 px / 32 px sides and 32 px / 56 px top
(phone / ≥ 640 px). Header row: the course codes as a tag left (`EEE 361 · EEE 321`), theme choice right.
Title 34 / 46 px, intro 16 px `--mute` (max 576 px). Then one group per course: a `.tag` heading
(`EEE 361 · Electromagnetic Waves`) with the textbook on the right (normal case, book title in italics)
and a rule below; each lab is a full-width link row with a `3rem 1fr auto` grid: number (`.num` 13 px
`--faint`), title 19 px with summary 14 px and the textbook tag, and an arrow `→` that moves 2 px right on
hover. Planned labs follow as one `--faint` 13 px line ("In preparation: 01 …; 03 …"), then the model note
of each built lab in 12 px `--faint`.

---

## 10. Footer

Source: `Disclaimer` in `src/shell/Disclaimer.tsx`, text built from `src/shell/courses.ts`. One footer per
course; each lab page shows its course's footer.

Text (exact):

> Student project for EEE 361. Not an official course resource. Check results against the textbook
> (Cheng, *Field and Wave Electromagnetics*, 2nd ed.).

> Student project for EEE 321. Not an official course resource. Check results against the textbook
> (Chapman, *Electric Machinery Fundamentals*, 5th ed.).

- 12 px, relaxed line height, `--faint`; the book title in italics.
- **Home:** both footers at the bottom of the column (`mt-auto`, 64 px above, 6 px between them). The
  model notes moved under each course group.
- **Lab, desktop:** at the end of the centre column, 32 px below Show the work, with a 1 px top rule and
  12 px padding above the text.
- **Lab, phone:** at the end of every tab panel, same rule and spacing.

---

## 11. Motion

- The field map and the z-plot are animated in `requestAnimationFrame` outside React; time is slowed so
  one period lasts 1–8 s (speeds 0.125, 0.25, 0.5, 1 periods per second; default 0.5). The caption
  states the slow-down factor.
- The animation starts at ωt = 45° (a pure standing wave is blank at ωt = 0). Step advances 1/24 period.
- The only CSS transitions are the switch knob and the home-list arrow; both are removed under
  `prefers-reduced-motion`, which also starts the animation paused.

---

## 12. Brand marks

- **Favicon:** inline SVG data URI in `index.html`: 32 × 32 rounded square (radius 6) in `#16181b`
  with a sine-like stroke `M4 16c3-8 6-8 9 0s6 8 9 0 4-6 6-4` in `#f2c744`, width 2.5.
- **Page title:** "EEE 361 Field Lab". There is no logo; the home title "Field Lab" is set in type.

---

## 13. Known limitations

- Light-theme `--faint` (`#8e9299`) measures 2.99 : 1 on `--panel`, below the 4.5 : 1 WCAG AA level for
  small text. It is used for tertiary text, including the footer. A project that needs AA for all text
  should darken it; `#6a6f76` measures 4.85 : 1 on `--panel` and 4.52 : 1 on `--bg`.
- Light-theme `--trn` (3.06 : 1) and `--inc` (3.57 : 1) are suitable for marks and symbols, not for
  running text.
- Dark-theme `--inc` and `--trn` are lighter than a typical categorical lightness band (see section 3);
  colour-vision separation and contrast still pass.
