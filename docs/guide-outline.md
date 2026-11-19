# Guide outline ("How to use")

Written before the text. Route `#/guide`; sections are anchors after a second `#` (`#/guide#start`). One Markdown
file per section in `src/guide/content/`. Screenshots are made by `scripts/guide-screenshots.ts` from URL states;
the shot list (URL, viewport, clip, markers) is `src/guide/shots.ts`, shared with the tests.

Marker syntax in the text: a figure `![alt](image-name)` is followed by a numbered list with one item per marker.

## `#start` — Start here (`00-start.md`)

| Part | Screenshot (`public/guide/img/…webp`) | State | Markers |
|---|---|---|---|
| What the site is (2 sentences, footer note) | — | — | — |
| Open a lab | `home-desktop` (window 1440 × 900) | `#/` | 1 "How to use", 2 course chips, 3 a lab tile, 4 theme choice |
| Screen layout, desktop | `layout-desktop` (window) | loop, Example 7-1 (c) | 1 back button, 2 controls, 3 simulation, 4 results, 5 plots below, 6 Guide / Copy link / theme |
| Screen layout, phone | `layout-phone` (window 390 × 844) | same | 1 pinned view, 2 tabs, 3 tab panel |
| Sliders and number fields | `ctl-slider` (clip: "Battery and circuit") | same | 1 number field, 2 slider |
| Presets, "customized", segmented choice | `ctl-preset` (clip: "Setup") | loop, V_B changed | 1 preset, 2 "customized", 3 segmented choice |
| Toolbar: segmented, switch, playback | `ctl-toolbar` (clip: toolbar) | EEE 361 default | 1 segmented, 2 switch, 3 play/pause, 4 step, 5 reset, 6 speed |
| Header: Guide, Copy link, theme | `ctl-header` (clip: header) | loop | 1 back, 2 Guide, 3 Copy link, 4 theme |
| "What changed" sentence | `teach-what` (clip) | loop, R typed as 0.6 | 1 reaction sentence, 2 situation |
| Show the work | `teach-work` (clip: first step) | loop, opened | 1 disclosure, 2 step title and equation number, 3 equation, 4 numbers, 5 result |
| Guided experiments | `teach-experiment` (clip) | loop, experiment 2 opened | 1 item, 2 "Predict first", 3 "Show the answer", 4 "Set up this experiment" |
| Keyboard | — | — | — |

## One section per lab (home-page order)

Each: 1 what it shows (+ section tag), 2 quick start, 3 annotated desktop screenshot, 4 textbook problem walkthrough,
5 things to try (experiment titles only), 6 limits (README "Not yet implemented" / "Decisions"). One phone shot each.

### `#plane-wave-incidence` — EEE 361 Lab 01 (`10-…md`)
- `lab-wave-desktop` (window; air → lossless dielectric εr = 4, θi = 0): 1 guided experiments, 2 toolbar,
  3 field map, 4 plot along z, 5 results, 6 Advanced switch. `lab-wave-phone`.
- Walkthrough (normal incidence on a dielectric, the representative Cheng case): `wave-inputs` (clip: "Wave"
  section: 1 f, 2 θi), `wave-medium2` (clip: Medium 2: 1 preset), `wave-results` (clip: Interface + standing wave:
  1 Γ, 2 τ, 3 S, 4 |E|min). Numbers Γ, τ, S from the engine.

### `#eee321-three-phase-transformer` — EEE 321 Lab 01 (`20-…md`)
- `lab-xf-desktop` (window; ideal "Y–Δ step-down 13.8 kV, a = 10"): 1 Model, 2 Preset, 3 Connection, 4 wiring,
  5 playback, 6 results. `lab-xf-phone`.
- Ideal walkthrough: `xf-ideal-results` (1 V_LL/V_ll, 2 a, 3 shift), `xf-ideal-phasors` (1 phasor diagrams,
  2 Rotate with ωt, 3 Overlay secondary).
- Real bank, Problem 2-12: `xf-real-rating` (1 given as, 2 S_φ, 3 V_φP, 4 V_φS), `xf-real-tests` (1 test data,
  2 OC switch, 3 measured on, 4 readings are, 5 readings, 6 one-transformer values), `xf-real-operating`
  (1 hold, 2 load as, 3 S_load, 4 Rated load, 5 PF), `xf-real-results` (1 VR, 2 P_Cu, 3 P_core, 4 η),
  `xf-real-circuit` (1 hero switch, 2 circuit). Manual-error note. Numbers VR, η from the engine.

### `#eee321-rotating-loop` — EEE 321 Lab 02 (`30-…md`)
- `lab-loop-desktop` (window; Example 7-1 (c)): 1 preset, 2 given, 3 machine view, 4 operating line, 5 power
  flow, 6 results. `lab-loop-phone`.
- Walkthrough: `loop-shaft` (1 τ_load field, 2 sign hint), `loop-results` (1 mode badge, 2 e_ind, 3 i, 4 ω),
  `loop-generator` (Problem 7-1, 500 rad/s: 1 badge, 2 i). Numbers i, ω from the engine.

### `#eee321-armature-winding` — EEE 321 Lab 03 (`40-…md`)
- `lab-arm-desktop` (window; 16-coil lap): 1 preset, 2 winding choices, 3 C and drawable chips, 4 path chips,
  5 developed diagram, 6 results. `lab-arm-phone`.
- `arm-path` (Path 1 highlighted: 1 path chips, 2 diagram), `arm-c` (1 C field, 2 − / +, 3 drawable chips),
  `arm-notdrawn` (C = 18: 1 reason, 2 "Go to nearest drawable"), `arm-beta` (Problem 7-2: 1 β, 2 Ignore dead zone,
  3 geometry), `arm-dz-results` (1 E_A, 2 E_A,dz), `arm-ex73` (Example 7-3: 1 Z, 2 a, 3 E_A), `arm-exam` (seeded:
  1 New winding, 2 diagram, 3 type / plex / direction, 4 number fields, 5 Check, 6 grading).

## `#faq` (`90-faq.md`)
Cannot be drawn (reuses `arm-notdrawn`) · differs from the solutions manual · reset · share · display-only settings
(pole-arc fraction, display gain of the drops, third-harmonic h, "Show circuit referred to", weak-field colour gain) ·
value refused or held at a limit (red field, wattmeter > V·I, torque above stall, negative speed) · "beyond the
textbook" badge · experiments "✓ done" · phone layout · animation paused (reduced motion).

## Checks
Labels `**[ui:…]**` against the rendered DOM; numbers `{{key: shown}}` against the engine; no other digits in the
prose; images, marker JSON and marker counts; links and anchors. PDF: `public/guide/eee-labs-guide.pdf`.
