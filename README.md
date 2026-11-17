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
| EEE 321 | **02 The rotating loop**: one loop between curved pole faces, fed by a battery through a resistor. Torque or speed given; motor, generator or no load; commutator; forces; power flow. | `#/eee321-rotating-loop` | Chapman § 7.1, Eqs. (7-1) to (7-16), Example 7-1, Problem 7-1 |

Planned: EEE 361 Faraday's law and moving loops, transmission lines; EEE 321 01 three-phase transformer
connections (§ 2.10), 03 armature windings and E_A (§ 7.3, 7.5).

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

## Not yet implemented

- Lossy Medium 1 (the brief fixes σ₁ = 0 for this version).
- Multiple layers (slabs, quarter-wave matching) and frequency-dispersive materials.
- Vector arrows of E and H on the field map (the map shows one Cartesian component at a time).
- Lab 02: the four-loop commutation machine (Chapman § 7.2), start-up transients (no inertia in the book),
  losses other than i²R, and negative speeds (clockwise rotation).
- EEE 321 Lab 01 (three-phase transformer connections, § 2.10) and Lab 03 (armature windings and E_A,
  § 7.3, 7.5): listed as planned on the home page.
