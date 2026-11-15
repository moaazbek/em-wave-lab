# EEE 361 Field Lab

Online electromagnetics lab for EEE 361 students. Lab 01: uniform plane wave incident on a plane boundary.
Reference: D. K. Cheng, *Field and Wave Electromagnetics*, 2nd ed. (§ 8-2 to 8-10).

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (physics engine, formatting, palette, URL state)
- `npm run build` — `tsc --noEmit` then static build into `dist/` (relative base, works from any sub-path)
- `npm run preview` — serve the build

## Layout
- `src/physics/` — pure TypeScript engine, no React/DOM. Own complex-number module. Every number,
  plot and animation frame on screen must come from here; never compute physics in UI code.
- `src/labs/plane-wave-incidence/` — the lab (state + URL codec, derived model, field map, plots, teaching text).
- `src/shell/` — home page, lab registry (`labs.ts`), hash router, theme toggle.
- `src/ui/` — reusable controls (`ParamSlider`, `Segmented`, `Switch`), KaTeX (`Tex`, `Prose`), formatting, palette, theme.
- New labs: add a folder under `src/labs/` and one entry in `src/shell/labs.ts`.

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
