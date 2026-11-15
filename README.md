# EEE 361 Field Lab

An online laboratory for EEE 361 (Electromagnetic Waves). Students change a material or an angle, see the
fields respond immediately, and read the same numbers they would get by hand from D. K. Cheng,
*Field and Wave Electromagnetics*, 2nd edition.

**Live site:** https://moaazbek.github.io/em-wave-lab/ (QR code for class: `qr-code.png` in the repository root;
it is not part of the website).

> Student project for EEE 361. Not an official course resource. Check results against the textbook
> (Cheng, *Field and Wave Electromagnetics*, 2nd ed.).

**Lab 01 — Plane-wave incidence** (Cheng § 8-2, 8-3, 8-5 to 8-8, 8-10): a uniform plane wave meets a
plane boundary between two media. Normal and oblique incidence, both polarizations, lossless, lossy and
perfectly conducting Medium 2, Brewster angle, total reflection, skin depth.

## Run, test, build

Requires Node 20 or newer.

```sh
npm install
npm run dev        # development server, open the printed URL
npm test           # unit tests (physics engine, formatting, colours, URL state)
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

## What is in the lab

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

## Model: assumptions and limits

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
- **Only one lab is built.** The home page lists the two planned labs as text only.

## Not yet implemented

- Lossy Medium 1 (the brief fixes σ₁ = 0 for this version).
- Multiple layers (slabs, quarter-wave matching) and frequency-dispersive materials.
- Vector arrows of E and H on the field map (the map shows one Cartesian component at a time).
