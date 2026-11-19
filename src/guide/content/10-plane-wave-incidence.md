---
id: plane-wave-incidence
title: Plane-wave incidence
states:
  - plane-wave-incidence
  - plane-wave-incidence?th=0
  - plane-wave-incidence?th=0&e2=5
---

## What this lab shows

A uniform plane wave meets a flat boundary between two media. You see the standing wave in Medium 1 and the wave in Medium 2, and you read $\Gamma$, $\tau$, $S$, the angles and the power fractions, in Cheng's notation (§ 8-2, 8-3, 8-5 to 8-8, 8-10).

## Quick start

1. Open the lab. It starts with air in Medium 1 and a lossless dielectric in Medium 2, at an oblique angle.
2. Press play. The field map moves; the reflected and incident waves add up to the pattern in Medium 1.
3. Drag the incident ray, or type a new $\theta_i$. Watch $\Gamma$ in the results.
4. Change the polarization to parallel and look for the angle where the reflection disappears: the Brewster angle.
5. Choose **[ui:Copper (σ = 5.8×10⁷ S/m)]** for Medium 2. The wave hardly enters; Medium 2 gets its own, magnified scale.

## The screen

![The plane-wave lab on a computer: guided experiments and controls on the left, the toolbar and the colour field map in the centre with the field plot below, and the results on the right.](lab-wave-desktop)

1. **[ui:Guided experiments]**, and below them the controls: **[ui:Wave]**, **[ui:Medium 1 · z < 0]** and **[ui:Medium 2 · z > 0]**, and a strip that shows the class of Medium 2 at each frequency.
2. The toolbar: which wave the map shows (**[ui:Total]**, **[ui:Incident]**, **[ui:Reflected]**, **[ui:Transmitted]**), the field ($\mathbf{E}$ or $\mathbf{H}$), the polarization, **[ui:Rays]** and playback.
3. The field map. Each pixel is one component of the field at this instant; the colour bar under the map gives the scale. Medium 1 is on the left ($z < 0$), Medium 2 on the right. Drag the incident ray to change $\theta_i$.
4. The field along $z$ at $x = 0$, with its envelope. Maxima and minima of the standing wave are marked.
5. The results: both media, the interface ($\Gamma$, $\tau$, $\theta_t$, $\theta_c$, $\theta_B$), the power across the boundary and the standing wave.
6. **[ui:Advanced]** adds the complex forms, $\gamma$, and a comparison of Cheng's approximate formulas with the exact values.

Below the map you find **[ui:Reflection against angle]**, a plot of $|\Gamma|$ against $\theta_i$ that you can drag, then **What is happening** and **Show the work**.

![The plane-wave lab on a phone: the toolbar and the field map at the top, with the tabs Controls, Results, Explain and Plots below.](lab-wave-phone)

## Enter a textbook problem

A typical problem: a uniform plane wave in air meets a lossless dielectric with $\epsilon_r = 4$ at normal incidence. Find $\Gamma$, $\tau$ and the standing-wave ratio $S$.

**Step 1. The wave.** Under **[ui:Wave]**, type the frequency and the angle. Normal incidence means $\theta_i = 0$.

![The Wave section: the frequency field at 1 GHz and the incidence angle field at 0 degrees, each with a slider.](wave-inputs)

1. $f$, the frequency. At normal incidence on lossless media, $\Gamma$ does not depend on it; it sets the wavelength.
2. $\theta_i$, the angle of incidence.

**Step 2. The media.** Under **[ui:Material (typical values)]**, choose **[ui:Air (εr = 1)]** for Medium 1 and **[ui:Lossless dielectric (εr = 4)]** for Medium 2. If your problem gives other values, type them into the fields; the list then shows **[ui:customized]**.

![The Medium 2 section: the material list set to a lossless dielectric, and the fields for relative permittivity, permeability and conductivity.](wave-medium2)

1. The material of Medium 2.
2. $\epsilon_{r2}$, the relative permittivity.
3. $\sigma_2$, the conductivity. The left end of its slider is exactly zero (lossless).

**Step 3. Read the answers** in the results column.

![The Interface and standing-wave results: Gamma, tau, the angles, the power fractions, S and the positions of the maximum and minimum.](wave-results)

1. $\Gamma$ = {{wave.normal.Gamma: −0.3333}}. It is negative because Medium 2 has the smaller intrinsic impedance.
2. $\tau$ = {{wave.normal.tau: 0.6667}}.
3. $S$ = {{wave.normal.S: 2.000}}.
4. Because $\Gamma < 0$, $|E|$ is a minimum at the interface.

**Step 4. Check the method.** Open **Show the work**. The steps **Medium 1 (lossless)** and **Medium 2 (lossless)** give $\eta_1$ and $\eta_2$. The step **Reflection and transmission coefficients** puts them into $\Gamma = (\eta_2 - \eta_1)/(\eta_2 + \eta_1)$ with the numbers. **Standing wave in Medium 1** gives $S$ and the positions of the maxima and minima.

For oblique incidence, also choose the polarization in the toolbar. The results then show $\Gamma_\perp$ or $\Gamma_\parallel$, $\theta_t$, and the critical and Brewster angles when they exist.

## Things to try

Open the guided experiments in the left column (on a phone, in **Explain**):

- **[ui:Normal incidence on a perfect conductor]**
- **[ui:Air to a dielectric]**
- **[ui:Brewster angle]**
- **[ui:Total reflection]**
- **[ui:Skin depth]**
- **[ui:Same material, three behaviours]**

## Limits

- Medium 1 is always lossless ($\sigma_1 = 0$).
- There is one boundary only: no layers, slabs or quarter-wave matching.
- $\epsilon_r$, $\mu_r$ and $\sigma$ do not change with frequency. The material presets are typical, approximate values.
- The map shows one Cartesian component of the field at a time. It draws no arrows of $\mathbf{E}$ or $\mathbf{H}$.
- Oblique incidence on a lossy Medium 2 is not in the textbook. The lab computes it and marks it "beyond the textbook"; it draws no refraction angle there.
- Medium 2 as a perfect conductor is a separate choice, not a very large $\sigma$.
