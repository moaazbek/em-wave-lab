# EEE 361 Field Lab (now two courses)

Online labs for students. Live: https://moaazbek.github.io/em-wave-lab/ (deploys on every push to `main`).
- EEE 361 Lab 01 `#/plane-wave-incidence`: plane wave at a boundary. Cheng, *Field and Wave Electromagnetics*, 2nd ed. (§ 8-2 to 8-10).
- EEE 321 Lab 02 `#/eee321-rotating-loop`: simple rotating loop. Chapman, *Electric Machinery Fundamentals*, 5th ed. (§ 7.1).
The repository is public: never add textbook pages, slides, figures, scans, exam papers or long quotations.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (physics engine, formatting, palette, URL state)
- `npm run build` — `tsc --noEmit` then static build into `dist/` (relative base, works from any sub-path)
- `npm run preview` — serve the build

## Layout
- `src/physics/` — EEE 361 engine, pure TypeScript, no React/DOM. Own complex-number module. Every number,
  plot and animation frame on screen must come from here; never compute physics in UI code.
- `src/labs/eee321-rotating-loop/engine/` — EEE 321 Lab 02 engine (same rules), with its tests.
- `src/labs/plane-wave-incidence/` — the lab (state + URL codec, derived model, field map, plots, teaching text).
- `src/shell/` — home page grouped by course, `courses.ts` (course, textbook, footer), lab registry (`labs.ts`),
  hash router + `useUrlSync`, `LabHeader`, `LabFrame` (desktop 3 columns / phone pinned view + tabs), `Disclaimer`.
- `src/ui/` — shared components: `ParamSlider` (with `onOutOfRange`), `Segmented`, `Switch`, `SelectField`,
  `Row`/`Badge`, `PlaybackControls`/`AngleReadout`, clock (`useClock`), teaching panels (`ExperimentList`,
  `ExperimentPanel`, `WhatIsHappening`, `ShowWork`), KaTeX (`Tex`, `Prose`), formatting, palette, theme.
- New labs: add a folder under `src/labs/` and one entry in `src/shell/labs.ts`; reuse the shared components.
- Never change a published route slug. Do not change Lab 01's look: compare screenshots before and after.

## Notation and conventions (exams are graded on Cheng's notation)
- Phasors with e^{jωt}; instantaneous = Re[phasor · e^{jωt}]; e^{-jβz} travels in +z; cosine form in time domain.
- γ = α + jβ, η, Γ, τ, δ, u_p, S, θ_i/θ_r/θ_t, E_i0, a_x/a_y/a_z.
- "Perpendicular" / "parallel" polarization (TE/TM only as a secondary label).
- Interface z = 0; Medium 1 is z < 0 (lossless), Medium 2 is z > 0; plane of incidence is xz. Draw z right, x up.
- Perpendicular: E along a_y. Parallel: H along a_y; E_r = E_r0(a_x cosθ_r + a_z sinθ_r)…, H_r = −a_y (E_r0/η_1)….
- Roots: α ≥ 0, β > 0, Re η > 0; k_2z with Re ≥ 0, Im ≤ 0. cos θ_t = k_2z / k_2 (complex in general).
- Classification thresholds on σ/ωε: < 0.01 low-loss, > 100 good conductor (named constants in `physics/constants.ts`;
  they are a convention). PEC is an explicit flag, never a large σ.
- Maths in the UI always through KaTeX (`Tex` / `Prose` with `$…$`). Numbers in the mono face with tabular figures.
- Wave colours: incident / reflected / transmitted = `--inc` / `--ref` / `--trn` (validated for colour-vision deficiency in `ui/palette.test.ts`).
- Explanatory text: short sentences, no idioms (many readers use English as a second language).

## EEE 321 Lab 02 notation and signs (Chapman § 7.1)
- Symbols: r, l, B, A_P = πrl, φ = A_P B, ω (and n = 60ω/2π r/min), v = rω, e_ind, i, R, V_B, τ_ind, τ_load;
  conductors ab and cd, end connections bc and da. In the UI always write (2/π)φ; the engine uses k = 2rlB.
- Equations: e_ind = 2vBl (7-5) = (2/π)φω (7-6); τ_ind = 2rilB (7-15) = (2/π)φ i (7-16); KVL V_B = e_ind + iR.
  Mode A (torque given): i = τ_load/(2/π)φ, e_ind = V_B − iR, ω = e_ind/(2/π)φ. Mode B (speed given):
  e_ind = (2/π)φω, i = (V_B − e_ind)/R, τ_ind = (2/π)φ i; the prime mover supplies −τ_ind.
- Signs: ω > 0 counter-clockwise; i > 0 out of the battery's + terminal into the loop (motor), τ_ind > 0 then;
  e_ind > 0 opposes that current; τ_load > 0 opposes rotation, τ_load < 0 = applied in the direction of rotation.
- Mode by current direction: i > 0 motor, i < 0 generator, i = 0 no load (at ω = 0 with i > 0: motor at standstill).
- Steady state only (no inertia in the book). A_P = πrl ignores pole gaps; the pole-arc fraction is drawing-only.
- Colours by meaning (`MACHINE_COLOR` in `ui/palette.ts`): voltage `--inc`, current `--ref`, mechanical
  (τ, ω, F, shaft power) `--trn`, field `--mute`, structure `--ink`. No new hex colours.
