---
id: eee321-rotating-loop
title: The rotating loop
states:
  - eee321-rotating-loop?p=ex71c
  - eee321-rotating-loop?p=ex71b
  - eee321-rotating-loop?p=p71-500
---

## What this lab shows

One loop turns between two curved pole faces. A battery feeds it through a resistor. You load the shaft or drive it, and the loop settles as a motor or as a generator; you see the commutator, the forces and the power flow (Chapman § 7.1).

## Quick start

1. Open the lab. It starts with **[ui:Example 7-1 (c) 10 N·m load]**: a motor with a load on its shaft.
2. Press play. The loop turns; the marks show the current, the induced voltage and the forces.
3. Drag the point on **[ui:Operating line]** to change the load torque. The speed and the current follow.
4. Choose **[ui:Example 7-1 (d) 7.5 N·m applied]**. The torque now drives the shaft, and the loop becomes a generator.

## The screen

![The rotating-loop lab on a computer: preset and inputs on the left, the front view of the machine with its circuit in the centre, two plots below it, and the results on the right.](lab-loop-desktop)

1. **[ui:Preset (Chapman)]**: Example 7-1 (b) to (e) and Problem 7-1.
2. **[ui:Given]**: what you give, the shaft torque or the shaft speed.
3. The front view: the poles, the loop, the commutator, the brushes and the circuit. ⊙ and ⊗ show the current, + and − the polarity of the induced voltage, and the arrows the force $F = ilB$. The badge says **[ui:MOTOR]**, **[ui:GENERATOR]** or **[ui:NO LOAD]**. The caption gives the slow-down factor.
4. **[ui:Operating line]**: speed against load torque, with the operating point. Drag the point, or use the arrow keys.
5. **[ui:Voltage against rotor angle]**: the loop voltage and the brush voltage over two turns.
6. The results: the mode, the machine constants, the operating point, the powers and the limits.

Below the plots you find **[ui:Power flow]**, **What is happening** and **Show the work**.

![The rotating-loop lab on a phone: playback buttons and the machine drawing at the top, with the tabs Controls, Results, Explain and Plots below.](lab-loop-phone)

## Enter a textbook problem: Example 7-1

Example 7-1 gives a loop with $V_B$, $R$, $B$, $r$ and $l$. It asks for the speed and the current at no load, with a load torque, with a torque applied in the direction of rotation, and with a weaker field.

**Step 1. Choose the part.** Under **[ui:Preset (Chapman)]**, choose **[ui:Example 7-1 (b) no load]**, **[ui:Example 7-1 (c) 10 N·m load]**, **[ui:Example 7-1 (d) 7.5 N·m applied]** or **[ui:Example 7-1 (e) B = 0.20 T]**. For your own data, change the values under **[ui:Battery and circuit]** and **[ui:Field and geometry]**.

**Step 2. Choose the input mode** under **[ui:Given]**:

- **[ui:shaft torque]**: you give the load torque $\tau_{load}$. The lab finds $i$, $e_{ind}$ and $\omega$. This is Example 7-1.
- **[ui:shaft speed]**: a prime mover holds the speed $\omega$. The lab finds $e_{ind}$, $i$ and $\tau_{ind}$. This is Problem 7-1.

![The Shaft section: the load-torque field with its slider, and the sign rules below it.](loop-shaft)

1. $\tau_{load}$, the load torque.
2. The sign rule: a negative load torque is applied in the direction of rotation, as in Example 7-1 (d).

**Step 3. Read the answers.**

![The Mode and Operating point results for Example 7-1 (c): the MOTOR badge, then e_ind, i, omega, n and the torque.](loop-results)

1. The mode badge.
2. $e_{ind}$, the induced voltage.
3. $i$ = {{loop.ex71c.i: 40.00}} A.
4. $\omega$ = {{loop.ex71c.omega: 432.0}} rad/s. The speed in r/min is just below it.

**Step 4. Motor or generator?** The lab decides by the direction of the current:

- $i > 0$, out of the battery's + terminal: **MOTOR**. Electric power becomes mechanical power.
- $i < 0$, into the battery: **GENERATOR**. Mechanical power becomes electric power.
- $i = 0$: **NO LOAD**, as in Example 7-1 (b).

![The results for Problem 7-1 at 500 rad/s: the GENERATOR badge, and a negative current into the battery.](loop-generator)

1. Choose **[ui:Problem 7-1, 500 rad/s]**: the badge says **GENERATOR**.
2. $i$ = {{loop.p71-500.i: −5.000}} A. The minus sign means the current flows into the battery.

**Step 5.** Open **Show the work**. Each step has three lines (equation, numbers with units, result) and its equation number, for example (7-6) and (7-16).

## Things to try

- **[ui:Starting current]**
- **[ui:Loading the motor]**
- **[ui:Double the resistance]**
- **[ui:Push the shaft]**
- **[ui:Weaken the field]**
- **[ui:Drive it from outside]**

## Limits

- Steady state only. The book gives no inertia, so start-up is described in words, not animated. A new input shows the new steady state at once.
- $A_P = \pi r l$ ignores the gaps between the poles. The gaps appear only in the drawing and in the voltage plot; **[ui:pole-arc fraction (drawing only)]** changes these drawings only.
- The only loss is $i^2R$.
- The loop turns counter-clockwise or stands still: the speed cannot be negative. A load torque above the starting torque is held at the limit, with a warning.
- The four-loop machine of § 7.2 is not in this lab.
