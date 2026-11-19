# UI audit: interactive elements

Every element a student can click, tap or focus, on every page, before the "make every clickable element look
clickable" change. Found by searching the code for `onClick`, `<button`, `role="button"`, `<a `, `<summary>`,
`<details>` and `onPointerDown`, and by looking at the screenshots below.

Screenshots (1440 px desktop and 390 px phone, light theme) are in `docs/ui-audit/`:
`before-<page>-<desktop|phone>.jpg` and `after-<page>-<desktop|phone>.jpg`, with `<page>` one of
`home`, `eee361`, `eee321-xf-ideal`, `eee321-xf-real`, `eee321-loop`, `eee321-arm`. Desktop shots have
"Show the work" opened; phone shots show the Explain tab.

Legend for "now": **text** = looks like plain text (no border, no fill, no icon); **ok** = already looks like
a control.

## Shared (every lab)

| Element | Where | Now | Becomes |
|---|---|---|---|
| "← Field Lab" / "← Labs" back link | header | text (`.tag`) | `<a href>` styled as small button, ← icon (`data-ui="header-link"`) |
| "Copy link" | header (≥ 640 px) | text | `Button` small (`data-ui="button"`) |
| Theme Auto / Light / Dark | header, home page | text with underline | `Segmented` (small) |
| Advanced switch | header (EEE 361) | ok (`Switch`) | `Switch` + `data-ui="switch"` |
| Phone tabs Controls / Results / … | phone | ok (tabs) | unchanged look, `data-ui="tab"` |
| Play / step / reset | toolbars | ok (icon buttons) | unchanged look, `data-ui="icon-button"` |
| Segmented choices | controls, views | ok | unchanged look, `data-ui="segmented"`; border `--mute` checked |
| Switches | controls | ok | unchanged look, `data-ui="switch"` |
| Sliders, number fields, selects | controls | ok | unchanged |
| Guided experiments list | left column / Explain tab | text (numbered rows) | `ExperimentItem` (`data-ui="experiment"`), opens inline |
| Experiment "Close" | experiment panel | text (`.tag`) | removed: the item closes itself (`aria-expanded`) |
| "Show the answer" | experiment panel | outlined, ink border | `Button` primary |
| Experiment reveal ("Go to 45°", "Apply 7.5 N·m", "Make it duplex", …) | experiment answer | outlined, rule border | `Button` secondary |
| (new) "Set up this experiment" | experiment item | — | `Button` secondary |
| "Show the work" | centre / Explain tab | text (`<summary>`, `.tag`) | `Disclosure` (`data-ui="disclosure"`) |

## Home page (`#/`)

| Element | Now | Becomes |
|---|---|---|
| Lab rows (title, summary, →) | text row with hover underline | `LabTile` (`data-ui="lab-tile"`), whole tile one `<a href>` |
| Planned labs | one faint text line | `LabTile` planned (dashed, not a link) |
| Theme choice | text | `Segmented` |
| (new) course jump | — | `Chip` per course (`<button>`, scrolls to the course) |

## EEE 361 Lab 01, plane-wave incidence (`#/plane-wave-incidence`)

| Element | Now | Becomes |
|---|---|---|
| Presets, polarization, view toggles | ok (`SelectField`, `Segmented`, `Switch`) | unchanged |
| Field-map ray handle, |Γ| plot cursor | ok (keyboard sliders, drag) | unchanged |
| Experiments, "Show the answer", "Go to 45°" and other reveals, "Show the work" | see Shared | see Shared |

## EEE 321 Lab 01, three-phase transformer (`#/eee321-three-phase-transformer`)

| Element | Mode | Now | Becomes |
|---|---|---|---|
| "Rated load" | Ideal (unit rating), Real | outlined, rule border, small text | `Button` secondary |
| OC / SC test switches | Real, test data | ok (`Switch`) | unchanged |
| Measured on / Readings are / Show circuit referred to / hold / load as / drops ×N / hero view / pinned view | Real | ok (`Segmented`) | unchanged |
| Rotate with ωt / Overlay secondary | both | ok (`Switch`) | unchanged |
| Experiments, Show the work | both | see Shared | see Shared |

## EEE 321 Lab 02, rotating loop (`#/eee321-rotating-loop`)

| Element | Now | Becomes |
|---|---|---|
| Presets (`SelectField`), mode and direction (`Segmented`) | ok | unchanged |
| Operating-line plot cursor (drag, keyboard) | ok (slider role) | unchanged |
| Power bars | display only, not interactive | unchanged |
| Experiments ("Go to 450 rad/s", "Apply 7.5 N·m" …), Show the work | see Shared | see Shared |

## EEE 321 Lab 03, armature windings (`#/eee321-armature-winding`)

| Element | Now | Becomes |
|---|---|---|
| "New winding" (exam mode) | text (`.tag`) | `Button` primary with ↻ |
| "Check" (exam mode) | outlined, ink border | `Button` primary |
| C − / + | outlined, rule border | `Button` small (icon-like ±) |
| "Drawable: 20 · 30 · 40" | small outlined mono buttons | `Chip` |
| "Go to nearest drawable", "Show a small drawable version" | outlined, rule border | `Button` secondary |
| "Ignore dead zone" | outlined, rule border | `Button` secondary |
| Path chips "Path 1 · 5.33 V" (diagram) and path rows (schematic) | outlined | `Chip` |
| Brush rectangles in the developed diagram | click + hover on an SVG `<g>` | hover only (a click handler on a static element is not allowed); the path chips do the same job by click or tap |
| Experiments, Show the work | see Shared | see Shared |

## After

Every element above now uses the component in its "Becomes" column. Checks:

- `npm run lint`: jsx-a11y `no-static-element-interactions`, `click-events-have-key-events` and
  `no-noninteractive-element-interactions` as errors; no violations.
- `src/ui-affordance.test.tsx`: renders the home page and every lab (desktop, and every phone tab), several URL
  states per lab (Ideal and Real bank, both hero views, refused test data; wave duplex, frog-leg, an undrawable
  typed C, Example 7-3), opens every disclosure and experiment and presses every "Show the answer"; every
  `button` and `a[href]` carries an allowed `data-ui`.
- `src/ui/palette.test.ts`: contrast of button, chip, disclosure, experiment and tile text, borders and icons,
  both themes, at rest and on hover.
- Browser: every page at 1440 px and 390 px in both themes, every phone tab: no horizontal page scroll, no
  console errors. Hover and keyboard focus: `after-home-hover-<theme>.jpg`, `after-home-focus-<theme>.jpg`,
  `after-arm-hover-focus-<theme>.jpg`.
