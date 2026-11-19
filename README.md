# EEE 361 Field Lab

An online laboratory for two courses: **EEE 361** (Electromagnetic Waves, textbook D. K. Cheng,
*Field and Wave Electromagnetics*, 2nd ed.) and **EEE 321** (Electromechanical Energy Conversion – I,
textbook S. J. Chapman, *Electric Machinery Fundamentals*, 5th ed.). Students change a value, see the fields
or the machine respond immediately, and read the same numbers they would get by hand from the textbook.

**Live site:** https://moaazbek.github.io/em-wave-lab/ (QR code for class: `qr-code.png` in the repository root;
it is not part of the website).

> Student project for EEE 361. Not an official course resource. Check results against the textbook
> (Cheng, *Field and Wave Electromagnetics*, 2nd ed.).
>
> Student project for EEE 321. Not an official course resource. Check results against the textbook
> (Chapman, *Electric Machinery Fundamentals*, 5th ed.).

| Course | Lab | Route | Textbook |
|---|---|---|---|
| EEE 361 | **01 Plane-wave incidence**: a uniform plane wave meets a plane boundary between two media. Normal and oblique incidence, both polarizations, lossless, lossy and perfectly conducting Medium 2, Brewster angle, total reflection, skin depth. | `#/plane-wave-incidence` | Cheng § 8-2, 8-3, 8-5 to 8-8, 8-10 |
| EEE 321 | **01 Three-phase transformer connections**: Y–Y, Y–Δ, Δ–Y and Δ–Δ banks of three single-phase transformers; wiring with moving current, phasor diagrams, waveforms, the √3 factors, the 30° shift, unit-rating input, third-harmonic view; real-bank mode with OC/SC tests, per-unit, voltage regulation, losses and efficiency. | `#/eee321-three-phase-transformer` | Chapman § 2.5–2.7, 2.10, Eqs. (2-40) to (2-67), (2-88) to (2-95), Example 2-9, Problems 2-10 to 2-13 |
| EEE 321 | **02 The rotating loop**: one loop between curved pole faces, fed by a battery through a resistor. Torque or speed given; motor, generator or no load; commutator; forces; power flow. | `#/eee321-rotating-loop` | Chapman § 7.1, Eqs. (7-1) to (7-16), Example 7-1, Problem 7-1 |
| EEE 321 | **03 Armature windings and E_A**: lap, wave and frog-leg windings; developed diagram drawn by the program, parallel paths traced through it, end view, path schematic, brush voltage, Z, a, y_c, E_A, R_A, I_A; exam mode "Identify the winding". | `#/eee321-armature-winding` | Chapman § 7.3, 7.5, Eqs. (7-22) to (7-49), Examples 7-2 to 7-4, Problems 7-4, 7-5, 7-7 |

Planned: EEE 361 Faraday's law and moving loops, transmission lines.

## Run, test, build

Requires Node 20 or newer.

```sh
npm install
npm run dev        # development server, open the printed URL
npm test           # unit tests (both engines, formatting, colours, URL state)
npm run build      # type check (tsc, strict) + static production build into dist/
npm run preview    # serve dist/ locally
```

## Publish an update

Commit and push to `main`. The workflow tests, builds and redeploys the site in about a minute:

```sh
npm test && npm run build      # optional local check first
git add -A
git commit -m "Describe the change"
git push
gh run watch                   # optional: follow the deploy
```

If the tests fail, the site is not updated and the previous version stays online.

## Deploy to GitHub Pages (first-time setup, already done for this repository)

The build is fully static, uses relative asset paths and hash routing (`#/plane-wave-incidence?...`),
so it works from any sub-path such as `https://<user>.github.io/<repo>/`.

1. Push the repository to GitHub.
2. In the repository settings, open **Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`: install, test, build, publish `dist/`.

Any other static host works too: upload the contents of `dist/`.

## Lab 01 (EEE 361): what is in the lab

- **Field map.** Every pixel is the instantaneous total (or incident / reflected / transmitted) field
  component, computed by the engine and animated in time. A diverging colour map, tuned separately for the
  light and dark themes. Rays with arrowheads, angle arcs with live values, opacity following the power
  each ray carries. Drag the incident ray to change θᵢ.
- **Plot along z** at x = 0: instantaneous field plus the envelope |F(z)|, with standing-wave maxima,
  minima and S at normal incidence.
- **|Γ⊥| and |Γ∥| against θᵢ**, with markers at θ_c and θ_B; drag on it (or use the arrow keys) to set θᵢ.
- **Results:** class badge, loss tangent, α, β, η (rectangular and polar), u_p, λ, δ; Γ, τ, θ_t, θ_c,
  θ_B, power fractions, S, surface current on a perfect conductor.
- **Advanced switch:** complex forms, γ, |τ|², the other Brewster angle, and the comparison of Cheng's
  low-loss and good-conductor approximations with the exact values (with percentage error).
- **What is happening:** two or three plain sentences about the current situation, plus one sentence that
  reacts to the last change.
- **Show the work:** each governing equation, the same equation with the current numbers, the result,
  and the instantaneous fields in cosine form.
- **Six guided experiments**, each with a question to predict before revealing the answer.
- The full setup is in the URL; **Copy link** shares an exact configuration.

## Lab 01 (EEE 321): three-phase transformer connections

- **Wiring view**, generated from the netlist: three single-phase transformers stacked (T1, T2, T3),
  primary coils left and secondary coils right with polarity dots, one vertical rail per terminal
  (A, B, C, N and a, b, c, n), orthogonal wires and junction dots, a Y or Δ symbol per side, and the live
  winding voltage phasor beside each coil. Moving dots run along every wire; their direction and speed follow
  the engine's instantaneous current (rail currents by KCL from the winding currents), scaled per side
  (display only). Under reduced motion, static arrows show the direction instead.
- **Phasor diagrams**, primary and secondary on the same angle reference: winding phasors thin in the phase
  colour, line-to-line phasors thick in ink, line currents dashed. A dashed line shows the direction of V_AB on
  the secondary diagram with an arc to V_ab ("30° lag", "30° lead" or "no shift"). "Rotate with ωt" turns
  them with the slowed time (their real parts match the waveforms) or freezes them at t = 0; "Overlay"
  draws the secondary on the primary diagram, scaled by V_LL/V_ll (display only).
- **Waveforms:** one period of v_AB and of v_ab·V_LL/V_ll, a time cursor, and a bracket marking the shift as
  T/12 (1.389 ms at 60 Hz, 1.667 ms at 50 Hz). With the third-harmonic view: the three v_kN with harmonic h,
  their (identical) third-harmonic part, v_AB without it, and the sum of the harmonics around a delta.
- **Model: Ideal | Real bank.** The real bank uses Chapman's approximate per-phase equivalent circuit of each
  transformer (R_C ∥ jX_M at the primary terminals, then R_eq + jX_eq) and solves the end-of-chapter bank
  problems: rating (one transformer or the bank, Problem 2-10), the equivalent circuit from OC and SC test data
  (on either side, as bank line readings or one-transformer readings), from per-unit values or from ohms on
  either side; operating point with the secondary or the primary held at rated voltage; load as S or % of
  rated, PF lagging / unity / leading; display referred to HV, LV or per-unit.
  Hero switch "Connections | Equivalent circuit": the per-phase circuit with live values (neglected elements
  faint and dashed), sketches of the OC and SC set-ups with the converted readings, and the per-phase phasor
  diagram (V_φS, I_φS, R_eq,S I, jX_eq,S I, V_φP/a, δ, VR) with a labelled display gain for the drops. Below:
  power bars (P_in → P_out, P_Cu, P_core; Q in a second row) and VR (three PFs) and η against load, 0–125 %.
  Results, Show the work in exam order, six real-bank experiments, and six presets (Example 2-9, Problems
  2-10 to 2-13, midterm-style bank) with notes on the solutions manual's errors.
- **Inputs (ideal):** connection; "line voltage and a" or "unit rating" (one unit's winding voltages and S_φ; the
  lab derives a, V_LL and the rated S = 3S_φ, with a "Rated load" button); balanced load S, PF, lagging / unity / leading;
  sequence abc/acb; 50 or 60 Hz; presets (Example 2-9, the 3 × 10 MVA bank, Y–Δ 13.8 kV, Y–Y 480/240 V,
  Δ–Δ 4160/480 V).
- **Results**, **What is happening**, **Show the work** (equation, numbers, result for each step of the
  current connection, ending with the phase shift and its reason) and six **guided experiments**.

### Lab 01 (EEE 321) model, notation and wiring

- Bank of three ideal single-phase transformers (no winding impedance, no magnetizing current), balanced load,
  no circulating current in a delta. RMS phasors; reference V_AN = (V_LL/√3)∠0° of the supply (for a Δ
  primary, the supply's voltage to its own neutral); abc: V_BN at −120°, V_CN at +120°; acb swaps them.
- Netlists (dotted end → other end), primary / secondary: Y–Y A→N, B→N, C→N / a→n, b→n, c→n;
  Y–Δ A→N, B→N, C→N / a→b, b→c, c→a; Δ–Y A→C, B→A, C→B / a→n, b→n, c→n; Δ–Δ A→B, B→C, C→A /
  a→b, b→c, c→a. The engine computes node potentials, winding currents (KCL plus no circulating current),
  line currents and powers from these netlists; the ratio and the 30° shift are results, not rules.
- The third-harmonic amplitude h is a display parameter (the book gives none); the circulating current it
  drives in a delta is described, not computed.
- Notation (the course's exam notation): V_LL, V_LN (HV), V_ll, V_ln (LV); V_φP, V_φS winding voltages of one
  transformer; I_LP, I_LS line currents; I_φP, I_φS winding currents; a = N_P/N_S = V_φP/V_φS of one
  transformer; S of the bank, S_φ = S/3 of one transformer; R_C, X_M, Y_E = G_C − jB_M; R_eq, X_eq,
  Z_SE = R_eq + jX_eq; subscript P or S for the side a value is referred to.
- Real bank: one solver for both models. The secondary windings sit at the angles the ideal netlist gives
  them; each transformer k: V_Pk = a(V_Sk + Z_SE,S I_Sk), a I_Pk = I_Sk + (V_Pk/a) Y_E,S; node voltages and line
  currents then come from the same netlists. Referral Z_S = Z_P/a², Y_E,S = a² Y_E,P. Per-unit bases are each
  side's rated winding voltage and S_φ (Eqs. 2-92 to 2-95). Test readings: Y side V/√3, I, P/3; Δ side V, I/√3,
  P/3. VR (2-62), P_Cu = 3I_φS²R_eq,S, P_core = 3|V_φP/a|²/R_C,S, η (2-67). The shift readout becomes
  (connection shift) − δ.

## Lab 03 (EEE 321): armature windings, parallel paths and E_A

- **Developed winding diagram** (the exam's style), drawn from the engine: pole strip over β of each pole
  pitch, slot numbers, each coil as a diamond (top-layer side solid, bottom-layer side dashed at slot + y_s),
  leads to the commutator segments, fixed brushes labelled + or − from the computed potentials, conductor
  marks ⊙ (+) and ⊗ (−) in the two ends of the field colour map, faint in the dead zone, and a mark on coils
  being commutated. The rotor slides left past the fixed poles and brushes, wrapping around. Path chips
  ("Path 1 … Path a") and the brushes highlight their path in magenta. Large diagrams scroll inside their frame.
- **End view** (C slots with both coil sides, P curved pole faces exactly β·360°/P wide at a fixed radius,
  field lines only under the pole faces, one dead zone marked "dead zone 18° mech · 36° elec", commutator ring,
  fixed brushes, θm and θe), **path schematic** (+ rail, one row per path with each coil's voltage, the path
  sum, − rail; coils shorted by a brush listed separately) and **brush voltage against rotor angle** over three
  segment pitches with the book's E_A = Kφω (solid, "Eq. 7-38, dead zone ignored"), βKφω (dashed, "conductors
  under the pole faces") and the coil-level average (dotted). A coil shorted by a brush while it has voltage gets
  a `--warn` note ("shorted while it has voltage", § 7.2).
- **Smart adjust:** pressing a choice button (winding type, plex, direction, P) keeps that choice and changes as
  few other settings as needed to reach a drawable winding: P only when no C ≤ 48 can be drawn with it (wave with
  P = 2 → 4; triplex lap with P = 10 or 12 → 8), then C to the nearest drawable value (tie: the smaller), then
  y_s back to full pitch. Every automatic change is listed in the "what changed" sentence with its reason.
  P buttons that cannot be drawn are disabled with a hint. The C − / + buttons step between drawable values,
  "Drawable: …" chips show up to 8 of them, and slider moves stop on them; typed values are never changed.
- **Messages** appear only for a typed C that cannot be drawn (reason + "Go to nearest drawable (C = …)"),
  C > 48 ("Diagram drawn only for C ≤ 48; the numbers are still exact" + "Show a small drawable version"),
  frog-leg (numbers only), and a simplex wave preset whose y_c is not an integer (Example 7-4, the book's reason).
- **Multiplex wave windings** (duplex, triplex) are drawn with y_c = 2(C ± m)/P and a = 2m, marked with the
  `--warn` "beyond the textbook" badge wherever the pitch formula appears (results, Show the work, caption).
- **Formula results** for any input (Z, a, y_c, brushes, C/a, Z/a, p, pole arc and dead zone angles, Z_under,
  K, K', ω, e_cond, E_A, E_A,dz, coil-level average, R_A by the series–parallel rule, I_A, I_A/a, V_T, τ_ind).
- **Flux input:** "Flux given as φ | B, r, l"; the second mode uses φ = 2πrlB/P (Eq. 7-36), e_cond = rωBl.
- **Exam mode** "Identify the winding": a random drawable winding without type labels; the student enters
  type, plex, direction, coils, conductors, segments, paths and y_c; Check grades each field with a reason.
- Presets (Examples 7-2, 7-3, 7-4, Problems 7-7 and 7-2 (dead zone), the 9-coil wave and the 16-coil lap),
  seven guided experiments (including "The dead zone" with Problem 7-2), What is happening, Show the work in the
  order Z, a, y_c, (φ), K/K', ω, E_A, then with β < 1 θ_gap,m, θ_gap,e, Z_under, E_A,dz, then R_A, I_A, V_T, τ.

### Lab 03 (EEE 321) model

- Two-layer winding, slots = coils = segments, slot pitch Δ = 2π/C. Coil k: top side in slot k, bottom side
  in slot k + y_s; starts at segment k, ends at segment k + y_c. Segment j is centred at
  (j + (y_s − y_c)/2)Δ + α, so each coil's centre line lies midway between its two segments.
- Field: N centres at electrical 0, S at 180°, b = ±1 within ±β·90° electrical, 0 in the dead zone.
  Conductor voltage e = b·e_cond with e_cond = Pφω/(2π) (= rωBl); coil voltage N_C(e_top − e_bottom).
- Dead zone (geometry, from θ_e = (P/2)θ_m, Eq. 7-23): β = pole arc / pole pitch (0.5–1); pole arc β·360°/P mech
  (β·180° elec); gap (1 − β)·360°/P mech ((1 − β)·180° elec). Course estimate (Chapman p. 448; solutions manual
  Problems 7-2, 7-9): Z_under = βZ, E_A,dz = (Z_under/a) e_cond = βKφω, τ_ind,dz = βKφI_A, I_A = E_A,dz/(R_A + R_L).
  φ keeps the book's definition B·A_P with A_P = 2πrl/P (Eqs. 7-35, 7-36). Coil-level average: the mean brush
  voltage over one segment pitch, 2000 samples.
- Brushes fixed at the pole centres (on the neutral plane): P for lap, 2 one pole pitch apart for wave;
  width (m − 0.5) segment pitches. Paths are traced by cutting the commutator cycles (gcd(|y_c|, C) of them) at
  the tapped segments; a chain between brushes of opposite polarity is a path, a chain returning to the same
  brush is being commutated. Brush polarity comes from the computed potentials.
- Constructive limits, all in one engine function (`drawRule`, listed by `drawableCoilCounts(type, m, P,
  direction)`): no segment may ever be under two brushes, which needs C/P ≥ m + ½ (see Decisions).
  Lap (m = 1–3): C a multiple of mP, C ≥ 2P, and so C ≥ 2mP. Wave (m = 1–3): P ≥ 4, C ≥ 2P + 1, C ≥ (m + ½)P,
  2(C ± m)/P an integer. Frog-leg: not drawn. C ≤ 48 for drawing.

## Lab 02 (EEE 321): the rotating loop

- **Front view of the machine**, drawn from the engine: yoke, N pole left and S pole right with curved
  faces, radial B-field lines, iron rotor, conductors ab and cd at radius r, the commutator (two half rings)
  and two fixed brushes, and the external circuit (battery V_B, resistor R, current arrow, brush polarity).
  The loop turns at the engine's ω, slowed down; the caption gives the factor ("Shown at 1/200 of real speed").
  Each conductor shows its current (⊙ / ⊗), the polarity of its induced voltage (+ / −) and the force
  F = ilB as an arrow on a fixed, labelled scale. Beyond the pole edges the marks disappear and the brushes
  are highlighted while they short the segments. A badge reads MOTOR, GENERATOR or NO LOAD; Mode B adds a
  prime-mover block with its torque.
- **Voltage against rotor angle** over two revolutions: loop voltage and brush voltage, the gaps between the
  poles shaded, and a cursor at the current angle. A pole-arc fraction control (default 0.9) changes only
  this drawing.
- **Operating line** ω(τ_load) from (7-6), (7-16) and KVL, motor and generator halves, the operating point;
  drag it to set τ_load (torque given) or ω (speed given).
- **Power bars** P_B, P_R and P_conv on one fixed scale, plus P_shaft and "Why the difference?
  P_B − P_conv = i²R".
- **Results:** φ, (2/π)φ, e_ind, i, ω, n, τ_ind, v, F, all powers, the mode, and in Mode A i_start, ω_nl and
  τ_stall. **What is happening** and a sentence that reacts to the last change; **Show the work** in three
  lines per step (equation, numbers with units, result) with equation numbers; six **guided experiments**.
- Presets from Example 7-1 (b)–(e) and Problem 7-1; "customized" appears when a value is changed. The full
  state is in the URL.

### Lab 02 model and sign conventions

- Steady state only. Chapman gives no inertia, so start-up is described in words (Example 7-1(a)), not
  animated: when an input changes the new steady state is shown at once.
- A_P = πrl ignores the gaps between the poles; all numbers use it. The gaps appear only in the waveform and
  the drawing. B is uniform and radial under the poles, zero beyond their edges. The only loss is i²R.
- ω > 0 is counter-clockwise; i > 0 flows out of the battery's + terminal into the loop (motor action), and
  then τ_ind > 0; e_ind > 0 opposes that current; τ_load > 0 opposes the rotation, τ_load < 0 is a torque
  applied in the direction of rotation.
- Mode A (torque given) allows τ_load from −τ_stall up to just below τ_stall = (2/π)φ V_B/R; a larger typed
  value is held at the limit with a warning. Mode B (speed given) allows 0 ≤ ω ≤ 2 ω_nl; a negative typed
  speed is held at 0 with a warning.

## Lab 01 (EEE 361): model, assumptions and limits

- Uniform plane waves, time-harmonic steady state (phasors with e^{jωt}).
- Linear, isotropic, homogeneous media; one plane interface at z = 0.
- Medium 1 (z < 0) is lossless. Medium 2 (z > 0) may be lossless, lossy or a perfect conductor.
- ε_r, μ_r and σ are constants: no frequency dispersion. (Real seawater, for example, changes ε_r at
  microwave frequencies; the lab keeps the values of the preset.)
- Material presets are typical, approximate values.
- Oblique incidence on a lossy Medium 2 is not treated in the textbook. The lab computes it with the same
  general formulation (complex cos θ_t) and marks it "beyond the textbook"; no real refraction angle is drawn.

## How the physics is computed

`src/physics/` is pure TypeScript with no UI imports. The UI, the plots and the animation all read from it.

- Medium: γ = √(jωμ(σ + jωε)), η = jωμ/γ, roots with α ≥ 0, β > 0, Re η > 0.
- Interface: k_x = β₁ sin θᵢ, k₂z = √(ω²μ₂ε_c2 − k_x²) with Re ≥ 0, Im ≤ 0, cos θ_t = k₂z/k₂, then Cheng's
  formulas for Γ and τ as written. Ordinary refraction, total reflection and lossy media come from this one
  code path; PEC is a separate explicit case (Γ = −1, τ = 0).
- Fields: each field is e^{−jk_x x}·g(z), so the map evaluates the two factors once and combines them per
  frame.
- Tests (`src/physics/physics.test.ts`) check the textbook cases listed in the brief, and a boundary-condition
  test on 600 random combinations of media, frequency, angle and polarization: tangential E and H (and
  normal B) are continuous at z = 0, the power that enters Medium 2 computed from the Poynting vector
  equals 1 − |Γ|², and the transmitted field never grows with depth.

## Decisions

- **Hash routing and relative base path** so the build works on GitHub Pages under any repository name
  without configuration.
- **Classification thresholds:** σ/ωε < 0.01 low-loss dielectric, > 100 good conductor, in between a
  general lossy medium; σ = 0 is always lossless. The UI says these limits are a convention.
- **Medium 2 magnified panel:** when the field in Medium 2 varies over less than λ₁/14 along z (a good
  conductor, or a strongly evanescent field), Medium 2 gets its own z scale, marked "Different scale" with
  its own scale bar and dashed outline. The x scale stays shared so phase fronts still match at the boundary.
- **Weak-field colour gain:** in a good conductor the transmitted E is a tiny fraction of E_i0 (seawater
  at 5 MHz: 1.7 %) and would be invisible. When the peak field in Medium 2 is below 10 % of E_i0 (or H_i0),
  the map and the z-plot multiply Medium 2 by a 1-2-5 factor and label it ("Weak field: colour scale ×50").
  This is display-only: the results, explanations and equations use the true values, and the z-plot adds a
  second y axis on the Medium 2 side that shows the true (unamplified) values.
- **Colour range** of the map is ±2 times the incident amplitude, the largest value a total field can reach
  in Medium 1.
- **Slowed time:** the animation runs at 0.125 to 1 displayed periods per second; the caption states the
  slow-down factor. It starts at ωt = 45°, because at ωt = 0 a pure standing wave in E is zero everywhere.
  With `prefers-reduced-motion` the animation starts paused (Play and Step still work).
- **Field shown:** switching polarization also switches the map to the field along a_y (E for
  perpendicular, H for parallel). For the field that lies in the plane of incidence the student chooses
  the x or z component.
- **Standing-wave extremes** are computed from the exact, unrounded phase of Γ, with z′ = −z the distance
  from the interface: θ_Γ − 2β₁z′_min = −π and θ_Γ − 2β₁z′_max = 0 (mod 2π). A computed extreme that lies
  behind the interface (inside Medium 2) by less than λ₁/1000 is reported as "at the interface"; the exact
  position is still shown in "Show the work". Example: copper at 3 MHz has θ_Γ = 179.99986°, and its first
  minimum lies 19 µm behind the interface (λ₁/1000 = 99.9 mm), so |E| is minimum at the interface.
- **Display rounding only:** Γ, τ and every field value are used unrounded by the engine, the field map and
  the plots. Phases near 0° or 180° are printed with enough decimals to show the departure (179.99986°).
- **Real Γ and τ** are shown with their sign (Γ = −0.3820, as in the textbook); complex ones in polar form,
  with the other form in the advanced view.
- **Wave colours** (incident amber, reflected magenta, transmitted green) were checked with a
  colour-vision-deficiency simulation (protan, deutan, tritan); the check runs as a unit test
  (`src/ui/palette.test.ts`). The rays also differ in position and labels, so colour is never the only cue.
- **Fonts:** IBM Plex Sans for text and IBM Plex Mono with tabular figures for numbers, bundled locally
  (no external requests).
- **Two courses, one site.** Labs are grouped by course on the home page; each course has its own
  footer (`src/shell/courses.ts`). The site name "EEE 361 Field Lab" (page title) and the repository name no
  longer cover both courses; the owner should decide whether to rename them. Routes are unchanged:
  `#/plane-wave-incidence` still works, and the new lab is `#/eee321-rotating-loop`.
- **Shared pieces** (clock, playback controls, guided-experiment panels, Show the work, result row, select,
  lab header, two-layout frame, URL sync) moved to `src/ui` and `src/shell`, so both labs use the same
  components. Six reference screenshots of Lab 01 were compared pixel by pixel before and after: identical.
  One fix came with it: on phones the Lab 01 footer was drawn above the Plots tab content; it is now at the
  bottom.
- **Lab 02, motor or generator** follows the direction of the current only: i > 0 motor, i < 0 generator,
  i = 0 no load. For ω > 0 this equals the sign of P_conv. At standstill (ω = 0, experiment 1) P_conv = 0
  but current flows out of the battery: the lab calls this "motor at standstill".
- **Lab 02, display speed:** the slow-down factor is a 1-2-5 number chosen from the no-load speed and the
  speed choice (0.125–1 rev/s), never from the operating point. So loading the motor visibly slows the loop,
  and weakening the field visibly speeds it up. It is never below 1 (real speed).
- **Lab 02, fixed scales** that do not move with the torque or speed sliders: waveform ±2.2 V_B (e_ind ≤ 2 V_B
  for ω ≤ 2 ω_nl); operating line τ_load ∈ [−τ_stall, τ_stall], ω ∈ [0, 2.1 ω_nl]; force arrows full length
  i_start·l·B; power bars half-length V_B²/4R (the largest power the loop can convert as a motor). Longer
  power bars are cut at the edge and marked « or ». Numbers always show the true values.
- **Lab 02, induced-voltage marks:** a front view cannot show a direction along the conductor, so each
  conductor carries + or − for the polarity of its end nearest the viewer (+ when the induced voltage points
  out of the page). The legend above the drawing says so.
- **Lab 02, conductors between the poles:** no voltage, no force and no current mark, because the brushes
  short the loop there and the external current bypasses it.
- **Lab 02, brushes** sit midway between the poles (top and bottom of the drawing) and the commutator gaps
  line up with the conductors, so the segments switch where the loop voltage is zero. With pole-arc
  fraction 1 the switch is instantaneous; it is drawn over ±3° so it can be seen.
- **Lab 02, torque slider** steps on a 1-2-5 grid (τ_stall/500, 0.2 N·m for Example 7-1) so the book's values
  are reachable by dragging; its top is one step below τ_stall.
- **Lab 02, units** follow the book: R in Ω (0.3 Ω, not 300 mΩ), φ in Wb, (2/π)φ in V·s with up to six
  significant figures. Engineering input accepts "120 V", "0.25 T", "250 mT", "4.7k", "10 N·m".
- **Lab 02 default:** Example 7-1(c), a motor with a 10 N·m load, so current, forces and power show at once.
- **Lab 02 has no Advanced switch:** every quantity the brief asks for is shown in the normal view.
- **EEE 321 Lab 01, Δ–Y wiring:** the lab uses T1 A→C, T2 B→A, T3 C→B, which gives the 30° lag (abc) that
  Chapman's text and the course slides state. Chapman's Fig. 2-37c as printed (A→B, B→C, C→A) gives a 30°
  lead with abc; a unit test (T6) proves this, so the claim is checked. The voltage ratio is the same. The
  printed wiring is not offered in the lab; a note in "Show the work" explains the choice.
- **EEE 321 Lab 01, complex numbers:** the engine reuses the repository's self-written, tested module
  (`src/physics/complex.ts`) instead of adding a second copy.
- **EEE 321 Lab 01, phase colours:** phase A/a (T1) `--inc`, B/b (T2) `--ref`, C/c (T3) `--trn` through
  `PHASE_COLOR` in `src/ui/palette.ts`; line-to-line phasors and the neutral `--ink`. Primary and secondary are
  told apart by position and upper/lower-case labels, never by colour. The same three tokens mean voltage,
  current and mechanical quantities in the DC labs; each lab's legend states its meaning.
- **EEE 321 Lab 01, moving dots:** each wire is drawn as a dashed stroke of dots whose offset advances by
  k·i(ωt)·Δ(ωt), so the dots move back and forth with the AC current. k is chosen per side so that the largest
  line current moves 26 px per radian of ωt. A browser check confirms the dots on rail A move with the
  engine's i_A at all 24 steps of a period.
- **EEE 321 Lab 01, starting phase:** ωt starts at 0, so a frozen phasor diagram, the waveform cursor and
  the dots all show t = 0.
- **EEE 321 Lab 01, frequency defaults:** 60 Hz for the Chapman presets (US examples), 50 Hz for the
  3 × 10 MVA bank.
- **EEE 321 Lab 01, real bank — the solutions manual has errors; the lab follows the book's equations.**
  Problem 2-11(d): the manual uses P_out = 80 MW; 80 MVA at PF 0.8 is 64 MW, so η = 96.91 %, not 97.5 %.
  Problem 2-12: the manual computes Z_base,HV with 25 kVA instead of 20 kVA and in (b) uses yet another
  impedance (0.0125 + j0.0588); its VR = 3.8 % and η = 96.9 % are wrong; the lab gives 2.94 % and 97.15 %.
  Problem 2-13: the manual writes 8413 V instead of 8314 V (V_φP = 8856 V, VR = 6.52 %); the lab gives
  8757 V and 5.32 %. In (e) the manual uses V_φ²/S with the bank S (230 Ω); Eq. (2-94b) gives 3V_φ²/S = 691 Ω,
  so Z = 0.0273 + j0.0518 pu. Problem 2-10: the manual's turns ratios (2.50, 1.44, 4.33) belong to a
  34.5/13.8 kV bank; for 34.5/11 kV they are 3.136, 1.811, 5.432, 3.136. Each preset shows its note.
- **EEE 321 Lab 01, real bank, operating point:** "secondary at rated voltage" (default) holds V_φS at its
  rating at the angle the ideal netlist gives that winding. "Primary at rated voltage" holds |V_φP| and solves
  |V_φS| from Eq. (2-64); the load then means the winding current (S_load/3)/V_φS,rated (rated current at
  100 %), so the delivered VA is a little below S_load. If Eq. (2-64) has no solution the lab says so and
  computes nothing.
- **EEE 321 Lab 01, real bank, inputs:** the shunt branch is used only when the OC test is on (test data) or
  the "excitation branch" switch is on (per-unit / ohms); otherwise P_core = 0 and the results and the work say
  "shunt branch neglected". The SC test off means Z_SE = 0. A wattmeter reading above V·I (or a negative one)
  is refused with a `--warn` message and nothing is computed. Switching the circuit source (per-unit, ohms on
  either side) carries the present circuit over in the new units; switching the model carries the ratings over.
- **EEE 321 Lab 01, real bank, presets:** Problem 2-10 gives only ratings, so its preset uses test data with
  both tests off (an ideal circuit): the numbers to compare are the ratings and a for the four connections.
  The book's 60 Hz for Chapman's problems, 50 Hz for the midterm-style bank. Problem 2-12's rated load is
  3 × 20 kVA at PF 0.9 lagging; Problem 2-13's 300 kVA at PF 0.8 lagging.
- **EEE 321 Lab 01, real bank, "primary (HV)":** the primary is the HV side in every preset. If the student sets
  a < 1 the labels stay "primary / secondary" with "(LV)" / "(HV)" beside them.
- **EEE 321 Lab 01, notation change:** the whole lab, including the ideal mode, now uses V_φP, V_φS, I_LP, I_φP,
  I_LS, I_φS, S and S_φ instead of the slide-style V_p-pri, I_L-pri, I_p-pri, S_3φ, S_unit. The ideal results are
  unchanged (its browser test passes with the same values). The PF control gained "unity".
- **EEE 321 Lab 01, real bank, display:** the drop phasors may be drawn ×5 or ×10 (labelled "display only"; the
  closing V_φP/a is drawn to the magnified tip, the numbers are true). The η plot zooms on the useful range;
  loads under 10 % fall below its axis and are not drawn. Losses use the power token `--trn` with a lighter
  tint (P_Cu) or a hatch (P_core). Shared additions: `NumberField` (typed values without a slider) and
  `PERPHASE_COLOR` in `ui/palette.ts`.
- **EEE 321 Lab 01, display noise:** P or Q below 10⁻⁹ of S is shown as 0 (for example Q at PF 1).
- **Shared "Show the work" notes** may now contain inline maths (rendered with KaTeX). Lab 01 (EEE 361) is
  unchanged: its six reference screenshots are still pixel-identical.
- **EEE 321 Lab 03, multiplex lap needs C ≥ 2mP (a real limitation found by the tests).** The path-count
  invariant failed for multiplex lap windings with one coil per path (for example duplex, P = 4, C = 8, or
  triplex, P = 6, C = 18). Brushes are (m − 0.5) segments wide and only C/P segments apart, so when C/P ≤ m a
  + brush and a − brush reach the same segment and short each other. The constructive part therefore draws
  multiplex lap windings only for C ≥ 2mP (at least two coils per path) and says why otherwise. For simplex
  lap this is the brief's C ≥ 2P. The tolerance was not loosened; 20 000 extra random cases trace exactly a paths.
- **EEE 321 Lab 03, drawing limit vs tracing:** C ≤ 48 limits only the drawing. The tracing has no size limit
  (a test traces Example 7-3's duplex lap, P = 6, C = 72, and finds 12 paths).
- **EEE 321 Lab 03, clean starting angle:** the lab opens (and exam mode draws) at a rotor angle where every
  brush touches exactly m segments, found by scanning one segment pitch; a test checks it for 500 windings.
  Highlighting the paths (experiment 1) pauses at such an angle, so each path shows its full C/a coils.
- **EEE 321 Lab 03, rotation and speed:** the rotor turns so that the coils slide left in the developed diagram
  (clockwise in the end view); e_cond is taken positive for the chosen ω. Playback is in segment pitches per
  second (0.5–4 seg/s); the caption gives the slow-down factor against the real speed.
- **EEE 321 Lab 03, brush voltage:** the coil-level brush voltage is the mean potential of the + brushes minus
  that of the − brushes, with brush potentials from a least-squares fit over the traced paths. With β = 1 and a
  full-pitch lap winding it equals Kφω whenever no coil is commutated (tested exactly).
- **EEE 321 Lab 03, Example 7-2 preset:** the four-loop machine uses illustrative values (φ = 0.05 Wb,
  1200 r/min, 0.1 Ω per coil); the other presets use the book's data.
- **EEE 321 Lab 03, speed input:** "400", "400 rpm", "400 r/min", "50 rev/s" (= 3000 r/min) and "rad/s" are
  accepted. Shared `ParamSlider` gained optional `parse` and `integer` props, and `PlaybackControls` an optional
  label format; Lab 01 (EEE 361) is still pixel-identical.
- **EEE 321 Lab 03, follow-up — brush overlap rule replaces the brief's lower limits (a real fault found by
  the tests).** The brief allowed lap C ≥ 2P for every m and wave C ≥ max(2P + 1, mP). Brushes are (m − ½)
  segments wide and C/P segments apart, so they touch a common segment at some rotor angle whenever C/P < m + ½;
  that segment then shorts a + brush to a − brush. The path count can still look right (it does for the triplex
  wave, P = 4, C = 13), so the brief's 765-case check could not see it. A new invariant ("no segment under two
  brushes") failed for 16 multiplex wave windings that the brief allows. The lab therefore uses C/P ≥ m + ½:
  for lap this is C ≥ 2mP (unchanged), for wave C ≥ (m + ½)P. Consequences for the brief's test values:
  triplex wave, P = 4: 13 → 15 (y_c = 9); wave m = 3, P = 4 → P = 12: C = 45 (list: 45), not 39; wave m = 2,
  P = 12: list 34, 40, 46 (not 28); duplex wave → Lap at P = 4, C = 12: C = 16, not 8; lap m = 2, P = 8 from 24:
  32, not 16; lap m = 3, P = 12: no drawable C ≤ 48 (36 would short the brushes). The test with a 6-cycle path
  count uses the triplex wave P = 4, C = 15 and C = 17 instead of C = 13; C = 13 is tested as refused.
  A test runs every drawable winding at 600 rotor angles and finds no shared segment.
- **EEE 321 Lab 03, smart adjust may change P for triplex lap.** Triplex lap with 10 or 12 poles needs
  C ≥ 60 or 72, more than the lab draws. Pressing triplex there moves P to the nearest pole count that can be
  drawn (8), and says so; while triplex lap is selected the P = 10 and 12 buttons are disabled with a hint.
  The brief's coverage test therefore holds for every combination except these two (tested exactly).
- **EEE 321 Lab 03, slider and experiments:** moving the C slider stops on drawable values up to 48 (it is a
  control, not typing); typed values are never changed. Experiment answers apply their change directly
  (no smart adjust): "Lap → wave, same coils and flux" must keep C = 16, so it shows the not-drawable message
  with "Go to nearest drawable", and the answer explains why.
- **EEE 321 Lab 03, dead zone and flux:** the course method holds B under the poles fixed, so β lowers the
  conductor count and E_A,dz = βKφω. If the *real* flux per pole were held fixed instead, narrower poles would
  raise B under them and the average E_A would not fall. When β < 1, I_A, V_T and τ use E_A,dz (as the solutions
  manual does in Problem 7-2); the book's E_A = Kφω stays in the results as "dead zone ignored". The book's
  example presets use β = 1; the two figure presets (16-coil lap, 9-coil wave) open with β = 0.8 so the gaps show.
- **EEE 321 Lab 03, where the coil-level average equals βKφω.** It does (within 2 × 10⁻³, tested on random
  simplex lap windings, full pitch, C/P ≥ 4, β 0.5–0.8) when the coil being commutated is wholly in the dead
  zone. It is not exact for β near 1, for chorded coils or for very few coils per pole: there a commutated coil
  is still partly under a pole, so the lab also shows the `--warn` note "shorted while it has voltage".
- **EEE 321 Lab 03, clean angle for multiplex wave:** for some multiplex wave windings the two brushes never
  touch exactly m segments at the same time; the lab then opens at the angle where most brushes do.
- **Shared components (Lab 01 EEE 361 still pixel-identical):** `Segmented` options may be `disabled`;
  `ParamSlider` has an optional `snap` for slider moves only; `ShowWork` steps may carry the "beyond the
  textbook" badge (`BeyondBadge` in `ui/Row.tsx`). `ParamSlider` fix: the delayed `select()` on focus now runs
  only if the field still has focus — in Chrome `select()` focuses the field, so a very fast click–type–Enter
  (seen in automated tests) left the field focused and a later blur re-committed the old text.
- **EEE 321 Lab 03, conductor colours:** ⊙ (+) and ⊗ (−) use the two ends of the existing diverging field map,
  always with the symbol; the highlighted path is `--ref`; E_A and V_T `--inc`, I_A `--ref`, τ and ω `--trn`.

## Not yet implemented

- Lossy Medium 1 (the brief fixes σ₁ = 0 for this version).
- Multiple layers (slabs, quarter-wave matching) and frequency-dispersive materials.
- Vector arrows of E and H on the field map (the map shows one Cartesian component at a time).
- Lab 02: the four-loop commutation machine (Chapman § 7.2), start-up transients (no inertia in the book),
  losses other than i²R, and negative speeds (clockwise rotation).
- EEE 321 Lab 03, out of scope: armature reaction, L di/dt voltages, interpoles and compensating windings
  (§ 7.4); equalizer currents; frog-leg diagrams (their numbers are computed); losses and the power-flow
  diagram (§ 7.7); windings whose brushes would share a segment, C/P < m + ½ (see Decisions), including
  triplex lap with 10 or 12 poles at C ≤ 48; fringing at the pole tips (the field is ±1 under a pole face and
  0 in the dead zone); exam questions on multiplex wave windings (outside the course).
- EEE 321 Lab 01, out of scope: open-Δ and other two-transformer connections (§ 2.11); unbalanced loads;
  autotransformers; derating and inrush current; computing the third-harmonic circulating current; the exact
  (not approximate) equivalent circuit; non-identical transformers in one bank; "all-day" efficiency.
