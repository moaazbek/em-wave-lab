# EEE 361 Field Lab (now two courses)

Online labs for students. Live: https://moaazbek.github.io/em-wave-lab/ (deploys on every push to `main`).
- EEE 361 Lab 01 `#/plane-wave-incidence`: plane wave at a boundary. Cheng, *Field and Wave Electromagnetics*, 2nd ed. (§ 8-2 to 8-10).
- EEE 321 Lab 01 `#/eee321-three-phase-transformer`: three-phase transformer connections, ideal and real bank. Chapman § 2.5–2.7, 2.10.
- EEE 321 Lab 02 `#/eee321-rotating-loop`: simple rotating loop. Chapman, *Electric Machinery Fundamentals*, 5th ed. (§ 7.1).
- EEE 321 Lab 03 `#/eee321-armature-winding`: armature windings, parallel paths and E_A. Chapman § 7.3, 7.5.
The repository is public: never add textbook pages, slides, figures, scans, exam papers or long quotations.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (physics engine, formatting, palette and contrast, URL state, data-ui DOM test)
- `npm run lint` — ESLint with jsx-a11y (Babel parser; TypeScript 7 has no JS API for typescript-eslint)
- `npm run build` — `tsc --noEmit` (app and `scripts/`) then static build into `dist/` (relative base)
- `npm run guide:screenshots` / `npm run guide:pdf` — re-take the guide's images / print its PDF (README "Updating the guide")
- `npm run preview` — serve the build

## Layout
- `src/physics/` — EEE 361 engine, pure TypeScript, no React/DOM. Own complex-number module. Every number,
  plot and animation frame on screen must come from here; never compute physics in UI code.
- `src/labs/eee321-rotating-loop/engine/` — EEE 321 Lab 02 engine (same rules), with its tests.
- `src/labs/plane-wave-incidence/` — the lab (state + URL codec, derived model, field map, plots, teaching text).
- `src/shell/` — home page grouped by course, `courses.ts` (course, textbook, footer), lab registry (`labs.ts`),
  hash router + `useUrlSync`, `LabHeader`, `LabFrame` (desktop 3 columns / phone pinned view + tabs), `Disclaimer`.
- `src/ui/` — shared components: `Button` (primary / secondary / small), `Chip`, `Disclosure`, icons (`buttons.tsx`),
  `LabTile`, `ParamSlider` (with `onOutOfRange`), `NumberField`, `Segmented`, `Switch`, `SelectField`,
  `Row`/`Badge`, `PlaybackControls`/`AngleReadout`, clock (`useClock`), teaching panels (`ExperimentList`,
  `WhatIsHappening`, `ShowWork`), KaTeX (`Tex`, `Prose`), formatting, palette, theme.
- `src/guide/` — the "How to use" guide (`#/guide`): text in `content/*.md` (`**[ui:Label]**` = checked UI label,
  `{{key: shown}}` = number checked against `values.ts`), shot list `shots.ts`, images in `public/guide/img/`.
  After any UI change: `npm run guide:screenshots`, `npm run guide:pdf`, `npm test`; update the text if a label moved.
- New labs: add a folder under `src/labs/` and one entry in `src/shell/labs.ts`; reuse the shared components; add a
  guide section `src/guide/content/<nn>-<route>.md` (the guide test requires one per lab).
- Never change a published route slug. Compare screenshots before and after any visual change.
- Everything clickable looks clickable: use `Button`, `Chip`, `Disclosure`, `ExperimentList`, `LabTile`, `Segmented`,
  `Switch`. Actions are `<button>`, navigation `<a href>`; never a click handler on a div, span or SVG group.
  Every button and link carries a `data-ui` value (tested in `src/ui-affordance.test.tsx`). Run `npm run lint`
  (jsx-a11y) before committing.

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

## EEE 321 Lab 01 notation (Chapman § 2.10, slides' symbols) — `#/eee321-three-phase-transformer`
- Engine: `src/labs/eee321-three-phase-transformer/engine/` (reuses `src/physics/complex.ts`).
- Terminals A, B, C, N (primary) and a, b, c, n (secondary). Exam notation everywhere (ideal and real):
  V_LL, V_LN (HV), V_ll, V_ln (LV); V_φP, V_φS winding voltages of one transformer; I_LP, I_LS line currents;
  I_φP, I_φS winding currents; a = N_P/N_S = V_φP/V_φS of ONE transformer; S bank, S_φ = S/3 one transformer.
  Never the slide-style V_p-pri, I_L-pri, I_p-pri, S_3φ, S_unit. Primary = HV in presets; if a < 1 show (LV)/(HV).
- Ideal transformers: V_Sk = V_Pk/a (dot to undotted); I_Pk into the primary dot = I_Sk out of the secondary dot / a.
- Phasors RMS; reference V_AN = (V_LL/√3)∠0° of the supply (for a Δ primary: supply to its neutral);
  abc: V_BN ∠−120°, V_CN ∠+120°; acb swaps them. So V_AB = V_LL∠+30° (abc), ∠−30° (acb).
- Netlists (dot → other), pri / sec: Y–Y A→N,B→N,C→N / a→n,b→n,c→n; Y–Δ A→N,B→N,C→N / a→b,b→c,c→a;
  Δ–Y A→C,B→A,C→B / a→n,b→n,c→n; Δ–Δ A→B,B→C,C→A / a→b,b→c,c→a. Everything is computed from these;
  the ratio (2-88)…(2-91) and the 30° shift are results, never hard-coded.
- Δ–Y note: Chapman Fig. 2-37c as printed (A→B, B→C, C→A) gives +30° (lead) with abc; the text and slides
  say lag, so the lab uses A→C, B→A, C→B. Test T6 keeps the "as printed" result checked; it is not in the UI.
- Load: I_x = ((S/3)∠θ / V_xn,eq)*; θ = +acos PF lagging. Delta winding currents: KCL + no circulating current.
- Phase colours (`PHASE_COLOR`): A/a T1 `--inc`, B/b T2 `--ref`, C/c T3 `--trn`; line-to-line and neutral `--ink`.
- Real bank ("Model: Ideal | Real bank"): approximate equivalent circuit of each transformer (R_C ∥ jX_M at the
  primary terminals, then R_eq + jX_eq); working values referred to the secondary (LV): Z_S = Z_P/a²,
  Y_E,S = a²Y_E,P. One solver: secondary windings at the ideal netlist's angles (|V_φS| rated, or from Eq. 2-64
  with |V_φP| held), V_Pk = a(V_Sk + Z_SE,S I_Sk), aI_Pk = I_Sk + (V_Pk/a)Y_E,S, then the same netlist code.
  Ideal = Z_SE = 0, no shunt (tested phasor by phasor). Shift readout = connection shift − δ.
- Tests: OC (2-40…2-47) gives R_C, X_M, SC (2-48…2-52) gives R_eq, X_eq, on the side measured. Bank line readings:
  Y side V/√3, I, P/3; Δ side V, I/√3, P/3. P > V·I is refused. Per-unit bases per side: V_φ,rated and
  S_φ = S/3; Z_base = V_φ²/S_φ = 3V_φ²/S (2-94); I_L,base = S/(√3 V_L) (2-95).
- VR = (|V_φP|/a − |V_φS|)/|V_φS| (2-62); P_Cu = 3I_φS²R_eq,S; P_core = 3|V_φP/a|²/R_C,S; η (2-67). The solutions
  manual has errors in Problems 2-10 to 2-13 (README Decisions): follow the book's equations, never the manual.
- Per-phase colours (`PERPHASE_COLOR`): voltage `--inc`, current `--ref`, power and losses `--trn` (losses tinted
  or hatched), elements `--ink`, neglected `--faint`.

## EEE 321 Lab 03 notation and winding model (Chapman § 7.3, 7.5) — `#/eee321-armature-winding`
- Engine: `src/labs/eee321-armature-winding/engine/` (formula part for any input; constructive part for drawing).
- Symbols: P, C (coils = segments), N_C, Z = 2CN_C (7-22), m (plex), a, y_c, y_s, p = y_s P/C (7-24), φ, n, ω
  ("mechanical speed, rad/s"), E_A, I_A, R_A, τ_ind, K = ZP/2πa, K' = ZP/60a.
- a: lap mP (7-26), wave 2m (7-28), frog-leg 2P m_lap (7-29). y_c: lap ±m (7-25), wave 2(C ± m)/P; + progressive,
  − retrogressive. For m = 1 this is Eq. (7-27); for m > 1 it is beyond the course: show the `--warn` "beyond the
  textbook" badge (`BeyondBadge`, `WorkStep.beyond`) wherever it appears. Frog-leg: no y_c, never drawn.
- E_A = Kφω = K'φn; e_cond = Pφω/2π = rωBl; τ = KφI_A; R_A by the series–parallel rule (elements per path × R, / a).
- Dead zone (geometry from θ_e = (P/2)θ_m): β = pole arc / pole pitch, 0.5–1 (1 = "ignore the dead zone").
  Arc β·360°/P mech, β·180° elec; gap (1−β)·360°/P mech, (1−β)·180° elec. Z_under = βZ, E_A,dz = (Z_under/a)e_cond
  = βKφω (Chapman p. 448; solutions manual P 7-2, 7-9); I_A, V_T, τ = βKφI_A use E_A,dz. φ = B·A_P, A_P = 2πrl/P
  (7-35, 7-36), B fixed. Flux input "φ | B, r, l". Coil-level average = mean brush voltage over one segment pitch.
- Model: two-layer, slots = C, Δ = 2π/C; coil k top slot k, bottom k + y_s, segments k → k + y_c; segment j at
  (j + (y_s − y_c)/2)Δ + α; N centres at electrical 0, b = ±1 within ±β·90°; brushes fixed at pole centres
  (P lap, 2 wave), width (m − 0.5) pitches; paths = cycles cut at tapped segments; polarity from potentials.
- Drawable rules live in ONE place: `drawRule` / `drawableCoilCounts(type, m, P, progressive)` in the engine; the
  build, smart adjust (`adjust.ts`), C stepper, chips and messages all use it. No segment under two brushes ⇒
  C/P ≥ m + ½. Lap: C multiple of mP, C ≥ 2P, C ≥ 2mP. Wave: P ≥ 4, C ≥ 2P + 1, C ≥ (m + ½)P, integer y_c.
  Draw only C ≤ 48. Invariants: traced paths = a, KVL, no shared segment, ideal path voltage = (Z/a)e_cond.
- Smart adjust (choice buttons only): keep the pressed choice; change P only if no C ≤ 48 exists, then C to the
  nearest drawable (tie: smaller; C > 48 kept), then y_s to full pitch; say every change. Typed C never changes.

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
